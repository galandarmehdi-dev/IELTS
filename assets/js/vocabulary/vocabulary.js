/* assets/js/vocabulary/vocabulary.js - isolated Vocabulary MVP. */
(function () {
  "use strict";

  const NS = "IELTS:VOCAB:v1";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const state = {
    loaded: false,
    loading: false,
    useSupabase: false,
    user: null,
    authUserId: "",
    identityKey: "guest",
    decks: [],
    words: [],
    progress: new Map(),
    events: [],
    currentView: "dashboard",
    currentDeckId: "",
    session: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function auth() {
    return window.IELTS?.Auth || null;
  }

  function supabase() {
    return auth()?.supabase || null;
  }

  function storageKey(suffix) {
    const identity = String(state.identityKey || "guest").replace(/[^a-z0-9_.@-]/gi, "_");
    return `${NS}:${identity}:${suffix}`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function safeText(value, fallback) {
    const text = String(value ?? "").trim();
    return text || fallback || "";
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function isUuid(value) {
    return UUID_RE.test(String(value || ""));
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function randomId() {
    try {
      if (crypto?.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function setStatus(message, tone) {
    const el = $("vocabStatus");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("hidden", !message);
    el.classList.toggle("error", tone === "error");
  }

  async function resolveUser() {
    const saved = auth()?.getSavedUser?.() || null;
    state.user = saved;
    state.identityKey = auth()?.getIdentityKey?.() || saved?.email || saved?.id || "guest";
    state.authUserId = "";
    state.useSupabase = false;

    try {
      const sb = supabase();
      if (sb && !auth()?.isSharedPasswordUser?.()) {
        const { data } = await sb.auth.getUser();
        const id = data?.user?.id || "";
        if (isUuid(id)) {
          state.authUserId = id;
          state.user = data.user || saved;
          state.identityKey = id;
          state.useSupabase = true;
        }
      }
    } catch (e) {}

    if (!state.user && saved) state.user = saved;
    return state.user;
  }

  function requireSignedIn() {
    if (auth()?.isSignedIn?.()) return true;
    try { auth()?.openLoginGate?.("Please log in to open Vocabulary."); } catch (e) {}
    return false;
  }

  function fallbackData() {
    const sample = window.IELTS?.VocabSampleData || { decks: [], words: [] };
    return {
      decks: (sample.decks || []).filter((deck) => deck && deck.is_active !== false),
      words: sample.words || [],
    };
  }

  async function loadContent() {
    const sb = supabase();
    if (!sb || !state.useSupabase) return fallbackData();

    try {
      const { data: decks, error: deckError } = await sb
        .from("vocab_decks")
        .select("id,title,description,level,topic,unit_code,cover_image,is_active,created_at")
        .eq("is_active", true)
        .order("title", { ascending: true });
      if (deckError) throw deckError;
      const activeDecks = Array.isArray(decks) ? decks : [];
      if (!activeDecks.length) return fallbackData();
      const deckIds = activeDecks.map((deck) => deck.id).filter(Boolean);
      const { data: words, error: wordsError } = await sb
        .from("vocab_words")
        .select("id,deck_id,term,term_normalized,part_of_speech,meaning_en,meaning_az,meaning_ru,example_1,example_2,collocations,synonyms,audio_url,image_url,difficulty,tags,distractors_json,created_at")
        .in("deck_id", deckIds)
        .order("term", { ascending: true });
      if (wordsError) throw wordsError;
      return { decks: activeDecks, words: Array.isArray(words) ? words : [] };
    } catch (error) {
      console.warn("Vocabulary Supabase content load failed; using bundled samples.", error);
      return fallbackData();
    }
  }

  function readLocalProgress() {
    try {
      const raw = localStorage.getItem(storageKey("progress"));
      const rows = raw ? JSON.parse(raw) : [];
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocalProgress() {
    try {
      localStorage.setItem(storageKey("progress"), JSON.stringify(Array.from(state.progress.values())));
    } catch (e) {}
  }

  function readLocalEvents() {
    try {
      const raw = localStorage.getItem(storageKey("events"));
      const rows = raw ? JSON.parse(raw) : [];
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }

  function writeLocalEvents() {
    try {
      localStorage.setItem(storageKey("events"), JSON.stringify(state.events.slice(-300)));
    } catch (e) {}
  }

  async function loadProgress() {
    state.progress = new Map();
    state.events = [];
    if (state.useSupabase && state.authUserId) {
      try {
        const wordIds = state.words.map((word) => word.id).filter(isUuid);
        if (wordIds.length) {
          const { data, error } = await supabase()
            .from("user_vocab_progress")
            .select("id,user_id,word_id,status,ease_factor,interval_days,repetition_count,due_at,last_seen_at,last_result,correct_streak,incorrect_count,total_attempts,mastered_at,created_at,updated_at")
            .eq("user_id", state.authUserId)
            .in("word_id", wordIds);
          if (error) throw error;
          (data || []).forEach((row) => state.progress.set(row.word_id, row));
        }
        const { data: events } = await supabase()
          .from("user_vocab_events")
          .select("word_id,deck_id,exercise_type,result,response_ms,created_at")
          .eq("user_id", state.authUserId)
          .order("created_at", { ascending: false })
          .limit(200);
        state.events = Array.isArray(events) ? events : [];
        return;
      } catch (error) {
        console.warn("Vocabulary Supabase progress load failed; using local fallback.", error);
        state.useSupabase = false;
      }
    }
    readLocalProgress().forEach((row) => {
      if (row?.word_id) state.progress.set(row.word_id, row);
    });
    state.events = readLocalEvents();
  }

  function baseProgress(wordId) {
    const created = nowIso();
    return {
      id: randomId(),
      user_id: state.authUserId || state.identityKey,
      word_id: wordId,
      status: "new",
      ease_factor: 2.5,
      interval_days: 0,
      repetition_count: 0,
      due_at: null,
      last_seen_at: null,
      last_result: null,
      correct_streak: 0,
      incorrect_count: 0,
      total_attempts: 0,
      mastered_at: null,
      created_at: created,
      updated_at: created,
    };
  }

  function nextCorrectInterval(repetitionCount) {
    if (repetitionCount <= 1) return 1;
    if (repetitionCount === 2) return 3;
    if (repetitionCount === 3) return 7;
    if (repetitionCount === 4) return 14;
    return 30;
  }

  function applyResult(row, correct) {
    const next = { ...(row || baseProgress(row?.word_id)) };
    const at = new Date();
    next.total_attempts = Number(next.total_attempts || 0) + 1;
    next.last_seen_at = at.toISOString();
    next.last_result = !!correct;
    next.updated_at = at.toISOString();

    if (correct) {
      const reps = Number(next.repetition_count || 0) + 1;
      const interval = nextCorrectInterval(reps);
      next.repetition_count = reps;
      next.interval_days = interval;
      next.correct_streak = Number(next.correct_streak || 0) + 1;
      next.status = reps >= 5 ? "mastered" : reps >= 3 ? "review" : "learning";
      next.due_at = new Date(at.getTime() + interval * DAY_MS).toISOString();
      if (next.status === "mastered" && !next.mastered_at) next.mastered_at = at.toISOString();
    } else {
      next.incorrect_count = Number(next.incorrect_count || 0) + 1;
      next.correct_streak = 0;
      next.repetition_count = Math.max(0, Number(next.repetition_count || 0) - 1);
      next.interval_days = 0;
      next.status = "learning";
      next.mastered_at = null;
      next.due_at = new Date(at.getTime() + 6 * 60 * 60 * 1000).toISOString();
    }
    return next;
  }

  async function persistProgress(word, exerciseType, correct, responseMs) {
    const existing = state.progress.get(word.id) || baseProgress(word.id);
    const updated = applyResult(existing, correct);
    state.progress.set(word.id, updated);

    const event = {
      id: randomId(),
      user_id: state.authUserId || state.identityKey,
      word_id: word.id,
      deck_id: word.deck_id,
      session_id: state.session?.id || null,
      exercise_type: exerciseType,
      result: !!correct,
      response_ms: Math.max(0, Math.round(Number(responseMs) || 0)),
      created_at: nowIso(),
    };
    state.events.unshift(event);

    if (state.useSupabase && state.authUserId && isUuid(word.id)) {
      try {
        const payload = {
          user_id: state.authUserId,
          word_id: word.id,
          status: updated.status,
          ease_factor: updated.ease_factor,
          interval_days: updated.interval_days,
          repetition_count: updated.repetition_count,
          due_at: updated.due_at,
          last_seen_at: updated.last_seen_at,
          last_result: updated.last_result,
          correct_streak: updated.correct_streak,
          incorrect_count: updated.incorrect_count,
          total_attempts: updated.total_attempts,
          mastered_at: updated.mastered_at,
          updated_at: updated.updated_at,
        };
        const { data, error } = await supabase()
          .from("user_vocab_progress")
          .upsert(payload, { onConflict: "user_id,word_id" })
          .select("id,user_id,word_id,status,ease_factor,interval_days,repetition_count,due_at,last_seen_at,last_result,correct_streak,incorrect_count,total_attempts,mastered_at,created_at,updated_at")
          .single();
        if (error) throw error;
        if (data?.word_id) state.progress.set(data.word_id, data);
        await supabase().from("user_vocab_events").insert({
          user_id: state.authUserId,
          word_id: word.id,
          deck_id: isUuid(word.deck_id) ? word.deck_id : null,
          session_id: isUuid(event.session_id) ? event.session_id : null,
          exercise_type: exerciseType,
          result: !!correct,
          response_ms: event.response_ms,
        });
        return;
      } catch (error) {
        console.warn("Vocabulary Supabase progress save failed; keeping local backup.", error);
        state.useSupabase = false;
      }
    }

    writeLocalProgress();
    writeLocalEvents();
  }

  function wordsForDeck(deckId) {
    return state.words.filter((word) => word.deck_id === deckId);
  }

  function progressForWord(wordId) {
    return state.progress.get(wordId) || baseProgress(wordId);
  }

  function isDue(row) {
    if (!row || !row.due_at) return true;
    return new Date(row.due_at).getTime() <= Date.now();
  }

  function getStats(deckId) {
    const words = deckId ? wordsForDeck(deckId) : state.words;
    const rows = words.map((word) => progressForWord(word.id));
    const learned = rows.filter((row) => row.status && row.status !== "new").length;
    const mastered = rows.filter((row) => row.status === "mastered").length;
    const learning = rows.filter((row) => row.status === "learning").length;
    const review = rows.filter((row) => row.status === "review").length;
    const due = rows.filter((row) => row.status !== "mastered" && isDue(row)).length;
    const attempts = rows.reduce((sum, row) => sum + Number(row.total_attempts || 0), 0);
    const incorrect = rows.reduce((sum, row) => sum + Number(row.incorrect_count || 0), 0);
    const accuracy = attempts ? Math.round(((attempts - incorrect) / attempts) * 100) : 0;
    const percent = words.length ? Math.round((learned / words.length) * 100) : 0;
    return { total: words.length, learned, mastered, learning, review, due, attempts, incorrect, accuracy, percent };
  }

  function currentStreak() {
    const days = new Set(
      state.events
        .filter((event) => event?.result === true && event.created_at)
        .map((event) => new Date(event.created_at).toISOString().slice(0, 10))
    );
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 120; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      if (!days.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function renderStats(container, stats) {
    if (!container) return;
    container.innerHTML = [
      ["Words learned", stats.learned],
      ["Mastered", stats.mastered],
      ["Due today", stats.due],
      ["Accuracy", `${stats.accuracy}%`],
    ].map(([label, value]) => `
      <div class="vocab-stat-card">
        <span class="vocab-label">${escapeHtml(label)}</span>
        <strong class="vocab-stat-value">${escapeHtml(value)}</strong>
      </div>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  }

  function deckCard(deck) {
    const stats = getStats(deck.id);
    return `
      <article class="vocab-deck-card" data-vocab-deck-card="${escapeHtml(deck.id)}">
        <div>
          <p class="vocab-label">${escapeHtml(deck.topic || "IELTS Vocabulary")} · ${escapeHtml(deck.level || "All levels")}</p>
          <h3 class="vocab-deck-title">${escapeHtml(deck.title || "Vocabulary deck")}</h3>
          <p class="vocab-deck-meta">${escapeHtml(deck.description || "Study and review this deck.")}</p>
        </div>
        <div class="vocab-progress-track" aria-label="Deck progress">
          <div class="vocab-progress-fill" style="width:${stats.percent}%"></div>
        </div>
        <p class="vocab-deck-meta">${stats.learned}/${stats.total} learned · ${stats.mastered} mastered · ${stats.due} due</p>
        <button class="vocab-btn" type="button" data-vocab-start-deck="${escapeHtml(deck.id)}">${stats.learned ? "Continue" : "Start"}</button>
      </article>
    `;
  }

  function renderDashboard() {
    renderStats($("vocabDashboardStats"), getStats());
    const streak = $("vocabCurrentStreak");
    if (streak) streak.textContent = `${currentStreak()} day${currentStreak() === 1 ? "" : "s"}`;
    const deckWrap = $("vocabDashboardDecks");
    if (deckWrap) deckWrap.innerHTML = state.decks.slice(0, 4).map(deckCard).join("") || `<div class="vocab-empty">No vocabulary decks are available yet.</div>`;
    const recent = $("vocabRecentActivity");
    if (recent) {
      recent.innerHTML = state.events.slice(0, 5).map((event) => {
        const word = state.words.find((item) => item.id === event.word_id);
        return `<p class="vocab-muted">${event.result ? "Correct" : "Practice"}: ${escapeHtml(word?.term || "word")} · ${escapeHtml(new Date(event.created_at).toLocaleString())}</p>`;
      }).join("") || `<p class="vocab-muted">No vocabulary activity yet. Start a deck when you are ready.</p>`;
    }
  }

  function renderDecks() {
    const wrap = $("vocabDeckList");
    if (wrap) wrap.innerHTML = state.decks.map(deckCard).join("") || `<div class="vocab-empty">No active decks found. Apply the seed SQL or use the bundled sample fallback.</div>`;
  }

  function renderProgress() {
    renderStats($("vocabProgressStats"), getStats());
    const hardWords = state.words
      .map((word) => ({ word, row: progressForWord(word.id) }))
      .filter((item) => Number(item.row.incorrect_count || 0) > 0)
      .sort((a, b) => Number(b.row.incorrect_count || 0) - Number(a.row.incorrect_count || 0))
      .slice(0, 8);
    const hard = $("vocabHardWords");
    if (hard) {
      hard.innerHTML = hardWords.map(({ word, row }) => `<p class="vocab-muted"><strong>${escapeHtml(word.term)}</strong> · ${Number(row.incorrect_count || 0)} incorrect · ${escapeHtml(row.status || "new")}</p>`).join("") || `<p class="vocab-muted">No difficult words yet.</p>`;
    }
    const deckProgress = $("vocabPerDeckProgress");
    if (deckProgress) deckProgress.innerHTML = state.decks.map((deck) => {
      const stats = getStats(deck.id);
      return `<div class="vocab-deck-card"><strong>${escapeHtml(deck.title)}</strong><div class="vocab-progress-track"><div class="vocab-progress-fill" style="width:${stats.percent}%"></div></div><p class="vocab-muted">${stats.learned}/${stats.total} learned · ${stats.mastered} mastered · ${stats.accuracy}% accuracy</p></div>`;
    }).join("") || `<div class="vocab-empty">No deck progress yet.</div>`;
  }

  function bindDynamicButtons() {
    Array.from(document.querySelectorAll("[data-vocab-start-deck]")).forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => startDeck(button.getAttribute("data-vocab-start-deck")));
    });
  }

  function setActiveView(view) {
    state.currentView = view || "dashboard";
    ["dashboard", "decks", "study", "progress"].forEach((name) => {
      const panel = $(`vocab${name.charAt(0).toUpperCase()}${name.slice(1)}View`);
      if (panel) panel.classList.toggle("hidden", name !== state.currentView);
    });
    Array.from(document.querySelectorAll("[data-vocab-view]")).forEach((button) => {
      button.classList.toggle("is-active", button.getAttribute("data-vocab-view") === state.currentView);
    });
  }

  function renderAll() {
    renderDashboard();
    renderDecks();
    renderProgress();
    bindDynamicButtons();
  }

  async function loadAll(force) {
    if (state.loaded && !force) return;
    if (state.loading) return;
    state.loading = true;
    setStatus("Loading vocabulary...");
    try {
      await resolveUser();
      const content = await loadContent();
      state.decks = content.decks || [];
      state.words = content.words || [];
      if (state.useSupabase && !state.words.some((word) => isUuid(word.id))) {
        state.useSupabase = false;
      }
      await loadProgress();
      state.loaded = true;
      setStatus(state.useSupabase ? "Progress is saving to Supabase." : "Progress is saving safely in this browser for this account.");
      renderAll();
    } catch (error) {
      console.warn("Vocabulary failed to load.", error);
      const content = fallbackData();
      state.decks = content.decks;
      state.words = content.words;
      state.useSupabase = false;
      await loadProgress();
      state.loaded = true;
      setStatus("Vocabulary is using the bundled sample deck because the database content could not load.", "error");
      renderAll();
    } finally {
      state.loading = false;
    }
  }

  function buildSessionWords(deckId) {
    const deckWords = wordsForDeck(deckId);
    const due = deckWords.filter((word) => progressForWord(word.id).status !== "mastered" && isDue(progressForWord(word.id)));
    const newWords = deckWords.filter((word) => progressForWord(word.id).status === "new");
    const review = deckWords.filter((word) => ["learning", "review"].includes(progressForWord(word.id).status));
    return shuffle(unique([...due, ...newWords, ...review].map((word) => word.id))).slice(0, 10).map((id) => deckWords.find((word) => word.id === id)).filter(Boolean);
  }

  function startDeck(deckId) {
    const deck = state.decks.find((item) => item.id === deckId);
    const items = buildSessionWords(deckId);
    if (!deck || !items.length) {
      setStatus("This deck has no words ready for study yet.", "error");
      return;
    }
    state.currentDeckId = deckId;
    state.session = {
      id: randomId(),
      deckId,
      deckTitle: deck.title,
      words: items,
      index: 0,
      correct: 0,
      incorrect: 0,
      startedAt: Date.now(),
      answered: false,
      startedQuestionAt: Date.now(),
    };
    setActiveView("study");
    renderStudyQuestion();
  }

  function exerciseTypeFor(index) {
    return ["term_to_meaning", "meaning_to_term", "type_word"][index % 3];
  }

  function optionTexts(word, type) {
    const correct = type === "meaning_to_term" ? word.term : word.meaning_en;
    const pool = state.words
      .filter((item) => item.id !== word.id)
      .map((item) => type === "meaning_to_term" ? item.term : item.meaning_en)
      .filter(Boolean);
    const distractors = Array.isArray(word.distractors_json) && type !== "meaning_to_term" ? word.distractors_json : [];
    return shuffle(unique([correct, ...distractors, ...shuffle(pool)]).slice(0, 4));
  }

  function renderStudyQuestion() {
    const session = state.session;
    const body = $("vocabStudyBody");
    if (!session || !body) return;
    const word = session.words[session.index];
    if (!word) {
      renderSessionComplete();
      return;
    }
    const type = exerciseTypeFor(session.index);
    session.answered = false;
    session.startedQuestionAt = Date.now();
    const progress = Math.round((session.index / session.words.length) * 100);
    const prompt = type === "term_to_meaning"
      ? `What does “${word.term}” mean?`
      : type === "meaning_to_term"
        ? word.meaning_en
        : `${word.meaning_en}${word.example_1 ? `\nClue: ${word.example_1.replace(new RegExp(word.term, "ig"), "____")}` : ""}`;
    const controls = type === "type_word"
      ? `<input class="vocab-typing-input" id="vocabTypingInput" type="text" autocomplete="off" placeholder="Type the word" /><div class="vocab-study-actions"><button class="vocab-btn" id="vocabCheckTypingBtn" type="button">Check</button></div>`
      : `<div class="vocab-options">${optionTexts(word, type).map((option) => `<button class="vocab-option" type="button" data-vocab-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div>`;

    body.innerHTML = `
      <div class="vocab-study-card">
        <div class="vocab-study-top">
          <div><span class="vocab-label">${escapeHtml(session.deckTitle)} · ${session.index + 1}/${session.words.length}</span></div>
          <div class="vocab-muted">${escapeHtml(type.replace(/_/g, " → "))}</div>
        </div>
        <div class="vocab-progress-track"><div class="vocab-progress-fill" style="width:${progress}%"></div></div>
        <div class="vocab-prompt">${escapeHtml(prompt).replace(/\n/g, "<br>")}</div>
        ${word.part_of_speech ? `<p class="vocab-muted">${escapeHtml(word.part_of_speech)}</p>` : ""}
        ${controls}
        <div class="vocab-feedback" id="vocabFeedback"></div>
        <div class="vocab-word-detail hidden" id="vocabWordDetail"></div>
        <div class="vocab-study-actions"><button class="vocab-btn secondary hidden" id="vocabNextQuestionBtn" type="button">Next</button></div>
      </div>
    `;

    Array.from(document.querySelectorAll("[data-vocab-answer]")).forEach((button) => {
      button.addEventListener("click", () => answerCurrent(button.getAttribute("data-vocab-answer"), button));
    });
    $("vocabCheckTypingBtn")?.addEventListener("click", () => answerCurrent($("vocabTypingInput")?.value || ""));
    $("vocabTypingInput")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") answerCurrent($("vocabTypingInput")?.value || "");
    });
    $("vocabNextQuestionBtn")?.addEventListener("click", nextQuestion);
  }

  async function answerCurrent(answer, button) {
    const session = state.session;
    if (!session || session.answered) return;
    const word = session.words[session.index];
    const type = exerciseTypeFor(session.index);
    const expected = type === "term_to_meaning" ? word.meaning_en : word.term;
    const correct = normalize(answer) === normalize(expected);
    const responseMs = Date.now() - Number(session.startedQuestionAt || Date.now());
    session.answered = true;
    if (correct) session.correct += 1;
    else session.incorrect += 1;

    if (button) {
      button.classList.add(correct ? "is-correct" : "is-wrong");
      Array.from(document.querySelectorAll("[data-vocab-answer]")).forEach((option) => {
        option.disabled = true;
        if (normalize(option.getAttribute("data-vocab-answer")) === normalize(expected)) option.classList.add("is-correct");
      });
    }
    const feedback = $("vocabFeedback");
    if (feedback) {
      feedback.textContent = correct ? "Correct. Nice one." : `Not quite. Correct answer: ${expected}`;
      feedback.classList.toggle("good", correct);
      feedback.classList.toggle("bad", !correct);
    }
    const detail = $("vocabWordDetail");
    if (detail) {
      detail.classList.remove("hidden");
      detail.innerHTML = `<strong>${escapeHtml(word.term)}</strong> ${word.part_of_speech ? `<span class="vocab-muted">(${escapeHtml(word.part_of_speech)})</span>` : ""}<br>${escapeHtml(word.meaning_en || "")} ${word.meaning_az ? `<br>AZ: ${escapeHtml(word.meaning_az)}` : ""}${word.example_1 ? `<br><em>${escapeHtml(word.example_1)}</em>` : ""}`;
    }
    const input = $("vocabTypingInput");
    if (input) input.disabled = true;
    $("vocabCheckTypingBtn")?.setAttribute("disabled", "disabled");
    $("vocabNextQuestionBtn")?.classList.remove("hidden");
    await persistProgress(word, type, correct, responseMs);
    renderDashboard();
    renderProgress();
  }

  function nextQuestion() {
    if (!state.session) return;
    state.session.index += 1;
    renderStudyQuestion();
  }

  function renderSessionComplete() {
    const body = $("vocabStudyBody");
    if (!body || !state.session) return;
    const session = state.session;
    body.innerHTML = `
      <div class="vocab-study-card">
        <p class="vocab-label">Session complete</p>
        <h2 class="vocab-section-heading">${escapeHtml(session.deckTitle)}</h2>
        <p class="vocab-copy">Correct: <strong>${session.correct}</strong> · Needs review: <strong>${session.incorrect}</strong></p>
        <div class="vocab-study-actions">
          <button class="vocab-btn" type="button" id="vocabRepeatDeckBtn">Study this deck again</button>
          <button class="vocab-btn secondary" type="button" id="vocabGoProgressBtn">View progress</button>
        </div>
      </div>
    `;
    $("vocabRepeatDeckBtn")?.addEventListener("click", () => startDeck(session.deckId));
    $("vocabGoProgressBtn")?.addEventListener("click", () => { setActiveView("progress"); renderProgress(); });
    renderAll();
  }

  function closeAccountMenu() {
    const dropdown = $("homeAccountDropdown");
    const trigger = $("openDashboardBtn");
    if (dropdown) dropdown.classList.add("hidden");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }

  async function open(view) {
    if (!requireSignedIn()) return;
    closeAccountMenu();
    try { window.IELTS?.UI?.showOnly?.("vocabulary"); } catch (e) {}
    try { window.IELTS?.Router?.setHashRoute?.(window.IELTS?.Registry?.getActiveTestId?.() || "ielts1", "vocabulary"); } catch (e) {}
    setActiveView(view || "dashboard");
    await loadAll(false);
    renderAll();
  }

  async function refresh() {
    state.loaded = false;
    await loadAll(true);
    renderAll();
  }

  function bindStaticUi() {
    Array.from(document.querySelectorAll("[data-vocab-view]")).forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        const view = button.getAttribute("data-vocab-view") || "dashboard";
        setActiveView(view);
        renderAll();
      });
    });
    $("vocabRefreshBtn")?.addEventListener("click", () => refresh());
    $("vocabBackHomeBtn")?.addEventListener("click", () => {
      try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {}
      try { window.IELTS?.Router?.setHashRoute?.(window.IELTS?.Registry?.getActiveTestId?.() || "ielts1", "home"); } catch (e) {}
    });
    $("vocabContinueBtn")?.addEventListener("click", () => {
      const first = state.decks.find((deck) => getStats(deck.id).due > 0) || state.decks[0];
      if (first) startDeck(first.id);
    });
    $("menuVocabularyBtn")?.addEventListener("click", () => open("dashboard"));
    $("dashboardOpenVocabularyBtn")?.addEventListener("click", () => open("dashboard"));
  }

  document.addEventListener("DOMContentLoaded", bindStaticUi);
  window.addEventListener("ielts:authchanged", () => {
    state.loaded = false;
    if (!$("vocabularySection")?.classList.contains("hidden")) refresh();
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.Vocabulary = { open, refresh, getStats: () => getStats(), _state: state };
})();
