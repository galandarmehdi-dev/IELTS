/* assets/js/placement-test.js — IELTS readiness diagnostic flow */
(function () {
  "use strict";

  const STORAGE_KEY = "ielts_placement_diagnostic_state_v2";

  const FLOW = [
    { id: "listen3", title: "Listening Section 3", kind: "listening" },
    { id: "listen4", title: "Listening Section 4", kind: "listening" },
    { id: "reading", title: "Reading Part 3", kind: "timed", seconds: 25 * 60 },
    { id: "grammar", title: "Grammar Diagnostic", kind: "timed", seconds: 15 * 60 },
    { id: "vocabulary", title: "Vocabulary Diagnostic", kind: "timed", seconds: 15 * 60 },
  ];

  const DEADLINE_OPTIONS = [
    "1 month",
    "2 months",
    "3 months",
    "6 months",
    "I do not have a deadline yet",
    "Custom date",
  ];

  let state = {
    loading: true,
    started: false,
    flowIndex: 0,
    data: null,
    timerEndsAt: 0,
    timerInterval: null,
    answers: {
      listening: {},
      reading: {},
      grammar: {},
      vocabulary: {},
    },
    timeSpent: {},
    stepStartedAt: 0,
    submitted: false,
    result: null,
    deadline: "",
    targetBand: "",
    customDeadline: "",
    listeningSeekLock: {},
  };

  function oneLine(v) {
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function currentStep() {
    return FLOW[state.flowIndex] || FLOW[0];
  }

  function progressLabel() {
    const step = currentStep();
    return `Step ${state.flowIndex + 1} of ${FLOW.length}: ${step.title}`;
  }

  function buildApiUrl() {
    try {
      return window.IELTS?.Registry?.buildAdminApiUrl?.({})?.replace(/\/api\/admin\?.*$/, "/api/placement-diagnostic")
        || "/api/placement-diagnostic";
    } catch (e) {
      return "/api/placement-diagnostic";
    }
  }

  async function waitForAccessToken(maxWaitMs = 2200) {
    const started = Date.now();
    while (Date.now() - started < maxWaitMs) {
      const token = await window.IELTS?.Auth?.getAccessToken?.().catch(() => null)
        || sessionStorage.getItem("ielts.authToken")
        || localStorage.getItem("ielts.authToken")
        || "";
      if (token) return token;
      await new Promise((resolve) => setTimeout(resolve, 180));
    }
    return "";
  }

  async function getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = await waitForAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function apiFetch(url, options = {}) {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      const error = new Error("Please sign in to access the placement test.");
      error.code = "MISSING_AUTH";
      throw error;
    }
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...headers,
      },
    });
  }

  function persistState() {
    const save = {
      started: state.started,
      flowIndex: state.flowIndex,
      answers: state.answers,
      timeSpent: state.timeSpent,
      deadline: state.deadline,
      targetBand: state.targetBand,
      customDeadline: state.customDeadline,
      submitted: state.submitted,
      result: state.result,
      updatedAt: Date.now(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  function hydrateState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      state.started = !!parsed.started;
      state.flowIndex = Number(parsed.flowIndex || 0);
      state.answers = parsed.answers && typeof parsed.answers === "object" ? parsed.answers : state.answers;
      state.timeSpent = parsed.timeSpent && typeof parsed.timeSpent === "object" ? parsed.timeSpent : state.timeSpent;
      state.deadline = oneLine(parsed.deadline || "");
      state.targetBand = oneLine(parsed.targetBand || "");
      state.customDeadline = oneLine(parsed.customDeadline || "");
      state.submitted = !!parsed.submitted;
      state.result = parsed.result || null;
    } catch (e) {}
  }

  function resetState() {
    state.started = false;
    state.flowIndex = 0;
    state.answers = { listening: {}, reading: {}, grammar: {}, vocabulary: {} };
    state.timeSpent = {};
    state.timerEndsAt = 0;
    state.stepStartedAt = 0;
    state.submitted = false;
    state.result = null;
    state.deadline = "";
    state.targetBand = "";
    state.customDeadline = "";
    persistState();
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function setStepStart() {
    state.stepStartedAt = Date.now();
  }

  function markStepTime(stepId) {
    if (!state.stepStartedAt) return;
    const spent = Math.max(0, Math.floor((Date.now() - state.stepStartedAt) / 1000));
    state.timeSpent[stepId] = (state.timeSpent[stepId] || 0) + spent;
    state.stepStartedAt = Date.now();
  }

  function fmtTimer(seconds) {
    const s = Math.max(0, Number(seconds || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function startTimer(seconds, onEnd) {
    stopTimer();
    state.timerEndsAt = Date.now() + (seconds * 1000);
    const tick = () => {
      const remain = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
      const timerEl = document.getElementById("diagStepTimer");
      if (timerEl) timerEl.textContent = fmtTimer(remain);
      if (remain <= 0) {
        stopTimer();
        onEnd?.();
      }
    };
    tick();
    state.timerInterval = setInterval(tick, 500);
  }

  function saveListeningAnswers(container) {
    if (!container) return;
    container.querySelectorAll("[data-lq]").forEach((input) => {
      const q = oneLine(input.getAttribute("data-lq"));
      if (!q) return;
      state.answers.listening[q] = oneLine(input.value || "");
    });
    const radios = {};
    container.querySelectorAll("[data-lq-radio]").forEach((input) => {
      const q = oneLine(input.getAttribute("data-lq-radio"));
      if (!q || !input.checked) return;
      radios[q] = oneLine(input.value || "");
    });
    Object.assign(state.answers.listening, radios);
  }

  function hydrateListeningAnswers(container) {
    if (!container) return;
    container.querySelectorAll("[data-lq]").forEach((input) => {
      const q = oneLine(input.getAttribute("data-lq"));
      if (!q) return;
      const val = state.answers.listening[q];
      if (typeof val === "string") input.value = val;
    });
    container.querySelectorAll("[data-lq-radio]").forEach((input) => {
      const q = oneLine(input.getAttribute("data-lq-radio"));
      if (!q) return;
      input.checked = oneLine(state.answers.listening[q] || "").toLowerCase() === oneLine(input.value || "").toLowerCase();
    });
  }

  function renderReadingBlock(block) {
    const title = `<h4 class="diag-subtitle">${escapeHtml(block.title || "")}</h4>`;
    const instructions = Array.isArray(block.instructions)
      ? `<div class="diag-inst">${block.instructions.map((x) => `<div>${escapeHtml(x)}</div>`).join("")}</div>`
      : "";

    if (block.type === "tfng") {
      return `${title}${instructions}<div class="diag-q-list">${(block.items || []).map((item) => {
        const q = Number(item.q || 0);
        return `<div class="diag-q-row"><label><b>${q}.</b> ${escapeHtml(item.text || "")}</label><select data-reading-q="${q}"><option value="">Select</option><option>TRUE</option><option>FALSE</option><option>NOT GIVEN</option><option>YES</option><option>NO</option></select></div>`;
      }).join("")}</div>`;
    }

    if (block.type === "summarySelect") {
      const options = (block.options || []).map((opt) => `<option value="${escapeHtml(opt.letter || "")}">${escapeHtml(opt.letter || "")} - ${escapeHtml(opt.word || "")}</option>`).join("");
      return `${title}${instructions}<div class="diag-q-list">${(block.summaryLines || []).map((line) => {
        const q = Number(line.blankQ || 0);
        const text = `${line.before || line.text || ""} ____ ${line.after || line.tail || ""}`;
        return `<div class="diag-q-row"><label><b>${q}.</b> ${escapeHtml(text)}</label><select data-reading-q="${q}"><option value="">Select</option>${options}</select></div>`;
      }).join("")}</div>`;
    }

    if (block.type === "mcq") {
      return `${title}${instructions}<div class="diag-q-list">${(block.items || []).map((item) => {
        const q = Number(item.q || 0);
        const choices = item.choices || {};
        return `<div class="diag-q-card"><div><b>${q}.</b> ${escapeHtml(item.text || "")}</div>${Object.entries(choices).map(([key, label]) => `<label class="diag-opt"><input type="radio" name="reading_${q}" value="${escapeHtml(key)}" data-reading-q-radio="${q}"> ${escapeHtml(key)}) ${escapeHtml(label)}</label>`).join("")}</div>`;
      }).join("")}</div>`;
    }

    if (Array.isArray(block.items) && block.items.length) {
      return `${title}${instructions}<div class="diag-q-list">${(block.items || []).map((item) => {
        const q = Number(item.q || 0);
        const text = item.text || item.prompt || "";
        return `<div class="diag-q-row"><label><b>${q}.</b> ${escapeHtml(text)}</label><input data-reading-q="${q}" class="diag-input" type="text" placeholder="Type your answer"></div>`;
      }).join("")}</div>`;
    }

    return "";
  }

  function saveReadingAnswers(container) {
    if (!container) return;
    container.querySelectorAll("[data-reading-q]").forEach((el) => {
      const q = oneLine(el.getAttribute("data-reading-q"));
      if (!q) return;
      state.answers.reading[q] = oneLine(el.value || "");
    });
    container.querySelectorAll("[data-reading-q-radio]").forEach((el) => {
      const q = oneLine(el.getAttribute("data-reading-q-radio"));
      if (!q || !el.checked) return;
      state.answers.reading[q] = oneLine(el.value || "");
    });
  }

  function hydrateReadingAnswers(container) {
    if (!container) return;
    container.querySelectorAll("[data-reading-q]").forEach((el) => {
      const q = oneLine(el.getAttribute("data-reading-q"));
      if (!q) return;
      if (state.answers.reading[q]) el.value = state.answers.reading[q];
    });
    container.querySelectorAll("[data-reading-q-radio]").forEach((el) => {
      const q = oneLine(el.getAttribute("data-reading-q-radio"));
      if (!q) return;
      el.checked = oneLine(state.answers.reading[q] || "").toUpperCase() === oneLine(el.value || "").toUpperCase();
    });
  }

  function renderOpenSection(schema, answerKeyPrefix) {
    return (schema.sections || []).map((section) => {
      const itemsHtml = (section.items || []).map((item) => {
        const qLabel = escapeHtml(item.prompt || "");
        const choices = Array.isArray(item.choices) ? item.choices : null;
        const displayNumber = Number(item.id?.split("_")?.[1] || 0) || 1;
        return `<div class="diag-q-card"><label><b>${displayNumber}.</b> ${qLabel}</label>${choices
          ? `<div class="diag-choice-wrap">${choices.map((choice, idx) => `<label class="diag-opt"><input type="radio" name="${item.id}" value="${escapeHtml(choice)}" data-open-q="${escapeHtml(item.id)}"> ${String.fromCharCode(97 + idx)}) ${escapeHtml(choice)}</label>`).join("")}</div>`
          : `<input class="diag-input" type="text" data-open-q="${escapeHtml(item.id)}" placeholder="Type your answer">`
        }</div>`;
      }).join("");
      const wordBox = Array.isArray(section.wordBox) && section.wordBox.length
        ? `<div class="diag-wordbox">${section.wordBox.map((w) => `<span>${escapeHtml(w)}</span>`).join("")}</div>`
        : "";
      return `<div class="diag-section-block"><h4 class="diag-subtitle">${escapeHtml(section.title || "")}</h4><p class="diag-inst">${escapeHtml(section.instruction || "")}</p>${wordBox}${itemsHtml}</div>`;
    }).join("");
  }

  function saveOpenAnswers(container, key) {
    if (!container) return;
    const out = state.answers[key] || {};
    container.querySelectorAll("[data-open-q]").forEach((el) => {
      const q = oneLine(el.getAttribute("data-open-q"));
      if (!q) return;
      if (el.type === "radio") {
        if (el.checked) out[q] = oneLine(el.value || "");
      } else {
        out[q] = oneLine(el.value || "");
      }
    });
    state.answers[key] = out;
  }

  function hydrateOpenAnswers(container, key) {
    if (!container) return;
    const out = state.answers[key] || {};
    container.querySelectorAll("[data-open-q]").forEach((el) => {
      const q = oneLine(el.getAttribute("data-open-q"));
      if (!q) return;
      const saved = oneLine(out[q] || "");
      if (el.type === "radio") {
        el.checked = saved.toLowerCase() === oneLine(el.value || "").toLowerCase();
      } else {
        el.value = saved;
      }
    });
  }

  function buildHeader() {
    return `<div class="diag-header"><div class="diag-progress">${escapeHtml(progressLabel())}</div><div class="diag-title">Placement / Diagnostic Test</div><div class="diag-note">Complete all steps to get an estimated IELTS readiness profile.</div></div>`;
  }

  function stepShell(inner, opts = {}) {
    const backBtn = state.flowIndex > 0 ? `<button class="btn secondary" id="diagBackBtn" type="button">Back</button>` : "";
    const finishLabel = opts.finishLabel || "Next";
    const timer = opts.timer ? `<div class="diag-timer">Time left: <b id="diagStepTimer">${fmtTimer(opts.timer)}</b></div>` : "";
    const finishEarly = opts.showFinishEarly ? `<button class="btn secondary" id="diagFinishEarlyBtn" type="button">Finish Early</button>` : "";
    return `${buildHeader()}<div class="diag-step-card">${timer}${inner}<div class="diag-actions">${backBtn}${finishEarly}<button class="btn" id="diagNextBtn" type="button">${escapeHtml(finishLabel)}</button></div></div>`;
  }

  function renderIntro(container) {
    container.innerHTML = `${buildHeader()}<div class="diag-step-card"><h3>Complete IELTS readiness diagnostic</h3><p>This diagnostic includes Listening Section 3 & 4, Reading Part 3, Grammar, and Vocabulary. You will get an estimated IELTS band range, CEFR level, strengths, weaknesses, and a study plan.</p><ul><li>Reading timer: 25 minutes</li><li>Grammar timer: 15 minutes</li><li>Vocabulary timer: 15 minutes</li></ul><div class="diag-actions"><button class="btn" id="diagStartBtn" type="button">Start diagnostic</button></div></div>`;
    document.getElementById("diagStartBtn")?.addEventListener("click", () => {
      state.started = true;
      state.flowIndex = 0;
      setStepStart();
      persistState();
      render();
    });
  }

  function wireDiagnosticAudioPlayer(container, audioSrc, stepId) {
    const audio = container?.querySelector("#diagListeningAudio");
    const playBtn = container?.querySelector("#diagAudioPlayBtn");
    const status = container?.querySelector("#diagAudioStatus");
    if (!audio || !playBtn || !status) return;
    audio.src = audioSrc || "";
    audio.controls = false;
    audio.preload = "none";
    audio.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
    audio.setAttribute("disablePictureInPicture", "true");
    audio.setAttribute("playsinline", "true");

    const setBtn = () => {
      playBtn.textContent = audio.paused ? "Play audio" : "Pause audio";
    };
    const lockSeek = () => {
      const lockTo = Number(state.listeningSeekLock[stepId] || 0);
      if (audio.currentTime < lockTo - 0.35) {
        audio.currentTime = lockTo;
      } else if (audio.currentTime > lockTo) {
        state.listeningSeekLock[stepId] = audio.currentTime;
      }
    };
    audio.addEventListener("play", () => {
      status.textContent = "Audio is playing.";
      setBtn();
    });
    audio.addEventListener("pause", setBtn);
    audio.addEventListener("ended", () => {
      status.textContent = "Audio finished.";
      setBtn();
    });
    audio.addEventListener("seeking", lockSeek);
    audio.addEventListener("timeupdate", lockSeek);

    playBtn.addEventListener("click", async () => {
      if (audio.paused) await audio.play().catch(() => {});
      else audio.pause();
      setBtn();
    });

    status.textContent = "Tap Play audio to start.";
    setBtn();
  }

  function renderListeningStep(container, step) {
    const diag = state.data?.diagnostic;
    const isSec3 = step.id === "listen3";
    const html = isSec3 ? (diag?.listening?.section3Html || "") : (diag?.listening?.section4Html || "");
    const audio = isSec3 ? diag?.listening?.audioSection3 : diag?.listening?.audioSection4;
    const header = `<h3>${escapeHtml(step.title)}</h3><p class="diag-inst">Use IELTS Test 3 ${isSec3 ? "Section 3" : "Section 4"} diagnostic audio. Complete all visible questions before continuing.</p><div class="diag-audio-player"><audio id="diagListeningAudio" class="diag-audio" preload="auto"></audio><button class="btn secondary" type="button" id="diagAudioPlayBtn">Play audio</button><span class="diag-audio-status" id="diagAudioStatus">Preparing audio…</span></div>`;
    container.innerHTML = stepShell(`${header}<div id="diagListeningWrap" class="diag-listen-wrap">${html}</div>`, { finishLabel: "Next" });

    const wrap = document.getElementById("diagListeningWrap");
    hydrateListeningAnswers(wrap);

    const hideNav = wrap?.querySelector(".listen-footer");
    if (hideNav) hideNav.remove();
    wireDiagnosticAudioPlayer(container, audio, step.id);

    document.getElementById("diagBackBtn")?.addEventListener("click", onBack);
    document.getElementById("diagNextBtn")?.addEventListener("click", () => {
      saveListeningAnswers(wrap);
      onNext();
    });
  }

  function renderReadingStep(container, step) {
    const part = state.data?.diagnostic?.reading?.part3;
    if (!part) {
      container.innerHTML = `${buildHeader()}<div class="diag-step-card"><p>We could not load Reading Part 3. Please refresh and try again.</p></div>`;
      return;
    }
    const blocks = (part.blocks || []).map(renderReadingBlock).join("");
    const blockHtml = blocks || `<div class="diag-inst">Reading questions could not be generated for this part. Please refresh and try again.</div>`;
    container.innerHTML = stepShell(`<h3>Reading Part 3</h3><p class="diag-inst">You have 25 minutes for this section. Click Finish Early when ready.</p><div class="diag-reading-layout"><article class="diag-passage">${escapeHtml(part.passageText || "").replace(/\n/g, "<br>")}</article><section id="diagReadingQA" class="diag-reading-qa">${blockHtml}</section></div>`, {
      finishLabel: "Next",
      showFinishEarly: true,
      timer: step.seconds,
    });
    const qa = document.getElementById("diagReadingQA");
    hydrateReadingAnswers(qa);

    document.getElementById("diagBackBtn")?.addEventListener("click", () => {
      saveReadingAnswers(qa);
      onBack();
    });
    document.getElementById("diagNextBtn")?.addEventListener("click", () => {
      saveReadingAnswers(qa);
      onNext();
    });
    document.getElementById("diagFinishEarlyBtn")?.addEventListener("click", () => {
      saveReadingAnswers(qa);
      onNext();
    });

    startTimer(step.seconds, () => {
      saveReadingAnswers(qa);
      onNext();
    });
  }

  function renderOpenStep(container, step, schemaKey, answerKey) {
    const schema = state.data?.diagnostic?.[schemaKey];
    if (!schema) {
      container.innerHTML = `${buildHeader()}<div class="diag-step-card"><p>Could not load ${escapeHtml(step.title)}. Please refresh.</p></div>`;
      return;
    }
    const deadlineControls = step.id === "vocabulary"
      ? `<div class="diag-deadline-box"><h4 class="diag-subtitle">IELTS deadline</h4><p class="diag-inst">Select your exam deadline so we can personalize your study plan.</p><select id="diagDeadlineSelect" class="diag-input"><option value="">Select deadline</option>${DEADLINE_OPTIONS.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("")}</select><input id="diagDeadlineCustom" class="diag-input" type="date" style="display:none"/><input id="diagTargetBand" class="diag-input" type="text" placeholder="Optional target band (e.g. 6.5)"/></div>`
      : "";

    container.innerHTML = stepShell(`<h3>${escapeHtml(step.title)}</h3><p class="diag-inst">${escapeHtml(schema.instruction || "Complete all tasks. Do not use a dictionary or AI.")}</p>${renderOpenSection(schema, answerKey)}${deadlineControls}`, {
      finishLabel: step.id === "vocabulary" ? "Submit diagnostic" : "Next",
      showFinishEarly: true,
      timer: step.seconds,
    });

    const wrap = container;
    hydrateOpenAnswers(wrap, schemaKey);
    if (step.id === "vocabulary") {
      const select = document.getElementById("diagDeadlineSelect");
      const custom = document.getElementById("diagDeadlineCustom");
      const target = document.getElementById("diagTargetBand");
      if (select) select.value = state.deadline || "";
      if (target) target.value = state.targetBand || "";
      if (custom) custom.value = state.customDeadline || "";
      const onDeadlineChange = () => {
        if (!select || !custom) return;
        custom.style.display = select.value === "Custom date" ? "block" : "none";
      };
      select?.addEventListener("change", onDeadlineChange);
      onDeadlineChange();
    }

    document.getElementById("diagBackBtn")?.addEventListener("click", () => {
      saveOpenAnswers(wrap, schemaKey);
      onBack();
    });

    const submitCurrent = () => {
      saveOpenAnswers(wrap, schemaKey);
      if (step.id === "vocabulary") {
        const select = document.getElementById("diagDeadlineSelect");
        const custom = document.getElementById("diagDeadlineCustom");
        const target = document.getElementById("diagTargetBand");
        state.deadline = oneLine(select?.value || "");
        state.customDeadline = oneLine(custom?.value || "");
        state.targetBand = oneLine(target?.value || "");
      }
      onNext();
    };

    document.getElementById("diagNextBtn")?.addEventListener("click", submitCurrent);
    document.getElementById("diagFinishEarlyBtn")?.addEventListener("click", submitCurrent);

    startTimer(step.seconds, submitCurrent);
  }

  function inferSectionAdvice(label, pct) {
    const p = Number(pct || 0);
    if (label === "listening") return `Listening is ${p >= 70 ? "strong" : "still developing"}. Keep practicing Section 3/4 academic listening and distractor recognition.`;
    if (label === "reading") return `Reading is ${p >= 70 ? "strong" : "developing"}. Continue timed Passage 3 practice and answer-type strategies.`;
    if (label === "grammar") return `Grammar performance suggests ${p >= 70 ? "solid control" : "more work needed"} on tenses, passive voice, conditionals, and rewriting.`;
    return `Vocabulary performance suggests ${p >= 70 ? "good lexical range" : "lexical gaps"}. Focus on academic words, collocations, and word forms.`;
  }

  function renderResult(container) {
    const result = state.result;
    const pct = Number(result?.overallPercentage || 0).toFixed(2);
    const scores = result?.sectionScores || {};
    const pp = result?.percentages || {};
    const plan = result?.plan || {};
    container.innerHTML = `${buildHeader()}<div class="diag-step-card"><h3>Diagnostic Result</h3><p class="diag-disclaimer">${escapeHtml(result?.disclaimer || "This is an estimated IELTS readiness score based on your diagnostic performance.")}</p><div class="diag-result-grid"><div class="diag-kpi"><span>Overall</span><b>${pct}%</b></div><div class="diag-kpi"><span>IELTS estimate</span><b>${escapeHtml(result?.estimatedIeltsBandRange || "-")}</b></div><div class="diag-kpi"><span>CEFR</span><b>${escapeHtml(result?.estimatedCefrLevel || "-")}</b></div></div><div class="diag-score-list"><div>Listening: <b>${scores.listeningTotal || 0}/${scores.listeningMax || 20}</b> (${pp.listening?.label || "-"})</div><div>Reading: <b>${scores.reading || 0}/${scores.readingMax || 14}</b> (${pp.reading?.label || "-"})</div><div>Grammar: <b>${scores.grammar || 0}/${scores.grammarMax || 30}</b> (${pp.grammar?.label || "-"})</div><div>Vocabulary: <b>${scores.vocabulary || 0}/${scores.vocabularyMax || 30}</b> (${pp.vocabulary?.label || "-"})</div></div><div class="diag-sw"><div><b>Strongest area:</b> ${escapeHtml(result?.strongestArea || "-")}</div><div><b>Weakest area:</b> ${escapeHtml(result?.weakestArea || "-")}</div></div><div class="diag-explainer"><p>${escapeHtml(inferSectionAdvice("listening", pp.listening?.pct || 0))}</p><p>${escapeHtml(inferSectionAdvice("reading", pp.reading?.pct || 0))}</p><p>${escapeHtml(inferSectionAdvice("grammar", pp.grammar?.pct || 0))}</p><p>${escapeHtml(inferSectionAdvice("vocabulary", pp.vocabulary?.pct || 0))}</p></div><div class="diag-plan"><h4 class="diag-subtitle">Personalized Study Plan</h4><p><b>Summary:</b> ${escapeHtml(plan.summary || "")}</p><p><b>Recommended weekly routine:</b> ${escapeHtml(plan.routine || "")}</p><p><b>Priority focus:</b> ${escapeHtml(plan.focus || "")}</p><ul>${Array.isArray(plan.weeklyPlan) ? plan.weeklyPlan.map((x) => `<li>${escapeHtml(x)}</li>`).join("") : ""}</ul>${Array.isArray(plan.cautions) && plan.cautions.length ? `<div class="diag-warning">${plan.cautions.map((c) => `<div>${escapeHtml(c)}</div>`).join("")}</div>` : ""}</div><div class="diag-actions"><button class="btn" id="diagGoPracticeBtn" type="button">Start Practice</button><button class="btn secondary" id="diagGoFullMockBtn" type="button">Take Full Mock Test</button><button class="btn secondary" id="diagRetakeBtn" type="button">Retake diagnostic</button></div></div>`;

    document.getElementById("diagGoPracticeBtn")?.addEventListener("click", () => {
      try { window.IELTS?.App?.openResourceHub?.("reading"); } catch (e) {}
    });
    document.getElementById("diagGoFullMockBtn")?.addEventListener("click", () => {
      try { window.IELTS?.App?.openResourceHub?.("fullExam"); } catch (e) {}
    });
    document.getElementById("diagRetakeBtn")?.addEventListener("click", () => {
      resetState();
      state.started = true;
      setStepStart();
      render();
    });
  }

  async function submitDiagnostic() {
    const container = document.getElementById("placementTestContainer");
    if (container) container.innerHTML = `${buildHeader()}<div class="diag-step-card"><p>Submitting diagnostic...</p></div>`;

    const deadline = state.deadline === "Custom date" && state.customDeadline
      ? `Custom date: ${state.customDeadline}`
      : state.deadline;

    const payload = {
      answers: state.answers,
      timeSpent: state.timeSpent,
      deadline,
      targetBand: state.targetBand,
    };

    try {
      const res = await apiFetch(buildApiUrl(), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        throw new Error(oneLine(json?.error || "Your answers could not be submitted. Please try again."));
      }
      state.result = json.result;
      state.submitted = true;
      stopTimer();
      persistState();
      render();
    } catch (e) {
      const err = oneLine(e?.message || "Your answers could not be submitted. Please try again.");
      if (container) container.innerHTML = `${buildHeader()}<div class="diag-step-card"><p>${escapeHtml(err)}</p><div class="diag-actions"><button class="btn" id="diagRetrySubmit" type="button">Retry submit</button></div></div>`;
      document.getElementById("diagRetrySubmit")?.addEventListener("click", submitDiagnostic);
    }
  }

  function onBack() {
    stopTimer();
    const step = currentStep();
    markStepTime(step.id);
    state.flowIndex = Math.max(0, state.flowIndex - 1);
    persistState();
    setStepStart();
    render();
  }

  function onNext() {
    stopTimer();
    const step = currentStep();
    markStepTime(step.id);
    if (state.flowIndex >= FLOW.length - 1) {
      persistState();
      submitDiagnostic();
      return;
    }
    state.flowIndex += 1;
    persistState();
    setStepStart();
    render();
  }

  function renderStep(container) {
    const step = currentStep();
    if (step.id === "listen3" || step.id === "listen4") return renderListeningStep(container, step);
    if (step.id === "reading") return renderReadingStep(container, step);
    if (step.id === "grammar") return renderOpenStep(container, step, "grammar", "grammar");
    if (step.id === "vocabulary") return renderOpenStep(container, step, "vocabulary", "vocabulary");
    return renderIntro(container);
  }

  function render() {
    const container = document.getElementById("placementTestContainer");
    if (!container) return;
    if (state.loading) {
      container.innerHTML = `${buildHeader()}<div class="diag-step-card"><p>Loading diagnostic content...</p></div>`;
      return;
    }
    if (state.submitted && state.result) {
      renderResult(container);
      return;
    }
    if (!state.started) {
      renderIntro(container);
      return;
    }
    renderStep(container);
  }

  function bindButtons() {
    const homeBtn = document.getElementById("placementHomeBtn");
    if (homeBtn && !homeBtn.dataset.bound) {
      homeBtn.dataset.bound = "1";
      homeBtn.addEventListener("click", () => {
        try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {}
        try { window.IELTS?.Router?.setHashRoute?.(window.IELTS?.Registry?.getActiveTestId?.() || "ielts1", "home"); } catch (e) {}
      });
    }
  }

  async function loadDiagnosticContent() {
    state.loading = true;
    render();
    try {
      const res = await apiFetch(buildApiUrl(), { method: "GET" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(oneLine(data?.error || "Could not load diagnostic content."));
      state.data = data;
      state.loading = false;
      render();
    } catch (e) {
      const container = document.getElementById("placementTestContainer");
      const missingAuth = oneLine(e?.code || "") === "MISSING_AUTH";
      if (container) {
        container.innerHTML = `${buildHeader()}<div class="diag-step-card"><p>${escapeHtml(oneLine(e?.message || "We could not load this diagnostic test. Please refresh."))}</p><div class="diag-actions"><button class="btn" id="diagRetryLoad" type="button">${missingAuth ? "Try again" : "Retry"}</button>${missingAuth ? '<button class="btn secondary" id="diagGoHome" type="button">Go to homepage</button>' : ""}</div></div>`;
      }
      document.getElementById("diagRetryLoad")?.addEventListener("click", loadDiagnosticContent);
      if (missingAuth) {
        document.getElementById("diagGoHome")?.addEventListener("click", () => {
          try { window.IELTS?.UI?.showOnly?.("home"); } catch (err) {}
          try { window.IELTS?.Router?.setHashRoute?.(window.IELTS?.Registry?.getActiveTestId?.() || "ielts1", "home"); } catch (err) {}
        });
      }
    }
  }

  async function init() {
    hydrateState();
    bindButtons();
    await loadDiagnosticContent();
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.PlacementTest = { init, render, resetState };

  // Placement section can be visited directly; initialize immediately.
  init();
})();
