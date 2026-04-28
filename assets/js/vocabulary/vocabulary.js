/* assets/js/vocabulary/vocabulary.js
 * Memrise-style IELTS vocabulary trainer.
 * Navigation: Section -> (Task) -> Level -> Deck -> Learn / Review.
 * Exercise modes: cloze, multiple-choice (term <-> definition), synonym match,
 * antonym match, typing. SRS scheduler unchanged from the MVP.
 */
(function () {
  "use strict";

  const NS = "IELTS:VOCAB:v2";
  const DAY_MS = 24 * 60 * 60 * 1000;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const SECTION_LABELS = { reading: "Reading", writing: "Writing", speaking: "Speaking" };
  const TASK_LABELS = { task1: "Task 1", task2: "Task 2" };
  const LEVEL_LABELS = {
    B1: "B1 · 5.5–6.5",
    B2: "B2 · 6.5–7.5",
    C1: "C1 · 7.5–8.0",
    C2: "C2 · 8.0–9.0",
  };
  const LEVEL_ORDER = ["B1", "B2", "C1", "C2"];
  const SECTION_ORDER = ["reading", "writing", "speaking"];

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
    nav: { section: "", task: "" },
    session: null,
  };

  function $(id) { return document.getElementById(id); }
  function auth() { return window.IELTS?.Auth || null; }
  function supabase() { return auth()?.supabase || null; }
  function nowIso() { return new Date().toISOString(); }
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function isUuid(value) { return UUID_RE.test(String(value || "")); }
  function unique(values) { return Array.from(new Set(values.filter(Boolean))); }
  function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function randomId() {
    try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function storageKey(suffix) {
    const identity = String(state.identityKey || "guest").replace(/[^a-z0-9_.@-]/gi, "_");
    return `${NS}:${identity}:${suffix}`;
  }

  function setStatus(message, tone) {
    const el = $("vocabStatus");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("hidden", !message);
    el.classList.toggle("error", tone === "error");
  }

  // ---------------- AUTH / DATA LOAD ----------------

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
        .select("id,title,description,level,topic,section,task,unit_code,sort_order,cover_image,is_active,created_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (deckError) throw deckError;
      const activeDecks = Array.isArray(decks) ? decks : [];
      if (!activeDecks.length) return fallbackData();
      const deckIds = activeDecks.map((deck) => deck.id).filter(Boolean);
      const { data: words, error: wordsError } = await sb
        .from("vocab_words")
        .select("id,deck_id,term,term_normalized,part_of_speech,definition,examples,collocations,synonyms,antonyms,difficulty,tags,audio_url,image_url,created_at")
        .in("deck_id", deckIds)
        .order("term", { ascending: true });
      if (wordsError) throw wordsError;
      return { decks: activeDecks, words: Array.isArray(words) ? words : [] };
    } catch (error) {
      console.warn("Vocabulary Supabase content load failed; using bundled samples.", error);
      return fallbackData();
    }
  }

  // ---------------- PROGRESS ----------------

  function readLocalProgress() {
    try {
      const raw = localStorage.getItem(storageKey("progress"));
      const rows = raw ? JSON.parse(raw) : [];
      return Array.isArray(rows) ? rows : [];
    } catch (e) { return []; }
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
    } catch (e) { return []; }
  }
  function writeLocalEvents() {
    try {
      localStorage.setItem(storageKey("events"), JSON.stringify(state.events.slice(-500)));
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
          .limit(500);
        if (Array.isArray(events)) state.events = events;
      } catch (error) {
        console.warn("Vocabulary Supabase progress load failed; using local cache.", error);
      }
    } else {
      readLocalProgress().forEach((row) => state.progress.set(row.word_id, row));
      state.events = readLocalEvents();
    }
  }

  function baseProgress(wordId) {
    return {
      id: randomId(),
      user_id: state.authUserId || "local",
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
      created_at: nowIso(),
      updated_at: nowIso(),
    };
  }

  function nextCorrectInterval(repetitionCount) {
    if (repetitionCount <= 0) return 1;
    if (repetitionCount === 1) return 1;
    if (repetitionCount === 2) return 3;
    if (repetitionCount === 3) return 7;
    if (repetitionCount === 4) return 16;
    if (repetitionCount === 5) return 35;
    return 70;
  }

  function applyResult(row, correct) {
    const next = { ...row };
    next.total_attempts = (row.total_attempts || 0) + 1;
    next.last_result = correct;
    next.last_seen_at = nowIso();
    if (correct) {
      const reps = (row.repetition_count || 0) + 1;
      next.repetition_count = reps;
      next.correct_streak = (row.correct_streak || 0) + 1;
      next.interval_days = nextCorrectInterval(reps);
      next.due_at = new Date(Date.now() + next.interval_days * DAY_MS).toISOString();
      next.status = reps >= 5 ? "mastered" : reps >= 3 ? "review" : "learning";
      if (next.status === "mastered" && !row.mastered_at) next.mastered_at = nowIso();
      next.ease_factor = Math.min(2.8, (row.ease_factor || 2.5) + 0.05);
    } else {
      next.incorrect_count = (row.incorrect_count || 0) + 1;
      next.correct_streak = 0;
      next.repetition_count = Math.max(0, (row.repetition_count || 0) - 1);
      next.interval_days = 0;
      next.due_at = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      next.status = "learning";
      if (row.status === "mastered") next.mastered_at = null;
      next.ease_factor = Math.max(1.6, (row.ease_factor || 2.5) - 0.2);
    }
    next.updated_at = nowIso();
    return next;
  }

  async function persistProgress(word, exerciseType, correct, responseMs) {
    const current = state.progress.get(word.id) || baseProgress(word.id);
    const next = applyResult(current, correct);
    state.progress.set(word.id, next);
    const event = {
      id: randomId(),
      user_id: state.authUserId || "local",
      word_id: word.id,
      deck_id: word.deck_id || null,
      session_id: state.session?.id || null,
      exercise_type: exerciseType,
      result: correct,
      response_ms: typeof responseMs === "number" ? Math.max(0, Math.floor(responseMs)) : null,
      created_at: nowIso(),
    };
    state.events.unshift(event);
    state.events = state.events.slice(0, 500);
    if (state.useSupabase && state.authUserId && isUuid(word.id)) {
      try {
        await supabase()
          .from("user_vocab_progress")
          .upsert({ ...next, id: undefined }, { onConflict: "user_id,word_id" });
        await supabase().from("user_vocab_events").insert({
          user_id: state.authUserId,
          word_id: word.id,
          deck_id: isUuid(word.deck_id) ? word.deck_id : null,
          session_id: isUuid(event.session_id) ? event.session_id : null,
          exercise_type: exerciseType,
          result: correct,
          response_ms: event.response_ms,
        });
      } catch (error) {
        console.warn("Vocabulary progress sync failed; will retain locally.", error);
        writeLocalProgress();
        writeLocalEvents();
      }
    } else {
      writeLocalProgress();
      writeLocalEvents();
    }
  }

  // ---------------- HELPERS ----------------

  function wordsForDeck(deckId) {
    return state.words.filter((word) => word.deck_id === deckId);
  }
  function progressForWord(wordId) {
    return state.progress.get(wordId) || null;
  }
  function isDue(row) {
    if (!row) return true;
    if (row.status === "new") return true;
    if (!row.due_at) return true;
    return new Date(row.due_at).getTime() <= Date.now();
  }
  function decksGroupedByTaxonomy() {
    const tree = {};
    state.decks.forEach((deck) => {
      const section = String(deck.section || "").toLowerCase() || "other";
      const task = String(deck.task || "").toLowerCase() || "_none";
      const level = String(deck.level || "").toUpperCase() || "OTHER";
      tree[section] = tree[section] || {};
      tree[section][task] = tree[section][task] || {};
      tree[section][task][level] = tree[section][task][level] || [];
      tree[section][task][level].push(deck);
    });
    return tree;
  }
  function getStats(deckId) {
    const words = deckId ? wordsForDeck(deckId) : state.words;
    const wordIds = new Set(words.map((w) => w.id));
    const rows = Array.from(state.progress.values()).filter((row) => wordIds.has(row.word_id));
    const learned = rows.filter((row) => row.status && row.status !== "new").length;
    const mastered = rows.filter((row) => row.status === "mastered").length;
    const learning = rows.filter((row) => row.status === "learning").length;
    const review = rows.filter((row) => row.status === "review").length;
    const due = rows.filter(isDue).length + (words.length - rows.length);
    const attempts = rows.reduce((sum, row) => sum + (row.total_attempts || 0), 0);
    const incorrect = rows.reduce((sum, row) => sum + (row.incorrect_count || 0), 0);
    const accuracy = attempts ? Math.round(((attempts - incorrect) / attempts) * 100) : 0;
    const percent = words.length ? Math.round((learned / words.length) * 100) : 0;
    return { total: words.length, learned, mastered, learning, review, due, attempts, incorrect, accuracy, percent };
  }
  function currentStreak() {
    const dayKeys = new Set();
    state.events.forEach((event) => {
      const d = new Date(event.created_at || nowIso());
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dayKeys.add(key);
    });
    let streak = 0;
    for (let i = 0; i < 60; i += 1) {
      const day = new Date(Date.now() - i * DAY_MS);
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      if (dayKeys.has(key)) streak += 1;
      else if (i > 0) break;
    }
    return streak;
  }

  // ---------------- RENDER: DASHBOARD ----------------

  function renderStats(container, stats) {
    if (!container) return;
    const cells = [
      ["Words learned", stats.learned],
      ["Mastered", stats.mastered],
      ["Due today", stats.due],
      ["Accuracy", `${stats.accuracy}%`],
    ];
    container.innerHTML = cells.map(([label, value]) => `
      <div class="vocab-stat-card">
        <p class="vocab-stat-value">${escapeHtml(value)}</p>
        <p class="vocab-stat-label">${escapeHtml(label)}</p>
      </div>
    `).join("");
  }

  function deckCard(deck, options = {}) {
    const stats = getStats(deck.id);
    const continueLabel = stats.learned ? "Continue" : "Start";
    const learnButton = options.includeLearnButton !== false
      ? `<button class="vocab-btn" type="button" data-vocab-start-deck="${escapeHtml(deck.id)}">${continueLabel}</button>`
      : "";
    return `
      <article class="vocab-deck-card" data-vocab-deck-card="${escapeHtml(deck.id)}">
        <div class="vocab-deck-card-body">
          <span class="vocab-label">${escapeHtml(deck.level || "")}</span>
          <h3 class="vocab-deck-title">${escapeHtml(deck.title || "Vocabulary deck")}</h3>
          <p class="vocab-deck-meta">${escapeHtml(deck.description || "Study and review this deck.")}</p>
        </div>
        <div class="vocab-deck-card-footer">
          <p class="vocab-deck-meta">${stats.learned}/${stats.total} learned · ${stats.mastered} mastered · ${stats.due} due</p>
          ${learnButton}
        </div>
      </article>
    `;
  }

  function renderDashboard() {
    renderStats($("vocabDashboardStats"), getStats());
    const streakEl = $("vocabCurrentStreak");
    if (streakEl) {
      const streak = currentStreak();
      streakEl.textContent = streak ? `${streak} day${streak === 1 ? "" : "s"}` : "0 days";
    }
    const decksContainer = $("vocabDashboardDecks");
    if (decksContainer) {
      const featured = state.decks.slice(0, 4);
      decksContainer.innerHTML = featured.length
        ? featured.map((deck) => deckCard(deck)).join("")
        : `<p class="vocab-muted">No decks available yet.</p>`;
    }
    renderRecentActivity();
  }

  function renderRecentActivity() {
    const container = $("vocabRecentActivity");
    if (!container) return;
    const recent = state.events.slice(0, 8);
    if (!recent.length) {
      container.innerHTML = `<p class="vocab-muted">No activity yet — start a deck to log progress.</p>`;
      return;
    }
    container.innerHTML = recent.map((event) => {
      const word = state.words.find((w) => w.id === event.word_id);
      const term = word?.term || "(removed)";
      const time = event.created_at ? new Date(event.created_at).toLocaleString() : "";
      const verdict = event.result ? "✓ Correct" : "✗ Wrong";
      return `<p><strong>${escapeHtml(term)}</strong> · <span class="vocab-muted">${escapeHtml(event.exercise_type || "")} · ${escapeHtml(verdict)} · ${escapeHtml(time)}</span></p>`;
    }).join("");
  }

  // ---------------- RENDER: DECKS NAV (Section -> Task -> Level) ----------------

  function renderDecksView() {
    const container = $("vocabDeckList");
    if (!container) return;
    const tree = decksGroupedByTaxonomy();
    const breadcrumbs = ["<button type=\"button\" class=\"vocab-crumb\" data-vocab-nav=\"home\">All sections</button>"];
    if (state.nav.section) {
      breadcrumbs.push(`<span class="vocab-crumb-sep">›</span>`);
      breadcrumbs.push(`<button type="button" class="vocab-crumb" data-vocab-nav="section:${escapeHtml(state.nav.section)}">${escapeHtml(SECTION_LABELS[state.nav.section] || state.nav.section)}</button>`);
    }
    if (state.nav.task) {
      breadcrumbs.push(`<span class="vocab-crumb-sep">›</span>`);
      breadcrumbs.push(`<span class="vocab-crumb is-current">${escapeHtml(TASK_LABELS[state.nav.task] || state.nav.task)}</span>`);
    }

    let body = "";
    if (!state.nav.section) {
      // Section landing
      body = `<div class="vocab-section-grid">${SECTION_ORDER.filter((s) => tree[s]).map((section) => {
        const taskCount = Object.keys(tree[section]).length;
        const deckCount = Object.values(tree[section]).reduce((sum, taskMap) => sum + Object.values(taskMap).reduce((s2, decks) => s2 + decks.length, 0), 0);
        const wordCount = Object.values(tree[section]).reduce((sum, taskMap) => sum + Object.values(taskMap).reduce((s2, decks) => s2 + decks.reduce((s3, deck) => s3 + wordsForDeck(deck.id).length, 0), 0), 0);
        return `
          <button type="button" class="vocab-section-card" data-vocab-nav="section:${escapeHtml(section)}">
            <span class="vocab-section-card-title">${escapeHtml(SECTION_LABELS[section] || section)}</span>
            <span class="vocab-section-card-meta">${deckCount} decks · ${wordCount} words${taskCount > 1 ? ` · ${taskCount} tasks` : ""}</span>
          </button>
        `;
      }).join("")}</div>`;
    } else if (state.nav.section === "writing" && !state.nav.task) {
      // Task landing
      body = `<div class="vocab-section-grid">${Object.keys(tree.writing || {}).map((task) => {
        const deckCount = Object.values(tree.writing[task]).reduce((s, decks) => s + decks.length, 0);
        const wordCount = Object.values(tree.writing[task]).reduce((s, decks) => s + decks.reduce((s2, deck) => s2 + wordsForDeck(deck.id).length, 0), 0);
        return `
          <button type="button" class="vocab-section-card" data-vocab-nav="task:${escapeHtml(task)}">
            <span class="vocab-section-card-title">${escapeHtml(TASK_LABELS[task] || task)}</span>
            <span class="vocab-section-card-meta">${deckCount} decks · ${wordCount} words</span>
          </button>
        `;
      }).join("")}</div>`;
    } else {
      // Level grid
      const taskKey = state.nav.section === "writing" ? state.nav.task : "_none";
      const levelMap = (tree[state.nav.section] && tree[state.nav.section][taskKey]) || {};
      const decks = LEVEL_ORDER.flatMap((level) => levelMap[level] || []);
      if (!decks.length) {
        body = `<p class="vocab-muted">No decks here yet.</p>`;
      } else {
        body = `<div class="vocab-deck-grid">${decks.map((deck) => deckCard(deck)).join("")}</div>`;
      }
    }

    container.innerHTML = `
      <div class="vocab-breadcrumbs">${breadcrumbs.join("")}</div>
      ${body}
    `;
  }

  function handleNav(target) {
    if (!target) return;
    if (target === "home") { state.nav = { section: "", task: "" }; }
    else if (target.startsWith("section:")) { state.nav = { section: target.slice(8), task: "" }; }
    else if (target.startsWith("task:")) { state.nav = { ...state.nav, task: target.slice(5) }; }
    renderDecksView();
  }

  // ---------------- RENDER: PROGRESS ----------------

  function renderProgress() {
    renderStats($("vocabProgressStats"), getStats());
    const hard = $("vocabHardWords");
    if (hard) {
      const rows = Array.from(state.progress.values())
        .filter((row) => (row.incorrect_count || 0) > 0)
        .sort((a, b) => (b.incorrect_count || 0) - (a.incorrect_count || 0))
        .slice(0, 12);
      if (!rows.length) {
        hard.innerHTML = `<p class="vocab-muted">No problem words yet.</p>`;
      } else {
        hard.innerHTML = rows.map((row) => {
          const word = state.words.find((w) => w.id === row.word_id);
          const term = word?.term || "(removed)";
          return `<p><strong>${escapeHtml(term)}</strong> · <span class="vocab-muted">${row.incorrect_count} miss${row.incorrect_count === 1 ? "" : "es"} · ${row.status}</span></p>`;
        }).join("");
      }
    }
    const perDeck = $("vocabPerDeckProgress");
    if (perDeck) {
      perDeck.innerHTML = state.decks.map((deck) => {
        const stats = getStats(deck.id);
        return `
          <div class="vocab-progress-card">
            <h3>${escapeHtml(deck.title)}</h3>
            <p class="vocab-muted">${stats.learned}/${stats.total} learned · ${stats.mastered} mastered · ${stats.review} review · ${stats.learning} learning</p>
            <div class="vocab-progress-track"><div class="vocab-progress-fill" style="width:${stats.percent}%"></div></div>
          </div>
        `;
      }).join("");
    }
  }

  // ---------------- STUDY SESSION ----------------

  function pickSessionWords(deckId) {
    const all = wordsForDeck(deckId);
    if (!all.length) return [];
    const due = [];
    const learning = [];
    const fresh = [];
    all.forEach((word) => {
      const row = progressForWord(word.id);
      if (!row || row.status === "new") fresh.push(word);
      else if (isDue(row)) due.push(word);
      else if (row.status === "learning") learning.push(word);
    });
    const ordered = [...due, ...learning, ...fresh];
    return shuffle(ordered).slice(0, Math.max(8, Math.min(15, ordered.length)));
  }

  function startStudySession(deckId) {
    if (!requireSignedIn()) return;
    const deck = state.decks.find((d) => d.id === deckId);
    if (!deck) return;
    const words = pickSessionWords(deckId);
    if (!words.length) {
      setActiveView("study");
      const body = $("vocabStudyBody");
      if (body) body.innerHTML = `<div class="vocab-empty">Nothing to study right now in <strong>${escapeHtml(deck.title)}</strong>.</div>`;
      return;
    }
    state.currentDeckId = deckId;
    state.session = {
      id: randomId(),
      deckId: deck.id,
      deckTitle: deck.title,
      words,
      index: 0,
      correct: 0,
      incorrect: 0,
      startedAt: Date.now(),
      phase: "learn", // learn -> test
      learnIndex: 0,
      answered: false,
      startedQuestionAt: Date.now(),
    };
    setActiveView("study");
    renderLearnPhase();
  }

  // ---------- LEARN PHASE (Memrise-style intro card per word) ----------

  function highlightCollocations(text, term, collocations) {
    let html = escapeHtml(text);
    const safeCollocations = (collocations || []).filter(Boolean);
    safeCollocations.sort((a, b) => b.length - a.length).forEach((coll) => {
      const re = new RegExp(`(${escapeRegex(coll)})`, "ig");
      html = html.replace(re, `<mark>$1</mark>`);
    });
    if (term) {
      const reTerm = new RegExp(`(${escapeRegex(term)}\\w*)`, "ig");
      html = html.replace(reTerm, `<strong>$1</strong>`);
    }
    return html;
  }

  function escapeRegex(s) { return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function renderWordCard(word, options = {}) {
    const examples = Array.isArray(word.examples) ? word.examples : [];
    const collocations = Array.isArray(word.collocations) ? word.collocations : [];
    const synonyms = Array.isArray(word.synonyms) ? word.synonyms : [];
    const antonyms = Array.isArray(word.antonyms) ? word.antonyms : [];
    const definition = word.definition || word.meaning_en || "";
    return `
      <div class="vocab-word-card">
        <div class="vocab-word-card-head">
          <h2 class="vocab-word-term">${escapeHtml(word.term)}</h2>
          ${word.part_of_speech ? `<span class="vocab-word-pos">${escapeHtml(word.part_of_speech)}</span>` : ""}
        </div>
        ${definition ? `<p class="vocab-word-definition">${escapeHtml(definition)}</p>` : ""}
        ${examples.length ? `
          <section class="vocab-word-section">
            <h3 class="vocab-word-section-title">In context</h3>
            <ul class="vocab-word-examples">
              ${examples.map((ex) => {
                const text = typeof ex === "string" ? ex : (ex?.text || "");
                return `<li>${highlightCollocations(text, word.term, collocations)}</li>`;
              }).join("")}
            </ul>
          </section>
        ` : ""}
        ${collocations.length ? `
          <section class="vocab-word-section">
            <h3 class="vocab-word-section-title">Common collocations</h3>
            <p class="vocab-word-chiprow">${collocations.map((c) => `<span class="vocab-chip">${escapeHtml(c)}</span>`).join("")}</p>
          </section>
        ` : ""}
        ${synonyms.length ? `
          <section class="vocab-word-section">
            <h3 class="vocab-word-section-title">Synonyms</h3>
            <p class="vocab-word-chiprow">${synonyms.map((c) => `<span class="vocab-chip is-pos">${escapeHtml(c)}</span>`).join("")}</p>
          </section>
        ` : ""}
        ${antonyms.length ? `
          <section class="vocab-word-section">
            <h3 class="vocab-word-section-title">Opposites</h3>
            <p class="vocab-word-chiprow">${antonyms.map((c) => `<span class="vocab-chip is-neg">${escapeHtml(c)}</span>`).join("")}</p>
          </section>
        ` : ""}
        ${options.cta ? `<div class="vocab-study-actions">${options.cta}</div>` : ""}
      </div>
    `;
  }

  function renderLearnPhase() {
    const session = state.session;
    const body = $("vocabStudyBody");
    if (!session || !body) return;
    const word = session.words[session.learnIndex];
    if (!word) {
      session.phase = "test";
      session.index = 0;
      renderTestQuestion();
      return;
    }
    const total = session.words.length;
    const cta = `<button class="vocab-btn" type="button" id="vocabLearnNextBtn">${session.learnIndex + 1 === total ? "Start review" : "Got it — next word"}</button>`;
    body.innerHTML = `
      <div class="vocab-study-shell">
        <div class="vocab-study-top">
          <span class="vocab-label">${escapeHtml(session.deckTitle)} · Learn ${session.learnIndex + 1}/${total}</span>
          <button class="vocab-btn ghost" type="button" id="vocabLearnSkipBtn">Skip to review</button>
        </div>
        <div class="vocab-progress-track"><div class="vocab-progress-fill" style="width:${Math.round((session.learnIndex / total) * 100)}%"></div></div>
        ${renderWordCard(word, { cta })}
      </div>
    `;
    $("vocabLearnNextBtn")?.addEventListener("click", () => {
      session.learnIndex += 1;
      renderLearnPhase();
    });
    $("vocabLearnSkipBtn")?.addEventListener("click", () => {
      session.phase = "test";
      session.index = 0;
      renderTestQuestion();
    });
  }

  // ---------- TEST PHASE ----------

  const EXERCISE_CYCLE = ["cloze", "term_to_definition", "definition_to_term", "synonym_match", "antonym_match", "type_word"];

  function exerciseTypeFor(word, index) {
    const candidates = EXERCISE_CYCLE.slice();
    const examples = Array.isArray(word.examples) ? word.examples : [];
    const synonyms = Array.isArray(word.synonyms) ? word.synonyms : [];
    const antonyms = Array.isArray(word.antonyms) ? word.antonyms : [];
    if (!examples.length) drop(candidates, "cloze");
    if (!synonyms.length) drop(candidates, "synonym_match");
    if (!antonyms.length) drop(candidates, "antonym_match");
    if (!candidates.length) candidates.push("term_to_definition");
    return candidates[index % candidates.length];
  }
  function drop(arr, value) {
    const i = arr.indexOf(value);
    if (i >= 0) arr.splice(i, 1);
  }

  function distractorPool(word, field) {
    const pool = state.words
      .filter((w) => w.id !== word.id)
      .map((w) => {
        if (field === "term") return w.term;
        if (field === "definition") return w.definition || w.meaning_en;
        if (field === "synonym") return (w.synonyms || [])[0];
        if (field === "antonym") return (w.antonyms || [])[0];
        return null;
      })
      .filter((v) => v && typeof v === "string");
    return shuffle(unique(pool));
  }

  function buildOptions(correct, pool, count = 4) {
    const opts = unique([correct, ...pool]).slice(0, count);
    while (opts.length < count && pool.length > opts.length - 1) {
      opts.push(pool[opts.length - 1]);
    }
    return shuffle(opts);
  }

  function buildClozePrompt(word) {
    const examples = Array.isArray(word.examples) ? word.examples : [];
    const example = examples[Math.floor(Math.random() * examples.length)];
    const text = typeof example === "string" ? example : (example?.text || "");
    if (!text) return null;
    const re = new RegExp(`\\b${escapeRegex(word.term)}\\w*`, "i");
    if (!re.test(text)) return null;
    const blanked = text.replace(re, "_____");
    return blanked;
  }

  function renderTestQuestion() {
    const session = state.session;
    const body = $("vocabStudyBody");
    if (!session || !body) return;
    const word = session.words[session.index];
    if (!word) {
      renderSessionComplete();
      return;
    }
    const type = exerciseTypeFor(word, session.index);
    session.currentType = type;
    session.answered = false;
    session.startedQuestionAt = Date.now();
    const total = session.words.length;
    const progress = Math.round((session.index / total) * 100);

    let promptHtml = "";
    let controlsHtml = "";
    let expected = "";
    let mode = "click"; // click | type
    let optionsList = [];

    if (type === "cloze") {
      const cloze = buildClozePrompt(word) || (word.definition || word.meaning_en);
      promptHtml = `<p class="vocab-muted vocab-mode-label">Fill in the gap</p><p class="vocab-prompt vocab-prompt-cloze">${escapeHtml(cloze)}</p>`;
      controlsHtml = `
        <input class="vocab-typing-input" id="vocabTypingInput" type="text" autocomplete="off" placeholder="Type the missing word" />
        <div class="vocab-study-actions"><button class="vocab-btn" id="vocabCheckTypingBtn" type="button">Check</button></div>
      `;
      expected = word.term;
      mode = "type";
    } else if (type === "term_to_definition") {
      promptHtml = `<p class="vocab-muted vocab-mode-label">Pick the definition</p><p class="vocab-prompt"><strong>${escapeHtml(word.term)}</strong></p>${word.part_of_speech ? `<p class="vocab-muted">${escapeHtml(word.part_of_speech)}</p>` : ""}`;
      const correct = word.definition || word.meaning_en;
      optionsList = buildOptions(correct, distractorPool(word, "definition"));
      expected = correct;
      controlsHtml = `<div class="vocab-options">${optionsList.map((opt) => `<button class="vocab-option" type="button" data-vocab-answer="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join("")}</div>`;
    } else if (type === "definition_to_term") {
      promptHtml = `<p class="vocab-muted vocab-mode-label">Pick the word</p><p class="vocab-prompt">${escapeHtml(word.definition || word.meaning_en)}</p>`;
      optionsList = buildOptions(word.term, distractorPool(word, "term"));
      expected = word.term;
      controlsHtml = `<div class="vocab-options">${optionsList.map((opt) => `<button class="vocab-option" type="button" data-vocab-answer="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join("")}</div>`;
    } else if (type === "synonym_match") {
      const synonyms = Array.isArray(word.synonyms) ? word.synonyms : [];
      const correct = synonyms[0];
      promptHtml = `<p class="vocab-muted vocab-mode-label">Pick a synonym</p><p class="vocab-prompt"><strong>${escapeHtml(word.term)}</strong></p>`;
      optionsList = buildOptions(correct, distractorPool(word, "synonym").concat(distractorPool(word, "term")));
      expected = correct;
      session.acceptableAnswers = synonyms.slice();
      controlsHtml = `<div class="vocab-options">${optionsList.map((opt) => `<button class="vocab-option" type="button" data-vocab-answer="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join("")}</div>`;
    } else if (type === "antonym_match") {
      const antonyms = Array.isArray(word.antonyms) ? word.antonyms : [];
      const correct = antonyms[0];
      promptHtml = `<p class="vocab-muted vocab-mode-label">Pick the opposite</p><p class="vocab-prompt"><strong>${escapeHtml(word.term)}</strong></p>`;
      optionsList = buildOptions(correct, distractorPool(word, "antonym").concat(distractorPool(word, "term")));
      expected = correct;
      session.acceptableAnswers = antonyms.slice();
      controlsHtml = `<div class="vocab-options">${optionsList.map((opt) => `<button class="vocab-option" type="button" data-vocab-answer="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`).join("")}</div>`;
    } else { // type_word
      promptHtml = `<p class="vocab-muted vocab-mode-label">Type the word</p><p class="vocab-prompt">${escapeHtml(word.definition || word.meaning_en)}</p>`;
      controlsHtml = `
        <input class="vocab-typing-input" id="vocabTypingInput" type="text" autocomplete="off" placeholder="Type the word" />
        <div class="vocab-study-actions"><button class="vocab-btn" id="vocabCheckTypingBtn" type="button">Check</button></div>
      `;
      expected = word.term;
      mode = "type";
    }
    session.expectedAnswer = expected;
    session.answerMode = mode;

    body.innerHTML = `
      <div class="vocab-study-shell">
        <div class="vocab-study-top">
          <span class="vocab-label">${escapeHtml(session.deckTitle)} · Review ${session.index + 1}/${total}</span>
          <span class="vocab-muted">${escapeHtml(prettyType(type))}</span>
        </div>
        <div class="vocab-progress-track"><div class="vocab-progress-fill" style="width:${progress}%"></div></div>
        <div class="vocab-question-card">
          ${promptHtml}
          ${controlsHtml}
          <div class="vocab-feedback" id="vocabFeedback"></div>
          <div class="vocab-word-detail hidden" id="vocabWordDetail"></div>
          <div class="vocab-study-actions"><button class="vocab-btn secondary hidden" id="vocabNextQuestionBtn" type="button">Next</button></div>
        </div>
      </div>
    `;
    Array.from(document.querySelectorAll("[data-vocab-answer]")).forEach((button) => {
      button.addEventListener("click", () => answerCurrent(button.getAttribute("data-vocab-answer"), button));
    });
    $("vocabCheckTypingBtn")?.addEventListener("click", () => answerCurrent($("vocabTypingInput")?.value || ""));
    $("vocabTypingInput")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") answerCurrent($("vocabTypingInput")?.value || "");
    });
    $("vocabNextQuestionBtn")?.addEventListener("click", nextTestQuestion);
    setTimeout(() => { $("vocabTypingInput")?.focus(); }, 0);
  }

  function prettyType(type) {
    if (type === "cloze") return "Cloze · fill in the gap";
    if (type === "term_to_definition") return "Term → definition";
    if (type === "definition_to_term") return "Definition → term";
    if (type === "synonym_match") return "Synonym match";
    if (type === "antonym_match") return "Opposite match";
    if (type === "type_word") return "Type the word";
    return type;
  }

  async function answerCurrent(answer, button) {
    const session = state.session;
    if (!session || session.answered) return;
    const word = session.words[session.index];
    const expected = session.expectedAnswer;
    const acceptable = Array.isArray(session.acceptableAnswers) ? session.acceptableAnswers : [expected];
    const correct = acceptable.some((a) => normalize(answer) === normalize(a));
    const responseMs = Date.now() - Number(session.startedQuestionAt || Date.now());
    session.answered = true;
    if (correct) session.correct += 1; else session.incorrect += 1;

    if (button) {
      button.classList.add(correct ? "is-correct" : "is-wrong");
      Array.from(document.querySelectorAll("[data-vocab-answer]")).forEach((option) => {
        option.disabled = true;
        if (acceptable.some((a) => normalize(option.getAttribute("data-vocab-answer")) === normalize(a))) {
          option.classList.add("is-correct");
        }
      });
    }
    const feedback = $("vocabFeedback");
    if (feedback) {
      const acceptableLabel = acceptable.filter(Boolean).join(", ");
      feedback.textContent = correct
        ? "Correct."
        : `Not quite. Answer: ${acceptableLabel}`;
      feedback.classList.toggle("good", correct);
      feedback.classList.toggle("bad", !correct);
    }
    const detail = $("vocabWordDetail");
    if (detail) {
      detail.classList.remove("hidden");
      detail.innerHTML = renderWordCard(word);
    }
    const input = $("vocabTypingInput");
    if (input) input.disabled = true;
    $("vocabCheckTypingBtn")?.setAttribute("disabled", "disabled");
    $("vocabNextQuestionBtn")?.classList.remove("hidden");
    $("vocabNextQuestionBtn")?.focus();

    await persistProgress(word, session.currentType, correct, responseMs);
    renderDashboard();
    renderProgress();
  }

  function nextTestQuestion() {
    if (!state.session) return;
    state.session.index += 1;
    renderTestQuestion();
  }

  function renderSessionComplete() {
    const body = $("vocabStudyBody");
    if (!body || !state.session) return;
    const session = state.session;
    body.innerHTML = `
      <div class="vocab-study-shell">
        <div class="vocab-study-card">
          <p class="vocab-label">Session complete</p>
          <h2 class="vocab-section-heading">${escapeHtml(session.deckTitle)}</h2>
          <p class="vocab-copy">Correct: <strong>${session.correct}</strong> · Needs review: <strong>${session.incorrect}</strong></p>
          <div class="vocab-study-actions">
            <button class="vocab-btn" type="button" id="vocabRepeatDeckBtn">Study this deck again</button>
            <button class="vocab-btn secondary" type="button" id="vocabGoProgressBtn">View progress</button>
          </div>
        </div>
      </div>
    `;
    $("vocabRepeatDeckBtn")?.addEventListener("click", () => startStudySession(session.deckId));
    $("vocabGoProgressBtn")?.addEventListener("click", () => setActiveView("progress"));
  }

  // ---------------- VIEW SWITCHING / EVENTS ----------------

  function setActiveView(view) {
    state.currentView = view;
    document.querySelectorAll(".vocab-tab").forEach((tab) => {
      tab.classList.toggle("is-active", tab.getAttribute("data-vocab-view") === view);
    });
    document.querySelectorAll(".vocab-view").forEach((el) => {
      const id = el.id || "";
      el.classList.toggle("hidden", !id.toLowerCase().includes(view.toLowerCase()));
    });
    if (view === "dashboard") renderDashboard();
    if (view === "decks") renderDecksView();
    if (view === "progress") renderProgress();
  }

  function bindUi() {
    document.querySelectorAll(".vocab-tab").forEach((tab) => {
      tab.addEventListener("click", () => setActiveView(tab.getAttribute("data-vocab-view") || "dashboard"));
    });
    document.body.addEventListener("click", (event) => {
      const startBtn = event.target.closest("[data-vocab-start-deck]");
      if (startBtn) {
        event.preventDefault();
        startStudySession(startBtn.getAttribute("data-vocab-start-deck"));
        return;
      }
      const navBtn = event.target.closest("[data-vocab-nav]");
      if (navBtn) {
        event.preventDefault();
        handleNav(navBtn.getAttribute("data-vocab-nav"));
        return;
      }
    });
    $("vocabContinueBtn")?.addEventListener("click", () => {
      const next = state.decks.find((deck) => {
        const stats = getStats(deck.id);
        return stats.due > 0;
      }) || state.decks[0];
      if (next) startStudySession(next.id);
    });
    $("vocabRefreshBtn")?.addEventListener("click", async () => {
      setStatus("Refreshing…");
      await loadProgress();
      renderDashboard();
      renderProgress();
      setStatus("Up to date.");
      setTimeout(() => setStatus(""), 1500);
    });
    $("vocabBackHomeBtn")?.addEventListener("click", () => {
      close();
      try { window.IELTS?.Router?.goHome?.(); } catch (e) {}
      try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {}
    });
  }

  // ---------------- BOOTSTRAP ----------------

  async function ensureLoaded(forceRefresh) {
    if (state.loading) return;
    if (state.loaded && !forceRefresh) return;
    state.loading = true;
    setStatus("Loading vocabulary…");
    try {
      await resolveUser();
      const content = await loadContent();
      state.decks = content.decks;
      state.words = content.words;
      await loadProgress();
      state.loaded = true;
      renderDashboard();
      renderDecksView();
      renderProgress();
      setStatus(state.useSupabase ? "" : "Showing offline sample (sign in to sync).");
    } catch (error) {
      console.error("Vocabulary failed to load", error);
      setStatus("Could not load vocabulary. Please try again.", "error");
    } finally {
      state.loading = false;
    }
  }

  function open() {
    if (!requireSignedIn()) return;
    try { window.IELTS?.UI?.showOnly?.("vocabulary"); } catch (e) {}
    document.getElementById("vocabularySection")?.classList.remove("hidden");
    setActiveView("dashboard");
    ensureLoaded();
  }

  function close() {
    try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {}
    document.getElementById("vocabularySection")?.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindUi();
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.Vocabulary = {
    open,
    close,
    refresh: () => ensureLoaded(true),
  };
})();
