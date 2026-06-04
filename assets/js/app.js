/* assets/js/app.js (v5: reliable gates + always-new attempt for students) */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  
  const Router = () => window.IELTS.Router;
  const Modal = () => window.IELTS.Modal;
    const writingSampleCache = { rows: null, promise: null };
    const adminObjectiveDetailCache = new Map();
    const adminObjectivePrefetchPending = new Set();
    const adminFullResultPrefetchPending = new Set();
    const adminResultsPrefetchState = { promiseByMode: {}, startedAtByMode: {} };

  async function getAuthHeaders() {
    try {
      const token = await window.IELTS?.Auth?.getAccessToken?.();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  }

  function showNotice(message, title = "Notice") {
    if (Modal()?.showModal) {
      Modal().showModal(title, message, { mode: "confirm" });
      return;
    }
    console.warn(`[${title}] ${message}`);
  }

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch (e) {
      return false;
    }
  }

  function safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  }
  // Active test helpers (multi-test safe defaults)
  function getActiveTestId() {
    return (R()?.getActiveTestId?.() || R()?.TESTS?.defaultTestId || "ielts1");
  }
  function setActiveTestId(id) {
    try { R()?.setActiveTestId?.(id); } catch (e) {}
  }
  function getLaunchContext() {
    try {
      return R()?.getLaunchContext?.() || null;
    } catch (e) {
      return null;
    }
  }
  function matchesActiveNonFullLaunch(view) {
    const ctx = getLaunchContext();
    const normalized = String(view || "").trim();
    if (!ctx || !normalized) return false;
    if (ctx.mode === "section" && ctx.section === normalized) return true;
    if (ctx.mode === "practice" && ctx.skill === normalized) return true;
    return false;
  }
  function isFullExamFlow() {
    const ctx = getLaunchContext();
    return !ctx || ctx.mode === "full";
  }

  function getCurrentAuthUser() {
    return window.IELTS?.Auth?.getSavedUser?.() || window.IELTS?.Auth?.getSharedSession?.()?.user || null;
  }

  function getAcademicIdentity() {
    const user = getCurrentAuthUser();
    return window.IELTS?.Auth?.getAcademicIdentity?.(user) || {
      fullName: String(user?.name || "Student").trim() || "Student",
      resultEmail: String(user?.email || "").trim().toLowerCase(),
      loginEmail: String(user?.email || "").trim().toLowerCase(),
    };
  }

  function assignmentLaunchDebugEnabled() {
    return false;
  }

  function assignmentLaunchDebugLog(label, payload = {}) {
    if (!assignmentLaunchDebugEnabled()) return;
  }

  function derivePlacementLevelFromBand(avgOverall) {
    const band = Number(avgOverall);
    if (!Number.isFinite(band)) {
      return {
        label: "No score yet",
        level: "—",
        recommendation: "Recommended: complete one full mock test to unlock your personalised plan.",
      };
    }
    if (band >= 8) {
      return { label: "Advanced", level: "C2", recommendation: "Recommended: focus on precision, task response depth, and high-band writing control." };
    }
    if (band >= 7) {
      return { label: "Upper-Intermediate", level: "C1", recommendation: "Recommended: maintain full mocks and strengthen consistency across all skills." };
    }
    if (band >= 5.5) {
      return { label: "Intermediate", level: "B2", recommendation: "Recommended: prioritise Writing Task 2 and reading question-type drills." };
    }
    return { label: "Foundation", level: "B1", recommendation: "Recommended: build grammar and vocabulary fundamentals with guided practice." };
  }

  function resolveOverallBandForAverage(row) {
    if (!row || typeof row !== "object") return null;
    const direct = Number(row.overall_band);
    if (Number.isFinite(direct)) return direct;
    const parts = [Number(row.listening_band), Number(row.reading_band), Number(row.final_writing_band), Number(row.speaking_band)]
      .filter((value) => Number.isFinite(value));
    if (!parts.length) return null;
    const avg = parts.reduce((sum, value) => sum + value, 0) / parts.length;
    return Math.round(avg * 10) / 10;
  }

  async function refreshHomePlacementPreview() {
    const bandEl = $("homePlacementPreviewBand");
    const subEl = $("homePlacementPreviewSub");
    const fillEl = $("homePlacementPreviewFill");
    const nextEl = $("homePlacementPreviewNext");
    if (!bandEl || !subEl || !fillEl || !nextEl) return;

    if (!window.IELTS?.Auth?.isSignedIn?.()) {
      bandEl.textContent = "—";
      subEl.textContent = "Sign in to see your average overall band.";
      fillEl.style.width = "0%";
      nextEl.textContent = "Recommended: sign in and complete a full mock test.";
      return;
    }

    try {
      const rows = await window.IELTS?.History?.prefetch?.({ forceRefresh: false });
      const validBands = Array.isArray(rows)
        ? rows.map(resolveOverallBandForAverage).filter((value) => value !== null)
        : [];
      if (!validBands.length) {
        bandEl.textContent = "—";
        subEl.textContent = "Complete a scored test to see your average overall band.";
        fillEl.style.width = "0%";
        nextEl.textContent = "Recommended: complete one full mock test to unlock your personalised plan.";
        return;
      }
      const avgOverall = validBands.reduce((sum, value) => sum + value, 0) / validBands.length;
      const rounded = Math.round(avgOverall * 10) / 10;
      const level = derivePlacementLevelFromBand(rounded);
      bandEl.textContent = rounded.toFixed(1);
      subEl.textContent = `${level.label} · ${level.level}`;
      fillEl.style.width = `${Math.max(0, Math.min(100, (rounded / 9) * 100)).toFixed(1)}%`;
      nextEl.textContent = level.recommendation;
    } catch (error) {
      bandEl.textContent = "—";
      subEl.textContent = "Could not load your history average right now.";
      fillEl.style.width = "0%";
      nextEl.textContent = "Recommended: open History once and try again.";
    }
  }

  function derivePracticeExamId(section, activeTestId, scopeValue) {
    const testDigits = String(activeTestId || "ielts1").match(/(\d+)/);
    const testNumber = String(testDigits?.[1] || "1").padStart(3, "0");
    const base = `ielts-practice-${String(section || "").trim().toLowerCase()}-${testNumber}`;
    const scope = String(scopeValue || "").trim().toLowerCase();
    if (!scope) return base;
    const sectionMatch = scope.match(/^section(\d+)$/i);
    if (sectionMatch) return `${base}-section-${Number(sectionMatch[1])}`;
    const partMatch = scope.match(/^part(\d+)$/i);
    if (partMatch) return `${base}-part-${Number(partMatch[1])}`;
    const taskMatch = scope.match(/^task(\d+)$/i);
    if (taskMatch) return `${base}-task-${Number(taskMatch[1])}`;
    return `${base}-${scope.replace(/[^a-z0-9]+/g, "-")}`;
  }

  function derivePracticeLabel(section, activeTestId, scopeValue) {
    const testLabel = R()?.getTestLabel?.(activeTestId) || String(activeTestId || "IELTS Test");
    const sectionLabel = String(section || "").trim();
    const niceSection = sectionLabel ? `${sectionLabel.charAt(0).toUpperCase()}${sectionLabel.slice(1)}` : "Practice";
    const scope = String(scopeValue || "").trim().toLowerCase();
    if (!scope) return `${testLabel} · ${niceSection} practice`;
    const sectionMatch = scope.match(/^section(\d+)$/i);
    if (sectionMatch) return `${testLabel} · ${niceSection} Section ${Number(sectionMatch[1])} practice`;
    const partMatch = scope.match(/^part(\d+)$/i);
    if (partMatch) return `${testLabel} · ${niceSection} Section ${Number(partMatch[1])} practice`;
    const taskMatch = scope.match(/^task(\d+)$/i);
    if (taskMatch) return `${testLabel} · ${niceSection} Task ${Number(taskMatch[1])} practice`;
    return `${testLabel} · ${niceSection} ${scope}`;
  }

  async function submitObjectiveSectionPractice(section, options = {}) {
    const endpoint = R()?.buildAdminApiUrl?.({ action: "submitPracticeObjective" });
    const user = getCurrentAuthUser();
    const token = await window.IELTS?.Auth?.getAccessToken?.();
    if (!endpoint || !token || !user?.email) {
      throw new Error("Practice submission is not available right now.");
    }

    const activeTestId = String(options.activeTestId || getActiveTestId() || "ielts1");
    const scopeValue = String(options.scopeValue || "");
    const examId = derivePracticeExamId(section, activeTestId, scopeValue);
    const practiceLabel = derivePracticeLabel(section, activeTestId, scopeValue);
    const submittedAt = String(options.submittedAt || new Date().toISOString());
    const identity = getAcademicIdentity();
    const studentFullName = String(
      options.studentFullName ||
      identity.fullName ||
      user?.name ||
      user?.user_metadata?.name ||
      user?.user_metadata?.preferred_name ||
      "Student"
    ).trim() || "Student";

    const finalPayload = {
      attemptKind: "practice",
      practiceSection: section,
      practiceLabel,
      examId,
      submittedAt,
      studentFullName,
      studentProfileId: identity.studentProfileId || "",
      studentIdCode: identity.studentIdCode || "",
      classroomId: identity.classroomId || "",
      classroomName: identity.classroomName || "",
      officialEmail: identity.officialEmail || "",
      loginEmail: String(user?.email || "").trim().toLowerCase(),
      studentEmail: String(identity.resultEmail || user?.email || "").trim().toLowerCase(),
      signInMethod: String(user?.provider || user?.app_metadata?.provider || "email").trim().toLowerCase() || "email",
      reason: String(options.reason || `${section} section finished.`).trim(),
      [section]: {
        saved: true,
        testId: activeTestId,
        answers: { ...(options.answers || {}) },
        answerCount: Object.keys(options.answers || {}).length,
      },
    };

    try {
      window.IELTS?.History?.rememberLocalAttempt?.(finalPayload);
    } catch (e) {}

    const res = await fetch(endpoint.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        section,
        activeTestId,
        examId,
        practiceLabel,
        submittedAt,
        studentFullName,
        studentProfileId: identity.studentProfileId || "",
        studentIdCode: identity.studentIdCode || "",
        classroomId: identity.classroomId || "",
        classroomName: identity.classroomName || "",
        officialEmail: identity.officialEmail || "",
        loginEmail: String(user?.email || "").trim().toLowerCase(),
        email: String(user?.email || "").trim().toLowerCase(),
        reason: finalPayload.reason,
        answers: options.answers || {},
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
    try {
      const assignedTarget = String(window.__IELTS_ACTIVE_ASSIGNED_TARGET__ || "");
      if (assignedTarget && window.IELTS?.Assignments?.markAssignmentCompleteForTest) {
        window.IELTS.Assignments.markAssignmentCompleteForTest(assignedTarget);
      }
    } catch (e) {}

    return data;
  }

  function isExamRouteView(view) {
    return ["listening", "reading", "writing"].includes(String(view || ""));
  }

  function resetCurrentReadingStage() {
    const activeTestId = getActiveTestId();
    const readingTestId =
      R()?.getScopedReadingTestId?.(activeTestId) ||
      R()?.getTestConfig?.(activeTestId)?.readingTestId ||
      "ielts-reading-3parts-001";
    const keys = [
      `${readingTestId}:submitted`,
      `${readingTestId}:remainingSeconds`,
      `${readingTestId}:deadlineAt`,
      `${readingTestId}:answers`,
      `${readingTestId}:lastSubmission`,
      `${readingTestId}:review:rows`,
      `${readingTestId}:review:revealed`,
    ];
    keys.forEach((key) => {
      try { S().remove(key); } catch (e) {}
    });
    try { window.IELTS = window.IELTS || {}; window.IELTS.__ACTIVE_READING_PART = "part1"; } catch (e) {}
    try { $("readingControls")?.classList?.remove?.("view-only"); } catch (e) {}
    try { $("container")?.classList?.remove?.("view-only"); } catch (e) {}
  }

  function resetToPublicHomeFromStaleRoute() {
    try { window.__IELTS_SUPPRESS_AUTO_GATES__ = true; } catch (e) {}
    try { S()?.set?.(R()?.KEYS?.HOME_LAST_VIEW, "home"); } catch (e) {}
    try { UI().setExamStarted(false); } catch (e) {}
    try { R()?.clearLaunchContext?.(); } catch (e) {}
    try { UI().showOnly("home"); } catch (e) {}
    try { UI().updateHomeStatusLine("Status: Ready"); } catch (e) {}
    try { history.replaceState({}, "", "/"); } catch (e) {}
  }

  function isEditableTarget(target) {
    if (!target || typeof target.closest !== "function") return false;
    return !!target.closest('input, textarea, select, [contenteditable="true"]');
  }

  function isExamGuardActive() {
    try {
      return document.body?.classList?.contains("exam-guard") === true;
    } catch (e) {
      return false;
    }
  }

  function isHighlightingTarget(target) {
    if (!target) return false;
    const el = target.nodeType === 1 ? target : target.parentElement;
    if (!el || typeof el.closest !== "function") return false;
    return !!el.closest('[data-hl-root-key], #hlToolbar, mark.hl');
  }

  function installAntiCheatGuards() {
    if (window.__IELTS_ANTI_CHEAT_GUARDS__) return;
    window.__IELTS_ANTI_CHEAT_GUARDS__ = true;

    document.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
      },
      true
    );

    document.addEventListener(
      "keydown",
      (event) => {
        const key = String(event.key || "").toLowerCase();
        const cmdOrCtrl = !!(event.ctrlKey || event.metaKey);
        const shift = !!event.shiftKey;
        const blockedCombos =
          (cmdOrCtrl && (key === "f" || key === "p" || key === "s" || key === "u")) ||
          (cmdOrCtrl && shift && (key === "i" || key === "j" || key === "c")) ||
          key === "f12" ||
          key === "f3";

        if (!blockedCombos) return;

        if (isEditableTarget(event.target) && cmdOrCtrl && key === "s") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        try {
          if (blockedCombos && !window.__IELTS_SHORTCUT_WARNED__) {
            window.__IELTS_SHORTCUT_WARNED__ = true;
            window.setTimeout(() => {
              window.__IELTS_SHORTCUT_WARNED__ = false;
            }, 2500);
          }
        } catch (e) {}
      },
      true
    );

    const examOnlyBlock = (event) => {
      if (!isExamGuardActive()) return;
      if (isEditableTarget(event.target)) return;
      if (
        isHighlightingTarget(event.target) &&
        event.type === "selectstart"
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("copy", examOnlyBlock, true);
    document.addEventListener("cut", examOnlyBlock, true);
    document.addEventListener("dragstart", examOnlyBlock, true);
    document.addEventListener("selectstart", examOnlyBlock, true);
    document.addEventListener("dblclick", examOnlyBlock, true);
  }

  const EXAM_INTEGRITY = {
    strikes: 0,
    lastViolationAt: 0,
    promptOpen: false,
    lastFullscreenAttemptAt: 0,
    lastFullscreenReminderAt: 0,
    lastUserInteractionAt: 0,
    isCoarsePointerDevice:
      !!window.matchMedia?.("(pointer: coarse)")?.matches ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0),
    intervalId: null,
  };

  function currentActiveExamView() {
    return String(document.body?.dataset?.activeView || "").trim().toLowerCase();
  }

  function isExamSessionActiveForIntegrity() {
    if (isAdminView()) return false;
    if (!isFullExamFlow()) return false;
    const started = String(S()?.get?.(R()?.KEYS?.EXAM_STARTED, "false") || "false") === "true";
    if (!started) return false;
    const view = currentActiveExamView();
    return view === "listening" || view === "reading" || view === "writing";
  }

  function resetExamIntegrityState() {
    EXAM_INTEGRITY.strikes = 0;
    EXAM_INTEGRITY.lastViolationAt = 0;
    EXAM_INTEGRITY.promptOpen = false;
    EXAM_INTEGRITY.lastFullscreenReminderAt = 0;
    EXAM_INTEGRITY.lastUserInteractionAt = 0;
  }

  function markIntegrityUserInteraction() {
    EXAM_INTEGRITY.lastUserInteractionAt = Date.now();
  }

  function shouldIgnoreIntegrityViolation(reason) {
    const now = Date.now();
    const modalOpen = !document.getElementById("modal")?.classList?.contains("hidden");
    if (modalOpen) return true;

    // Give browser fullscreen transitions a brief grace window.
    if (now - EXAM_INTEGRITY.lastFullscreenAttemptAt < 2500) return true;

    // Tablet/mobile browsers can emit noisy blur events during normal gestures.
    if (EXAM_INTEGRITY.isCoarsePointerDevice) {
      if (reason === "blur") return true;
      if ((reason === "fullscreen" || reason === "visibility") && now - EXAM_INTEGRITY.lastUserInteractionAt < 1400) {
        return true;
      }
    }
    return false;
  }

  function stopExamByIntegrityPolicy() {
    try { UI()?.setExamStarted?.(false); } catch (e) {}
    try { R()?.clearLaunchContext?.(); } catch (e) {}
    try { clearAllStudentAttemptKeys(); } catch (e) {}
    try { resetToPublicHomeFromStaleRoute(); } catch (e) {}
    showNotice("Exam stopped. Your unfinished attempt was cleared.", "Exam stopped");
    try { UI()?.showOnly?.("home"); } catch (_) {}
  }

  async function requestExamFullscreen() {
    const root = document.documentElement;
    if (!root || document.fullscreenElement) return true;
    try {
      await root.requestFullscreen?.({ navigationUI: "hide" });
      return !!document.fullscreenElement;
    } catch (e) {
      return false;
    }
  }

  async function handleIntegrityViolation(reason) {
    if (!isExamSessionActiveForIntegrity()) return;
    if (EXAM_INTEGRITY.promptOpen) return;
    if (shouldIgnoreIntegrityViolation(reason)) return;
    const now = Date.now();
    if (now - EXAM_INTEGRITY.lastViolationAt < 1200) return;
    EXAM_INTEGRITY.lastViolationAt = now;
    EXAM_INTEGRITY.strikes += 1;

    if (EXAM_INTEGRITY.strikes < 3) {
      const remaining = 3 - EXAM_INTEGRITY.strikes;
      Modal()?.showModal?.(
        "Exam integrity warning",
        `Warning ${EXAM_INTEGRITY.strikes}/2. Do not leave fullscreen or switch tabs/windows. If this happens again, you will be asked for the test entry password. Remaining warning${remaining === 1 ? "" : "s"}: ${remaining}.`,
        { mode: "confirm" }
      );
      return;
    }

    EXAM_INTEGRITY.promptOpen = true;
    Modal()?.showModal?.(
      "Security check required",
      "You repeatedly left fullscreen or switched tabs/windows. Enter the test entry password to continue, or end the exam now.",
      {
        mode: "password",
        showCancel: true,
        submitText: "Continue",
        cancelText: "End exam",
        onConfirm: async () => {
          EXAM_INTEGRITY.promptOpen = false;
          EXAM_INTEGRITY.strikes = 0;
          EXAM_INTEGRITY.lastViolationAt = Date.now();
          await requestExamFullscreen();
        },
        onCancel: () => {
          EXAM_INTEGRITY.promptOpen = false;
          try { clearAllStudentAttemptKeys(); } catch (e) {}
          try { resetToPublicHomeFromStaleRoute(); } catch (e) {}
          try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
          stopExamByIntegrityPolicy();
        },
      }
    );
  }

  function installExamIntegrityGuards() {
    if (window.__IELTS_EXAM_INTEGRITY_GUARDS__) return;
    window.__IELTS_EXAM_INTEGRITY_GUARDS__ = true;

    document.addEventListener("pointerdown", markIntegrityUserInteraction, true);
    document.addEventListener("touchstart", markIntegrityUserInteraction, { capture: true, passive: true });
    document.addEventListener("keydown", markIntegrityUserInteraction, true);

    document.addEventListener("fullscreenchange", () => {
      if (!isExamSessionActiveForIntegrity()) return;
      if (!document.fullscreenElement) {
        handleIntegrityViolation("fullscreen");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!isExamSessionActiveForIntegrity()) return;
      if (document.visibilityState === "hidden") {
        handleIntegrityViolation("visibility");
      }
    });

    window.addEventListener("blur", () => {
      if (!isExamSessionActiveForIntegrity()) return;
      handleIntegrityViolation("blur");
    });

    EXAM_INTEGRITY.intervalId = window.setInterval(async () => {
      if (!isExamSessionActiveForIntegrity()) {
        resetExamIntegrityState();
        return;
      }
      if (document.fullscreenElement) return;
      const now = Date.now();
      if (EXAM_INTEGRITY.promptOpen) return;
      if (now - EXAM_INTEGRITY.lastFullscreenReminderAt < 15000) return;
      EXAM_INTEGRITY.lastFullscreenReminderAt = now;
      EXAM_INTEGRITY.promptOpen = true;
      Modal()?.showModal?.(
        "Fullscreen required",
        "Full exams require fullscreen mode. Click Continue to enter fullscreen and resume the exam.",
        {
          mode: "gate",
          submitText: "Continue",
          onConfirm: async () => {
            EXAM_INTEGRITY.promptOpen = false;
            EXAM_INTEGRITY.lastFullscreenAttemptAt = Date.now();
            await requestExamFullscreen();
          },
        }
      );
    }, 1000);
  }



  // Start engine method when split bundles load out-of-order.
  // Retries for a short period, and logs failures instead of silently swallowing them.
  function showEngineError(engineName, err) {
    console.error(`[IELTS] Engine failed: ${engineName}`, err);
    // Try modal first (graceful)
    try {
      window.IELTS?.Modal?.showModal?.(
        "Failed to load exam section",
        `The ${engineName} section could not be started. Please reload the page and try again.\n\nIf this keeps happening, clear your browser cache.`,
        {
          mode: "confirm",
          submitText: "Reload page",
          showCancel: true,
          cancelText: "Dismiss",
          onConfirm: () => { window.location.reload(); },
        }
      );
    } catch (modalErr) {
      // Fallback: inject an inline banner if modal is unavailable
      try {
        const existing = document.getElementById("ielts-engine-error-banner");
        if (existing) return; // already showing
        const banner = document.createElement("div");
        banner.id = "ielts-engine-error-banner";
        banner.style.cssText = [
          "position:fixed;top:0;left:0;right:0;z-index:99999",
          "background:#fef2f2;border-bottom:2px solid #fca5a5",
          "padding:14px 20px;display:flex;align-items:center;gap:12px",
          "font-size:14px;color:#991b1b;font-family:inherit",
        ].join(";");
        banner.innerHTML = `
          <span style="flex:1">⚠ Failed to load the <strong>${engineName}</strong> exam section. Please reload the page.</span>
          <button onclick="window.location.reload()" style="padding:6px 14px;background:#dc2626;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">Reload</button>
          <button onclick="this.parentElement.remove()" style="padding:6px 10px;background:transparent;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;font-size:13px;color:#991b1b">✕</button>
        `;
        document.body?.prepend(banner);
      } catch (e) {}
    }
  }

  function startEngineWhenReady(engineName, methodName, { maxMs = 3500, intervalMs = 100 } = {}) {
    const startAt = Date.now();
    return new Promise((resolve, reject) => {
      const tick = async () => {
        if (["Listening", "Reading", "Writing"].includes(String(engineName || ""))) {
          try {
            await R()?.ensureActiveTestContent?.();
          } catch (e) {
            console.error(`[IELTS] Failed to load protected test content for ${engineName}`, e);
            showEngineError(engineName, e);
            reject(e);
            return;
          }
        }
        const fn = window.IELTS?.Engines?.[engineName]?.[methodName];
        if (typeof fn === "function") {
          try {
            fn();
            resolve(true);
          } catch (e) {
            console.error(`[IELTS] Failed to start ${engineName}.${methodName}`, e);
            showEngineError(engineName, e);
            reject(e);
          }
          return;
        }
        if (Date.now() - startAt >= maxMs) {
          const err = new Error(`Engine not ready: ${engineName}.${methodName}`);
          showEngineError(engineName, err);
          reject(err);
          return;
        }
        setTimeout(tick, intervalMs);
      };
      tick();
    });
  }

  document.addEventListener("partials:loaded", () => {
    installAntiCheatGuards();
    installExamIntegrityGuards();

    // Bind modal buttons once
    if (window.IELTS?.Modal && typeof window.IELTS.Modal.bindModalOnce === "function") {
      window.IELTS.Modal.bindModalOnce();
      // Boot safety: never show modal on first load
      safe(() => Modal().hideModal());
      const m = document.getElementById("modal");
      if (m) m.classList.add("hidden");
    }

    // Init admin/session gate + apply UI lockdown for students
    safe(() => window.IELTS?.Access?.init?.());
    safe(() => UI()?.applyStudentLockdownUI?.());
    window.addEventListener("ielts:viewmodechange", () => {
      safe(() => UI()?.applyStudentLockdownUI?.());
    });

    const $ = UI().$;
    
    const EXAM_DISPLAY_BUTTONS = {
      darkMode: false,
      brightness: true,
      textSize: true,
    };

    const PREF_KEYS = {
      fontScale: "fontScale",
      examBrightness: "examBrightness",
      examDarkMode: "examDarkMode",
      examTextScale: "examTextScale",
    };

    function getPreferenceStorageKey(key) {
      const authUser =
        window.IELTS?.Auth?.getSavedUser?.() ||
        window.IELTS?.Auth?.getSharedSession?.()?.user ||
        null;
      const userId =
        authUser?.id ||
        String(authUser?.email || "").trim().toLowerCase() ||
        "guest";
      return `IELTSPREF:${userId}:${key}`;
    }

    function applyFontScale(value) {
      const allowed = new Set(["small", "medium", "large"]);
      const next = allowed.has(value) ? value : "medium";
      try { document.body.setAttribute("data-font-scale", next); } catch (e) {}
      return next;
    }

    function applyExamBrightness(value) {
      const allowed = new Set(["darker", "soft", "normal", "bright"]);
      const next = allowed.has(value) ? value : "normal";
      try { document.body.setAttribute("data-exam-brightness", next); } catch (e) {}
      return next;
    }

    function applyExamDarkMode(value) {
      const next = value === "dark" ? "dark" : "light";
      try { document.body.setAttribute("data-exam-theme", next); } catch (e) {}
      return next;
    }

    function applyExamTextScale(value) {
      const allowed = new Set(["normal", "large", "xlarge"]);
      const next = allowed.has(value) ? value : "normal";
      try { document.body.setAttribute("data-exam-text-scale", next); } catch (e) {}
      return next;
    }

    function updateExamDisplayControlLabels(state) {
      const brightnessLabel = $("examBrightnessLabel");
      const darkLabel = $("examDarkModeLabel");
      const textLabel = $("examTextSizeLabel");
      const darkBtn = $("examDarkModeBtn");
      const brightnessMap = { darker: "Darker", soft: "Soft", normal: "Normal", bright: "Bright" };
      const textMap = { normal: "100%", large: "112%", xlarge: "125%" };
      if (brightnessLabel) brightnessLabel.textContent = brightnessMap[state.brightness] || "Normal";
      if (darkLabel) darkLabel.textContent = state.theme === "dark" ? "On" : "Off";
      if (textLabel) textLabel.textContent = textMap[state.textScale] || "100%";
      if (darkBtn) darkBtn.setAttribute("aria-pressed", state.theme === "dark" ? "true" : "false");
    }

    function initExamDisplayPreferences() {
      const controlsWrap = $("examDisplayControls");
      const darkBtn = $("examDarkModeBtn");
      const brightnessBtn = $("examBrightnessBtn");
      const textBtn = $("examTextSizeBtn");

      if (!EXAM_DISPLAY_BUTTONS.darkMode && darkBtn) darkBtn.classList.add("hidden");
      if (!EXAM_DISPLAY_BUTTONS.brightness && brightnessBtn) brightnessBtn.classList.add("hidden");
      if (!EXAM_DISPLAY_BUTTONS.textSize && textBtn) textBtn.classList.add("hidden");
      if (
        controlsWrap &&
        !EXAM_DISPLAY_BUTTONS.darkMode &&
        !EXAM_DISPLAY_BUTTONS.brightness &&
        !EXAM_DISPLAY_BUTTONS.textSize
      ) {
        controlsWrap.classList.add("hidden");
      }

      const brightnessKey = getPreferenceStorageKey(PREF_KEYS.examBrightness);
      const themeKey = getPreferenceStorageKey(PREF_KEYS.examDarkMode);
      const textScaleKey = getPreferenceStorageKey(PREF_KEYS.examTextScale);

      const state = {
        brightness: applyExamBrightness((localStorage.getItem(brightnessKey) || "normal").trim()),
        theme: applyExamDarkMode((localStorage.getItem(themeKey) || "light").trim()),
        textScale: applyExamTextScale((localStorage.getItem(textScaleKey) || "normal").trim()),
      };

      const brightnessOrder = ["darker", "soft", "normal", "bright"];
      const textScaleOrder = ["normal", "large", "xlarge"];

      brightnessBtn?.addEventListener("click", () => {
        const currentIndex = Math.max(0, brightnessOrder.indexOf(state.brightness));
        state.brightness = applyExamBrightness(brightnessOrder[(currentIndex + 1) % brightnessOrder.length]);
        try { localStorage.setItem(brightnessKey, state.brightness); } catch (e) {}
        updateExamDisplayControlLabels(state);
      });

      darkBtn?.addEventListener("click", () => {
        state.theme = applyExamDarkMode(state.theme === "dark" ? "light" : "dark");
        try { localStorage.setItem(themeKey, state.theme); } catch (e) {}
        updateExamDisplayControlLabels(state);
      });

      textBtn?.addEventListener("click", () => {
        const currentIndex = Math.max(0, textScaleOrder.indexOf(state.textScale));
        state.textScale = applyExamTextScale(textScaleOrder[(currentIndex + 1) % textScaleOrder.length]);
        try { localStorage.setItem(textScaleKey, state.textScale); } catch (e) {}
        updateExamDisplayControlLabels(state);
      });

      updateExamDisplayControlLabels(state);
    }

    function initFontPreference() {
      const select = $("fontSizeSelect");
      const perUserKey = getPreferenceStorageKey(PREF_KEYS.fontScale);
      const saved = (
        localStorage.getItem(perUserKey) ||
        localStorage.getItem("IELTSPREF:fontScale") ||
        "medium"
      ).trim();
      const active = applyFontScale(saved);
      if (select) {
        select.value = active;
        select.addEventListener("change", () => {
          const next = applyFontScale(select.value);
          try {
            localStorage.setItem(perUserKey, next);
            localStorage.removeItem("IELTSPREF:fontScale");
          } catch (e) {}
          try {
            window.dispatchEvent(new CustomEvent("ielts:fontscalechange", { detail: { value: next } }));
          } catch (e) {}
        });
      }
    }

    initFontPreference();
    initExamDisplayPreferences();
    // -----------------------------
    // Speaking exam (separate)
    // -----------------------------
    try {
      if (
        window.IELTS &&
        window.IELTS.Speaking &&
        typeof window.IELTS.Speaking.initSpeakingExam === "function"
      ) {
        window.IELTS.Speaking.initSpeakingExam();
      } else {
        window.addEventListener("load", () => {
          try {
            if (window.IELTS?.Speaking?.initSpeakingExam) {
              window.IELTS.Speaking.initSpeakingExam();
            }
          } catch (e) {
            console.error("Speaking exam late init failed", e);
          }
        }, { once: true });
      }
    } catch (e) {
      console.error("Speaking exam init failed", e);
    }

    // Key helpers
    const readingSubmittedKey = () => {
      const tid = getActiveTestId();
      const rid = R()?.getScopedReadingTestId?.(tid) || R()?.getTestConfig?.(tid)?.readingTestId || "ielts-reading-3parts-001";
      return `${rid}:submitted`;
    };
    const activeScopedKeys = () => {
      const tid = getActiveTestId();
      return (R()?.getScopedKeys?.(tid)) || (R()?.keysFor?.(tid)) || {};
    };

    // -----------------------------
    // Always-new attempt behavior
    // -----------------------------
    function clearAllStudentAttemptKeys() {
      // Keep admin session, wipe everything else that belongs to attempts.
      try {
        const keep = new Set([
          "IELTS:ADMIN:session",
          "IELTS:EXAM:activeTestId",
          "IELTS:AUTH:user",
          "IELTS:AUTH:sharedSession",
          "IELTS:AUTH:sharedPasswordOverrides",
          "IELTS:AUTH:personalPasswordEmails",
          "IELTS:AUTH:profileByEmail",
          "IELTS:LOCAL:HISTORY:lastOpen",
        ]);
        const prefixes = ["IELTS:", "ielts-reading-", "ielts-writing-", "ielts-full-"];
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (keep.has(k)) continue;
          if (k.startsWith("IELTS:LOCAL:HISTORY:")) continue;
          if (prefixes.some((p) => k.startsWith(p))) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
    }

    function hasNonEmptyObject(value) {
      return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
    }

    function hasResumableStudentAttempt() {
      if (isAdminView()) return false;
      const currentRouteView = safe(() => Router().parseHashRoute()?.view) || "";
      if (matchesActiveNonFullLaunch(currentRouteView)) return true;
      try {
        if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true") return false;
      } catch (e) {}

      const scoped = activeScopedKeys();
      const listeningKeys = scoped?.listening || {};
      const writingKeys = scoped?.writing || {};
      const listeningSubmitted = S().get(listeningKeys.submitted, "false") === "true";
      const listeningStarted = S().get(listeningKeys.started, "false") === "true";
      const readingSubmitted = S().get(readingSubmittedKey(), "false") === "true";
      const writingSubmitted = S().get(writingKeys.submitted, "false") === "true";
      const writingStarted = S().get(writingKeys.started, "false") === "true";
      const readingAnswers = S().getJSON(`${R()?.getScopedReadingTestId?.(getActiveTestId()) || R()?.getTestConfig?.(getActiveTestId())?.readingTestId || "ielts-reading-3parts-001"}:answers`, null);
      const listeningAnswers = S().getJSON(listeningKeys.answers, null);
      const writingAnswers = S().getJSON(writingKeys.answers, null);

      return (
        (listeningStarted && !listeningSubmitted) ||
        (!listeningSubmitted && hasNonEmptyObject(listeningAnswers)) ||
        (isFullExamFlow() && listeningSubmitted && !readingSubmitted) ||
        (!readingSubmitted && hasNonEmptyObject(readingAnswers)) ||
        (isFullExamFlow() && readingSubmitted && !writingSubmitted) ||
        (writingStarted && !writingSubmitted) ||
        (!writingSubmitted && hasNonEmptyObject(writingAnswers))
      );
    }

    function getResumableStudentView() {
      if (isAdminView()) return "";
      try {
        if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true") return "";
      } catch (e) {}

      const scoped = activeScopedKeys();
      const listeningKeys = scoped?.listening || {};
      const writingKeys = scoped?.writing || {};
      const listeningSubmitted = S().get(listeningKeys.submitted, "false") === "true";
      const listeningStarted = S().get(listeningKeys.started, "false") === "true";
      const readingSubmitted = S().get(readingSubmittedKey(), "false") === "true";
      const writingSubmitted = S().get(writingKeys.submitted, "false") === "true";
      const writingStarted = S().get(writingKeys.started, "false") === "true";
      const readingAnswers = S().getJSON(`${R()?.getScopedReadingTestId?.(getActiveTestId()) || R()?.getTestConfig?.(getActiveTestId())?.readingTestId || "ielts-reading-3parts-001"}:answers`, null);
      const listeningAnswers = S().getJSON(listeningKeys.answers, null);
      const writingAnswers = S().getJSON(writingKeys.answers, null);

      if (isFullExamFlow() && readingSubmitted && !writingSubmitted) return "writing";
      if (!readingSubmitted && hasNonEmptyObject(readingAnswers)) return "reading";
      if (isFullExamFlow() && listeningSubmitted && !readingSubmitted) return "reading";
      if ((listeningStarted && !listeningSubmitted) || (!listeningSubmitted && hasNonEmptyObject(listeningAnswers))) return "listening";
      if (writingStarted && !writingSubmitted) return "writing";
      if (!writingSubmitted && hasNonEmptyObject(writingAnswers)) return "writing";
      return "";
    }

    function renderHomeResumeAction() {
      const mount = $("homeResumeAction");
      if (!mount) return;
      clearElement(mount);

      const resumeView = getResumableStudentView();
      if (!resumeView || !window.IELTS?.Auth?.isSignedIn?.()) {
        mount.classList.add("hidden");
        return;
      }

      mount.classList.remove("hidden");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "home-btn";
      button.textContent = resumeView === "reading"
        ? "Resume Reading"
        : resumeView === "writing"
          ? "Resume Writing"
          : "Resume Listening";
      button.addEventListener("click", () => {
        try { Router().setHashRoute(getActiveTestId(), resumeView); } catch (e) {}
        try { S().set(R().KEYS.HOME_LAST_VIEW, resumeView); } catch (e) {}
        resumeStudentExamRoute({ view: resumeView });
      });
      mount.appendChild(button);

      const copy = document.createElement("div");
      copy.className = "home-resume-copy";
      copy.textContent = resumeView === "reading"
        ? "Listening is already submitted. Continue straight into Reading."
        : resumeView === "writing"
          ? "Your next section is ready. Continue your exam from here."
          : "You have an unfinished section. Continue from where you left off.";
      mount.appendChild(copy);
    }

    function resumeStudentExamRoute(route) {
      if (!route?.view) return;
      if (route.view === "listening") {
        try { UI().setExamStarted(true); } catch (e) {}
        try { startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to resume:', e)); } catch (e) {}
        try { UI().showOnly("listening"); } catch (e) {}
        try { UI().setExamNavStatus("Status: Resuming Listening"); } catch (e) {}
        return;
      }
      if (route.view === "reading") {
        try { UI().setExamStarted(true); } catch (e) {}
        try { window.__IELTS_READING_INIT__ = false; } catch (e) {}
        try { startEngineWhenReady("Reading", "startReadingSystem").catch(e => console.error('[IELTS] Reading failed to resume:', e)); } catch (e) {}
        try { UI().showOnly("reading"); } catch (e) {}
        try { UI().setExamNavStatus("Status: Resuming Reading"); } catch (e) {}
        return;
      }
      if (route.view === "writing") {
        try { UI().setExamStarted(true); } catch (e) {}
        try { window.__IELTS_WRITING_INIT__ = false; } catch (e) {}
        try { startEngineWhenReady("Writing", "startWritingSystem").catch(e => console.error('[IELTS] Writing failed to resume:', e)); } catch (e) {}
        try { UI().showOnly("writing"); } catch (e) {}
        try { UI().setExamNavStatus("Status: Resuming Writing"); } catch (e) {}
      }
    }

    function promptResumeStudentExamRoute(route) {
      if (!route?.view || window.__IELTS_RESUME_ROUTE_PROMPT_OPEN__) return;
      window.__IELTS_RESUME_ROUTE_PROMPT_OPEN__ = true;
      safe(() =>
        Modal().showModal(
          "Resume your exam?",
          "We found an unfinished exam attempt. If you go back to the homepage instead of resuming, your current answers will be lost and the exam will start from the beginning next time.",
          {
            mode: "confirm",
            showCancel: true,
            submitText: "Resume exam",
            cancelText: "Go to homepage",
            onConfirm: () => {
              window.__IELTS_RESUME_ROUTE_PROMPT_OPEN__ = false;
              // Gates were suppressed while the prompt was open; re-enable them so
              // the Listening→Reading gate fires normally after resuming.
              try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
              resumeStudentExamRoute(route);
            },
            onCancel: () => {
              window.__IELTS_RESUME_ROUTE_PROMPT_OPEN__ = false;
              clearAllStudentAttemptKeys();
              resetToPublicHomeFromStaleRoute();
            },
          }
        )
      );
    }

    function openAdminRoute(route) {
      if (!route?.view) return;
      if (route.view === "listening") {
        UI().setExamStarted(true);
        startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to start:', e));
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Listening in progress");
        return;
      }
      if (route.view === "reading") {
        UI().setExamStarted(true);
        window.__IELTS_READING_INIT__ = false;
        startEngineWhenReady("Reading", "startReadingSystem").catch(e => console.error('[IELTS] Reading failed to start:', e));
        UI().showOnly("reading");
        UI().setExamNavStatus("Status: Viewing Reading");
        return;
      }
      if (route.view === "writing") {
        UI().setExamStarted(true);
        window.__IELTS_WRITING_INIT__ = false;
        startEngineWhenReady("Writing", "startWritingSystem").catch(e => console.error('[IELTS] Writing failed to start:', e));
        UI().showOnly("writing");
        UI().setExamNavStatus("Status: Viewing Writing");
        return;
      }
      if (route.view === "results") {
        openAdminResultsView();
        return;
      }
      if (route.view === "classrooms") {
        openAdminClassroomsView();
        return;
      }
      if (route.view === "dashboard") {
        window.IELTS?.Dashboard?.open?.();
        return;
      }
      if (route.view === "home") {
        UI().showOnly("home");
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
      }
    }

    function reconcileStartupRoute() {
      const nextRoute = Router().parseHashRoute();
      if (!nextRoute?.view) return;

      if (nextRoute.view === "home") {
        try { history.replaceState({}, "", "/"); } catch (e) {}
        return;
      }

      if (isExamRouteView(nextRoute.view)) {
        if (isAdminView()) {
          if (document.body?.dataset?.activeView !== nextRoute.view) openAdminRoute(nextRoute);
          return;
        }
        if (matchesActiveNonFullLaunch(nextRoute.view)) {
          return;
        }
        const examStarted = String(S().get(R().KEYS.EXAM_STARTED, "false")) === "true";
        if (isStudentExamRouteActive() || examStarted) {
          // Freshly started exams can have no saved answers yet; do not treat them as stale.
          return;
        }
        if (!hasResumableStudentAttempt()) {
          // Preserve direct active exam hash routes instead of collapsing to home.
          try { UI().showOnly(nextRoute.view); } catch (e) {}
          try { UI().setExamNavStatus("Status: Ready to start"); } catch (e) {}
          return;
        }
        if (!isStudentExamRouteActive()) {
          promptResumeStudentExamRoute(nextRoute);
        }
        return;
      }

      if (isAdminView() && (nextRoute.view === "results" || nextRoute.view === "classrooms") && document.body?.dataset?.activeView !== "adminResults") {
        if (nextRoute.view === "classrooms") openAdminClassroomsView();
        else openAdminResultsView();
      }
      if (nextRoute.view === "vocabulary" && document.body?.dataset?.activeView !== "vocabulary") {
        if (window.IELTS?.Auth?.isSignedIn?.()) {
          window.IELTS?.Vocabulary?.open?.("dashboard");
        } else {
          window.IELTS?.Auth?.openLoginGate?.("Please log in to open Vocabulary.");
        }
      }
      if (nextRoute.view === "grammar" && document.body?.dataset?.activeView !== "grammar") {
        try { window.IELTS?.Grammar?.init?.(); } catch (e) {}
        UI().showOnly("grammar");
      }
      if (nextRoute.view === "placementTest" && document.body?.dataset?.activeView !== "placementTest") {
        UI().showOnly("placementTest");
      }
      if (nextRoute.view === "recentQuestions" && document.body?.dataset?.activeView !== "recentQuestions") {
        UI().showOnly("recentQuestions");
      }
      if (nextRoute.view === "resources" && document.body?.dataset?.activeView !== "resources") {
        try { window.IELTS?.ResourcesPage?.init?.(); } catch (e) {}
        UI().showOnly("resources");
      }
    }

    function isStudentExamRouteActive() {
      if (isAdminView()) return false;
      const isVisible = (id) => {
        const el = $(id);
        return !!(el && !el.classList.contains("hidden"));
      };
      return isVisible("listeningSection") || isVisible("readingControls") || isVisible("writingSection");
    }

    function clearStudentAttemptForExit() {
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = true; } catch (e) {}
      clearAllStudentAttemptKeys();
      safe(() => Modal().hideModal());
      safe(() => stopAllAudio());
      try { UI().setExamStarted(false); } catch (e) {}
    }

    function confirmLeaveStudentExam(onLeave) {
      if (!isStudentExamRouteActive() || !hasResumableStudentAttempt()) {
        return true;
      }
      safe(() =>
        Modal().showModal(
          "Leave this exam?",
          "If you leave now, your current answers will be lost and the exam will start from the beginning next time.",
          {
            mode: "confirm",
            submitText: "Leave exam",
            cancelText: "Continue exam",
            onConfirm: () => {
              clearStudentAttemptForExit();
              if (typeof onLeave === "function") onLeave();
            },
          }
        )
      );
      return false;
    }

    // If student lands on "submitted" overlay, do NOT trap them forever.
    // They should be able to start a new attempt.
    const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);
    if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) {
      S().set(R().EXAM.keys.finalSubmitted, "false");
    }

    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    if (finalDone && !isAdminView()) {
      // Student: auto-clear so Start Exam always works
      clearAllStudentAttemptKeys();
    }

    window.addEventListener("beforeunload", (event) => {
      if (!isStudentExamRouteActive() || !hasResumableStudentAttempt()) return;
      event.preventDefault();
      event.returnValue = "";
    });

    // ── In-app navigation guard ──────────────────────────────────────────────
    // Intercept hash changes that would take a student away from an active exam
    // (e.g. clicking Home in the exam-nav or any setHashRoute call to "home").
    // We revert the URL silently, then show the Leave/Continue modal.
    // Between-section navigation (listening→reading→writing) is always allowed.
    window.addEventListener("hashchange", (event) => {
      if (!isStudentExamRouteActive() || !hasResumableStudentAttempt()) return;
      const newView = (safe(() => Router().parseHashRoute()?.view)) || "";
      if (isExamRouteView(newView)) return; // cross-section nav is fine

      // Revert the URL change without firing another hashchange event.
      try {
        const prevHash = new URL(event.oldURL).hash;
        if (prevHash && location.hash !== prevHash) history.replaceState(null, "", prevHash);
      } catch (e) {}

      // Show Leave / Continue exam dialog.
      confirmLeaveStudentExam(() => {
        // Student confirmed "Leave exam" — clear state and go home cleanly.
        try { window.__IELTS_SUPPRESS_AUTO_GATES__ = true; } catch (e) {}
        try { UI().showOnly("home"); } catch (e) {}
        try { history.replaceState({}, "", "/"); } catch (e) {}
        try { UI().updateHomeStatusLine(); } catch (e) {}
        try { renderHomeResumeAction(); } catch (e) {}
        try { UI().setExamNavStatus("Status: Home"); } catch (e) {}
      });
    });

    // -----------------------------
    // Reliable gates (Listening→Reading, Reading→Writing)
    // -----------------------------
    let showingGate = false;

    function showListeningGate() {
      if (window.__IELTS_LISTENING_GATE_DIRECT_ACTIVE__ === true) return;
      if (!isFullExamFlow()) return;
      if (window.__IELTS_SUPPRESS_AUTO_GATES__ === true) return;
      if (isAdminView() || showingGate) return;
      const listeningDone = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false") === "true";
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      if (!listeningDone || readingDone) return;
      // If the user has already moved on to Reading/Writing, do not pull them back to Listening.
      const lastView = S().get(R().KEYS.HOME_LAST_VIEW, "");
      if (lastView === "reading" || lastView === "writing") return;


      showingGate = true;
      safe(() => UI().showOnly("listening"));
      safe(() => UI().setExamNavStatus("Status: Listening finished"));
      const modalApi = Modal();
      if (!modalApi || typeof modalApi.showModal !== "function") {
        showingGate = false;
        return;
      }
      try {
        modalApi.showModal(
          "Listening submitted",
          "Listening is submitted. Start Reading now?",
          {
            mode: "confirm",
            showCancel: true,
            submitText: "Start Reading",
            cancelText: "Stay here",
            onConfirm: async () => {
              // Mark that the user has moved on immediately to prevent any “gate loop” pulling them back.
              try { S().set(R().KEYS.HOME_LAST_VIEW, "reading"); } catch (e) {}
              resetCurrentReadingStage();

              // Keep the gate locked until we have attempted to start Reading.
              // (If listening:submitted fires again for any reason, showListeningGate will ignore it.)
              // Move to Reading view first, then start the engine (more reliable).
              try { UI().setExamStarted(true); } catch (e) {}
              try { UI().showOnly("reading"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Reading in progress"); } catch (e) {}
              try { window.IELTS?.Router?.setHashRoute?.((R().getActiveTestId?.() || R().TESTS?.defaultTestId || "ielts1"), "reading"); } catch (e) {}

              try {
                try { window.__IELTS_READING_INIT__ = false; } catch (e) {}
                await startEngineWhenReady("Reading", "startReadingSystem");
              } catch (e) {
                // Visible fallback: keep user on Reading screen even if engine failed.
                try {
                  showNotice("Reading failed to start. Please refresh the page and try again.", "Reading");
                } catch (_) {}
              } finally {
                showingGate = false;
              }
            },
            onCancel: () => {
              try { UI().showOnly("listening"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Listening submitted (review)"); } catch (e) {}
              showingGate = false;
            },
          }
        );
      } catch (e) {
        showingGate = false;
      }
    }

    function showReadingGate() {
      if (!isFullExamFlow()) return;
      if (window.__IELTS_SUPPRESS_AUTO_GATES__ === true) return;
      if (isAdminView() || showingGate) return;
      const listeningDone = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false") === "true";
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      const writingStarted = S().get((activeScopedKeys()?.writing || R().TESTS.writingKeys).started, "false") === "true";
      if (!listeningDone || !readingDone || writingStarted) return;
      // If the user already moved to Writing, do not pull them back to Reading.
      const lastView = S().get(R().KEYS.HOME_LAST_VIEW, "");
      if (lastView === "writing") return;


      showingGate = true;
      safe(() => UI().showOnly("reading"));
      safe(() => UI().setExamNavStatus("Status: Reading finished"));

      safe(() =>
        Modal().showModal(
          "Reading finished",
          "Your Reading has been submitted. Click Start Writing to continue.",
          {
            mode: "gate",
                        submitText: "Start Writing",
            onConfirm: async () => {
              showingGate = false;

              try { UI().setExamStarted(true); } catch (e) {}
              try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "writing"); } catch (e) {}
              try { UI().showOnly("writing"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Writing in progress"); } catch (e) {}

              try {
                try { window.__IELTS_WRITING_INIT__ = false; } catch (e) {}
                await startEngineWhenReady("Writing", "startWritingSystem");
              } catch (e) {
                try { showNotice("Writing failed to start. Please refresh the page and try again.", "Writing"); } catch (_) {}
              }
            },
          }
        )
      );
    }

    // Event-based (preferred)
    document.addEventListener("listening:submitted", showListeningGate);
    document.addEventListener("reading:submitted", showReadingGate);

    window.IELTS = window.IELTS || {};
    window.IELTS.App = window.IELTS.App || {};
    window.IELTS.App.showListeningGate = showListeningGate;
    window.IELTS.App.showReadingGate = showReadingGate;
    window.IELTS.App.openResourceHub = openResourceHub;

    // Storage-based fallback polling (in case an event is missed)
    let lastListen = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false");
    let lastRead = S().get(readingSubmittedKey(), "false");
    setInterval(() => {
      if (isAdminView()) return;
      const curListen = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false");
      const curRead = S().get(readingSubmittedKey(), "false");

      // If changed to true, run gates
      if (curListen !== lastListen) {
        lastListen = curListen;
        if (curListen === "true") showListeningGate();
      }
      if (curRead !== lastRead) {
        lastRead = curRead;
        if (curRead === "true") showReadingGate();
      }

      // Also keep checking in case state was already true (refresh)
      showListeningGate();
      showReadingGate();
    }, 800);

    // Attach a direct audio ended fallback for listening
    const aud = document.getElementById("listeningAudio");
    if (aud && !aud.dataset.gateBound) {
      aud.dataset.gateBound = "1";
      aud.addEventListener("ended", () => {
        // Give engine time to set submitted key
        setTimeout(showListeningGate, 400);
        setTimeout(showListeningGate, 1200);
      });
    }

    // -----------------------------
    // Admin nav buttons (unchanged)
    // -----------------------------
    const toHome = $("navToHomeBtn");
    const toL = $("navToListeningBtn");
    const toR = $("navToReadingBtn");
    const toW = $("navToWritingBtn");
    const toResults = $("navToResultsBtn");
    const resetBtn = $("resetExamBtn");

    if (toHome) {
      toHome.onclick = () => {
        if (!isAdminView()) return;
        try { stopAllAudio(); } catch (e) {}
        UI().showOnly("home");
        try { history.replaceState({}, "", "/"); } catch (e) {}
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
      };
    }

    if (toL) {
      toL.onclick = () => {
        if (!isAdminView()) return;
        UI().setExamStarted(true);
        resetEngineInitFlags();
        UI().showOnly("listening");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "listening"); } catch (e) {}
        UI().setExamNavStatus("Status: Viewing Listening");
        try {
          startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to start:', e));
        } catch (e) {
          console.error("Listening failed to open from nav:", e);
          try { showNotice("Listening failed to load. Please refresh once and try again.", "Listening"); } catch (_) {}
        }
      };
    }

    if (toR) {
      toR.onclick = () => {
        if (!isAdminView()) return;
        UI().setExamStarted(true);
        window.__IELTS_READING_INIT__ = false;
        startEngineWhenReady("Reading", "startReadingSystem").catch(e => console.error('[IELTS] Reading failed to start:', e));
        UI().clearReadingLockStyles();
        UI().showOnly("reading");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "reading"); } catch (e) {}
        UI().setExamNavStatus("Status: Viewing Reading");
      };
    }

    if (toW) {
      toW.onclick = () => {
        if (!isAdminView()) return;
        const writingStarted = S().get((R().keysFor?.(getActiveTestId())?.writing || R().TESTS.writingKeys).started, "false") === "true";
        const readingSubmitted = S().get(readingSubmittedKey(), "false") === "true";
        if (!writingStarted && !readingSubmitted) {
          Modal().showModal("Writing locked", "You must submit Reading before opening Writing.", { mode: "confirm" });
          UI().showOnly("reading");
          try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "reading"); } catch (e) {}
          UI().setExamNavStatus("Status: Viewing Reading");
          return;
        }
        UI().setExamStarted(true);
        if (!writingStarted) startEngineWhenReady("Writing", "startWritingSystem").catch(e => console.error('[IELTS] Writing failed to start:', e));
        else UI().showOnly("writing");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "writing"); } catch (e) {}
        UI().setExamNavStatus("Status: Viewing Writing");
      };
    }

    if (toResults) {
      toResults.onclick = () => {
        if (!isAdminView()) return;
        openAdminResultsView();
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (!isAdminView()) return;
        Modal().showModal("Start a new attempt?", "This will clear saved answers on this browser.", {
          mode: "confirm",
          showCancel: true,
          submitText: "Continue",
          cancelText: "Cancel",
          onConfirm: () => {
            UI().setExamStarted(false);
            UI().resetExamAttempt();
          },
        });
      };
    }

    // -----------------------------
    // Admin results dashboard
    // -----------------------------
    const adminState = { mode: "full", page: "results", rowsByMode: { full: [], practice: [], diagnostic: [] }, filtered: [] };
    const ADMIN_RESULTS_CACHE_KEY = "IELTS:ADMIN:RESULTS:CACHE:V4";
    const ADMIN_RESULTS_PERSISTENT_CACHE_KEY = "IELTS:ADMIN:RESULTS:CACHE:PERSISTENT:V4";
    const ADMIN_RESULTS_CACHE_MAX_AGE_MS = 1000 * 60 * 10;            // 10 min sessionStorage
    const ADMIN_RESULTS_PERSISTENT_CACHE_MAX_AGE_MS = 1000 * 60 * 20; // 20 min localStorage (was 6 h)
    const adminDetailState = { sourceRowId: null, sourceScrollY: 0 };
    const adminFullResultCache = new Map();

    function nullableNumber(value) {
      if (value === null || value === undefined) return null;
      const text = String(value).trim();
      if (!text) return null;
      const n = Number(text);
      return Number.isFinite(n) ? n : null;
    }

    function nullableBand(value) {
      return nullableNumber(value);
    }

    function parseBandRangeMidpoint(value) {
      const text = String(value || "").trim();
      if (!text) return null;
      const parts = text.split("-").map((part) => nullableBand(part));
      if (parts.length >= 2 && parts[0] !== null && parts[1] !== null) {
        return (parts[0] + parts[1]) / 2;
      }
      return nullableBand(text);
    }

    function effectiveWritingBand(row) {
      const task1Words = nullableNumber(row?.task1Words);
      const task2Words = nullableNumber(row?.task2Words);
      const task1Band = nullableBand(row?.task1Band);
      const task2Band = nullableBand(row?.task2Band);
      const finalBand = nullableBand(row?.finalWritingBand);
      const hasTask1 = task1Words !== null && task1Words > 0;
      const hasTask2 = task2Words !== null && task2Words > 0;
      if (!hasTask1 && !hasTask2) return finalBand;
      if (hasTask1 && hasTask2) {
        if (finalBand !== null) return finalBand;
        if (task1Band !== null && task2Band !== null) {
          return Math.round(((task1Band + task2Band) / 2) * 2) / 2;
        }
        return task1Band ?? task2Band ?? null;
      }
      if (hasTask1) return task1Band;
      if (hasTask2) return task2Band;
      return null;
    }

    function speakingBand(row) {
      return nullableBand(row?.speakingBand);
    }

    function writingBandEditable(row) {
      return (
        nullableBand(row?.task1Band) === null &&
        nullableBand(row?.task2Band) === null &&
        nullableBand(row?.finalWritingBand) === null
      );
    }

    function effectiveOverallBand(row) {
      const nums = [
        nullableBand(row?.listeningBand),
        nullableBand(row?.readingBand),
        effectiveWritingBand(row),
        speakingBand(row),
      ].filter((value) => value !== null);
      if (!nums.length) return null;
      return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 2) / 2;
    }

    function scoreAverage(rows, getter) {
      const nums = (rows || [])
        .map((row) => getter(row))
        .filter((value) => value !== null);
      if (!nums.length) return null;
      return nums.reduce((sum, value) => sum + value, 0) / nums.length;
    }

    function numberText(value) {
      const n = nullableNumber(value);
      return n === null ? "—" : String(n);
    }

    function writingWordText(value) {
      const n = nullableNumber(value);
      return n !== null && n > 0 ? String(n) : "—";
    }

    function objectiveDetailText(total, band, totalQuestions = 40) {
      const totalValue = nullableNumber(total);
      const bandValue = nullableBand(band);
      if (totalValue === null && bandValue === null) return "—";
      return `${numberText(total)} / ${Number(totalQuestions) || 40} (Band ${bandText(band)})`;
    }

    function bandText(value) {
      const n = nullableBand(value);
      return n === null ? "—" : n.toFixed(1);
    }

    function plainText(value, fallback = "—") {
      const t = String(value ?? "").trim();
      return t || fallback;
    }

    function fmtDate(value) {
      const d = new Date(value || "");
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString();
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function clearElement(el) {
      if (!el) return;
      while (el.firstChild) el.removeChild(el.firstChild);
    }

    function appendLabeledLine(container, label, value, { bold = true } = {}) {
      if (!container) return;
      const line = document.createElement("div");
      line.append(`${label}: `);
      const valueEl = document.createElement(bold ? "b" : "span");
      valueEl.textContent = String(value ?? "");
      line.appendChild(valueEl);
      container.appendChild(line);
    }

    function appendTextBlock(container, text, fallback = "—") {
      if (!container) return;
      const block = document.createElement("div");
      block.className = "admin-detail-text";
      block.textContent = plainText(text, fallback);
      container.appendChild(block);
    }

    function renderObjectiveReviewInto(container, items, emptyMessage) {
      if (!container) return;
      clearElement(container);
      const rows = Array.isArray(items) ? items : [];
      if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "objective-review-empty";
        empty.textContent = emptyMessage || "No answer review available yet.";
        container.appendChild(empty);
        return;
      }

      const table = document.createElement("table");
      table.className = "objective-review-table";
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      ["Q#", "Student", "Correct", "Mark"].forEach((label) => {
        const th = document.createElement("th");
        th.textContent = label;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      rows.forEach((item) => {
        const tr = document.createElement("tr");
        [
          String(item.q ?? "—"),
          String(item.student || "—"),
          String(item.correct || "—"),
        ].forEach((value) => {
          const td = document.createElement("td");
          td.textContent = value;
          tr.appendChild(td);
        });
        const markTd = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = `objective-review-mark ${item.mark ? "ok" : "bad"}`;
        badge.textContent = item.mark ? "Correct" : "Wrong";
        markTd.appendChild(badge);
        tr.appendChild(markTd);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    }

    function buildAdminResultCacheKey(row) {
      return [
        String(row?.submittedAt || "").trim(),
        String(row?.studentFullName || "").trim().toLowerCase(),
        String(row?.examId || "").trim().toLowerCase(),
        String(row?.reason || "").trim().toLowerCase(),
      ].join("::");
    }

    function getAdminRows(mode = adminState.mode) {
      return adminState.rowsByMode[String(mode || "full")] || [];
    }

    function setAdminRows(mode, rows) {
      adminState.rowsByMode[String(mode || "full")] = Array.isArray(rows) ? rows : [];
    }


    function hasAdminMeaningfulValue(value) {
      if (value === null || value === undefined) return false;
      if (typeof value === "number") return Number.isFinite(value);
      if (typeof value === "boolean") return true;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      const text = String(value).trim();
      return text !== "";
    }

    function mergeAdminRowsPreferHydrated(freshRow, cachedRow) {
      const next = { ...(cachedRow || {}), ...(freshRow || {}) };
      const keys = new Set([
        ...Object.keys(cachedRow || {}),
        ...Object.keys(freshRow || {}),
      ]);
      keys.forEach((key) => {
        const freshValue = freshRow?.[key];
        const cachedValue = cachedRow?.[key];
        if (!hasAdminMeaningfulValue(freshValue) && hasAdminMeaningfulValue(cachedValue)) {
          next[key] = cachedValue;
        }
      });
      return next;
    }

    function mergeAdminResultsWithCache(rows, mode = adminState.mode) {
      const freshRows = Array.isArray(rows) ? rows : [];
      const cachedRows = [
        ...getAdminRows(mode),
        ...loadAdminResultsCache(mode),
      ];
      const cachedByKey = new Map();
      cachedRows.forEach((row) => {
        const key = buildAdminResultCacheKey(row);
        if (!key) return;
        cachedByKey.set(key, mergeAdminRowsPreferHydrated(row, cachedByKey.get(key) || null));
      });
      return freshRows.map((row) => {
        const key = buildAdminResultCacheKey(row);
        if (!key) return row;
        return mergeAdminRowsPreferHydrated(row, cachedByKey.get(key) || null);
      });
    }

    function hasHydratedAdminDetail(row) {
      if (!row || typeof row !== "object") return false;
      return [
        row.studentEmail,
        row.signInMethod,
        row.writingTask1,
        row.writingTask2,
        row.task1Breakdown,
        row.task2Breakdown,
        row.overallFeedback,
        row.task1Feedback,
        row.task2Feedback,
      ].some(hasAdminMeaningfulValue);
    }

    function adminCacheKey(mode) {
      return `${ADMIN_RESULTS_CACHE_KEY}:${String(mode || "full")}`;
    }

    function adminPersistentCacheKey(mode) {
      return `${ADMIN_RESULTS_PERSISTENT_CACHE_KEY}:${String(mode || "full")}`;
    }

    function readSessionValueWithLegacyFallback(key) {
      try {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue !== null) return sessionValue;
      } catch (e) {}
      return null;
    }

    function updateAdminResultsModeChrome() {
      const fullBtn = $("adminResultsModeFullBtn");
      const practiceBtn = $("adminResultsModePracticeBtn");
      const diagnosticBtn = $("adminResultsModeDiagnosticBtn");
      const isPractice = adminState.mode === "practice";
      const isDiagnostic = adminState.mode === "diagnostic";
      if (fullBtn) {
        fullBtn.className = (isPractice || isDiagnostic) ? "btn secondary" : "btn";
        fullBtn.setAttribute("aria-pressed", (!isPractice && !isDiagnostic) ? "true" : "false");
      }
      if (practiceBtn) {
        practiceBtn.className = isPractice ? "btn" : "btn secondary";
        practiceBtn.setAttribute("aria-pressed", isPractice ? "true" : "false");
      }
      if (diagnosticBtn) {
        diagnosticBtn.className = isDiagnostic ? "btn" : "btn secondary";
        diagnosticBtn.setAttribute("aria-pressed", isDiagnostic ? "true" : "false");
      }
      const title = document.querySelector(".admin-results-title");
      const subtitle = document.querySelector(".admin-results-subtitle");
      const empty = $("adminResultsEmpty");
      if (title) title.textContent = isDiagnostic ? "Diagnostic results dashboard" : (isPractice ? "Practice review dashboard" : "Results command dashboard");
      if (subtitle) {
        subtitle.textContent = isPractice
          ? "Review section-only and practice attempts separately from full mocks."
          : (isDiagnostic
            ? "Review placement/diagnostic outcomes, estimated IELTS readiness, and weakest skill areas."
            : "Search, filter, inspect, and export student submissions from a cleaner cohort-management workspace.");
      }
      if (empty) empty.textContent = isDiagnostic ? "No diagnostic results found." : (isPractice ? "No practice results found." : "No results found.");
    }

    async function fetchAdminResults(options = {}) {
      const mode = String(options.mode || adminState.mode || "full");
      const endpoint = String(R()?.ADMIN_API_PATH || "/api/admin").trim();
      if (!endpoint) throw new Error("Admin endpoint is missing.");

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("action", mode === "practice" ? "practiceResultsSummary" : (mode === "diagnostic" ? "diagnosticResultsSummary" : "resultsSummary"));
      if (options.forceRefresh === true) {
        url.searchParams.set("refresh", "1");
        url.searchParams.set("t", String(Date.now()));
      }

      const headers = await getAuthHeaders();
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const res = await fetch(url.toString(), {
            method: "GET",
            headers,
          });
          const text = await res.text();
          let data = null;
          try { data = JSON.parse(text); } catch (e) {}
          if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`);
          const sourceRows = Array.isArray(data?.results) ? data.results : (Array.isArray(data?.rows) ? data.rows : null);
          if (!data || data.ok !== true || !Array.isArray(sourceRows)) {
            throw new Error((data && data.error) || "Could not load admin results.");
          }
          if (mode !== "diagnostic") return sourceRows;
          return sourceRows.map((row) => {
            const bandRange = String(row?.estimated_ielts_band || "").trim();
            const low = Number((bandRange.split("-")[0] || "").trim());
            const high = Number((bandRange.split("-")[1] || "").trim());
            const midpoint = Number.isFinite(low) && Number.isFinite(high)
              ? Math.round(((low + high) / 2) * 2) / 2
              : (Number.isFinite(low) ? low : null);
            return {
              submittedAt: row?.submitted_at || "",
              studentFullName: row?.student_name || "(No name)",
              examId: "placement-diagnostic",
              reason: `Diagnostic · Weakest: ${row?.weaknesses || "—"} · CEFR: ${row?.estimated_cefr_level || "—"}`,
              listeningTotal: null,
              listeningBand: null,
              readingTotal: null,
              readingBand: null,
              finalWritingBand: null,
              speakingBand: null,
              overallBand: midpoint,
              task1Words: 0,
              task2Words: 0,
              task1Band: null,
              task2Band: null,
              classroomName: "",
              classroom: "",
              diagnosticResultId: row?.id || "",
              diagnosticPercentage: row?.overall_percentage ?? null,
              diagnosticBandRange: bandRange || "—",
              diagnosticCefrLevel: row?.estimated_cefr_level || "—",
              diagnosticStrength: row?.strengths || "—",
              diagnosticWeakness: row?.weaknesses || "—",
              diagnosticDeadline: row?.deadline_selected || "—",
            };
          });
        } catch (error) {
          lastError = error;
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
          }
        }
      }
      const cachedRows = getAdminRows(mode);
      if (cachedRows.length) {
        return cachedRows.slice();
      }
      const persistedRows = loadAdminResultsCache(mode);
      if (persistedRows.length) {
        setAdminRows(mode, persistedRows);
        return persistedRows.slice();
      }
      throw lastError || new Error("Could not load admin results.");
    }

    async function fetchAdminFullResultForRow(row) {
      const cacheKey = buildAdminResultCacheKey(row);
      if (adminFullResultCache.has(cacheKey)) return adminFullResultCache.get(cacheKey);

      const endpoint = String(R()?.ADMIN_API_PATH || "/api/admin").trim();
      if (!endpoint) throw new Error("Admin endpoint is missing.");

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("action", "resultDetail");
      url.searchParams.set("submittedAt", String(row.submittedAt || ""));
      url.searchParams.set("studentFullName", String(row.studentFullName || ""));
      url.searchParams.set("examId", String(row.examId || ""));
      url.searchParams.set("reason", String(row.reason || ""));
      url.searchParams.set("t", String(Date.now()));

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) {}
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!data || data.ok !== true || !data.result) {
        throw new Error((data && data.error) || "Could not load full admin result.");
      }
      adminFullResultCache.set(cacheKey, data.result);
      return data.result;
    }

    function prefetchAdminResults(options = {}) {
      if (!isAdminView()) return Promise.resolve(getAdminRows(adminState.mode).slice());
      const now = Date.now();
      const mode = String(options.mode || adminState.mode || "full");
      if (adminResultsPrefetchState.promiseByMode[mode]) return adminResultsPrefetchState.promiseByMode[mode];
      if (!options.forceRefresh && getAdminRows(mode).length && now - Number(adminResultsPrefetchState.startedAtByMode[mode] || 0) < 30000) {
        return Promise.resolve(getAdminRows(mode).slice());
      }
      adminResultsPrefetchState.startedAtByMode[mode] = now;
      adminResultsPrefetchState.promiseByMode[mode] = fetchAdminResults(options)
        .then((rows) => {
          const mergedRows = mergeAdminResultsWithCache(rows, mode);
          setAdminRows(mode, mergedRows);
          saveAdminResultsCache(mergedRows, mode);
          return mergedRows;
        })
        .finally(() => {
          adminResultsPrefetchState.promiseByMode[mode] = null;
        });
      return adminResultsPrefetchState.promiseByMode[mode];
    }

    async function fetchObjectiveDetailForRow(row) {
      const cacheKey = buildAdminResultCacheKey(row);
      if (adminObjectiveDetailCache.has(cacheKey)) return adminObjectiveDetailCache.get(cacheKey);

      const endpoint = String(R()?.ADMIN_API_PATH || "/api/admin").trim();
      if (!endpoint) throw new Error("Admin endpoint is missing.");

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("action", "objectiveDetailAdmin");
      url.searchParams.set("submittedAt", String(row.submittedAt || ""));
      url.searchParams.set("studentFullName", String(row.studentFullName || ""));
      url.searchParams.set("examId", String(row.examId || ""));
      url.searchParams.set("reason", String(row.reason || ""));

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true || !data.result) return null;
      adminObjectiveDetailCache.set(cacheKey, data.result);
      return data.result;
    }

    function prefetchAdminObjectiveDetails(rows, limit) {
      (rows || [])
        .slice(0, Math.max(0, Number(limit) || 0))
        .forEach((row) => {
          if (row?.source === "practice-objective") return;
          const cacheKey = buildAdminResultCacheKey(row);
          if (!cacheKey || adminObjectiveDetailCache.has(cacheKey) || adminObjectivePrefetchPending.has(cacheKey)) return;
          adminObjectivePrefetchPending.add(cacheKey);
          fetchObjectiveDetailForRow(row)
            .catch(() => null)
            .finally(() => adminObjectivePrefetchPending.delete(cacheKey));
        });
    }

    function scheduleAdminDetailWarmup(rows, mode = adminState.mode) {
      const safeRows = Array.isArray(rows) ? rows.slice() : [];
      if (!safeRows.length) return;
      const warmup = () => {
        if (document.body?.dataset?.activeView !== "adminResults") return;
        prefetchAdminFullResults(safeRows, 1, mode);
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => warmup(), { timeout: 4000 });
        return;
      }
      window.setTimeout(warmup, 2500);
    }

    function prefetchAdminFullResults(rows, limit, mode = adminState.mode) {
      (rows || [])
        .slice(0, Math.max(0, Number(limit) || 0))
        .forEach((row) => {
          if (row?.source === "practice-objective") return;
          const cacheKey = buildAdminResultCacheKey(row);
          if (!cacheKey || adminFullResultCache.has(cacheKey) || adminFullResultPrefetchPending.has(cacheKey)) return;
          adminFullResultPrefetchPending.add(cacheKey);
          fetchAdminFullResultForRow(row)
            .then((fullResult) => {
              if (!fullResult) return;
              const mergedRow = { ...row, ...fullResult };
              mergeAdminRowIntoState(mergedRow, mode);
              if (document.body?.dataset?.activeView === "adminResults") {
                applyAdminFilters();
              }
            })
            .catch(() => null)
            .finally(() => adminFullResultPrefetchPending.delete(cacheKey));
        });
    }

    function renderObjectiveReview(prefix, result) {
      const listeningEl = $(`${prefix}ListeningReview`);
      const readingEl = $(`${prefix}ReadingReview`);
      renderObjectiveReviewInto(listeningEl, result?.listening, "Listening answer review is not available for this submission yet.");
      renderObjectiveReviewInto(readingEl, result?.reading, "Reading answer review is not available for this submission yet.");
    }

    function fillExamFilter(rows) {
      const sel = $("adminResultsExamFilter");
      if (!sel) return;
      const current = sel.value || "";
      const exams = Array.from(new Set(rows.map((r) => String(r.examId || "").trim()).filter(Boolean))).sort();
      clearElement(sel);
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "All tests";
      sel.appendChild(allOption);
      exams.forEach((examId) => {
        const option = document.createElement("option");
        option.value = examId;
        option.textContent = examId;
        sel.appendChild(option);
      });
      sel.value = exams.includes(current) ? current : "";
    }

    function resolveClassroomName(row) {
      return String(row?.classroomName || row?.classroom || "").trim();
    }

    function fillClassFilter(rows) {
      const sel = $("adminResultsClassFilter");
      if (!sel) return;
      const current = sel.value || "";
      const classes = Array.from(
        new Set((rows || []).map((row) => resolveClassroomName(row)).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
      clearElement(sel);
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "All classes";
      sel.appendChild(allOption);
      classes.forEach((className) => {
        const option = document.createElement("option");
        option.value = className;
        option.textContent = className;
        sel.appendChild(option);
      });
      sel.value = classes.includes(current) ? current : "";
    }

    function fillMonthYearFilters(rows) {
      const monthSel = $("adminResultsMonthFilter");
      const yearSel = $("adminResultsYearFilter");
      if (!monthSel || !yearSel) return;
      const currentMonth = monthSel.value || "";
      const currentYear = yearSel.value || "";
      const monthMap = new Map();
      const years = new Set();
      (rows || []).forEach((row) => {
        const d = new Date(row?.submittedAt || 0);
        if (Number.isNaN(d.getTime())) return;
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear());
        if (!monthMap.has(month)) monthMap.set(month, d.toLocaleString(undefined, { month: "long" }));
        years.add(year);
      });
      clearElement(monthSel);
      clearElement(yearSel);
      const allMonthsOption = document.createElement("option");
      allMonthsOption.value = "";
      allMonthsOption.textContent = "All months";
      monthSel.appendChild(allMonthsOption);
      Array.from(monthMap.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          monthSel.appendChild(option);
        });
      const allYearsOption = document.createElement("option");
      allYearsOption.value = "";
      allYearsOption.textContent = "All years";
      yearSel.appendChild(allYearsOption);
      Array.from(years)
        .sort((a, b) => Number(b) - Number(a))
        .forEach((year) => {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year;
          yearSel.appendChild(option);
        });
      monthSel.value = monthMap.has(currentMonth) ? currentMonth : "";
      yearSel.value = years.has(currentYear) ? currentYear : "";
    }

    function saveAdminResultsCache(rows, mode = adminState.mode) {
      try {
        const payload = JSON.stringify({ rows: Array.isArray(rows) ? rows : [], savedAt: Date.now() });
        sessionStorage.setItem(adminCacheKey(mode), payload);
      } catch (e) {}
      try {
        const payload = JSON.stringify({ rows: Array.isArray(rows) ? rows : [], savedAt: Date.now() });
        localStorage.setItem(adminPersistentCacheKey(mode), payload);
      } catch (e) {}
    }

    function loadAdminResultsCache(mode = adminState.mode) {
      try {
        const sessionRaw = readSessionValueWithLegacyFallback(adminCacheKey(mode));
        const sessionParsed = sessionRaw ? JSON.parse(sessionRaw) : null;
        if (sessionParsed && Date.now() - Number(sessionParsed.savedAt || 0) <= ADMIN_RESULTS_CACHE_MAX_AGE_MS) {
          return Array.isArray(sessionParsed?.rows) ? sessionParsed.rows : [];
        }
      } catch (e) {}
      try {
        const persistentRaw = localStorage.getItem(adminPersistentCacheKey(mode));
        const persistentParsed = persistentRaw ? JSON.parse(persistentRaw) : null;
        if (!persistentParsed) return [];
        if (Date.now() - Number(persistentParsed.savedAt || 0) > ADMIN_RESULTS_PERSISTENT_CACHE_MAX_AGE_MS) return [];
        if (Array.isArray(persistentParsed?.rows)) {
          try {
            sessionStorage.setItem(adminCacheKey(mode), JSON.stringify(persistentParsed));
          } catch (e) {}
          return persistentParsed.rows;
        }
        return [];
      } catch (e) {
        return [];
      }
    }

    function clearAdminResultsCache(mode = adminState.mode) {
      try { sessionStorage.removeItem(adminCacheKey(mode)); } catch (e) {}
      try { localStorage.removeItem(adminPersistentCacheKey(mode)); } catch (e) {}
      setAdminRows(mode, []);
      adminState.filtered = [];
      adminResultsPrefetchState.startedAtByMode[mode] = 0;
      adminResultsPrefetchState.promiseByMode[mode] = null;
    }

    function mergeAdminRowIntoState(updatedRow, mode = adminState.mode) {
      if (!updatedRow) return;
      const targetKey = buildAdminResultCacheKey(updatedRow);
      let found = false;
      const nextRows = getAdminRows(mode).map((row) => {
        if (buildAdminResultCacheKey(row) !== targetKey) return row;
        found = true;
        return mergeAdminRowsPreferHydrated(updatedRow, row);
      });
      if (!found) nextRows.unshift(updatedRow);
      setAdminRows(mode, nextRows);
      saveAdminResultsCache(nextRows, mode);
      const cacheKey = buildAdminResultCacheKey(updatedRow);
      if (cacheKey && hasHydratedAdminDetail(updatedRow)) {
        adminFullResultCache.set(cacheKey, updatedRow);
      }
    }

    function renderSummary(rows) {
      const isDiagnosticMode = adminState.mode === "diagnostic";
      const count = rows.length;
      const avgListening = isDiagnosticMode
        ? scoreAverage(rows, (row) => nullableNumber(row?.diagnosticPercentage))
        : scoreAverage(rows, (row) => nullableBand(row?.listeningBand));
      const avgReading = isDiagnosticMode
        ? null
        : scoreAverage(rows, (row) => nullableBand(row?.readingBand));
      const avgWriting = isDiagnosticMode
        ? null
        : scoreAverage(rows, (row) => effectiveWritingBand(row));
      const avgSpeaking = isDiagnosticMode
        ? null
        : scoreAverage(rows, (row) => speakingBand(row));
      const avgOverall = isDiagnosticMode
        ? null
        : scoreAverage(rows, (row) => effectiveOverallBand(row));
      const latest = rows.slice().sort((a,b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0];
      if ($("adminStatSubmissions")) $("adminStatSubmissions").textContent = String(count);
      if ($("adminStatListening")) $("adminStatListening").textContent = avgListening === null ? "null" : `${avgListening.toFixed(1)}${isDiagnosticMode ? "%" : ""}`;
      if ($("adminStatReading")) $("adminStatReading").textContent = avgReading === null ? "null" : avgReading.toFixed(1);
      if ($("adminStatWriting")) $("adminStatWriting").textContent = avgWriting === null ? "null" : avgWriting.toFixed(1);
      if ($("adminStatSpeaking")) $("adminStatSpeaking").textContent = avgSpeaking === null ? "null" : avgSpeaking.toFixed(1);
      if ($("adminStatOverall")) {
        if (isDiagnosticMode) {
          const diagnosticAvgBand = scoreAverage(rows, (row) => parseBandRangeMidpoint(row?.diagnosticBandRange));
          $("adminStatOverall").textContent = diagnosticAvgBand === null ? "null" : diagnosticAvgBand.toFixed(1);
        } else {
          $("adminStatOverall").textContent = avgOverall === null ? "null" : avgOverall.toFixed(1);
        }
      }
      if ($("adminStatLatest")) $("adminStatLatest").textContent = latest ? `${latest.studentFullName || "(No name)"} · ${fmtDate(latest.submittedAt)}` : "—";
    }

    async function saveAdminSpeakingBand(row, speakingBandValue) {
      const response = await fetch((R()?.buildAdminApiUrl?.({ action: "adminResultSpeakingScore" }) || "").toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          submittedAt: row?.submittedAt || "",
          studentFullName: row?.studentFullName || "",
          examId: row?.examId || "",
          reason: row?.reason || "",
          speakingBand: speakingBandValue,
        }),
      }).then((res) => res.json().catch(() => null).then((data) => ({ ok: res.ok, data }))).catch(() => ({ ok: false, data: null }));

      if (!response.ok || response.data?.ok !== true) {
        throw new Error(response.data?.error || "Could not save speaking band.");
      }

      return response.data?.speakingBand ?? null;
    }

    async function saveAdminWritingBands(row, values = {}) {
      const response = await fetch((R()?.buildAdminApiUrl?.({ action: "adminResultWritingScore" }) || "").toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({
          submittedAt: row?.submittedAt || "",
          studentFullName: row?.studentFullName || "",
          examId: row?.examId || "",
          reason: row?.reason || "",
          task1Band: values.task1Band,
          task2Band: values.task2Band,
          finalWritingBand: values.finalWritingBand,
        }),
      }).then((res) => res.json().catch(() => null).then((data) => ({ ok: res.ok, data }))).catch(() => ({ ok: false, data: null }));

      if (!response.ok || response.data?.ok !== true) {
        throw new Error(response.data?.error || "Could not save writing bands.");
      }

      return {
        task1Band: response.data?.task1Band ?? null,
        task2Band: response.data?.task2Band ?? null,
        finalWritingBand: response.data?.finalWritingBand ?? null,
      };
    }

    function createSpeakingBandOptions(select, selectedValue) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "Band null";
      select.appendChild(emptyOption);

      for (let value = 0; value <= 9; value += 0.5) {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = `Band ${value.toFixed(1)}`;
        if (selectedValue !== null && Number(selectedValue) === value) option.selected = true;
        select.appendChild(option);
      }
    }

    function buildInlineSpeakingEditor(row, speakingTd) {
      clearElement(speakingTd);
      speakingTd.classList.add("admin-inline-score-cell");

      const wrapper = document.createElement("div");
      wrapper.className = "admin-inline-score";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "admin-inline-score-trigger";
      trigger.textContent = `Band ${bandText(speakingBand(row))}`;
      trigger.setAttribute("aria-label", `Edit speaking band for ${row.studentFullName || "student"}`);
      wrapper.appendChild(trigger);

      const openEditor = () => {
        clearElement(wrapper);
        wrapper.classList.add("is-editing");

        const select = document.createElement("select");
        select.className = "admin-inline-score-select";
        createSpeakingBandOptions(select, speakingBand(row));
        wrapper.appendChild(select);

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "admin-inline-score-save";
        saveBtn.textContent = "Save";
        wrapper.appendChild(saveBtn);

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "admin-inline-score-cancel";
        cancelBtn.textContent = "Cancel";
        wrapper.appendChild(cancelBtn);

        const message = document.createElement("div");
        message.className = "admin-inline-score-message";
        wrapper.appendChild(message);

        const closeEditor = () => {
          buildInlineSpeakingEditor(row, speakingTd);
        };

        cancelBtn.addEventListener("click", closeEditor);
        saveBtn.addEventListener("click", async () => {
          saveBtn.disabled = true;
          cancelBtn.disabled = true;
          select.disabled = true;
          message.textContent = "Saving...";
          try {
            const nextValue = select.value.trim() === "" ? null : Number(select.value);
            const savedSpeakingBand = await saveAdminSpeakingBand(row, nextValue);
            const updatedRow = { ...row, speakingBand: savedSpeakingBand };
            mergeAdminRowIntoState(updatedRow, adminState.mode);
            if ($("adminResultDetail") && !$("adminResultDetail")?.classList?.contains("hidden")) {
              const currentTitle = $("adminDetailTitle")?.textContent || "";
              if (currentTitle === (row.studentFullName || "Result details")) {
                renderAdminDetailFields(updatedRow, { loadingDetail: false });
              }
            }
            applyAdminFilters();
          } catch (error) {
            message.textContent = error?.message || "Could not save speaking band.";
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            select.disabled = false;
          }
        });

        try { select.focus(); } catch (e) {}
      };

      trigger.addEventListener("click", openEditor);
      speakingTd.appendChild(wrapper);
    }

    function buildInlineWritingEditor(row, writingTd) {
      clearElement(writingTd);
      writingTd.classList.add("admin-inline-score-cell");

      const ew = effectiveWritingBand(row);
      const hasGrade = ew !== null && ew !== undefined;

      const wrapper = document.createElement("div");
      wrapper.className = "admin-inline-score";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "admin-inline-score-trigger";
      trigger.textContent = hasGrade ? `Band ${bandText(ew)}` : "Band null";
      trigger.setAttribute("aria-label", `Edit writing band for ${row.studentFullName || "student"}`);
      if (hasGrade) trigger.disabled = true;
      wrapper.appendChild(trigger);

      if (!hasGrade) {
        const openEditor = () => {
          clearElement(wrapper);
          wrapper.classList.add("is-editing");

          function makeInput(label, placeholder) {
            const row = document.createElement("div");
            row.className = "admin-inline-writing-row";
            const lbl = document.createElement("label");
            lbl.textContent = label;
            const inp = document.createElement("input");
            inp.type = "number";
            inp.min = "0";
            inp.max = "9";
            inp.step = "0.5";
            inp.className = "admin-inline-score-input";
            inp.placeholder = placeholder;
            row.appendChild(lbl);
            row.appendChild(inp);
            wrapper.appendChild(row);
            return inp;
          }

          const t1Input = makeInput("T1 Band", "e.g. 6.5");
          const t2Input = makeInput("T2 Band", "e.g. 7.0");
          const ovInput = makeInput("Overall", "auto");

          function autoOverall() {
            const t1 = t1Input.value.trim();
            const t2 = t2Input.value.trim();
            if (ovInput === document.activeElement) return;
            if (t1 !== "" && t2 !== "") {
              const avg = (Number(t1) + Number(t2)) / 2;
              ovInput.value = (Math.round(avg * 2) / 2).toFixed(1);
            } else if (t1 !== "") {
              ovInput.value = Number(t1).toFixed(1);
            } else if (t2 !== "") {
              ovInput.value = Number(t2).toFixed(1);
            }
          }
          t1Input.addEventListener("input", autoOverall);
          t2Input.addEventListener("input", autoOverall);

          const btnRow = document.createElement("div");
          btnRow.className = "admin-inline-score-btn-row";

          const saveBtn = document.createElement("button");
          saveBtn.type = "button";
          saveBtn.className = "admin-inline-score-save";
          saveBtn.textContent = "Save";
          btnRow.appendChild(saveBtn);

          const cancelBtn = document.createElement("button");
          cancelBtn.type = "button";
          cancelBtn.className = "admin-inline-score-cancel";
          cancelBtn.textContent = "Cancel";
          btnRow.appendChild(cancelBtn);

          wrapper.appendChild(btnRow);

          const message = document.createElement("div");
          message.className = "admin-inline-score-message";
          wrapper.appendChild(message);

          cancelBtn.addEventListener("click", () => buildInlineWritingEditor(row, writingTd));

          saveBtn.addEventListener("click", async () => {
            autoOverall();
            const t1 = t1Input.value.trim() === "" ? null : Number(t1Input.value);
            const t2 = t2Input.value.trim() === "" ? null : Number(t2Input.value);
            const ov = ovInput.value.trim() === "" ? null : Number(ovInput.value);
            if (t1 === null && t2 === null && ov === null) {
              message.textContent = "Enter at least one band.";
              return;
            }
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            [t1Input, t2Input, ovInput].forEach((i) => (i.disabled = true));
            message.textContent = "Saving…";
            try {
              const saved = await saveAdminWritingBands(row, {
                task1Band: t1,
                task2Band: t2,
                finalWritingBand: ov,
              });
              const updatedRow = {
                ...row,
                task1Band: saved.task1Band,
                task2Band: saved.task2Band,
                finalWritingBand: saved.finalWritingBand,
              };
              mergeAdminRowIntoState(updatedRow, adminState.mode);
              if ($("adminResultDetail") && !$("adminResultDetail")?.classList?.contains("hidden")) {
                const currentTitle = $("adminDetailTitle")?.textContent || "";
                if (currentTitle === (row.studentFullName || "Result details")) {
                  renderAdminDetailFields(updatedRow, { loadingDetail: false });
                }
              }
              applyAdminFilters();
            } catch (error) {
              message.textContent = error?.message || "Could not save writing bands.";
              saveBtn.disabled = false;
              cancelBtn.disabled = false;
              [t1Input, t2Input, ovInput].forEach((i) => (i.disabled = false));
            }
          });

          try { t1Input.focus(); } catch (e) {}
        };

        trigger.addEventListener("click", openEditor);
      }

      writingTd.appendChild(wrapper);
    }

    function appendAdminObjectiveCell(cell, total, band, totalQuestions = 40) {
      const totalValue = nullableNumber(total);
      const bandValue = nullableBand(band);
      if (totalValue === null && bandValue === null) {
        cell.textContent = "null";
        return;
      }
      cell.append(`${numberText(total)} / ${Number(totalQuestions) || 40}`);
      cell.appendChild(document.createElement("br"));
      const small = document.createElement("span");
      small.className = "small";
      small.textContent = `Band ${bandText(band)}`;
      cell.appendChild(small);
    }

    function renderAdminTable(rows) {
      adminState.filtered = rows.slice();
      const tbody = $("adminResultsTbody");
      const empty = $("adminResultsEmpty");
      if (!tbody) return;
      clearElement(tbody);
      if (!rows.length) {
        empty?.classList.remove("hidden");
        renderSummary([]);
        return;
      }
      empty?.classList.add("hidden");
      rows.forEach((row, idx) => {
        const isDiagnostic = adminState.mode === "diagnostic" || String(row?.examId || "").toLowerCase() === "placement-diagnostic";
        const tr = document.createElement("tr");
        tr.id = `admin-result-row-${idx}`;

        const submittedTd = document.createElement("td");
        submittedTd.textContent = fmtDate(row.submittedAt);
        tr.appendChild(submittedTd);

        const nameTd = document.createElement("td");
        const strong = document.createElement("strong");
        strong.textContent = row.studentFullName || "(No name)";
        nameTd.appendChild(strong);
        nameTd.appendChild(document.createElement("br"));
        const reason = document.createElement("span");
        reason.className = "small";
        reason.textContent = row.reason || "";
        nameTd.appendChild(reason);
        tr.appendChild(nameTd);

        const examTd = document.createElement("td");
        examTd.textContent = isDiagnostic ? "Placement Diagnostic" : (row.practiceLabel || row.examId || "—");
        tr.appendChild(examTd);

        const listeningTd = document.createElement("td");
        if (isDiagnostic) {
          const pct = nullableNumber(row?.diagnosticPercentage);
          listeningTd.textContent = pct === null ? "null" : `${pct.toFixed(1)}%`;
        } else {
          appendAdminObjectiveCell(listeningTd, row.listeningTotal, row.listeningBand, row.listeningTotalQuestions || 40);
        }
        tr.appendChild(listeningTd);

        const readingTd = document.createElement("td");
        if (isDiagnostic) {
          readingTd.textContent = row?.diagnosticCefrLevel || "—";
        } else {
          appendAdminObjectiveCell(readingTd, row.readingTotal, row.readingBand, row.readingTotalQuestions || 40);
        }
        tr.appendChild(readingTd);

        const writingTd = document.createElement("td");
        if (isDiagnostic) {
          writingTd.textContent = row?.diagnosticWeakness || "—";
        } else {
          buildInlineWritingEditor(row, writingTd);
        }
        tr.appendChild(writingTd);

        const speakingTd = document.createElement("td");
        if (isDiagnostic) {
          speakingTd.textContent = row?.diagnosticStrength || "—";
        } else {
          buildInlineSpeakingEditor(row, speakingTd);
        }
        tr.appendChild(speakingTd);

        const overallTd = document.createElement("td");
        overallTd.textContent = isDiagnostic
          ? (row?.diagnosticBandRange ? `Band ${row.diagnosticBandRange}` : "Band null")
          : `Band ${bandText(effectiveOverallBand(row))}`;
        tr.appendChild(overallTd);

        const actionTd = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "admin-row-actions";
        const btn = document.createElement("button");
        btn.className = "btn secondary";
        btn.type = "button";
        btn.setAttribute("data-admin-view", String(idx));
        btn.setAttribute("data-admin-row-id", tr.id);
        btn.textContent = "View";
        actions.appendChild(btn);
        actionTd.appendChild(actions);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
      });
      renderSummary(rows);
    }

    function applyAdminFilters() {
      const q = String($("adminResultsSearch")?.value || "").trim().toLowerCase();
      const examFilter = String($("adminResultsExamFilter")?.value || "").trim();
      const monthFilter = String($("adminResultsMonthFilter")?.value || "").trim();
      const yearFilter = String($("adminResultsYearFilter")?.value || "").trim();
      const classFilter = String($("adminResultsClassFilter")?.value || "").trim();
      const sortValue = String($("adminResultsSort")?.value || "submittedAt_desc");
      let rows = getAdminRows(adminState.mode).slice();

      if (q) {
        rows = rows.filter((row) => {
          const hay = [row.studentFullName, row.reason, row.examId, row.practiceLabel, resolveClassroomName(row)].map((x) => String(x || "").toLowerCase()).join(" ");
          return hay.includes(q);
        });
      }
      if (examFilter) rows = rows.filter((row) => String(row.examId || "") === examFilter);
      if (classFilter) rows = rows.filter((row) => resolveClassroomName(row) === classFilter);
      if (monthFilter || yearFilter) {
        rows = rows.filter((row) => {
          const d = new Date(row?.submittedAt || 0);
          if (Number.isNaN(d.getTime())) return false;
          const rowMonth = String(d.getMonth() + 1).padStart(2, "0");
          const rowYear = String(d.getFullYear());
          if (monthFilter && rowMonth !== monthFilter) return false;
          if (yearFilter && rowYear !== yearFilter) return false;
          return true;
        });
      }

      const [field, dir] = sortValue.split("_");
      rows.sort((a, b) => {
        let av = a[field];
        let bv = b[field];
        if (field === "submittedAt") {
          av = new Date(av || 0).getTime();
          bv = new Date(bv || 0).getTime();
        } else if (field === "classroomName") {
          av = resolveClassroomName(a).toLowerCase();
          bv = resolveClassroomName(b).toLowerCase();
        } else if (["listeningTotal", "readingTotal"].includes(field)) {
          av = nullableNumber(av);
          bv = nullableNumber(bv);
          av = av === null ? -1 : av;
          bv = bv === null ? -1 : bv;
        } else if (field === "finalWritingBand") {
          av = effectiveWritingBand(a);
          bv = effectiveWritingBand(b);
          av = av === null ? -1 : av;
          bv = bv === null ? -1 : bv;
        } else if (field === "speakingBand") {
          av = speakingBand(a);
          bv = speakingBand(b);
          av = av === null ? -1 : av;
          bv = bv === null ? -1 : bv;
        } else if (field === "overallBand") {
          av = effectiveOverallBand(a);
          bv = effectiveOverallBand(b);
          av = av === null ? -1 : av;
          bv = bv === null ? -1 : bv;
        } else {
          av = String(av || "").toLowerCase();
          bv = String(bv || "").toLowerCase();
        }
        if (av < bv) return dir === "desc" ? 1 : -1;
        if (av > bv) return dir === "desc" ? -1 : 1;
        return 0;
      });

      renderAdminTable(rows);
    }

    function mergeAdminSubmissionIdentity(row, submissionRecord = null) {
      const nextRow = row && typeof row === "object" ? { ...row } : {};
      if (!submissionRecord || typeof submissionRecord !== "object") return nextRow;
      return {
        ...nextRow,
        studentIdCode: nextRow.studentIdCode || submissionRecord.studentIdCode || "",
        studentProfileId: nextRow.studentProfileId || submissionRecord.studentProfileId || "",
        classroomId: nextRow.classroomId || submissionRecord.classroomId || "",
        classroomName: nextRow.classroomName || submissionRecord.classroomName || "",
        officialEmail: nextRow.officialEmail || submissionRecord.officialEmail || "",
        loginEmail: nextRow.loginEmail || submissionRecord.loginEmail || submissionRecord.email || "",
        studentEmail: nextRow.studentEmail || submissionRecord.officialEmail || submissionRecord.email || "",
        signInMethod: nextRow.signInMethod || submissionRecord.provider || "",
      };
    }

    function renderAdminDetailFields(row, options = {}) {
      const resolvedRow = mergeAdminSubmissionIdentity(row, options.submissionRecord || null);
      const loadingDetail = options.loadingDetail === true;
      const isDiagnostic = adminState.mode === "diagnostic" || String(resolvedRow?.examId || "").toLowerCase() === "placement-diagnostic";
      const overallWritingBand = effectiveWritingBand(resolvedRow);
      $("adminDetailTitle").textContent = resolvedRow.studentFullName || "Result details";
      const metaEl = $("adminDetailMeta");
      clearElement(metaEl);
      appendLabeledLine(metaEl, "Test", isDiagnostic ? "Placement Diagnostic" : (resolvedRow.practiceLabel || resolvedRow.examId || "—"));
      appendLabeledLine(metaEl, "Submitted", fmtDate(resolvedRow.submittedAt));
      appendLabeledLine(metaEl, "Reason", resolvedRow.reason || "—");
      if (options.submissionRecord) {
        appendLabeledLine(metaEl, "Email", options.submissionRecord.email || "—");
        appendLabeledLine(metaEl, "Sign-in method", String(options.submissionRecord.provider || "email").replace(/-/g, " "));
      } else if (resolvedRow?.studentEmail) {
        appendLabeledLine(metaEl, "Email", resolvedRow.studentEmail || "—");
        appendLabeledLine(metaEl, "Sign-in method", String(resolvedRow.signInMethod || "email").replace(/-/g, " "));
      }
      appendLabeledLine(metaEl, "Student ID", resolvedRow.studentIdCode || "—");

      const scoresEl = $("adminDetailScores");
      clearElement(scoresEl);
      if (isDiagnostic) {
        const diagPct = nullableNumber(resolvedRow?.diagnosticPercentage);
        appendLabeledLine(scoresEl, "Overall diagnostic", diagPct === null ? "null" : `${diagPct.toFixed(1)}%`);
        appendLabeledLine(scoresEl, "Estimated IELTS", resolvedRow?.diagnosticBandRange ? `Band ${resolvedRow.diagnosticBandRange}` : "Band null");
        appendLabeledLine(scoresEl, "Estimated CEFR", resolvedRow?.diagnosticCefrLevel || "—");
        appendLabeledLine(scoresEl, "Strongest area", resolvedRow?.diagnosticStrength || "—");
        appendLabeledLine(scoresEl, "Weakest area", resolvedRow?.diagnosticWeakness || "—");
        appendLabeledLine(scoresEl, "Deadline", resolvedRow?.diagnosticDeadline || "Not specified");

        const studentCodeEditor = $("adminDetailStudentCodeEditor");
        if (studentCodeEditor) clearElement(studentCodeEditor);
        const writingEditor = $("adminDetailWritingEditor");
        if (writingEditor) clearElement(writingEditor);
        const speakingEditor = $("adminDetailSpeakingEditor");
        if (speakingEditor) clearElement(speakingEditor);

        const task1ScoreEl = $("adminDetailTask1Score");
        clearElement(task1ScoreEl);
        appendLabeledLine(task1ScoreEl, "Diagnostic note", "No essay tasks in placement diagnostic.", { bold: false });
        const task2ScoreEl = $("adminDetailTask2Score");
        clearElement(task2ScoreEl);
        appendLabeledLine(task2ScoreEl, "Diagnostic note", "No essay tasks in placement diagnostic.", { bold: false });

        $("adminDetailTask1").textContent = "";
        $("adminDetailTask2").textContent = "";
        $("adminDetailTask1Feedback").textContent = "";
        $("adminDetailTask2Feedback").textContent = "";
        const overallEl = $("adminDetailOverallWriting");
        clearElement(overallEl);
        appendTextBlock(overallEl, "Placement diagnostic contains listening, reading, grammar, and vocabulary sections only.");
        return;
      }

      appendLabeledLine(scoresEl, "Listening", objectiveDetailText(resolvedRow.listeningTotal, resolvedRow.listeningBand, resolvedRow.listeningTotalQuestions || 40));
      appendLabeledLine(scoresEl, "Reading", objectiveDetailText(resolvedRow.readingTotal, resolvedRow.readingBand, resolvedRow.readingTotalQuestions || 40));
      appendLabeledLine(scoresEl, "Overall Writing", `Band ${bandText(overallWritingBand)}`);
      appendLabeledLine(scoresEl, "Speaking", `Band ${bandText(speakingBand(resolvedRow))}`);
      appendLabeledLine(scoresEl, "Overall score", `Band ${bandText(effectiveOverallBand(resolvedRow))}`);
      appendLabeledLine(scoresEl, "Writing words", `${writingWordText(resolvedRow.task1Words)} / ${writingWordText(resolvedRow.task2Words)}`);

      const studentCodeEditor = $("adminDetailStudentCodeEditor");
      if (studentCodeEditor) {
        clearElement(studentCodeEditor);
        const field = document.createElement("div");
        field.className = "admin-speaking-editor";
        const title = document.createElement("div");
        title.className = "admin-detail-label";
        title.textContent = "Student sign-in code";
        field.appendChild(title);
        const hint = document.createElement("div");
        hint.className = "small";
        if (resolvedRow.studentIdCode) {
          hint.textContent = `Assigned code: ${resolvedRow.studentIdCode}`;
        } else {
          hint.textContent = "No Student ID is assigned to this result yet. Type the sign-in code you want to assign to this student.";
          const label = document.createElement("label");
          label.className = "admin-field";
          const codeTitle = document.createElement("span");
          codeTitle.textContent = "Sign-in code";
          const codeInput = document.createElement("input");
          codeInput.type = "text";
          codeInput.placeholder = "Enter student sign-in code";
          label.appendChild(codeTitle);
          label.appendChild(codeInput);
          field.appendChild(label);
          const saveBtn = document.createElement("button");
          saveBtn.className = "btn secondary";
          saveBtn.type = "button";
          saveBtn.textContent = "Assign sign-in code";
          saveBtn.addEventListener("click", async () => {
            const studentIdCode = String(codeInput.value || "").trim();
            if (!studentIdCode) {
              hint.textContent = "Please enter the sign-in code first.";
              return;
            }
            try {
              const saved = await assignStudentCodeFromAdminResult(resolvedRow, options.submissionRecord || null, studentIdCode);
              const updatedRow = {
                ...resolvedRow,
                studentIdCode: saved.studentIdCode || resolvedRow.studentIdCode || "",
                studentProfileId: saved.id || resolvedRow.studentProfileId || "",
                classroomId: saved.classroomId || resolvedRow.classroomId || "",
                classroomName: saved.classroomName || resolvedRow.classroomName || "",
                officialEmail: saved.officialEmail || resolvedRow.officialEmail || "",
              };
              mergeAdminRowIntoState(updatedRow, adminState.mode);
              renderAdminDetailFields(updatedRow, { ...options, loadingDetail: false });
              applyAdminFilters();
            } catch (error) {
              hint.textContent = error?.message || "Could not assign a sign-in code.";
            }
          });
          field.appendChild(saveBtn);
        }
        field.appendChild(hint);
        studentCodeEditor.appendChild(field);
      }

      const task1ScoreEl = $("adminDetailTask1Score");
      clearElement(task1ScoreEl);
      appendLabeledLine(task1ScoreEl, "Band", bandText(resolvedRow.task1Band));
      const task1BreakdownLabel = document.createElement("div");
      task1BreakdownLabel.textContent = "Breakdown:";
      task1ScoreEl.appendChild(task1BreakdownLabel);
      appendTextBlock(task1ScoreEl, loadingDetail ? "Loading detailed writing analysis..." : plainText(resolvedRow.task1Breakdown));

      $("adminDetailTask1").textContent = loadingDetail ? "Loading detailed writing response..." : (resolvedRow.writingTask1 || "");
      $("adminDetailTask1Feedback").textContent = loadingDetail ? "Loading feedback..." : plainText(resolvedRow.task1Feedback, "");
      const task2ScoreEl = $("adminDetailTask2Score");
      clearElement(task2ScoreEl);
      appendLabeledLine(task2ScoreEl, "Band", bandText(resolvedRow.task2Band));
      const task2BreakdownLabel = document.createElement("div");
      task2BreakdownLabel.textContent = "Breakdown:";
      task2ScoreEl.appendChild(task2BreakdownLabel);
      appendTextBlock(task2ScoreEl, loadingDetail ? "Loading detailed writing analysis..." : plainText(resolvedRow.task2Breakdown));
      $("adminDetailTask2").textContent = loadingDetail ? "Loading detailed writing response..." : (resolvedRow.writingTask2 || "");
      $("adminDetailTask2Feedback").textContent = loadingDetail ? "Loading feedback..." : plainText(resolvedRow.task2Feedback, "");
      const overallEl = $("adminDetailOverallWriting");
      clearElement(overallEl);
      appendLabeledLine(overallEl, "Overall Writing", `Band ${bandText(overallWritingBand)}`);
      overallEl.appendChild(document.createElement("br"));
      appendTextBlock(overallEl, loadingDetail ? "Loading overall writing feedback..." : plainText(resolvedRow.overallFeedback));

      const writingEditor = $("adminDetailWritingEditor");
      if (writingEditor) {
        clearElement(writingEditor);
        if (!loadingDetail && writingBandEditable(row)) {
          const field = document.createElement("div");
          field.className = "admin-speaking-editor";

          const task1Label = document.createElement("label");
          task1Label.className = "admin-field";
          const task1Title = document.createElement("span");
          task1Title.textContent = "Writing Task 1 band";
          const task1Input = document.createElement("input");
          task1Input.type = "number";
          task1Input.min = "0";
          task1Input.max = "9";
          task1Input.step = "0.5";
          task1Input.value = "";
          task1Label.appendChild(task1Title);
          task1Label.appendChild(task1Input);
          field.appendChild(task1Label);

          const task2Label = document.createElement("label");
          task2Label.className = "admin-field";
          const task2Title = document.createElement("span");
          task2Title.textContent = "Writing Task 2 band";
          const task2Input = document.createElement("input");
          task2Input.type = "number";
          task2Input.min = "0";
          task2Input.max = "9";
          task2Input.step = "0.5";
          task2Input.value = "";
          task2Label.appendChild(task2Title);
          task2Label.appendChild(task2Input);
          field.appendChild(task2Label);

          const saveBtn = document.createElement("button");
          saveBtn.className = "btn secondary";
          saveBtn.type = "button";
          saveBtn.textContent = "Save writing";
          field.appendChild(saveBtn);

          const hint = document.createElement("div");
          hint.className = "small";
          hint.textContent = "Only available when the result endpoint has no writing grades yet.";
          field.appendChild(hint);

          saveBtn.addEventListener("click", async () => {
            const task1Value = task1Input.value.trim();
            const task2Value = task2Input.value.trim();
            try {
              const saved = await saveAdminWritingBands(row, {
                task1Band: task1Value === "" ? null : Number(task1Value),
                task2Band: task2Value === "" ? null : Number(task2Value),
              });
              const updatedRow = {
                ...row,
                task1Band: saved.task1Band,
                task2Band: saved.task2Band,
                finalWritingBand: saved.finalWritingBand,
              };
              mergeAdminRowIntoState(updatedRow, adminState.mode);
              renderAdminDetailFields(updatedRow, { loadingDetail: false, submissionRecord: options.submissionRecord });
              applyAdminFilters();
              hint.textContent = "Writing bands saved.";
            } catch (error) {
              hint.textContent = error?.message || "Could not save writing bands.";
            }
          });

          writingEditor.appendChild(field);
        }
      }

      const speakingEditor = $("adminDetailSpeakingEditor");
      if (speakingEditor) {
        clearElement(speakingEditor);
        const field = document.createElement("div");
        field.className = "admin-speaking-editor";
        const label = document.createElement("label");
        label.className = "admin-field";
        const title = document.createElement("span");
        title.textContent = "Speaking band";
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = "9";
        input.step = "0.5";
        input.value = speakingBand(resolvedRow) === null ? "" : String(speakingBand(resolvedRow));
        input.id = "adminDetailSpeakingInput";
        label.appendChild(title);
        label.appendChild(input);
        field.appendChild(label);
        const saveBtn = document.createElement("button");
        saveBtn.className = "btn secondary";
        saveBtn.type = "button";
        saveBtn.id = "adminDetailSpeakingSaveBtn";
        saveBtn.textContent = "Save speaking";
        field.appendChild(saveBtn);
        const hint = document.createElement("div");
        hint.className = "small";
        hint.id = "adminDetailSpeakingMessage";
        hint.textContent = "Admin-only score. This will update the student's history too.";
        field.appendChild(hint);
        saveBtn.addEventListener("click", async () => {
          const nextValue = input.value.trim();
          try {
            const savedSpeakingBand = await saveAdminSpeakingBand(row, nextValue === "" ? null : Number(nextValue));
            const updatedRow = {
              ...resolvedRow,
              speakingBand: savedSpeakingBand,
            };
            mergeAdminRowIntoState(updatedRow, adminState.mode);
            renderAdminDetailFields(updatedRow, { loadingDetail: false, submissionRecord: options.submissionRecord });
            applyAdminFilters();
            hint.textContent = "Speaking band saved.";
          } catch (error) {
            hint.textContent = error?.message || "Could not save speaking band.";
          }
        });
        speakingEditor.appendChild(field);
      }
    }

    async function renderAdminDetail(row, options = {}) {
      const detail = $("adminResultDetail");
      if (!detail || !row) return;
      const isDiagnostic = adminState.mode === "diagnostic" || String(row?.examId || "").toLowerCase() === "placement-diagnostic";
      adminDetailState.sourceRowId = options.sourceRowId || null;
      adminDetailState.sourceScrollY = window.scrollY || 0;
      const hasCachedDetail = hasHydratedAdminDetail(row);
      if (hasCachedDetail) {
        const cacheKey = buildAdminResultCacheKey(row);
        if (cacheKey && !adminFullResultCache.has(cacheKey)) {
          adminFullResultCache.set(cacheKey, row);
        }
      }
      renderAdminDetailFields(row, { loadingDetail: !hasCachedDetail });
      renderObjectiveReview("adminDetail", null);
      detail.classList.remove("hidden");
      try {
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {}
      if (isDiagnostic) {
        return;
      }
      try {
        const token = await window.IELTS?.Auth?.getAccessToken?.();
        if (adminState.mode === "practice" && row.source === "practice-objective") {
          const detailUrl = R()?.buildAdminApiUrl?.({
            action: "practiceResultDetail",
            id: row.id || "",
            t: Date.now(),
          });
          const res = detailUrl
            ? await fetch(detailUrl.toString(), {
                method: "GET",
                cache: "no-store",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              }).then((response) => response.json().catch(() => null).then((data) => ({ ok: response.ok, data })))
            : null;
          const practiceRow = res?.ok && res?.data?.ok === true ? (res.data.row || row) : row;
          renderAdminDetailFields(practiceRow, { loadingDetail: false });
          renderObjectiveReview("adminDetail", res?.data?.result || null);
          return;
        }
        const submissionMetaUrl = R()?.buildAdminApiUrl?.({
          action: "submissionMeta",
          submittedAt: row.submittedAt || "",
          studentFullName: row.studentFullName || "",
          examId: row.examId || "",
          reason: row.reason || "",
          t: Date.now(),
        });
        const metaPromise = submissionMetaUrl
          ? fetch(submissionMetaUrl.toString(), {
              method: "GET",
              cache: "no-store",
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            }).then((res) => res.json().catch(() => null).then((data) => ({ ok: res.ok, data })))
          : Promise.resolve(null);
        const fullResultPromise = fetchAdminFullResultForRow(row).catch(() => null);
        const objectivePromise = fetchObjectiveDetailForRow(row).catch(() => null);
        const [metaResult, fullResult, objectiveResult] = await Promise.all([metaPromise, fullResultPromise, objectivePromise]);
        const metaRecord = metaResult?.ok && metaResult.data?.ok === true ? metaResult.data.record : null;
        const detailRow = mergeAdminSubmissionIdentity(fullResult ? { ...row, ...fullResult } : row, metaRecord);
        if (fullResult || detailRow.studentIdCode || detailRow.studentProfileId || detailRow.classroomId || detailRow.officialEmail) {
          mergeAdminRowIntoState(detailRow, adminState.mode);
        }
        renderAdminDetailFields(detailRow, { submissionRecord: metaRecord, loadingDetail: !fullResult });
        renderObjectiveReview("adminDetail", objectiveResult);
      } catch (e) {
        renderObjectiveReview("adminDetail", null);
      }
    }

    function closeAdminDetail() {
      $("adminResultDetail")?.classList.add("hidden");
      if (adminDetailState.sourceRowId) {
        const source = document.getElementById(adminDetailState.sourceRowId);
        if (source) {
          try {
            source.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (e) {}
        } else {
          try { window.scrollTo({ top: adminDetailState.sourceScrollY || 0, behavior: "smooth" }); } catch (e) {}
        }
        adminDetailState.sourceRowId = null;
      }
    }

    async function openAdminResultsView(forceRefresh = false, mode = adminState.mode) {
      if (!isAdminView()) return;
      adminState.mode = (mode === "practice" || mode === "diagnostic") ? mode : "full";
      setAdminPage("results");
      updateAdminResultsModeChrome();
      UI().showOnly("adminResults");
      UI().setExamNavStatus(
        adminState.mode === "practice"
          ? "Status: Practice results"
          : (adminState.mode === "diagnostic" ? "Status: Diagnostic results" : "Status: Admin results")
      );
      try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "results"); } catch (e) {}
      const tbody = $("adminResultsTbody");
      try {
        const cachedRows = loadAdminResultsCache(adminState.mode);
        let usedCachedRows = false;
        if (cachedRows.length) {
          setAdminRows(adminState.mode, cachedRows);
          fillExamFilter(cachedRows);
          fillMonthYearFilters(cachedRows);
          fillClassFilter(cachedRows);
          applyAdminFilters();
          usedCachedRows = true;
        } else if (getAdminRows(adminState.mode).length) {
          fillExamFilter(getAdminRows(adminState.mode));
          fillMonthYearFilters(getAdminRows(adminState.mode));
          fillClassFilter(getAdminRows(adminState.mode));
          applyAdminFilters();
          usedCachedRows = true;
        } else if (tbody) {
          tbody.innerHTML = '<tr class="ui-table-state-row"><td colspan="9">Loading results...</td></tr>';
        }
        const refresh = prefetchAdminResults({ forceRefresh, mode: adminState.mode })
          .then((rows) => {
            const mergedRows = mergeAdminResultsWithCache(rows, adminState.mode);
            setAdminRows(adminState.mode, mergedRows);
            saveAdminResultsCache(mergedRows, adminState.mode);
            fillExamFilter(mergedRows);
            fillMonthYearFilters(mergedRows);
            fillClassFilter(mergedRows);
            applyAdminFilters();
            scheduleAdminDetailWarmup(mergedRows, adminState.mode);
            return mergedRows;
          });
        if (!usedCachedRows) {
          await refresh;
        } else {
          refresh.catch(() => null);
        }
      } catch (e) {
        if (tbody) tbody.innerHTML = `<tr class="ui-table-state-row"><td colspan="9">${escapeHtml(e.message || "Could not load results.")}</td></tr>`;
        renderSummary([]);
      }
    }

    function setAdminPage(page) {
      const validPages = ["results", "classrooms", "assignments", "questions", "questionAnalytics"];
      const nextPage = validPages.includes(page) ? page : "results";
      adminState.page = nextPage;
      $("adminResultsBanner")?.classList.toggle("hidden", nextPage !== "results");
      $("adminResultsContent")?.classList.toggle("hidden", nextPage !== "results");
      $("adminClassroomsPage")?.classList.toggle("hidden", nextPage !== "classrooms");
      $("adminAssignmentsPage")?.classList.toggle("hidden", nextPage !== "assignments");
      $("adminQuestionsPage")?.classList.toggle("hidden", nextPage !== "questions");
      $("adminQuestionAnalyticsPage")?.classList.toggle("hidden", nextPage !== "questionAnalytics");
      const resultsBtn = $("adminPageResultsBtn");
      const classroomsBtn = $("adminPageClassroomsBtn");
      const assignmentsBtn = $("adminPageAssignmentsBtn");
      const questionsBtn = $("adminPageQuestionsBtn");
      const analyticsBtn = $("adminPageQuestionAnalyticsBtn");
      const toggleBtn = $("adminClassroomsToggleBtn");
      if (resultsBtn) {
        resultsBtn.className = nextPage === "results" ? "btn" : "btn secondary";
        resultsBtn.setAttribute("aria-pressed", nextPage === "results" ? "true" : "false");
      }
      if (classroomsBtn) {
        classroomsBtn.className = nextPage === "classrooms" ? "btn" : "btn secondary";
        classroomsBtn.setAttribute("aria-pressed", nextPage === "classrooms" ? "true" : "false");
      }
      if (assignmentsBtn) {
        assignmentsBtn.className = nextPage === "assignments" ? "btn" : "btn secondary";
        assignmentsBtn.setAttribute("aria-pressed", nextPage === "assignments" ? "true" : "false");
      }
      if (questionsBtn) {
        questionsBtn.className = nextPage === "questions" ? "btn" : "btn secondary";
        questionsBtn.setAttribute("aria-pressed", nextPage === "questions" ? "true" : "false");
      }
      if (analyticsBtn) {
        analyticsBtn.className = nextPage === "questionAnalytics" ? "btn" : "btn secondary";
        analyticsBtn.setAttribute("aria-pressed", nextPage === "questionAnalytics" ? "true" : "false");
      }
      if (toggleBtn) toggleBtn.textContent = nextPage === "classrooms" ? "Results" : "Classrooms";
      if (nextPage !== "classrooms") {
        $("adminStudentProgressDetail")?.classList.add("hidden");
      }
    }

    async function loadAdminPendingQuestions() {
      const list = $("adminQuestionsList");
      const status = $("adminQuestionsStatus");
      if (!list) return;
      if (status) status.textContent = "Loading…";
      list.innerHTML = "";
      try {
        const token = await window.IELTS?.Auth?.getAccessToken?.() || null;
        const url = new URL("/api/admin", window.location.origin);
        url.searchParams.set("action", "listPendingQuestions");
        const res = await fetch(url.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error("Could not load pending questions.");
        const data = await res.json();
        const posts = data.posts || [];
        if (status) status.textContent = posts.length ? `${posts.length} pending question${posts.length === 1 ? "" : "s"}` : "No pending questions.";
        if (!posts.length) return;
        list.innerHTML = posts.map((p) => `
          <div style="border:1px solid var(--neutral-200,#e5e7eb);border-radius:8px;padding:14px 16px;margin-bottom:12px">
            <div style="font-size:12px;color:var(--neutral-500,#6b7280);margin-bottom:6px">
              <strong>${p.module}</strong> · ${p.test_type}${p.country ? ` · ${p.country}` : ""}${p.exam_date ? ` · ${p.exam_date}` : ""}
              <span style="margin-left:8px;font-size:11px;color:var(--neutral-400,#9ca3af)">${p.user_id || "anonymous"}</span>
            </div>
            <p style="margin:0 0 10px;font-size:14px;line-height:1.5">${p.question_text}</p>
            <div style="display:flex;gap:8px">
              <button class="btn" style="font-size:12px;padding:5px 14px" data-qid="${p.id}" data-qaction="approve">Approve</button>
              <button class="btn secondary" style="font-size:12px;padding:5px 14px" data-qid="${p.id}" data-qaction="reject">Reject</button>
            </div>
          </div>`).join("");
        list.querySelectorAll("[data-qid]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const id = btn.dataset.qid;
            const action = btn.dataset.qaction === "approve" ? "approveQuestion" : "rejectQuestion";
            btn.disabled = true;
            btn.textContent = "…";
            try {
              const tok = await window.IELTS?.Auth?.getAccessToken?.() || null;
              const u = new URL("/api/admin", window.location.origin);
              u.searchParams.set("action", action);
              const r = await fetch(u.toString(), { method: "POST", headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
              const d = await r.json().catch(() => null);
              if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed.");
              btn.closest("div[style]").remove();
              const remaining = list.querySelectorAll("[data-qid]").length / 2;
              if (status) status.textContent = remaining ? `${remaining} pending question${remaining === 1 ? "" : "s"}` : "No pending questions.";
            } catch (e) {
              btn.disabled = false;
              btn.textContent = btn.dataset.qaction === "approve" ? "Approve" : "Reject";
              if (status) status.textContent = `Error: ${e.message}`;
            }
          });
        });
      } catch (e) {
        if (status) status.textContent = e.message || "Could not load questions.";
      }
    }

    function setQuestionAnalyticsStatus(message, tone = "") {
      const el = $("adminQuestionAnalyticsStatus");
      if (!el) return;
      el.textContent = message || "";
      el.style.color = tone === "error" ? "#991b1b" : tone === "success" ? "#166534" : "";
    }

    function renderQuestionAnalyticsSummary(summary) {
      const safe = summary || {};
      if ($("qaSummaryAttempts")) $("qaSummaryAttempts").textContent = String(safe.totalAttempts || 0);
      if ($("qaSummaryTests")) $("qaSummaryTests").textContent = String(safe.testsAnalyzed || 0);
      if ($("qaSummaryQuestions")) $("qaSummaryQuestions").textContent = String(safe.questionsAnalyzed || 0);
      if ($("qaSummaryWrongRate")) $("qaSummaryWrongRate").textContent = `${Number(safe.averageWrongRate || 0).toFixed(1)}%`;
      if ($("qaSummaryHardestExam")) {
        const hardest = safe.hardestExam || null;
        $("qaSummaryHardestExam").textContent = hardest
          ? `${String(hardest.testId || "").toUpperCase()} · ${String(hardest.section || "").toUpperCase()} · ${Number(hardest.averageWrongRate || 0).toFixed(1)}%`
          : "—";
      }
      if ($("qaSummaryMostMissed")) {
        const top = safe.mostMissedQuestion || null;
        $("qaSummaryMostMissed").textContent = top
          ? `${String(top.testId || "").toUpperCase()} ${String(top.section || "").toUpperCase()} Q${top.questionNumber} · ${Number(top.wrongRate || 0).toFixed(1)}%`
          : "—";
      }
    }

    function renderQuestionAnalyticsRows(rows) {
      const tbody = $("qaRowsTbody");
      if (!tbody) return;
      const safeRows = Array.isArray(rows) ? rows : [];
      tbody.innerHTML = safeRows.map((row) => {
        const solvedKey = buildQuestionAnalyticsRowSolvedKey(row);
        const isSolved = !!questionAnalyticsState.solvedByKey?.[solvedKey];
        const commonWrong = (Array.isArray(row.commonWrongAnswers) ? row.commonWrongAnswers : [])
          .map((item) => `${item.answer}: ${item.count}`)
          .join(" · ") || "—";
        return `
          <tr class="ui-data-row">
            <td>${escapeHtml(String(row.testId || "").toUpperCase())}</td>
            <td>${escapeHtml(String(row.section || "").toUpperCase())}</td>
            <td>${escapeHtml(String(row.questionNumber || ""))}</td>
            <td>${escapeHtml(`${Number(row.attempts || 0)} (F:${Number(row.fullMockAttempts || 0)} / P:${Number(row.practiceAttempts || 0)})`)}</td>
            <td>${escapeHtml(`${Number(row.correctRate || 0).toFixed(1)}%`)}</td>
            <td>${escapeHtml(`${Number(row.wrongRate || 0).toFixed(1)}%`)}</td>
            <td>${escapeHtml(`${Number(row.blankRate || 0).toFixed(1)}%`)}</td>
            <td>${escapeHtml(row.difficulty || "—")}${row.needsReview ? ` <span class="badge badge-warning">Needs review</span>` : ""}</td>
            <td>${escapeHtml(row.correctAnswer || "—")}</td>
            <td>${escapeHtml(commonWrong)}</td>
            <td>
              <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" data-qa-solved="${escapeHtml(solvedKey)}" ${isSolved ? "checked" : ""}>
                <span class="small">${isSolved ? "Solved" : "Mark solved"}</span>
              </label>
            </td>
          </tr>
        `;
      }).join("") || `<tr class="ui-table-state-row"><td colspan="11">No analytics rows matched these filters.</td></tr>`;

      Array.from(tbody.querySelectorAll("[data-qa-solved]")).forEach((input) => {
        input.addEventListener("change", () => {
          const key = String(input.getAttribute("data-qa-solved") || "");
          const row = safeRows.find((item) => buildQuestionAnalyticsRowSolvedKey(item) === key);
          if (!row) return;
          setQuestionAnalyticsSolved(row, !!input.checked);
          const label = input.closest("label")?.querySelector("span");
          if (label) label.textContent = input.checked ? "Solved" : "Mark solved";
        });
      });
    }

    function populateQuestionAnalyticsClassroomFilter() {
      const select = $("qaClassroomFilter");
      if (!select) return;
      const current = String(select.value || classroomProgressState.selectedClassroomId || "");
      const options = (Array.isArray(classroomProgressState.classrooms) ? classroomProgressState.classrooms : [])
        .map((room) => `<option value="${escapeHtml(String(room.id || ""))}">${escapeHtml(String(room.name || "Classroom"))}</option>`)
        .join("");
      select.innerHTML = `<option value="__all__">All classrooms</option><option value="">Selected class</option>${options}`;
      if (current) select.value = current;
    }

    function populateQuestionAnalyticsTestFilter() {
      const select = $("qaTestFilter");
      if (!select) return;
      const current = String(select.value || "");
      const tests = Array.isArray(questionAnalyticsState.tests) ? questionAnalyticsState.tests : [];
      select.innerHTML = `<option value="">All taken tests</option>${tests.map((testId) => `<option value="${escapeHtml(testId)}">${escapeHtml(String(testId || "").toUpperCase())}</option>`).join("")}`;
      if (current && tests.includes(current)) select.value = current;
    }

    async function loadQuestionAnalytics(forceRefresh = false) {
      if (questionAnalyticsState.loading) return;
      questionAnalyticsState.loading = true;
      if (!questionAnalyticsState.solvedByKey || typeof questionAnalyticsState.solvedByKey !== "object") {
        questionAnalyticsState.solvedByKey = loadQuestionAnalyticsSolvedState();
      }
      setQuestionAnalyticsStatus("Loading question analytics...");
      try {
        if (!Array.isArray(classroomProgressState.classrooms) || !classroomProgressState.classrooms.length) {
          await loadClassroomProgressData(forceRefresh).catch(() => null);
        }
        populateQuestionAnalyticsClassroomFilter();
        const classroomFilterValue = String($("qaClassroomFilter")?.value || "");
        const selectedClassroomId = classroomFilterValue === "__all__"
          ? ""
          : (classroomFilterValue || classroomProgressState.selectedClassroomId || "");
        const section = String($("qaSectionFilter")?.value || "all");
        const testId = String($("qaTestFilter")?.value || "");
        const minAttempts = Number($("qaMinAttemptsFilter")?.value || 1);
        const difficulty = String($("qaDifficultyFilter")?.value || "");
        const questionNumber = Number($("qaQuestionFilter")?.value || 0);
        const url = R()?.buildAdminApiUrl?.({
          action: "questionAnalytics",
          section,
          testId,
          classroomId: selectedClassroomId,
          minAttempts: Number.isFinite(minAttempts) ? String(minAttempts) : "1",
          difficulty,
          questionNumber: questionNumber > 0 ? String(questionNumber) : "",
          refresh: forceRefresh ? "1" : "",
        });
        if (!url) throw new Error("Could not build analytics URL.");
        const res = await fetch(url.toString(), { headers: await getAuthHeaders() }).catch(() => null);
        const data = res ? await res.json().catch(() => null) : null;
        if (!res || !res.ok || !data || data.ok !== true) {
          throw new Error(data?.error || "Could not load question analytics.");
        }
        questionAnalyticsState.summary = data.summary || null;
        questionAnalyticsState.rows = Array.isArray(data.rows) ? data.rows : [];
        questionAnalyticsState.tests = Array.isArray(data.tests) ? data.tests : [];
        populateQuestionAnalyticsTestFilter();
        renderQuestionAnalyticsSummary(questionAnalyticsState.summary);
        renderQuestionAnalyticsRows(questionAnalyticsState.rows);
        setQuestionAnalyticsStatus(`Loaded ${questionAnalyticsState.rows.length} rows from ${questionAnalyticsState.tests.length} tests.`, "success");
      } catch (error) {
        renderQuestionAnalyticsSummary(null);
        renderQuestionAnalyticsRows([]);
        setQuestionAnalyticsStatus(error?.message || "Could not load question analytics.", "error");
      } finally {
        questionAnalyticsState.loading = false;
      }
    }

    async function openAdminQuestionAnalyticsView(forceRefresh = false) {
      if (!isAdminView()) return;
      UI().showOnly("adminResults");
      setAdminPage("questionAnalytics");
      await loadQuestionAnalytics(forceRefresh);
    }

    async function openAdminClassroomsView(forceRefresh = false) {
      if (!isAdminView()) return;
      UI().showOnly("adminResults");
      setAdminPage("classrooms");
      UI().setExamNavStatus("Status: Classroom analytics");
      try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "classrooms"); } catch (e) {}
      await loadClassroomProgressData(forceRefresh);
      await loadClassroomCoverageData(forceRefresh);
      if ($("adminClassroomManagementPanel")?.open) {
        await loadClassroomAdminData(forceRefresh);
      }
    }

    function exportAdminRowsCsv() {
      if (!isAdminView() || !adminState.filtered.length) return;
      const headers = adminState.mode === "diagnostic"
        ? ["organizationId","submittedAt","studentFullName","studentEmail","studentIdCode","studentProfileId","classroomId","examId","reason","diagnosticPercentage","diagnosticBandRange","diagnosticCefrLevel","diagnosticStrength","diagnosticWeakness","diagnosticDeadline"]
        : ["organizationId","submittedAt","studentFullName","studentIdCode","classroomName","officialEmail","studentProfileId","classroomId","examId","reason","listeningTotal","listeningBand","readingTotal","readingBand","finalWritingBand","speakingBand","overallBand","task1Words","task2Words","task1Band","task1Breakdown","task1Feedback","task2Band","task2Breakdown","task2Feedback","overallFeedback"];
      const lines = [headers.join(",")].concat(
        adminState.filtered.map((row) =>
          headers
            .map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
      );
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = adminState.mode === "practice"
        ? "ielts-practice-results.csv"
        : (adminState.mode === "diagnostic" ? "ielts-diagnostic-results.csv" : "ielts-results.csv");
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
    }

    // -----------------------------
    // Hash route support (ADMIN ONLY)
    // -----------------------------
    let pendingResourceHubKind = null;
    let pendingStartupRouteAction = null;
    const route = Router().parseHashRoute();
    if (route && route.testId) { try { setActiveTestId(route.testId); } catch (e) {} }
    if (
      route &&
      isExamRouteView(route.view) &&
      !isAdminView()
    ) {
      if (!hasResumableStudentAttempt()) {
        pendingStartupRouteAction = () => {
          // Preserve legacy active exam hash routes at startup.
          try { UI().showOnly(route.view); } catch (e) {}
          try { UI().setExamNavStatus("Status: Ready to start"); } catch (e) {}
        };
      } else {
        pendingStartupRouteAction = () => promptResumeStudentExamRoute(route);
      }
    } else if (isAdminView() && route && route.view) {
      pendingStartupRouteAction = () => openAdminRoute(route);
    }

    if (route && route.view) {
      if (route.view === "fullExamHub") {
        pendingResourceHubKind = "fullExam";
      }
      if (route.view === "readingHub") {
        pendingResourceHubKind = "reading";
      }
      if (route.view === "listeningHub") {
        pendingResourceHubKind = "listening";
      }
      if (route.view === "writingHub") {
        pendingResourceHubKind = "writing";
      }
      if (route.view === "writingTask1SamplesHub") {
        pendingResourceHubKind = "writingSamplesTask1";
      }
      if (route.view === "writingTask2SamplesHub") {
        pendingResourceHubKind = "writingSamplesTask2";
      }
      if (route.view === "speakingHub") {
        pendingResourceHubKind = "speaking";
      }
      if (route.view === "contactHub") {
        pendingResourceHubKind = "contact";
      }
    }

    // Pathname-based hub routing — clean URL support (no hash present)
    if (!pendingResourceHubKind) {
      if (window.location.pathname === "/mock-tests/") pendingResourceHubKind = "fullExam";
      if (window.location.pathname === "/listening/") pendingResourceHubKind = "listening";
      if (window.location.pathname === "/reading/") pendingResourceHubKind = "reading";
      if (window.location.pathname === "/writing/") pendingResourceHubKind = "writing";
      if (window.location.pathname === "/speaking/") pendingResourceHubKind = "speaking";
    }

    const pendingPlacementStartupRoute = window.location.pathname === "/placement-test/";
    const pendingVocabularyStartupRoute = window.location.pathname === "/vocabulary/";
    const pendingRecentQuestionsStartupRoute = window.location.pathname === "/recent-questions/";
    const hasPendingHashStartupRoute = !!(route && route.view && route.view !== "home");
    const hasPendingHubStartupRoute = !!pendingResourceHubKind;
    const hasPendingStartupRoute = hasPendingHashStartupRoute || hasPendingHubStartupRoute || pendingPlacementStartupRoute || pendingVocabularyStartupRoute || pendingRecentQuestionsStartupRoute;

    // -----------------------------
    // Default to home
    // -----------------------------
    // Clean hub routes must win over the generic home startup path.
    // Otherwise `/mock-tests/` or `/listening/` briefly get rewritten to `/`
    // before the hub has a chance to render.
    if (!hasPendingStartupRoute) {
      UI().showOnly("home");
    }
    UI().updateHomeStatusLine();
    renderHomeResumeAction();

    // -----------------------------
    // Home buttons: START ALWAYS = NEW ATTEMPT
    // -----------------------------
    const startBtn = $("startIelts1Btn");
    const startBtn2 = $("cardStartIelts1Btn");
    const startBtnT2 = $("startIelts2Btn");
    const startBtnT2b = $("cardStartIelts2Btn");
    const startBtnT3 = $("startIelts3Btn");
    const startBtnT3b = $("cardStartIelts3Btn");
    const footerStartTest1Btn = $("footerStartTest1Btn");
    const homeStartFullMockBtn = $("homeStartFullMockBtn");
    const homeHeroFocusStartBtn = $("homeHeroFocusStartBtn");
    const homeOpenAssignmentsBtn = $("homeOpenAssignmentsBtn");
    const homeOpenHistoryQuickBtn = $("homeOpenHistoryQuickBtn");
    const openDashboardBtn = $("openDashboardBtn");
    const footerOpenContactBtn = $("footerOpenContactBtn");
    const homeAccountDropdown = $("homeAccountDropdown");
    const menuDashboardProfileBtn = $("menuDashboardProfileBtn");
    const menuDashboardSettingsBtn = $("menuDashboardSettingsBtn");
    const menuHistoryBtn = $("menuHistoryBtn");
    const menuSpeakingBtn = $("menuSpeakingBtn");
    const menuToggleAdminViewBtn = $("menuToggleAdminViewBtn");
    const adminResultsBtn = $("homeAdminResultsBtn");
    const adminResultsHomeBtn = $("adminResultsHomeBtn");
    const adminClassroomsToggleBtn = $("adminClassroomsToggleBtn");
    const adminPageResultsBtn = $("adminPageResultsBtn");
    const adminPageClassroomsBtn = $("adminPageClassroomsBtn");
    const adminPageAssignmentsBtn = $("adminPageAssignmentsBtn");
    const adminPageQuestionAnalyticsBtn = $("adminPageQuestionAnalyticsBtn");
    const adminClassroomsRefreshBtn = $("adminClassroomsRefreshBtn");
    const adminClassroomManagementPanel = $("adminClassroomManagementPanel");
    const adminCreateClassroomBtn = $("adminCreateClassroomBtn");
    const adminSaveStudentBtn = $("adminSaveStudentBtn");
    const adminMoveStudentClassroomBtn = $("adminMoveStudentClassroomBtn");
    const adminRemoveStudentClassroomBtn = $("adminRemoveStudentClassroomBtn");
    const adminResetStudentLinkBtn = $("adminResetStudentLinkBtn");
    const adminClassroomProgressRefreshBtn = $("adminClassroomProgressRefreshBtn");
    const adminStudentProgressCloseBtn = $("adminStudentProgressCloseBtn");
    const adminStudentSearchInput = $("adminStudentSearchInput");
    const adminClassroomSelect = $("adminClassroomSelect");
    const adminClassroomStudentSearchInput = $("adminClassroomStudentSearchInput");
    const adminClassCoverageTestFilter = $("adminClassCoverageTestFilter");
    const adminClassCoverageScopeFilter = $("adminClassCoverageScopeFilter");
    const qaSectionFilter = $("qaSectionFilter");
    const qaClassroomFilter = $("qaClassroomFilter");
    const qaTestFilter = $("qaTestFilter");
    const qaMinAttemptsFilter = $("qaMinAttemptsFilter");
    const qaDifficultyFilter = $("qaDifficultyFilter");
    const qaQuestionFilter = $("qaQuestionFilter");
    const adminQuestionAnalyticsRefreshBtn = $("adminQuestionAnalyticsRefreshBtn");
    const adminExistingAccountSearch = $("adminExistingAccountSearch");
    const adminResultsModeFullBtn = $("adminResultsModeFullBtn");
    const adminResultsModePracticeBtn = $("adminResultsModePracticeBtn");
    const navResultsBtn = $("navToResultsBtn");
    const adminRefreshBtn = $("adminResultsRefreshBtn");
    const adminExportBtn = $("adminResultsExportBtn");
    const homeExploreMenus = $("homeExploreMenus");
    const resourceHubBadge = $("resourceHubBadge");
    const resourceHubTitle = $("resourceHubTitle");
    const resourceHubSubtitle = $("resourceHubSubtitle");
    const resourceHubBackBtn = $("resourceHubBackBtn");
    const resourceHubAnchorbar = $("resourceHubAnchorbar");
    const resourceHubContent = $("resourceHubContent");
    function requireSignedIn(onOk, message) {
      if (window.IELTS?.Auth?.isSignedIn?.()) {
        if (typeof onOk === "function") onOk();
        return true;
      }
      window.IELTS?.Auth?.openLoginGate?.(message || "Please log in to continue.");
      return false;
    }

    // Student password gate (does NOT affect admin view)
    function requireTestPassword(onOk, testId) {
      if (isAdminView()) {
        onOk();
        return;
      }

      if (!requireSignedIn(null, "Please log in before starting a test.")) {
        return;
      }

      function showPasswordModal() {
        window.IELTS?.Modal?.showModal?.(
          "Enter password",
          "This test is password-protected. Please enter the password to start.",
          {
            mode: "password",
            submitText: "Start exam",
            showCancel: true,
            cancelText: "Back",
            onConfirm: () => {
              onOk();
            },
          }
        );
      }

      // If a testId is provided, check for assignment access first.
      // Students with an active published assignment bypass the password.
      const resolvedTestId = testId || safe(() => getActiveTestId()) || "";
      if (resolvedTestId && window.IELTS?.Assignments?.checkAssignmentAccess) {
        window.IELTS.Assignments.checkAssignmentAccess(resolvedTestId).then((result) => {
          if (result && result.completed) {
            window.IELTS?.Modal?.showModal?.(
              "Assignment completed",
              "You have already completed this assignment.",
              { mode: "confirm" }
            );
            return;
          }
          if (result && result.access) {
            onOk();
          } else {
            showPasswordModal();
          }
        }).catch(() => {
          showPasswordModal();
        });
        return;
      }

      showPasswordModal();
    }




    function resetEngineInitFlags() {
      try { window.__IELTS_LISTENING_INIT__ = false; } catch (e) {}
      try { window.__IELTS_READING_INIT__ = false; } catch (e) {}
      try { window.__IELTS_WRITING_INIT__ = false; } catch (e) {}
    }

    function closeAccountMenu() {
      if (homeAccountDropdown) homeAccountDropdown.classList.add("hidden");
      if (openDashboardBtn) openDashboardBtn.setAttribute("aria-expanded", "false");
    }

    function toggleAccountMenu() {
      if (!homeAccountDropdown || !openDashboardBtn) {
        window.IELTS?.Dashboard?.open?.();
        return;
      }
      const nextHidden = !homeAccountDropdown.classList.contains("hidden");
      homeAccountDropdown.classList.toggle("hidden", nextHidden);
      openDashboardBtn.setAttribute("aria-expanded", nextHidden ? "false" : "true");
    }

    function openHistoryFromMenu() {
      closeAccountMenu();
      if (!requireSignedIn(null, "Please log in to open your history.")) return;
      if (!confirmLeaveStudentExam(() => openHistoryFromMenu())) return;
      try {
        if (typeof window.IELTS?.History?.openHistory === "function") {
          window.IELTS.History.openHistory();
          return;
        }
      } catch (e) {}
      $("openHistoryBtn")?.click?.();
    }

    function openSpeakingFromMenu() {
      closeAccountMenu();
      if (!requireSignedIn(null, "Please log in to open speaking practice.")) return;
      if (!confirmLeaveStudentExam(() => openSpeakingFromMenu())) return;
      try {
        if (typeof window.IELTS?.Speaking?.initSpeakingExam === "function") {
          window.IELTS.Speaking.initSpeakingExam();
        }
        UI().showOnly("speaking");
        UI().setExamNavStatus("Status: Speaking practice");
        return;
      } catch (e) {}
      $("openSpeakingExamBtn")?.click?.();
    }

    const classroomAdminState = { classrooms: [], students: [], selectedStudentId: "", registryAccounts: [], loaded: false, loading: false };
    const classroomProgressState = { summary: null, classrooms: [], studentAttemptsByCode: new Map(), selectedStudentId: "", selectedClassroomId: "" };
    const classroomCoverageState = { tests: [], classrooms: [], students: [], selectedTestId: "", scope: "all", selectedClassroomId: "" };
    const QUESTION_ANALYTICS_SOLVED_STORAGE_KEY = "ielts:admin:questionAnalytics:solved";
    const questionAnalyticsState = { summary: null, rows: [], tests: [], loading: false, solvedByKey: {} };

    function getQuestionAnalyticsScopeKey() {
      const classroomFilterValue = String($("qaClassroomFilter")?.value || "");
      const selectedClassroomId = classroomFilterValue === "__all__"
        ? "__all__"
        : (classroomFilterValue || classroomProgressState.selectedClassroomId || "__selected__");
      return `class:${selectedClassroomId}`;
    }

    function buildQuestionAnalyticsRowSolvedKey(row) {
      if (!row || typeof row !== "object") return "";
      const testId = String(row.testId || "").toLowerCase();
      const section = String(row.section || "").toLowerCase();
      const questionNumber = String(row.questionNumber || "");
      return `${getQuestionAnalyticsScopeKey()}|${testId}|${section}|q${questionNumber}`;
    }

    function loadQuestionAnalyticsSolvedState() {
      try {
        const raw = localStorage.getItem(QUESTION_ANALYTICS_SOLVED_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        return {};
      }
    }

    function saveQuestionAnalyticsSolvedState(nextState) {
      try {
        localStorage.setItem(QUESTION_ANALYTICS_SOLVED_STORAGE_KEY, JSON.stringify(nextState || {}));
      } catch (e) {}
    }

    function setQuestionAnalyticsSolved(row, solved) {
      const key = buildQuestionAnalyticsRowSolvedKey(row);
      if (!key) return;
      const next = {
        ...(questionAnalyticsState.solvedByKey && typeof questionAnalyticsState.solvedByKey === "object"
          ? questionAnalyticsState.solvedByKey
          : {}),
      };
      if (solved) next[key] = true;
      else delete next[key];
      questionAnalyticsState.solvedByKey = next;
      saveQuestionAnalyticsSolvedState(next);
    }

    function setClassroomStatus(message, tone = "") {
      const el = $("adminClassroomsStatus");
      if (!el) return;
      el.textContent = message || "";
      el.style.color = tone === "error" ? "#991b1b" : tone === "success" ? "#166534" : "";
    }

    function fillClassroomSelect() {
      const select = $("adminStudentClassroomSelect");
      if (!select) return;
      const current = select.value;
      select.innerHTML = `<option value="">No classroom</option>` + classroomAdminState.classrooms
        .map((room) => `<option value="${String(room.id || "").replace(/"/g, "&quot;")}">${String(room.name || "Classroom")}</option>`)
        .join("");
      if (current) select.value = current;
    }

    function renderExistingAccountMatches() {
      const wrap = $("adminExistingAccountResultsWrap");
      const tbody = $("adminExistingAccountResults");
      const query = String($("adminExistingAccountSearch")?.value || "").trim().toLowerCase();
      if (!wrap || !tbody) return;
      if (!query) {
        wrap.classList.add("hidden");
        tbody.innerHTML = "";
        return;
      }
      const rows = classroomAdminState.registryAccounts
        .filter((account) => {
          const hay = [account.fullName, account.email]
            .map((value) => String(value || "").toLowerCase())
            .join(" ");
          return hay.includes(query);
        })
        .slice(0, 8);
      wrap.classList.toggle("hidden", rows.length === 0);
      tbody.innerHTML = rows.map((account) => `
        <tr>
          <td>
            <button class="btn secondary" type="button" data-admin-pick-account="${escapeHtml(account.email || "")}">
              ${escapeHtml(account.fullName || "Unknown student")} · ${escapeHtml(account.email || "")}
            </button>
          </td>
        </tr>
      `).join("");
      Array.from(tbody.querySelectorAll("[data-admin-pick-account]")).forEach((button) => {
        button.addEventListener("click", async () => {
          const email = button.getAttribute("data-admin-pick-account") || "";
          if (!email) return;
          $("adminStudentLinkedEmailInput").value = email;
          $("adminExistingAccountSearch").value = "";
          renderExistingAccountMatches();
          if (String($("adminStudentIdInput")?.value || "").trim()) {
            await saveStudentFromAdmin();
            setClassroomStatus(`Linked ${email} to this student profile.`, "success");
          } else {
            setClassroomStatus(`Filled linked login email with ${email}. Save the student to confirm.`, "success");
          }
        });
      });
    }

    function renderClassroomStudents() {
      const tbody = $("adminStudentsTbody");
      if (!tbody) return;
      const query = String($("adminStudentSearchInput")?.value || "").trim().toLowerCase();
      const rows = classroomAdminState.students.filter((student) => {
        const hay = [student.studentIdCode, student.fullName, student.classroomName, student.officialEmail, student.linkedAuthEmail]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");
        return !query || hay.includes(query);
      });
      tbody.innerHTML = rows.map((student) => `
        <tr class="ui-data-row">
          <td>${escapeHtml(student.studentIdCode || "—")}</td>
          <td>${escapeHtml(student.fullName || "—")}</td>
          <td>${escapeHtml(student.classroomName || "—")}</td>
          <td>${escapeHtml(student.linkedAuthEmail || "—")}</td>
          <td>${escapeHtml(student.officialEmail || "—")}</td>
          <td>${student.linkedAuthIdentity || student.linkedAuthUserId ? "Linked" : "Unlinked"}</td>
          <td><button class="btn secondary ui-row-action" type="button" data-admin-edit-student="${escapeHtml(student.studentIdCode || "")}">Edit</button></td>
        </tr>
      `).join("") || `<tr class="ui-table-state-row"><td colspan="7">No students found.</td></tr>`;
      Array.from(tbody.querySelectorAll("[data-admin-edit-student]")).forEach((button) => {
        button.addEventListener("click", () => {
          const code = button.getAttribute("data-admin-edit-student") || "";
          const student = classroomAdminState.students.find((item) => item.studentIdCode === code);
          if (!student) return;
          classroomAdminState.selectedStudentId = student.studentIdCode || "";
          $("adminStudentIdInput").value = student.studentIdCode || "";
          $("adminStudentNameInput").value = student.name || "";
          $("adminStudentSurnameInput").value = student.surname || "";
          $("adminStudentLinkedEmailInput").value = student.linkedAuthEmail || "";
          $("adminStudentOfficialEmailInput").value = student.officialEmail || "";
          $("adminStudentClassroomSelect").value = student.classroomId || "";
          setClassroomStatus(`Editing ${student.fullName || student.studentIdCode}.`);
        });
      });
    }

    async function loadClassroomAdminData(forceRefresh = false) {
      if (!isAdminView()) return;
      if (classroomAdminState.loading) return;
      if (classroomAdminState.loaded && !forceRefresh) return;
      classroomAdminState.loading = true;
      setClassroomStatus("Loading classroom data...");
      const studentsUrl = R()?.buildAdminApiUrl?.({ action: "classroomStudents" });
      const registryUrl = R()?.buildAdminApiUrl?.({ action: "studentRegistry" });
      if (!studentsUrl) {
        classroomAdminState.loading = false;
        return;
      }
      const authHeaders = await getAuthHeaders();
      const [res, registryRes] = await Promise.all([
        fetch(studentsUrl.toString(), { headers: authHeaders }).catch(() => null),
        registryUrl ? fetch(registryUrl.toString(), { headers: authHeaders }).catch(() => null) : Promise.resolve(null),
      ]);
      const data = res ? await res.json().catch(() => null) : null;
      const registryData = registryRes ? await registryRes.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomStatus(data?.error || "Could not load classrooms.", "error");
        classroomAdminState.loading = false;
        return;
      }
      classroomAdminState.classrooms = Array.isArray(data.classrooms) ? data.classrooms : [];
      classroomAdminState.students = Array.isArray(data.students) ? data.students : [];
      classroomAdminState.registryAccounts = Array.isArray(registryData?.students)
        ? registryData.students
            .map((item) => ({
              email: String(item?.email || "").trim().toLowerCase(),
              fullName: String(item?.fullName || "").trim(),
            }))
            .filter((item) => item.email)
        : [];
      fillClassroomSelect();
      renderClassroomStudents();
      renderExistingAccountMatches();
      classroomAdminState.loaded = true;
      classroomAdminState.loading = false;
      setClassroomStatus(`Loaded ${classroomAdminState.classrooms.length} classrooms and ${classroomAdminState.students.length} students.`, "success");
    }

    async function createClassroomFromAdmin() {
      const url = R()?.buildAdminApiUrl?.({ action: "saveClassroom" });
      if (!url) return;
      const payload = {
        name: $("adminClassroomNameInput")?.value || "",
        teacherName: $("adminClassroomTeacherNameInput")?.value || "",
        teacherEmail: $("adminClassroomTeacherEmailInput")?.value || "",
      };
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify(payload),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomStatus(data?.error || "Could not create classroom.", "error");
        return;
      }
      $("adminClassroomNameInput").value = "";
      $("adminClassroomTeacherNameInput").value = "";
      $("adminClassroomTeacherEmailInput").value = "";
      await loadClassroomAdminData(true);
    }

    async function saveStudentFromAdmin() {
      const url = R()?.buildAdminApiUrl?.({ action: "saveStudentProfile" });
      if (!url) return;
      const payload = {
        studentIdCode: $("adminStudentIdInput")?.value || "",
        name: $("adminStudentNameInput")?.value || "",
        surname: $("adminStudentSurnameInput")?.value || "",
        linkedAuthEmail: $("adminStudentLinkedEmailInput")?.value || "",
        officialEmail: $("adminStudentOfficialEmailInput")?.value || "",
        classroomId: $("adminStudentClassroomSelect")?.value || "",
      };
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify(payload),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomStatus(data?.error || "Could not save student.", "error");
        return;
      }
      setClassroomStatus("Student saved.", "success");
      await loadClassroomAdminData(true);
    }

    async function moveSelectedStudentToClassroom() {
      const classroomId = String($("adminStudentClassroomSelect")?.value || "").trim();
      if (!classroomId) {
        setClassroomStatus("Choose a destination classroom first.", "error");
        return;
      }
      const studentIdCode = String($("adminStudentIdInput")?.value || "").trim();
      if (!studentIdCode) {
        setClassroomStatus("Select a student first.", "error");
        return;
      }
      await saveStudentFromAdmin();
      const classroomName = classroomAdminState.classrooms.find((row) => String(row.id || "") === classroomId)?.name || "the selected classroom";
      setClassroomStatus(`Student moved to ${classroomName}.`, "success");
    }

    async function removeSelectedStudentFromClassroom() {
      const studentIdCode = String($("adminStudentIdInput")?.value || "").trim();
      const studentName = String($("adminStudentNameInput")?.value || "").trim();
      if (!studentIdCode || !studentName) {
        setClassroomStatus("Select a student first.", "error");
        return;
      }
      if (!String($("adminStudentClassroomSelect")?.value || "").trim()) {
        setClassroomStatus("This student is already not assigned to a classroom.");
        return;
      }
      $("adminStudentClassroomSelect").value = "";
      await saveStudentFromAdmin();
      setClassroomStatus("Student removed from classroom.", "success");
    }

    async function assignStudentCodeFromAdminResult(row, submissionRecord = null, studentIdCode = "") {
      const url = R()?.buildAdminApiUrl?.({ action: "assignStudentCodeFromResult" });
      if (!url) throw new Error("Admin endpoint is not available.");
      const payload = {
        studentIdCode: String(studentIdCode || "").trim(),
        submittedAt: row?.submittedAt || "",
        studentFullName: row?.studentFullName || "",
        examId: row?.examId || "",
        reason: row?.reason || "",
        studentEmail: submissionRecord?.email || row?.studentEmail || "",
        signInMethod: submissionRecord?.provider || row?.signInMethod || "",
        officialEmail: row?.officialEmail || submissionRecord?.email || row?.studentEmail || "",
      };
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify(payload),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true || !data.student) {
        throw new Error(data?.error || "Could not assign a sign-in code.");
      }
      return data.student;
    }

    async function resetSelectedStudentLink() {
      const studentIdCode = String($("adminStudentIdInput")?.value || classroomAdminState.selectedStudentId || "").trim();
      if (!studentIdCode) {
        setClassroomStatus("Select or enter a Student ID first.", "error");
        return;
      }
      const url = R()?.buildAdminApiUrl?.({ action: "resetStudentProfileLink" });
      if (!url) return;
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ studentIdCode }),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomStatus(data?.error || "Could not reset link.", "error");
        return;
      }
      setClassroomStatus("Linked account reset. History was not deleted.", "success");
      await loadClassroomAdminData(true);
    }

    function setClassroomProgressStatus(message, tone = "") {
      const el = $("adminClassroomProgressStatus");
      if (!el) return;
      el.textContent = message || "";
      el.style.color = tone === "error" ? "#991b1b" : tone === "success" ? "#166534" : "";
    }

    function setClassroomProgressSummary(summary) {
      const safe = summary || {};
      if ($("adminClassProgressClassrooms")) $("adminClassProgressClassrooms").textContent = String(safe.classroomCount || 0);
      if ($("adminClassProgressStudents")) $("adminClassProgressStudents").textContent = String(safe.studentCount || 0);
      if ($("adminClassProgressActiveStudents")) $("adminClassProgressActiveStudents").textContent = String(safe.activeStudentCount || 0);
      if ($("adminClassProgressAttempts")) $("adminClassProgressAttempts").textContent = String(safe.attemptCount || 0);
      if ($("adminClassProgressOverall")) $("adminClassProgressOverall").textContent = safe.avgOverallBand === null || safe.avgOverallBand === undefined ? "0.0" : Number(safe.avgOverallBand).toFixed(1);
      if ($("adminClassProgressLatest")) $("adminClassProgressLatest").textContent = fmtDate(safe.latestSubmittedAt);
    }

    function setClassCoverageStatus(message, tone = "") {
      const el = $("adminClassCoverageStatus");
      if (!el) return;
      el.textContent = message || "";
      el.style.color = tone === "error" ? "#991b1b" : tone === "success" ? "#166534" : "";
    }

    function populateCoverageFilters() {
      const selectedClassroomId = String(classroomProgressState.selectedClassroomId || classroomCoverageState.selectedClassroomId || "");
      const selectedRoom = (classroomCoverageState.classrooms || []).find(
        (room) => String(room?.id || "") === selectedClassroomId
      ) || null;
      const takenTestsForSelectedClass = selectedRoom
        ? (classroomCoverageState.tests || []).filter((testId) => {
            const stats = selectedRoom?.coverageByTest?.[testId] || {};
            const fullAttempted = Number(stats.fullAttemptedStudents || 0);
            const practiceAttempted = Number(stats.practiceAttemptedStudents || 0);
            return (fullAttempted + practiceAttempted) > 0;
          })
        : [];

      if (adminClassCoverageTestFilter) {
        const current = String(classroomCoverageState.selectedTestId || "");
        adminClassCoverageTestFilter.innerHTML = `<option value="">Select taken test</option>` +
          takenTestsForSelectedClass
            .map((testId) => `<option value="${escapeHtml(testId)}">${escapeHtml(String(testId || "").toUpperCase())}</option>`)
            .join("");
        if (current && takenTestsForSelectedClass.includes(current)) {
          adminClassCoverageTestFilter.value = current;
        } else if (takenTestsForSelectedClass[0]) {
          classroomCoverageState.selectedTestId = String(takenTestsForSelectedClass[0]);
          adminClassCoverageTestFilter.value = classroomCoverageState.selectedTestId;
        } else {
          classroomCoverageState.selectedTestId = "";
          adminClassCoverageTestFilter.value = "";
        }
      }
      if (adminClassCoverageScopeFilter) {
        adminClassCoverageScopeFilter.value = classroomCoverageState.scope === "untaken" ? "untaken" : "all";
      }
    }

    function renderClassCoverageSummaryTable() {
      const tbody = $("adminClassCoverageSummaryTbody");
      if (!tbody) return;
      const selectedTestId = String(classroomCoverageState.selectedTestId || "");
      const selectedClassroomId = String(classroomProgressState.selectedClassroomId || classroomCoverageState.selectedClassroomId || "");
      const rows = [];
      (classroomCoverageState.classrooms || []).forEach((room) => {
        if (selectedClassroomId && String(room?.id || "") !== selectedClassroomId) return;
        const testIds = selectedTestId ? [selectedTestId] : (classroomCoverageState.tests || []);
        testIds.forEach((testId) => {
          if (!testId) return;
          const stats = room?.coverageByTest?.[testId] || {
            fullAttemptedStudents: 0,
            fullSubmittedStudents: 0,
            practiceAttemptedStudents: 0,
            practiceSubmittedStudents: 0,
          };
          const fullAttempted = Number(stats.fullAttemptedStudents || 0);
          const fullSubmitted = Number(stats.fullSubmittedStudents || 0);
          const practiceAttempted = Number(stats.practiceAttemptedStudents || 0);
          const practiceSubmitted = Number(stats.practiceSubmittedStudents || 0);
          const totalAttempted = fullAttempted + practiceAttempted;
          if (totalAttempted <= 0) return;
          const studentCount = Number(room?.studentCount || 0);
          const untaken = Math.max(0, studentCount - Math.max(fullAttempted, practiceAttempted));
          rows.push({
            classroomName: room?.name || "Classroom",
            testId,
            attemptedText: `F:${fullAttempted} / P:${practiceAttempted}`,
            submittedText: `F:${fullSubmitted} / P:${practiceSubmitted}`,
            untaken,
          });
        });
      });

      tbody.innerHTML = rows.map((row) => `
        <tr class="ui-data-row">
          <td>${escapeHtml(row.classroomName)}</td>
          <td>${escapeHtml(String(row.testId || "").toUpperCase())}</td>
          <td>${escapeHtml(row.attemptedText)}</td>
          <td>${escapeHtml(row.submittedText)}</td>
          <td>${escapeHtml(String(row.untaken))}</td>
        </tr>
      `).join("") || `<tr class="ui-table-state-row"><td colspan="5">No coverage data available yet.</td></tr>`;
    }

    function renderStudentCoverageTable() {
      const tbody = $("adminClassCoverageStudentTbody");
      if (!tbody) return;
      const selectedTestId = String(classroomCoverageState.selectedTestId || "");
      const scope = classroomCoverageState.scope === "untaken" ? "untaken" : "all";
      const selectedClassroomId = String(classroomProgressState.selectedClassroomId || classroomCoverageState.selectedClassroomId || "");

      if (!selectedTestId) {
        tbody.innerHTML = `<tr class="ui-table-state-row"><td colspan="5">Select a taken test to see students.</td></tr>`;
        return;
      }

      const rows = [];
      (classroomCoverageState.students || []).forEach((student) => {
        if (selectedClassroomId && String(student?.classroomId || "") !== selectedClassroomId) return;
        const tests = [selectedTestId];
        tests.forEach((testId) => {
          const status = student?.tests?.[testId] || null;
          const fullAttempted = !!status?.fullAttempted;
          const practiceAttempted = !!status?.practiceAttempted;
          const attempted = fullAttempted || practiceAttempted;
          if (!attempted) return;
          if (scope === "untaken" && attempted) return;
          const fullSubmitted = !!status?.fullSubmitted;
          const practiceSubmitted = !!status?.practiceSubmitted;
          const modeLabel = fullAttempted && practiceAttempted
            ? "Full + Practice"
            : (fullAttempted ? "Full mock" : (practiceAttempted ? "Practice" : "—"));
          const statusLabel = (fullSubmitted || practiceSubmitted) ? "Submitted" : "Attempted";
          const submittedAt = status?.fullLastSubmittedAt || status?.practiceLastSubmittedAt || "";
          rows.push({
            studentIdCode: student?.studentIdCode || "—",
            name: student?.name || "Student",
            modeLabel,
            statusLabel,
            submittedAt,
          });
        });
      });

      tbody.innerHTML = rows.map((row) => `
        <tr class="ui-data-row">
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.studentIdCode)}</td>
          <td>${escapeHtml(row.modeLabel)}</td>
          <td>${escapeHtml(row.statusLabel)}</td>
          <td>${escapeHtml(fmtDate(row.submittedAt))}</td>
        </tr>
      `).join("") || `<tr class="ui-table-state-row"><td colspan="5">No students from this class have taken the selected test yet.</td></tr>`;
    }

    function renderClassroomCoverageWorkspace() {
      classroomCoverageState.selectedClassroomId = String(classroomProgressState.selectedClassroomId || classroomCoverageState.selectedClassroomId || "");
      populateCoverageFilters();
      renderClassCoverageSummaryTable();
      renderStudentCoverageTable();
    }

    function renderClassroomDirectory() {
      const wrap = $("adminClassroomDirectory");
      if (!wrap) return;
      const classrooms = Array.isArray(classroomProgressState.classrooms) ? classroomProgressState.classrooms : [];
      if (!classrooms.length) {
        wrap.innerHTML = `<div class="small">No classrooms available yet.</div>`;
        return;
      }
      wrap.innerHTML = classrooms.map((room) => {
        const selected = String(room?.id || "") === String(classroomProgressState.selectedClassroomId || "");
        return `
          <button class="admin-classroom-directory-item${selected ? " is-active" : ""}" type="button" data-classroom-pick="${escapeHtml(room?.id || "")}">
            <span class="admin-classroom-directory-name">${escapeHtml(room?.name || "Classroom")}</span>
            <span class="admin-classroom-directory-meta">${escapeHtml(String(room?.studentCount || 0))} students · ${escapeHtml(String(room?.attemptCount || 0))} attempts</span>
          </button>
        `;
      }).join("");
      Array.from(wrap.querySelectorAll("[data-classroom-pick]")).forEach((button) => {
        button.addEventListener("click", () => {
          classroomProgressState.selectedClassroomId = String(button.getAttribute("data-classroom-pick") || "");
          if (adminClassroomSelect) adminClassroomSelect.value = classroomProgressState.selectedClassroomId;
          renderSelectedClassroomWorkspace();
        });
      });
    }

    function renderClassroomOverviewChart(series) {
      const wrap = $("adminClassroomOverviewChart");
      const empty = $("adminClassroomOverviewEmpty");
      if (!wrap || !empty) return;
      const rows = Array.isArray(series)
        ? series.filter((entry) => Number(entry?.attemptCount || 0) > 0)
        : [];
      empty.classList.toggle("hidden", rows.length > 0);
      if (!rows.length) {
        wrap.innerHTML = "";
        return;
      }
      const maxAttempts = rows.reduce((max, entry) => Math.max(max, Number(entry?.attemptCount || 0)), 1);
      wrap.innerHTML = rows.map((entry) => {
        const width = Math.max(8, Math.min(100, (Number(entry?.attemptCount || 0) / maxAttempts) * 100));
        const meta = `${Number(entry?.attemptCount || 0)} attempts · Avg ${bandText(entry?.avgOverallBand)} · ${Number(entry?.activeStudentCount || 0)} active`;
        return `
          <div class="admin-classroom-chart-row">
            <div class="admin-classroom-chart-label">${escapeHtml(entry?.label || entry?.monthKey || "Month")}</div>
            <div class="admin-classroom-chart-track"><span class="admin-classroom-chart-fill" style="width:${width.toFixed(2)}%"></span></div>
            <div class="admin-classroom-chart-meta">${escapeHtml(meta)}</div>
          </div>
        `;
      }).join("");
    }

    function renderSelectedClassroomStudents(classroom) {
      const tbody = $("adminClassroomStudentsTbody");
      if (!tbody) return;
      const query = String(adminClassroomStudentSearchInput?.value || "").trim().toLowerCase();
      const rows = Array.isArray(classroom?.students) ? classroom.students : [];
      const filtered = rows.filter((student) => {
        const hay = [student?.studentIdCode, student?.fullName]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");
        return !query || hay.includes(query);
      });
      tbody.innerHTML = filtered.map((student) => `
        <tr class="${String(student?.studentIdCode || "") === String(classroomProgressState.selectedStudentId || "") ? "is-selected" : ""}">
          <td>${escapeHtml(student?.studentIdCode || "—")}</td>
          <td>${escapeHtml(student?.fullName || "Student")}</td>
          <td>${escapeHtml(String(student?.attemptCount || 0))}</td>
          <td>${escapeHtml(String(student?.fullAttemptCount || 0))}</td>
          <td>${escapeHtml(String(student?.practiceAttemptCount || 0))}</td>
          <td>${escapeHtml(student?.avgOverallBand === null || student?.avgOverallBand === undefined ? "—" : `Band ${bandText(student?.avgOverallBand)}`)}</td>
          <td>${escapeHtml(fmtDate(student?.latestSubmittedAt))}</td>
          <td><button class="btn secondary ui-row-action" type="button" data-classroom-student="${escapeHtml(student?.studentIdCode || "")}">Open</button></td>
        </tr>
      `).join("") || `<tr class="ui-table-state-row"><td colspan="8">No students matched this class view yet.</td></tr>`;
      Array.from(tbody.querySelectorAll("[data-classroom-student]")).forEach((button) => {
        button.addEventListener("click", () => {
          const studentIdCode = button.getAttribute("data-classroom-student") || "";
          if (studentIdCode) openStudentProgressFromClassroom(studentIdCode).catch((e) => setClassroomProgressStatus(e?.message || "Could not load student progress.", "error"));
        });
      });
    }

    function renderSelectedClassroomWorkspace() {
      const classrooms = Array.isArray(classroomProgressState.classrooms) ? classroomProgressState.classrooms : [];
      if (adminClassroomSelect) {
        const current = String(classroomProgressState.selectedClassroomId || "");
        adminClassroomSelect.innerHTML = `<option value="">Select a classroom</option>` + classrooms
          .map((room) => `<option value="${escapeHtml(room?.id || "")}">${escapeHtml(room?.name || "Classroom")}</option>`)
          .join("");
        if (current && classrooms.some((room) => String(room?.id || "") === current)) {
          adminClassroomSelect.value = current;
        } else if (!current && classrooms[0]?.id) {
          classroomProgressState.selectedClassroomId = String(classrooms[0].id);
          adminClassroomSelect.value = classroomProgressState.selectedClassroomId;
        }
      }
      const selected = classrooms.find((room) => String(room?.id || "") === String(classroomProgressState.selectedClassroomId || ""))
        || classrooms[0]
        || null;
      classroomProgressState.selectedClassroomId = String(selected?.id || "");
      renderClassroomDirectory();
      if ($("adminSelectedClassroomTitle")) $("adminSelectedClassroomTitle").textContent = plainText(selected?.name, "Choose a class");
      if ($("adminSelectedClassroomMeta")) $("adminSelectedClassroomMeta").textContent = selected
        ? `${plainText(selected?.teacherName, "Teacher not set")} · ${plainText(selected?.teacherEmail, "No teacher email")} · Latest activity: ${fmtDate(selected?.latestSubmittedAt)}`
        : "You’ll see monthly movement, active students, and each student’s attempt history in one place.";
      if ($("adminClassroomTeacherMeta")) $("adminClassroomTeacherMeta").value = selected ? `${plainText(selected?.teacherName, "Teacher not set")} · ${plainText(selected?.teacherEmail, "No teacher email")}` : "";
      if ($("adminSelectedClassroomStudents")) $("adminSelectedClassroomStudents").textContent = String(selected?.studentCount || 0);
      if ($("adminSelectedClassroomActiveStudents")) $("adminSelectedClassroomActiveStudents").textContent = String(selected?.activeStudentCount || 0);
      if ($("adminSelectedClassroomAttempts")) $("adminSelectedClassroomAttempts").textContent = String(selected?.attemptCount || 0);
      if ($("adminSelectedClassroomOverall")) $("adminSelectedClassroomOverall").textContent = selected?.avgOverallBand === null || selected?.avgOverallBand === undefined ? "0.0" : Number(selected.avgOverallBand).toFixed(1);
      if ($("adminSelectedClassroomCurrentMonth")) $("adminSelectedClassroomCurrentMonth").textContent = String(selected?.currentMonth?.attemptCount || 0);
      if ($("adminSelectedClassroomPreviousMonth")) $("adminSelectedClassroomPreviousMonth").textContent = String(selected?.previousMonth?.attemptCount || 0);
      if ($("adminSelectedClassroomCurrentMonthLabel")) $("adminSelectedClassroomCurrentMonthLabel").textContent = selected?.currentMonth?.label || "This month";
      if ($("adminSelectedClassroomPreviousMonthLabel")) $("adminSelectedClassroomPreviousMonthLabel").textContent = selected?.previousMonth?.label || "Previous month";
      if ($("adminSelectedClassroomCurrentMonthAttempts")) $("adminSelectedClassroomCurrentMonthAttempts").textContent = `${Number(selected?.currentMonth?.attemptCount || 0)} attempts`;
      if ($("adminSelectedClassroomCurrentMonthOverall")) $("adminSelectedClassroomCurrentMonthOverall").textContent = `Avg overall: ${selected?.currentMonth?.avgOverallBand === null || selected?.currentMonth?.avgOverallBand === undefined ? "0.0" : Number(selected.currentMonth.avgOverallBand).toFixed(1)}`;
      if ($("adminSelectedClassroomCurrentMonthActive")) $("adminSelectedClassroomCurrentMonthActive").textContent = `Active students: ${Number(selected?.currentMonth?.activeStudentCount || 0)}`;
      if ($("adminSelectedClassroomPreviousMonthAttempts")) $("adminSelectedClassroomPreviousMonthAttempts").textContent = `${Number(selected?.previousMonth?.attemptCount || 0)} attempts`;
      if ($("adminSelectedClassroomPreviousMonthOverall")) $("adminSelectedClassroomPreviousMonthOverall").textContent = `Avg overall: ${selected?.previousMonth?.avgOverallBand === null || selected?.previousMonth?.avgOverallBand === undefined ? "0.0" : Number(selected.previousMonth.avgOverallBand).toFixed(1)}`;
      if ($("adminSelectedClassroomPreviousMonthActive")) $("adminSelectedClassroomPreviousMonthActive").textContent = `Active students: ${Number(selected?.previousMonth?.activeStudentCount || 0)}`;
      renderClassroomOverviewChart(selected?.monthlySeries || []);
      renderSelectedClassroomStudents(selected);
      renderClassroomCoverageWorkspace();
    }

    function renderStudentProgressDetail(data) {
      const panel = $("adminStudentProgressDetail");
      const tbody = $("adminStudentProgressAttemptsTbody");
      if (!panel || !tbody) return;
      const student = data?.student || {};
      const classroom = data?.classroom || {};
      const attempts = Array.isArray(data?.attempts) ? data.attempts : [];
      classroomProgressState.selectedStudentId = String(student?.studentIdCode || "");
      classroomProgressState.studentAttemptsByCode.set(classroomProgressState.selectedStudentId, attempts);
      if ($("adminStudentProgressTitle")) $("adminStudentProgressTitle").textContent = `${plainText(student?.fullName, "Student")} progress`;
      if ($("adminStudentProgressAttempts")) $("adminStudentProgressAttempts").textContent = String(student?.attemptCount || attempts.length || 0);
      if ($("adminStudentProgressFullAttempts")) $("adminStudentProgressFullAttempts").textContent = String(student?.fullAttemptCount || 0);
      if ($("adminStudentProgressPracticeAttempts")) $("adminStudentProgressPracticeAttempts").textContent = String(student?.practiceAttemptCount || 0);
      if ($("adminStudentProgressOverall")) $("adminStudentProgressOverall").textContent = student?.avgOverallBand === null || student?.avgOverallBand === undefined ? "0.0" : Number(student.avgOverallBand).toFixed(1);
      if ($("adminStudentProgressLatest")) $("adminStudentProgressLatest").textContent = fmtDate(student?.latestSubmittedAt);
      if ($("adminStudentProgressClassroom")) $("adminStudentProgressClassroom").textContent = plainText(classroom?.name || student?.classroomName, "—");
      tbody.innerHTML = attempts.map((row, index) => `
        <tr class="ui-data-row">
          <td>${escapeHtml(fmtDate(row?.submittedAt))}</td>
          <td>${escapeHtml(row?.source === "practice" ? (row?.practiceLabel || row?.examId || "Practice") : (row?.examId || "Mock test"))}</td>
          <td>${escapeHtml(scoreText(row?.listeningTotal, row?.listeningBand, row?.listeningTotalQuestions || 40))}</td>
          <td>${escapeHtml(scoreText(row?.readingTotal, row?.readingBand, row?.readingTotalQuestions || 40))}</td>
          <td>${escapeHtml(row?.finalWritingBand === null || row?.finalWritingBand === undefined ? "—" : `Band ${bandText(row?.finalWritingBand)}`)}</td>
          <td>${escapeHtml(row?.speakingBand === null || row?.speakingBand === undefined ? "—" : `Band ${bandText(row?.speakingBand)}`)}</td>
          <td>${escapeHtml(row?.overallBand === null || row?.overallBand === undefined ? "—" : `Band ${bandText(effectiveOverallBand(row))}`)}</td>
          <td><button class="btn secondary ui-row-action" type="button" data-student-attempt-index="${index}">View</button></td>
        </tr>
      `).join("") || `<tr class="ui-table-state-row"><td colspan="8">No attempts matched to this student yet.</td></tr>`;
      Array.from(tbody.querySelectorAll("[data-student-attempt-index]")).forEach((button) => {
        button.addEventListener("click", () => {
          const idx = Number(button.getAttribute("data-student-attempt-index"));
          const row = attempts[idx];
          if (row) openAdminDetailForRow(row);
        });
      });
      panel.classList.remove("hidden");
      try {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {}
    }

    async function loadClassroomProgressData(forceRefresh = false) {
      if (!isAdminView()) return;
      setClassroomProgressStatus("Loading class progress...");
      const url = R()?.buildAdminApiUrl?.({ action: "classroomProgress", refresh: forceRefresh ? "1" : "" });
      if (!url) return;
      const res = await fetch(url.toString(), { headers: await getAuthHeaders() }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomProgressStatus(data?.error || "Could not load class progress.", "error");
        return;
      }
      classroomProgressState.summary = data.summary || null;
      classroomProgressState.classrooms = Array.isArray(data.classrooms) ? data.classrooms : [];
      if (!classroomProgressState.selectedClassroomId || !classroomProgressState.classrooms.some((room) => String(room?.id || "") === String(classroomProgressState.selectedClassroomId || ""))) {
        classroomProgressState.selectedClassroomId = String(classroomProgressState.classrooms[0]?.id || "");
      }
      setClassroomProgressSummary(classroomProgressState.summary || {});
      renderSelectedClassroomWorkspace();
      setClassroomProgressStatus(`Loaded progress for ${Number(classroomProgressState.classrooms.length || 0)} classrooms.`, "success");
    }

    async function loadClassroomCoverageData(forceRefresh = false) {
      if (!isAdminView()) return;
      setClassCoverageStatus("Loading class exam coverage...");
      const url = R()?.buildAdminApiUrl?.({ action: "classroomCoverage", refresh: forceRefresh ? "1" : "" });
      if (!url) return;
      const res = await fetch(url.toString(), { headers: await getAuthHeaders() }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassCoverageStatus(data?.error || "Could not load class exam coverage.", "error");
        return;
      }
      classroomCoverageState.tests = Array.isArray(data.tests) ? data.tests : [];
      classroomCoverageState.classrooms = Array.isArray(data.classrooms) ? data.classrooms : [];
      classroomCoverageState.students = Array.isArray(data.students) ? data.students : [];
      renderClassroomCoverageWorkspace();
      setClassCoverageStatus(`Coverage loaded for ${classroomCoverageState.classrooms.length} classrooms across ${classroomCoverageState.tests.length} tests.`, "success");
    }

    async function openStudentProgressFromClassroom(studentIdCode) {
      const url = R()?.buildAdminApiUrl?.({ action: "classroomStudentProgress", studentIdCode, t: Date.now() });
      if (!url) return;
      setClassroomProgressStatus(`Loading ${studentIdCode}...`);
      const res = await fetch(url.toString(), { headers: await getAuthHeaders() }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomProgressStatus(data?.error || "Could not load student progress.", "error");
        return;
      }
      renderStudentProgressDetail(data);
      setClassroomProgressStatus(`Loaded progress for ${data?.student?.fullName || studentIdCode}.`, "success");
    }

    async function backfillStudentHistoryFromAdmin() {
      const url = R()?.buildAdminApiUrl?.({ action: "backfillStudentHistory" });
      if (!url) return;
      setClassroomProgressStatus("Matching previous attempts to student IDs...");
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({}),
      }).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!res || !res.ok || !data || data.ok !== true) {
        setClassroomProgressStatus(data?.error || "Could not assign previous attempts.", "error");
        return;
      }
      const report = data.report || {};
      setClassroomProgressStatus(`Assigned ${Number(report.attachedEmailCount || 0)} historical email trail(s). ${Number(report.unmatchedCount || 0)} still need manual review.`, "success");
      await Promise.all([
        loadClassroomAdminData(),
        loadClassroomProgressData(true),
      ]);
    }

    function syncAdminToggleMenu() {
      if (!menuToggleAdminViewBtn) return;
      const canToggle = window.IELTS?.Access?.canUseAdminToggle?.() === true;
      const activeMode = window.IELTS?.Access?.getActiveMode?.() || "student";
      menuToggleAdminViewBtn.classList.toggle("hidden", !canToggle);
      menuToggleAdminViewBtn.textContent = activeMode === "admin" ? "Switch to student view" : "Switch to admin view";
    }

    function toggleAdminViewFromMenu() {
      closeAccountMenu();
      if (!window.IELTS?.Auth?.isSignedIn?.()) {
        window.IELTS?.Auth?.openLoginGate?.("Please log in first.");
        return;
      }
      window.IELTS?.Access?.toggleAdminMode?.();
    }

    // stop any playing audio used by exam flows (listening / speaking)
    function stopAllAudio() {
      try { const la = document.getElementById('listeningAudio'); if (la && !la.paused) { la.pause(); la.currentTime = 0; } } catch (e) {}
      try { const sp = document.getElementById('speakingPlayback'); if (sp && !sp.paused) { sp.pause(); sp.currentTime = 0; } } catch (e) {}
      try { const remote = document.getElementById('remoteAudio'); if (remote && !remote.paused) { remote.pause(); remote.currentTime = 0; } } catch (e) {}
    }

    function clearScopedLaunchData(scope) {
      if (!scope) return;
      try {
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(scope)) toRemove.push(key);
        }
        toRemove.forEach((key) => localStorage.removeItem(key));
      } catch (e) {}
    }

    function setExamRouteForLaunch(testId, view) {
      const safeTest = encodeURIComponent(String(testId || getActiveTestId() || "ielts1"));
      const safeView = encodeURIComponent(String(view || "home"));
      const hashValue = `#/${safeTest}/${safeView}`;
      const assignedLaunchActive = (() => {
        try {
          return !!window.__IELTS_ACTIVE_ASSIGNED_TARGET__;
        } catch (e) {
          return false;
        }
      })();

      // Assigned starts were being bounced back to home by hashchange/home-reconcile.
      // For assignment launches we update the hash silently and keep the already-opened view.
      if (assignedLaunchActive) {
        try {
          const nextUrl = `${window.location.pathname || "/"}${window.location.search || ""}${hashValue}`;
          window.history.replaceState(window.history.state || {}, "", nextUrl);
          return;
        } catch (e) {}
      }

      try { Router().setHashRoute(testId, view); } catch (e) {}
    }

    function launchListeningOnly(testId, pageIndex) {
      assignmentLaunchDebugLog("launchListeningOnly:enter", {
        testId,
        pageIndex,
        activeViewBefore: document.body?.dataset?.activeView || "",
        hashBefore: window.location.hash,
        pathBefore: window.location.pathname,
      });
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
      setActiveTestId(testId);
      const scope = `IELTS:SECTION:${testId}:LISTENING`;
      const ctx = { mode: "section", section: "listening", testId, storageScope: scope };
      if (Number.isInteger(pageIndex)) ctx.pageIndex = pageIndex;
      R()?.setLaunchContext?.(ctx);
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("listening"); } catch (e) {}
      assignmentLaunchDebugLog("launchListeningOnly:afterShowOnly", {
        activeView: document.body?.dataset?.activeView || "",
        hash: window.location.hash,
        path: window.location.pathname,
      });
      try { UI().setExamNavStatus(`Status: ${R()?.getTestLabel?.(testId) || testId} Listening${Number.isInteger(pageIndex) ? ` · Section ${pageIndex + 1}` : ""}`); } catch (e) {}
      setExamRouteForLaunch(testId, "listening");
      assignmentLaunchDebugLog("launchListeningOnly:afterSetHashRoute", {
        activeView: document.body?.dataset?.activeView || "",
        hash: window.location.hash,
        path: window.location.pathname,
      });
      startEngineWhenReady("Listening", "initListeningSystem").catch((e) => console.error("[IELTS] Listening-only launch failed:", e));
    }

    function launchReadingOnly(testId, partId) {
      assignmentLaunchDebugLog("launchReadingOnly:enter", {
        testId,
        partId,
        activeViewBefore: document.body?.dataset?.activeView || "",
        hashBefore: window.location.hash,
        pathBefore: window.location.pathname,
      });
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
      setActiveTestId(testId);
      const scope = `IELTS:SECTION:${testId}:READING`;
      const ctx = { mode: "section", section: "reading", testId, storageScope: scope };
      if (partId) ctx.partId = partId;
      R()?.setLaunchContext?.(ctx);
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("reading"); } catch (e) {}
      assignmentLaunchDebugLog("launchReadingOnly:afterShowOnly", {
        activeView: document.body?.dataset?.activeView || "",
        hash: window.location.hash,
        path: window.location.pathname,
      });
      try { UI().setExamNavStatus(`Status: ${R()?.getTestLabel?.(testId) || testId} Reading${partId ? ` · ${String(partId).replace("part", "Section ")}` : ""}`); } catch (e) {}
      setExamRouteForLaunch(testId, "reading");
      assignmentLaunchDebugLog("launchReadingOnly:afterSetHashRoute", {
        activeView: document.body?.dataset?.activeView || "",
        hash: window.location.hash,
        path: window.location.pathname,
      });
      startEngineWhenReady("Reading", "startReadingSystem").catch((e) => console.error("[IELTS] Reading-only launch failed:", e));
    }

    function launchWritingOnly(testId, focusTask) {
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
      setActiveTestId(testId);
      const scope = `IELTS:SECTION:${testId}:WRITING`;
      const ctx = { mode: "section", section: "writing", testId, storageScope: scope };
      if (focusTask) ctx.focusTask = focusTask;
      R()?.setLaunchContext?.(ctx);
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("writing"); } catch (e) {}
      try { UI().setExamNavStatus(`Status: ${R()?.getTestLabel?.(testId) || testId} Writing${focusTask ? ` · ${focusTask === "task1" ? "Task 1" : "Task 2"}` : ""}`); } catch (e) {}
      try { Router().setHashRoute(testId, "writing"); } catch (e) {}
      startEngineWhenReady("Writing", "startWritingSystem").catch((e) => console.error("[IELTS] Writing-only launch failed:", e));
    }

    function launchReadingPractice(taskType) {
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
      const catalog = R()?.buildHomeCatalog?.()?.practice?.reading || [];
      const match = catalog.find((entry) => entry.type === taskType);
      const testId = match?.tests?.[0] || R()?.TESTS?.defaultTestId || "ielts1";
      const scope = `IELTS:PRACTICE:READING:${taskType}`;
      setActiveTestId(testId);
      R()?.setLaunchContext?.({ mode: "practice", skill: "reading", taskType, storageScope: scope });
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("reading"); } catch (e) {}
      try { UI().setExamNavStatus(`Status: ${match?.label || "Reading practice"}`); } catch (e) {}
      try { Router().setHashRoute(testId, "reading"); } catch (e) {}
      startEngineWhenReady("Reading", "startReadingSystem").catch((e) => console.error("[IELTS] Reading practice launch failed:", e));
    }

    function leavePracticeReviewToHome() {
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = true; } catch (e) {}
      try { stopAllAudio(); } catch (e) {}
      const ctx = safe(() => R()?.getLaunchContext?.()) || null;
      const scope = String(ctx?.storageScope || "").trim();
      if (scope) clearScopedLaunchData(scope);
      try { R()?.clearLaunchContext?.(); } catch (e) {}
      resetEngineInitFlags();
      try { UI().setExamStarted(false); } catch (e) {}
      try { UI().showOnly("home"); } catch (e) {}
      try { UI().updateHomeStatusLine("Status: Ready"); } catch (e) {}
      try { UI().setExamNavStatus("Status: Home"); } catch (e) {}
      try { history.replaceState({}, "", "/"); } catch (e) {}
    }

    function createMetaPill(text) {
      const pill = document.createElement("span");
      pill.className = "meta-pill";
      pill.textContent = text;
      return pill;
    }

    function createCatalogCard(options) {
      const card = document.createElement("article");
      card.className = "home-catalog-card ui-activity-card";
      card.setAttribute("data-card-kind", "test-selection");

      const kicker = document.createElement("div");
      kicker.className = "home-catalog-kicker ui-card-kicker";
      kicker.textContent = options.kicker || "Section";
      card.appendChild(kicker);

      const title = document.createElement("h3");
      title.className = "home-catalog-title ui-card-title";
      title.textContent = options.title || "Practice";
      card.appendChild(title);

      const copy = document.createElement("p");
      copy.className = "home-catalog-copy ui-card-copy";
      copy.textContent = options.copy || "";
      card.appendChild(copy);

      if (Array.isArray(options.meta) && options.meta.length) {
        const meta = document.createElement("div");
        meta.className = "home-catalog-meta ui-card-meta";
        options.meta.forEach((item) => meta.appendChild(createMetaPill(item)));
        card.appendChild(meta);
      }

      const actions = document.createElement("div");
      actions.className = "home-catalog-actions ui-card-actions";

      const primary = document.createElement("button");
      primary.type = "button";
      primary.className = "home-btn ui-card-action-primary";
      primary.textContent = options.primaryLabel || "Open";
      primary.addEventListener("click", options.onPrimary);
      actions.appendChild(primary);

      if (options.onSecondary) {
        const secondary = document.createElement("button");
        secondary.type = "button";
        secondary.className = "home-btn ghost ui-card-action-secondary";
        secondary.textContent = options.secondaryLabel || "Open";
        secondary.addEventListener("click", options.onSecondary);
        actions.appendChild(secondary);
      }

      card.appendChild(actions);
      return card;
    }

    function createMultiActionCard(options) {
      const card = createCatalogCard({
        kicker: options.kicker,
        title: options.title,
        copy: options.copy,
        meta: options.meta,
        primaryLabel: options.primaryLabel || "Open",
        onPrimary: options.onPrimary || (() => {}),
      });
      const actions = card.querySelector(".home-catalog-actions");
      if (actions && Array.isArray(options.extraActions)) {
        options.extraActions.forEach((action) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = action.ghost ? "home-btn ghost ui-card-action-secondary" : "home-btn ghost ui-card-action-secondary";
          btn.textContent = action.label;
          btn.addEventListener("click", action.onClick);
          actions.appendChild(btn);
        });
      }
      return card;
    }

    const HUB_VIEWS = {
      fullExam: "fullExamHub",
      reading: "readingHub",
      listening: "listeningHub",
      writing: "writingHub",
      writingSamplesTask1: "writingTask1SamplesHub",
      writingSamplesTask2: "writingTask2SamplesHub",
      speaking: "speakingHub",
      contact: "contactHub",
    };

    function createNoteCard(title, bullets, kicker) {
      const card = document.createElement("article");
      card.className = "resource-note-card";
      if (kicker) {
        const pill = document.createElement("div");
        pill.className = "sample-band-pill";
        pill.textContent = kicker;
        card.appendChild(pill);
      }
      const h3 = document.createElement("h3");
      h3.textContent = title;
      card.appendChild(h3);
      const list = document.createElement("ul");
      (bullets || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      card.appendChild(list);
      return card;
    }

    function appendEssayParagraphs(root, text) {
      String(text || "")
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const p = document.createElement("p");
          p.textContent = part;
          root.appendChild(p);
        });
    }

    function appendRichText(root, html) {
      const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "span", "sup", "sub", "a"]);
      const voidTags = new Set(["br"]);
      const stack = [{ tag: "__root__", el: root }];

      function decodeEntities(text) {
        return String(text || "").replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
          const named = {
            amp: "&",
            lt: "<",
            gt: ">",
            quot: "\"",
            apos: "'",
            nbsp: " ",
          };
          if (named[entity]) return named[entity];
          if (entity[0] === "#") {
            const isHex = entity[1]?.toLowerCase() === "x";
            const raw = entity.slice(isHex ? 2 : 1);
            const code = parseInt(raw, isHex ? 16 : 10);
            return Number.isFinite(code) ? String.fromCodePoint(code) : match;
          }
          return match;
        });
      }

      function currentParent() {
        return stack[stack.length - 1]?.el || root;
      }

      function appendText(text) {
        const value = decodeEntities(text);
        if (!value) return;
        currentParent().appendChild(document.createTextNode(value));
      }

      function parseAttributes(raw) {
        const attrs = {};
        const attrRe = /([a-zA-Z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/=`]+)))?/g;
        let match;
        while ((match = attrRe.exec(raw))) {
          attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
        }
        return attrs;
      }

      function popToTag(tag) {
        for (let i = stack.length - 1; i > 0; i -= 1) {
          if (stack[i].tag === tag) {
            stack.length = i;
            return;
          }
        }
      }

      const tokenRe = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g;
      let match;
      while ((match = tokenRe.exec(String(html || "")))) {
        const token = match[0];
        if (!token) continue;
        if (token.startsWith("<!--")) continue;
        if (token[0] !== "<") {
          appendText(token);
          continue;
        }

        const closing = /^<\//.test(token);
        const nameMatch = token.match(/^<\/?\s*([a-zA-Z0-9]+)/);
        const rawTag = String(nameMatch?.[1] || "").toLowerCase();
        if (!rawTag || !allowedTags.has(rawTag)) continue;

        if (closing) {
          popToTag(rawTag);
          continue;
        }

        const selfClosing = /\/\s*>$/.test(token) || voidTags.has(rawTag);
        const el = document.createElement(rawTag === "b" ? "strong" : rawTag);
        const attrs = parseAttributes(token);

        if (rawTag === "span") {
          const className = String(attrs.class || "").trim();
          if (/^[a-zA-Z0-9_\- ]+$/.test(className)) el.className = className;
        }
        if (rawTag === "a") {
          const href = String(attrs.href || "").trim();
          if (/^(https?:)?\/\//i.test(href) || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
            el.setAttribute("href", href);
            el.setAttribute("rel", "noopener noreferrer");
            el.setAttribute("target", "_blank");
          }
        }

        currentParent().appendChild(el);
        if (!selfClosing) stack.push({ tag: rawTag, el });
      }
    }

    function getWritingSampleDisplayTitle(entry) {
      return entry.topic || entry.shortTitle || entry.title || "Writing prompt";
    }

    function promotePromptImageLinks(promptEl) {
      if (!promptEl) return [];
      const created = [];
      promptEl.querySelectorAll("a[href]").forEach((link) => {
        const href = String(link.getAttribute("href") || "").trim();
        if (!/\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(href)) return;
        const img = document.createElement("img");
        img.className = "writing-sample-image";
        img.src = href;
        img.alt = "Task visual";
        created.push(img);
        link.remove();
      });
      return created;
    }

    function createWritingSampleResponse(entry, sample, index) {
      const response = document.createElement("article");
      response.className = "writing-sample-response";
      response.dataset.bandScore = String(sample.bandScore || "Coming soon");

      const head = document.createElement("div");
      head.className = "writing-sample-response-head";

      const titleWrap = document.createElement("div");
      titleWrap.className = "writing-sample-response-copy";

      const label = document.createElement("h4");
      label.textContent = entry.samples.length > 1
        ? (sample.label || `Sample ${index + 1}`)
        : "Sample answer";
      titleWrap.appendChild(label);

      const meta = document.createElement("p");
      meta.className = "writing-sample-response-meta";
      meta.textContent = sample.explanation
        ? "Band explanation and model response"
        : "Model response";
      titleWrap.appendChild(meta);

      const band = document.createElement("div");
      band.className = "sample-band-pill writing-band-pill";
      band.textContent = sample.bandScore || "Coming soon";

      head.appendChild(titleWrap);
      head.appendChild(band);
      response.appendChild(head);

      const sampleWrap = document.createElement("section");
      sampleWrap.className = "writing-sample-answer";
      const sampleTitle = document.createElement("h5");
      sampleTitle.textContent = "Sample answer";
      sampleWrap.appendChild(sampleTitle);
      appendEssayParagraphs(sampleWrap, sample.sampleAnswer || "Sample answer coming soon.");
      response.appendChild(sampleWrap);

      const analysisToggle = document.createElement("details");
      analysisToggle.className = "writing-sample-analysis-toggle";

      const analysisSummary = document.createElement("summary");
      analysisSummary.textContent = "Why this score";
      analysisToggle.appendChild(analysisSummary);

      const analysisWrap = document.createElement("section");
      analysisWrap.className = "writing-sample-analysis";
      const explanationText = document.createElement("p");
      explanationText.textContent = sample.explanation || "Score analysis is coming soon.";
      analysisWrap.appendChild(explanationText);
      analysisToggle.appendChild(analysisWrap);
      response.appendChild(analysisToggle);

      return response;
    }

    function createWritingSampleBandChooser(entry, responses) {
      const chooser = document.createElement("div");
      chooser.className = "writing-sample-band-chooser";

      const label = document.createElement("div");
      label.className = "writing-sample-band-chooser-label";
      label.textContent = "Choose a band score";
      chooser.appendChild(label);

      const options = document.createElement("div");
      options.className = "writing-sample-band-options";
      chooser.appendChild(options);

      const responseItems = Array.from(responses.querySelectorAll(".writing-sample-response"));
      const seen = new Set();
      const buttons = [];
      responseItems.forEach((node) => {
        const bandScore = String(node.dataset.bandScore || "Coming soon");
        if (seen.has(bandScore)) return;
        seen.add(bandScore);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "writing-sample-band-button";
        button.textContent = `Band ${bandScore}`;
        button.addEventListener("click", () => {
          buttons.forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
          responseItems.forEach((item) => {
            item.hidden = String(item.dataset.bandScore || "Coming soon") !== bandScore;
          });
        });
        buttons.push(button);
        options.appendChild(button);
      });

      if (buttons[0]) buttons[0].click();
      return chooser;
    }

    async function fetchStoredWritingSamples() {
      if (Array.isArray(writingSampleCache.rows)) return writingSampleCache.rows.slice();
      if (writingSampleCache.promise) return writingSampleCache.promise;

      writingSampleCache.promise = (async () => {
        const url = R()?.buildAdminApiUrl?.({ action: "writingSamples", t: Date.now() });
        if (!url) return [];

        const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.ok !== true || !Array.isArray(data.samples)) {
          throw new Error((data && data.error) || "Could not load stored writing samples.");
        }

        writingSampleCache.rows = data.samples.slice();
        writingSampleCache.promise = null;
        return data.samples.slice();
      })().catch((err) => {
        writingSampleCache.promise = null;
        console.error("Writing sample sync failed:", err);
        return [];
      });

      return writingSampleCache.promise;
    }

    function groupStoredWritingSamples(rows) {
      const map = {};
      (rows || []).forEach((row) => {
        const promptKey = String(row?.promptKey || "").trim();
        if (!promptKey) return;
        const key = promptKey;
        if (!map[key]) {
          map[key] = {
            promptKey: key,
            promptText: String(row?.promptText || "").trim(),
            taskKey: String(row?.taskKey || "").trim(),
            samples: [],
          };
        }
        if (!map[key].promptText && row?.promptText) map[key].promptText = String(row.promptText).trim();
        if (!map[key].taskKey && row?.taskKey) map[key].taskKey = String(row.taskKey).trim();
        map[key].samples.push({
          label: row.label || "Student sample",
          bandScore: row.bandScore || "Student sample",
          explanation: row.explanation || "Stored student essay from a past submission.",
          sampleAnswer: row.sampleAnswer || "",
          correctedForm: row.correctedForm || "",
        });
      });
      return map;
    }

    function createWritingSampleCard(entry) {
      const card = document.createElement("article");
      card.className = "writing-sample-card";

      const hero = document.createElement("div");
      hero.className = "writing-sample-hero";

      const heroCopy = document.createElement("div");
      heroCopy.className = "writing-sample-hero-copy";

      const top = document.createElement("div");
      top.className = "writing-sample-top";

      const typePill = document.createElement("div");
      typePill.className = "sample-band-pill";
      typePill.textContent = entry.groupType || entry.taskLabel;

      const sourcePill = document.createElement("div");
      sourcePill.className = "sample-band-pill writing-band-pill";
      sourcePill.textContent = entry.sourceTitle || entry.taskLabel;

      top.appendChild(typePill);
      top.appendChild(sourcePill);
      heroCopy.appendChild(top);

      const title = document.createElement("h3");
      title.textContent = getWritingSampleDisplayTitle(entry);
      heroCopy.appendChild(title);

      const source = document.createElement("div");
      source.className = "writing-sample-source";
      source.textContent = `${entry.sampleCount || 0} sample${entry.sampleCount === 1 ? "" : "s"} available`;
      heroCopy.appendChild(source);

      const prompt = document.createElement("div");
      prompt.className = "writing-sample-prompt";
      appendRichText(prompt, entry.promptHtml || "");
      heroCopy.appendChild(prompt);
      const promptLinkedImages = promotePromptImageLinks(prompt);

      hero.appendChild(heroCopy);

      if (entry.imageSrc || promptLinkedImages.length) {
        const media = document.createElement("div");
        media.className = "writing-sample-hero-media";
        if (entry.imageSrc) {
          const img = document.createElement("img");
          img.className = "writing-sample-image";
          img.src = entry.imageSrc;
          img.alt = `${getWritingSampleDisplayTitle(entry)} prompt visual`;
          media.appendChild(img);
        } else {
          promptLinkedImages.forEach((img) => media.appendChild(img));
        }
        hero.appendChild(media);
        prompt.querySelectorAll("a").forEach((link) => link.remove());
      }

      card.appendChild(hero);

      const responses = document.createElement("div");
      responses.className = "writing-sample-responses";
      (entry.samples || []).forEach((sample, index) => {
        responses.appendChild(createWritingSampleResponse(entry, sample, index));
      });
      if ((entry.samples || []).length > 1) {
        card.appendChild(createWritingSampleBandChooser(entry, responses));
      }
      card.appendChild(responses);

      return card;
    }

    function createWritingSampleAccordion(entry) {
      const item = document.createElement("details");
      item.className = "writing-sample-accordion";

      const summary = document.createElement("summary");
      summary.className = "writing-sample-summary";

      const textWrap = document.createElement("div");
      textWrap.className = "writing-sample-summary-copy";

      const title = document.createElement("div");
      title.className = "writing-sample-summary-title";
      title.textContent = getWritingSampleDisplayTitle(entry);

      const meta = document.createElement("div");
      meta.className = "writing-sample-summary-meta";
      meta.textContent = `${entry.taskLabel} · ${entry.sampleCount || 0} sample${entry.sampleCount === 1 ? "" : "s"}`;

      textWrap.appendChild(title);
      textWrap.appendChild(meta);
      summary.appendChild(textWrap);

      const pillWrap = document.createElement("div");
      pillWrap.className = "writing-sample-summary-pills";

      const typePill = document.createElement("div");
      typePill.className = "sample-band-pill";
      typePill.textContent = entry.groupType || entry.taskLabel;
      pillWrap.appendChild(typePill);

      const bandPill = document.createElement("div");
      bandPill.className = "sample-band-pill writing-band-pill";
      bandPill.textContent = entry.bandScore || "Coming soon";
      pillWrap.appendChild(bandPill);

      if ((entry.sampleCount || 0) > 1) {
        const countPill = document.createElement("div");
        countPill.className = "sample-band-pill";
        countPill.textContent = `${entry.sampleCount} samples`;
        pillWrap.appendChild(countPill);
      }

      summary.appendChild(pillWrap);
      item.appendChild(summary);

      const body = document.createElement("div");
      body.className = "writing-sample-accordion-body";
      body.appendChild(createWritingSampleCard(entry));
      item.appendChild(body);

      return item;
    }

    function renderWritingSampleLibrary(taskKey) {
      const wrap = document.createElement("div");
      wrap.className = "resource-hub-list writing-sample-list";
      const loading = document.createElement("div");
      loading.className = "home-catalog-empty";
      loading.textContent = "Loading stored essays and model answers...";
      wrap.appendChild(loading);

      const renderItems = (items) => {
        wrap.innerHTML = "";
        if (!items.length) {
          const empty = document.createElement("div");
          empty.className = "home-catalog-empty";
          empty.textContent = "No sample answers are available for this task yet.";
          wrap.appendChild(empty);
          return;
        }

        const groups = {};
        items.forEach((item) => {
          const key = item.groupType || "Other";
          if (!groups[key]) groups[key] = [];
          groups[key].push(item);
        });

        Object.keys(groups)
          .sort((a, b) => {
            const order = {
              "Bar chart": 1,
              "Line graph": 2,
              "Pie chart": 3,
              "Table": 4,
              "Map": 5,
              "Process diagram": 6,
              "Mixed chart": 7,
              "Chart": 8,
              "Task 1 report": 9,
              "Opinion essay": 1,
              "Discussion essay": 2,
              "Problem and solution": 3,
              "Advantages and disadvantages": 4,
              "Positive or negative development": 5,
              "Two-part question": 6,
              "Essay": 7,
            };
            return (order[a] || 99) - (order[b] || 99) || a.localeCompare(b);
          })
          .forEach((groupLabel) => {
            const section = document.createElement("section");
            section.className = "writing-sample-group";

            const head = document.createElement("div");
            head.className = "writing-sample-group-head";
            const heading = document.createElement("h3");
            heading.textContent = groupLabel;
            const count = document.createElement("p");
            count.textContent = `${groups[groupLabel].length} prompt${groups[groupLabel].length === 1 ? "" : "s"}`;
            head.appendChild(heading);
            head.appendChild(count);
            section.appendChild(head);

            const list = document.createElement("div");
            list.className = "writing-sample-group-list";

            groups[groupLabel]
              .sort((a, b) => String(a.shortTitle || a.title).localeCompare(String(b.shortTitle || b.title)))
              .forEach((item) => list.appendChild(createWritingSampleAccordion(item)));

            section.appendChild(list);
            wrap.appendChild(section);
          });
      };

      Promise.resolve()
        .then(fetchStoredWritingSamples)
        .then((rows) => {
        const items = (R()?.buildWritingSampleCatalog?.(groupStoredWritingSamples(rows)) || [])
            .filter((item) => item.taskKey === taskKey);
          renderItems(items);
        })
        .catch(() => {
          const items = (R()?.buildWritingSampleCatalog?.() || [])
            .filter((item) => item.taskKey === taskKey);
          renderItems(items);
        });

      return wrap;
    }

    function buildHubSection(id, label, copy, nodeBuilder) {
      const section = document.createElement("section");
      section.className = "resource-hub-section";
      section.id = id;
      const head = document.createElement("div");
      head.className = "home-section-head";
      const topline = document.createElement("div");
      topline.className = "home-card-topline";
      topline.textContent = label;
      const title = document.createElement("h2");
      title.className = "home-section-title";
      title.textContent = label;
      const text = document.createElement("p");
      text.className = "home-section-copy";
      text.textContent = copy;
      head.appendChild(topline);
      head.appendChild(title);
      head.appendChild(text);
      section.appendChild(head);
      const node = nodeBuilder();
      if (node) section.appendChild(node);
      return section;
    }

    function renderStaticTips(cards) {
      const wrap = document.createElement("div");
      wrap.className = "resource-hub-grid";
      cards.forEach((card) => wrap.appendChild(card));
      return wrap;
    }

    function createContactSection() {
      const wrap = document.createElement("div");
      wrap.className = "contact-page-grid";

      const card = document.createElement("article");
      card.className = "contact-highlight-card";
      const supportTopline = document.createElement("div");
      supportTopline.className = "home-card-topline";
      supportTopline.textContent = "Support email";
      const supportTitle = document.createElement("h3");
      supportTitle.textContent = "info@ieltsmock.org";
      const supportCopy = document.createElement("p");
      supportCopy.textContent = "Use this address for platform support, account questions, writing sample issues, bug reports, and general IELTS Mock enquiries.";
      const supportLink = document.createElement("a");
      supportLink.className = "btn";
      supportLink.href = "mailto:info@ieltsmock.org";
      supportLink.textContent = "Email support directly";
      card.appendChild(supportTopline);
      card.appendChild(supportTitle);
      card.appendChild(supportCopy);
      card.appendChild(supportLink);
      wrap.appendChild(card);

      const formCard = document.createElement("article");
      formCard.className = "contact-form-card";
      const formTopline = document.createElement("div");
      formTopline.className = "home-card-topline";
      formTopline.textContent = "Contact form";
      const formTitle = document.createElement("h3");
      formTitle.textContent = "Report a problem or contact the team";
      const formCopy = document.createElement("p");
      formCopy.className = "contact-form-copy";
      formCopy.append("Fill this in and we will send it directly to ");
      const formCopyStrong = document.createElement("strong");
      formCopyStrong.textContent = "info@ieltsmock.org";
      formCopy.appendChild(formCopyStrong);
      formCopy.append(".");

      const form = document.createElement("form");
      form.className = "contact-form";
      form.id = "contactSupportForm";

      const grid = document.createElement("div");
      grid.className = "contact-form-grid";

      const buildField = (labelText, inputEl, extraClass = "") => {
        const label = document.createElement("label");
        label.className = `contact-field${extraClass ? ` ${extraClass}` : ""}`;
        const span = document.createElement("span");
        span.textContent = labelText;
        label.appendChild(span);
        label.appendChild(inputEl);
        return label;
      };

      const fullNameInput = document.createElement("input");
      fullNameInput.type = "text";
      fullNameInput.name = "fullName";
      fullNameInput.placeholder = "Your full name";
      fullNameInput.required = true;

      const emailInput = document.createElement("input");
      emailInput.type = "email";
      emailInput.name = "email";
      emailInput.placeholder = "you@example.com";
      emailInput.required = true;

      const phoneInput = document.createElement("input");
      phoneInput.type = "tel";
      phoneInput.name = "phone";
      phoneInput.placeholder = "+994...";
      phoneInput.required = true;

      const reasonSelect = document.createElement("select");
      reasonSelect.name = "category";
      reasonSelect.required = true;
      [
        "General contact",
        "Technical issue",
        "Account support",
        "Writing sample issue",
        "Feedback or suggestion",
      ].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        reasonSelect.appendChild(option);
      });

      grid.appendChild(buildField("Full name", fullNameInput));
      grid.appendChild(buildField("Email address", emailInput));
      grid.appendChild(buildField("Phone number", phoneInput));
      grid.appendChild(buildField("Reason", reasonSelect));

      const messageInput = document.createElement("textarea");
      messageInput.name = "message";
      messageInput.rows = 7;
      messageInput.placeholder = "Tell us what happened, what page you were on, or how we can help.";
      messageInput.required = true;

      const messageField = buildField("Message", messageInput, "contact-field-full");

      const actions = document.createElement("div");
      actions.className = "contact-form-actions";
      const submitBtnEl = document.createElement("button");
      submitBtnEl.className = "btn";
      submitBtnEl.type = "submit";
      submitBtnEl.textContent = "Send message";
      const status = document.createElement("div");
      status.className = "contact-form-status";
      status.id = "contactFormStatus";
      status.setAttribute("aria-live", "polite");
      actions.appendChild(submitBtnEl);
      actions.appendChild(status);

      form.appendChild(grid);
      form.appendChild(messageField);
      form.appendChild(actions);

      formCard.appendChild(formTopline);
      formCard.appendChild(formTitle);
      formCard.appendChild(formCopy);
      formCard.appendChild(form);

      try {
        const savedUser = window.IELTS?.Auth?.getSavedUser?.() || null;
        if (savedUser?.email && emailInput) emailInput.value = savedUser.email;
        const knownName = savedUser?.profile?.preferredName || savedUser?.name || "";
        if (knownName && fullNameInput) fullNameInput.value = knownName;
      } catch (e) {}

      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form || !status) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        const payload = {
          fullName: String(formData.get("fullName") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          category: String(formData.get("category") || "").trim(),
          message: String(formData.get("message") || "").trim(),
        };

        status.textContent = "Sending your message...";
        status.className = "contact-form-status is-pending";
        if (submitBtn) submitBtn.disabled = true;

        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await response.json().catch(() => null);
          if (!response.ok || !data?.ok) {
            throw new Error(data?.error || "Could not send your message.");
          }
          status.textContent = data.message || "Your message has been sent.";
          status.className = "contact-form-status is-success";
          form.reset();
          if (emailInput && payload.email) emailInput.value = payload.email;
          if (fullNameInput && payload.fullName) fullNameInput.value = payload.fullName;
        } catch (error) {
          status.textContent = error?.message || "Could not send your message.";
          status.className = "contact-form-status is-error";
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });

      wrap.appendChild(formCard);
      return wrap;
    }

    function rememberHub(kind) {
      try { localStorage.setItem("IELTS:HOME:resourceHubKind", kind); } catch (e) {}
    }

    async function ensureReadingPracticeCatalogReady() {
      const testIds = Object.keys(R()?.TESTS?.byId || {});
      if (!testIds.length) return;
      await Promise.allSettled(testIds.map((testId) => R()?.ensureTestContent?.(testId)));
    }

    async function openResourceHub(kind, focusId) {
      if (!confirmLeaveStudentExam(() => openResourceHub(kind, focusId))) return;
      if (kind === "reading") {
        try {
          await ensureReadingPracticeCatalogReady();
        } catch (e) {
          console.warn("[IELTS] Reading resource preload failed:", e);
        }
      }
      const view = HUB_VIEWS[kind] || "fullExamHub";
      rememberHub(kind);
      renderResourceHub(kind, focusId);
      UI().showOnly(view);
      // Hub views with clean URL mappings use pushState via showOnly/VIEW_TO_PATH.
      // Only use hash routing for views that have no clean URL yet.
      const HUB_CLEAN_PATHS = {
        fullExamHub: "/mock-tests/",
        listeningHub: "/listening/",
        readingHub: "/reading/",
        writingHub: "/writing/",
        speakingHub: "/speaking/",
      };
      if (!HUB_CLEAN_PATHS[view]) {
        try { Router().setHashRoute(getActiveTestId(), view); } catch (e) {}
      }
      UI().setExamNavStatus(`Status: ${kind} page`);
      if (focusId) {
        setTimeout(() => document.getElementById(focusId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 40);
      }
    }

    function launchFullExamFromCatalog(testId) {
      const resolved = String(testId || "").trim();
      if (!resolved) return;
      requireTestPassword(() => {
        setActiveTestId(resolved);
        startFreshExam();
      }, resolved);
    }

    function openGrammarFromMenu() {
      try { window.IELTS?.Grammar?.init?.(); } catch (e) {}
      try { UI().showOnly("grammar"); } catch (e) {}
      try { UI().setExamNavStatus("Status: Grammar"); } catch (e) {}
    }

    function openResourcesFromMenu() {
      try { window.IELTS?.ResourcesPage?.init?.(); } catch (e) {}
      try { UI().showOnly("resources"); } catch (e) {}
      try { UI().setExamNavStatus("Status: Resources"); } catch (e) {}
    }

    function renderMenuGroup(menu) {
      const wrap = document.createElement("div");
      wrap.className = "home-skill-menu";

      const isSingleAction = menu.items.length === 1;
      const singleItem = isSingleAction ? menu.items[0] : null;
      const trigger = singleItem?.href ? document.createElement("a") : document.createElement("button");
      if (trigger.tagName === "BUTTON") trigger.type = "button";
      trigger.className = "home-skill-trigger";
      const labelSpan = document.createElement("span");
      labelSpan.textContent = menu.label;
      trigger.appendChild(labelSpan);
      if (singleItem?.href) trigger.href = singleItem.href;

      if (!isSingleAction) {
        const arrow = document.createElement("i");
        arrow.textContent = "▾";
        trigger.appendChild(arrow);
      }

      if (isSingleAction) {
        if (!singleItem?.href) {
          trigger.addEventListener("click", () => {
            document.querySelectorAll(".home-skill-dropdown").forEach((el) => el.classList.add("hidden"));
            menu.items[0].onClick();
          });
        }
        wrap.appendChild(trigger);
        return wrap;
      }

      const dropdown = document.createElement("div");
      dropdown.className = "home-skill-dropdown hidden";

      menu.items.forEach((item) => {
        const btn = item.href ? document.createElement("a") : document.createElement("button");
        if (btn.tagName === "BUTTON") btn.type = "button";
        btn.className = "home-skill-item";
        if (item.href) btn.href = item.href;
        const strong = document.createElement("strong");
        strong.textContent = item.label;
        btn.appendChild(strong);
        if (item.copy) {
          const copy = document.createElement("span");
          copy.textContent = item.copy;
          btn.appendChild(copy);
        }
        btn.addEventListener("click", (event) => {
          dropdown.classList.add("hidden");
          if (!item.href) {
            event.preventDefault();
            item.onClick();
          }
        });
        dropdown.appendChild(btn);
      });

      trigger.addEventListener("click", () => {
        document.querySelectorAll(".home-skill-dropdown").forEach((el) => {
          if (el !== dropdown) el.classList.add("hidden");
        });
        dropdown.classList.toggle("hidden");
      });

      wrap.appendChild(trigger);
      wrap.appendChild(dropdown);
      return wrap;
    }

    const FULL_EXAM_GROUPS = [
      { key: "irm", label: "IRM", testNumbers: [1, 2] },
      { key: "og", label: "OG", testNumbers: [3, 4, 5, 6, 7] },
      { key: "collins", label: "Collins", testNumbers: [8] },
      { key: "cambridge", label: "Cambridge", testNumbers: [9, 15, 20, 21] },
      { key: "irp", label: "IRP", testNumbers: [10, 11, 12, 13, 14, 16, 17, 18, 19, ] },
    ];

    function getExamNumberFromId(testId) {
      const match = String(testId || "").match(/(\d+)/);
      return match ? Number(match[1]) : NaN;
    }

    function groupFullExamCatalogItems(items) {
      const byNumber = new Map((items || []).map((item) => [getExamNumberFromId(item.id), item]));
      return FULL_EXAM_GROUPS.map((group) => ({
        ...group,
        items: group.testNumbers.map((n) => byNumber.get(n)).filter(Boolean),
      })).filter((group) => group.items.length);
    }

    function renderHomeMenus() {
      if (!homeExploreMenus) return;
      clearElement(homeExploreMenus);
      const menus = [
        {
          kicker: "Core path",
          label: "Exams",
          items: [
            { label: "Browse all full exams", copy: "See every complete mock exam in one place.", href: "/mock-tests/" },
            { label: "See all exam collections", copy: "Browse by series: IRM, OG, Cambridge, and more.", href: "/mock-tests/" },
          ],
        },
        {
          kicker: "Skills",
          label: "Practice",
          items: [
            { label: "Reading", copy: "Full reading exams, sections, and question-type practice.", href: "/reading/" },
            { label: "Listening", copy: "Listening exams, section-by-section, and strategy tips.", href: "/listening/" },
            { label: "Writing", copy: "Task 1 and Task 2 practice with AI feedback.", href: "/writing/" },
            { label: "Speaking", copy: "Speaking practice, predicted topics, and sample answers.", href: "/speaking/" },
          ],
        },
        {
          kicker: "Learn",
          label: "Grammar",
          items: [
            { label: "Grammar hub", copy: "12 structured grammar topics for IELTS Writing and Speaking.", onClick: () => openGrammarFromMenu() },
            { label: "Tenses", copy: "Master all IELTS-relevant tense forms.", onClick: () => openGrammarFromMenu() },
            { label: "Linking words", copy: "Coherence and cohesion vocabulary for band 7+.", onClick: () => openGrammarFromMenu() },
            { label: "Conditionals", copy: "If-clauses and hypothetical language for high band scores.", onClick: () => openGrammarFromMenu() },
          ],
        },
        {
          kicker: "Learn",
          label: "Vocabulary",
          items: [
            { label: "Open vocabulary hub", copy: "Themed IELTS word banks, flashcards, and practice.", href: "/vocabulary/" },
          ],
        },
        {
          kicker: "Tools",
          label: "Placement",
          items: [
            { label: "Take placement test", copy: "Find your approximate IELTS level in under 15 minutes.", href: "/placement-test/" },
          ],
        },
        {
          kicker: "Community",
          label: "Questions",
          items: [
            { label: "Browse recent questions", copy: "Read what other students saw on their real IELTS exams.", href: "/recent-questions/" },
            { label: "Share your experience", copy: "Help others by posting your recent exam questions and topics.", href: "/recent-questions/" },
          ],
        },
        {
          kicker: "Support",
          label: "Resources",
          items: [
            { label: "Browse all resources", copy: "Download guides, templates, and study materials.", onClick: () => openResourcesFromMenu() },
          ],
        },
      ];
      menus.forEach((menu) => homeExploreMenus.appendChild(renderMenuGroup(menu)));
    }

    function renderHomeMetrics() {
      const metricValues = document.querySelectorAll(".hero-stat-value");
      if (!metricValues || !metricValues.length) return;
      const fullExamCount = (R()?.buildHomeCatalog?.()?.fullExams || []).length;
      if (metricValues[0]) metricValues[0].textContent = String(fullExamCount).padStart(2, "0");
    }

    function renderResourceHub(kind, focusId) {
      if (!resourceHubContent || !resourceHubTitle || !resourceHubSubtitle || !resourceHubBadge || !resourceHubAnchorbar) return;

      const catalog = R()?.buildHomeCatalog?.() || { fullExams: [], sections: {}, practice: { reading: [] } };
      clearElement(resourceHubContent);
      clearElement(resourceHubAnchorbar);

      const addSection = (sectionId, label, copy, nodeBuilder) => {
        const section = buildHubSection(sectionId, label, copy, nodeBuilder);
        resourceHubContent.appendChild(section);
        const anchor = document.createElement("button");
        anchor.type = "button";
        anchor.className = "resource-hub-anchor";
        anchor.textContent = label;
        anchor.addEventListener("click", () => document.getElementById(sectionId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
        resourceHubAnchorbar.appendChild(anchor);
      };

      if (kind === "fullExam") {
        resourceHubBadge.textContent = "Full exam page";
        resourceHubTitle.textContent = "Take the full IELTS mock";
        resourceHubSubtitle.textContent = "Every uploaded exam still works as a complete mock first, with Listening, Reading, and Writing in sequence.";
        groupFullExamCatalogItems(catalog.fullExams).forEach((group) => {
          addSection(`full-exam-${group.key}`, group.label, `Choose from the ${group.label} full exam set.`, () => {
            const grid = document.createElement("div");
            grid.className = "resource-hub-grid";
            group.items.forEach((item) => {
              grid.appendChild(createCatalogCard({
                kicker: group.label,
                title: item.label,
                copy: item.description,
                meta: item.meta,
                primaryLabel: "Start full exam",
                onPrimary: () => launchFullExamFromCatalog(item.id),
              }));
            });
            return grid;
          });
        });
        addSection("full-exam-notes", "How full exams work", "Use the full path when you want realistic sequencing and timing.", () => renderStaticTips([
          createNoteCard("Best use case", ["Take a full exam when you want stamina practice, timing, and realistic transitions."], "Strategy"),
          createNoteCard("What to expect", ["Listening starts first, then Reading, then Writing.", "Progress is saved in the same workspace."], "Flow"),
          createNoteCard("When to use section pages instead", ["Use the skill pages when you want focused repair work on one area only."], "Focus"),
        ]));
      }

      if (kind === "reading") {
        resourceHubBadge.textContent = "Reading page";
        resourceHubTitle.textContent = "Reading exams, sections, practice, and strategy";
        resourceHubSubtitle.textContent = "Choose between full reading exams, part-based launches, question-type drills, and reading strategy support.";
        addSection("reading-full-exams", "Take full reading exam", "Run the complete reading-only section from any uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.reading || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Reading exam",
              title: item.label,
              copy: item.description,
              meta: item.meta,
              primaryLabel: "Open full reading",
              onPrimary: () => requireTestPassword(() => launchReadingOnly(item.testId), item.testId),
            }));
          });
          return grid;
        });
        addSection("reading-sections", "Take by section", "Open reading section 1, 2, or 3 separately from each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.reading || []).forEach((item) => {
            grid.appendChild(createMultiActionCard({
              kicker: "Reading sections",
              title: R()?.getTestLabel?.(item.testId) || item.label,
              copy: "Launch one reading part at a time when a student wants focused repair work instead of the full reading paper.",
              meta: ["Section 1", "Section 2", "Section 3"],
              primaryLabel: "Full reading",
              onPrimary: () => requireTestPassword(() => launchReadingOnly(item.testId), item.testId),
              extraActions: [
                { label: "Section 1", onClick: () => requireTestPassword(() => launchReadingOnly(item.testId, "part1"), item.testId) },
                { label: "Section 2", onClick: () => requireTestPassword(() => launchReadingOnly(item.testId, "part2"), item.testId) },
                { label: "Section 3", onClick: () => requireTestPassword(() => launchReadingOnly(item.testId, "part3"), item.testId) },
              ],
            }));
          });
          return grid;
        });
        addSection("reading-practice-types", "Practice by question type", "Choose the task type a student struggles with and drill only that format.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.practice.reading || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Question type",
              title: item.label,
              copy: item.summary,
              meta: [`${item.exerciseCount} drills`, `${item.questionCount} questions`],
              primaryLabel: "Start practice",
              onPrimary: () => requireTestPassword(() => launchReadingPractice(item.type)),
            }));
          });
          return grid;
        });
        addSection("reading-tips", "Reading tips", "General reading strategy and task-by-task guidance students can return to before practice.", () => renderStaticTips([
          createNoteCard("Start with the passage map", [
            "Read the title, intro, and first line of each paragraph before attacking the questions.",
            "Mark topic shifts, names, dates, and repeated keywords so the passage becomes easier to scan later.",
            "Do not try to understand every word on the first pass; build orientation first."
          ], "General"),
          createNoteCard("Manage time by section, not by panic", [
            "Keep moving if one question cluster is taking too long; come back after easier marks are secured.",
            "Leave a short buffer at the end to transfer or recheck uncertain answers.",
            "Use the earlier passages efficiently so Passage 3 still gets enough attention."
          ], "Timing"),
          createNoteCard("Hunt synonyms, not only exact words", [
            "IELTS often paraphrases the question using synonyms, opposites, or slightly different grammar.",
            "Underline the key idea in the question, then think of two or three alternative ways that idea might appear.",
            "If the exact words are missing, that does not mean the answer is missing."
          ], "General"),
          createNoteCard("True / False / Not Given", [
            "Turn the statement into a yes/no question, then check whether the passage clearly supports it, contradicts it, or stays silent.",
            "FALSE means the text says the opposite, while NOT GIVEN means the text does not give enough information.",
            "Base the answer on the passage only, never on your own knowledge."
          ], "TFNG"),
          createNoteCard("Matching Headings", [
            "Focus on the main idea of the whole paragraph, not a striking detail from one sentence.",
            "Read the heading list quickly, then summarise each paragraph in a few words before matching.",
            "If two headings both look possible, ask which one covers the paragraph as a whole."
          ], "Headings"),
          createNoteCard("Sentence / Summary Completion", [
            "Predict the missing word type first: noun, verb, adjective, number, or name.",
            "Check the word limit carefully before writing anything down.",
            "Make sure the completed sentence is grammatically correct as well as factually correct."
          ], "Completion"),
          createNoteCard("Short Answer", [
            "Find the relevant part of the text first, then lift only the exact words needed for the answer.",
            "Use the wording from the passage where possible instead of rewriting it in your own style.",
            "Keep checking the word limit because many correct ideas still become wrong answers if they are too long."
          ], "Short Answer"),
          createNoteCard("Matching Endings / Matching Information", [
            "Read the stem first and identify the core meaning before you look at the endings or options.",
            "Eliminate endings that repeat vocabulary but break the meaning when joined to the stem.",
            "For matching-information tasks, remember that the order is often not the same as the passage order."
          ], "Matching"),
          createNoteCard("Multiple Choice", [
            "Read the question stem before the options so you know what evidence you are hunting for.",
            "Expect distractors: one option may use familiar words but miss the writer's real point.",
            "Eliminate aggressively and confirm the surviving answer with exact evidence from the passage."
          ], "Multiple Choice"),
          createNoteCard("Summary Selection", [
            "Read the full summary first so you understand its overall meaning before choosing a word or option.",
            "Check grammar and meaning together; a word can look related to the passage but still not fit the sentence.",
            "If options are provided, compare them against the exact sentence in the text instead of relying on memory."
          ], "Summary"),
          createNoteCard("Final reading checklist", [
            "Check every answer against the question instructions and word limits.",
            "Revisit headings, TFNG, and multiple choice carefully because these are common trap areas.",
            "If you cannot prove an answer from the passage, it probably needs another look."
          ], "Review"),
        ]));
      }

      if (kind === "listening") {
        resourceHubBadge.textContent = "Listening page";
        resourceHubTitle.textContent = "Listening exams, sections, and listening technique";
        resourceHubSubtitle.textContent = "Use this page for full listening runs and listening reminders.";
        addSection("listening-full-exams", "Take full listening exam", "Open the listening-only version of each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.listening || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Listening exam",
              title: item.label,
              copy: item.description,
              meta: item.meta,
              primaryLabel: "Open full listening",
              onPrimary: () => requireTestPassword(() => launchListeningOnly(item.testId), item.testId),
            }));
          });
          return grid;
        });
        addSection("listening-tips", "Listening tips", "General listening strategy plus task-specific reminders students can use before or between attempts.", () => renderStaticTips([
          createNoteCard("Know the listening flow", [
            "The recording is played once only, but the questions follow the same order as the information in the audio.",
            "Use the short pauses to move your eyes forward and predict what is coming next.",
            "If you miss one answer, keep moving so one gap does not cost you the next three."
          ], "General"),
          createNoteCard("Read ahead before the audio starts", [
            "Use the preparation time to circle keywords, names, numbers, dates, and signpost words.",
            "Predict the answer type before you listen: number, place, noun, adjective, or verb.",
            "The better your prediction, the easier it is to catch the answer when the audio arrives."
          ], "Prep"),
          createNoteCard("Track paraphrase and synonyms", [
            "The speaker may not repeat the same words from the question sheet.",
            "Train yourself to hear paraphrase, especially for common nouns, verbs, and time expressions.",
            "A wider vocabulary helps you catch answers that sound different from the printed question."
          ], "General"),
          createNoteCard("Expect distractors", [
            "Speakers often say one answer, then correct themselves or add a detail that changes it.",
            "Wait for the final confirmed information before writing your answer.",
            "This matters especially in conversations, bookings, prices, times, and directions."
          ], "Distractors"),
          createNoteCard("Form / Note / Table / Summary Completion", [
            "Read the sentence around each gap so you know what kind of word will fit.",
            "Check word limits carefully because a correct idea can still be marked wrong if it is too long.",
            "Watch spelling, plurals, and singular forms because Listening answers must be exact."
          ], "Completion"),
          createNoteCard("Multiple Choice", [
            "Read the question before the options if possible so you know what main idea you are listening for.",
            "Eliminate options that mention details from the recording but do not answer the real question.",
            "Stay alert for contrast language like 'however', 'actually', 'in fact', or 'we decided instead'."
          ], "Multiple Choice"),
          createNoteCard("Matching tasks", [
            "Understand each option first so you know what differences you are listening for.",
            "Tick off options that are already used if the task instructions allow each answer only once.",
            "In matching sections, keep your place carefully because the speakers may move through choices quickly."
          ], "Matching"),
          createNoteCard("Map / Plan / Diagram Labelling", [
            "Before the recording starts, study the layout and identify landmarks, doors, corners, and directions.",
            "Listen for movement language such as 'opposite', 'next to', 'at the end of', 'to the left of', and 'beyond'.",
            "Follow the route step by step instead of trying to imagine the whole map at once."
          ], "Map / Plan"),
          createNoteCard("Use section difficulty wisely", [
            "Section 1 is usually more everyday and concrete, while Sections 3 and 4 demand stronger concentration and note tracking.",
            "Do not relax too much after an easier opening section because later sections usually move faster and feel denser.",
            "Save mental energy for Section 4, where one speaker may give many answer points in a short stretch."
          ], "Sections"),
          createNoteCard("Stay calm after a missed answer", [
            "Do not stop listening just because one item slipped away.",
            "Make a quick guess later if needed, but protect the questions that are still coming.",
            "Calm recovery is often worth more than chasing one lost answer."
          ], "Mindset"),
          createNoteCard("Final listening checklist", [
            "Recheck spelling, capital letters if needed, numbers, and singular/plural form.",
            "Make sure every answer respects the word limit printed in the instructions.",
            "If an answer feels too easy, ask whether the speaker later changed or corrected it."
          ], "Review"),
        ]));
      }

      if (kind === "writing") {
        resourceHubBadge.textContent = "Writing page";
        resourceHubTitle.textContent = "Writing tasks, model bands, and writing support";
        resourceHubSubtitle.textContent = "Separate task entry points and sample-answer guidance live here instead of crowding the homepage.";
        addSection("writing-full-exams", "Whole Writing Section", "Open the complete Writing section with both Task 1 and Task 2, plus the same writing submission flow used in the full exam.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.writing || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Whole Writing",
              title: `${R()?.getTestLabel?.(item.testId) || item.label} · Writing`,
              copy: "Launch the full Writing section with both tasks and submit it the same way as the full exam.",
              meta: ["Task 1 + Task 2", "Normal submission flow"],
              primaryLabel: "Open Writing",
              onPrimary: () => requireTestPassword(() => launchWritingOnly(item.testId), item.testId),
            }));
          });
          return grid;
        });
        addSection("writing-task1", "Writing Task 1", "Open Task 1-focused writing work from each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.writing || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Task 1",
              title: `${R()?.getTestLabel?.(item.testId) || item.label} · Task 1`,
              copy: "Launch writing and focus the student directly on Task 1.",
              meta: ["Visual / report task"],
              primaryLabel: "Open Task 1",
              onPrimary: () => requireTestPassword(() => launchWritingOnly(item.testId, "task1"), item.testId),
            }));
          });
          return grid;
        });
        addSection("writing-task2", "Writing Task 2", "Open Task 2-focused writing work from each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.writing || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Task 2",
              title: `${R()?.getTestLabel?.(item.testId) || item.label} · Task 2`,
              copy: "Launch writing and focus the student directly on Task 2.",
              meta: ["Essay task"],
              primaryLabel: "Open Task 2",
              onPrimary: () => requireTestPassword(() => launchWritingOnly(item.testId, "task2"), item.testId),
            }));
          });
          return grid;
        });
        addSection("writing-samples", "Sample answer libraries", "Open the dedicated sample-answer pages for Task 1 and Task 2 so the main Writing page stays lighter and easier to scan.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          grid.appendChild(createCatalogCard({
            kicker: "Sample library",
            title: "Writing Task 1 Samples",
            copy: "All available Task 1 prompts with sample answers and score explanations.",
            meta: ["Past prompts", "Future prompts", "Band guidance"],
            primaryLabel: "Open Task 1 library",
            onPrimary: () => openResourceHub("writingSamplesTask1"),
          }));
          grid.appendChild(createCatalogCard({
            kicker: "Sample library",
            title: "Writing Task 2 Samples",
            copy: "All available Task 2 prompts with sample answers and score explanations.",
            meta: ["Past prompts", "Future prompts", "Band guidance"],
            primaryLabel: "Open Task 2 library",
            onPrimary: () => openResourceHub("writingSamplesTask2"),
          }));
          return grid;
        });
        addSection("writing-tips", "Writing tips", "General writing guidance plus separate reminders for Task 1 and Task 2.", () => renderStaticTips([
          createNoteCard("Plan before you write", [
            "Spend a few minutes deciding your structure before you begin typing.",
            "A short plan usually saves time because your ideas come out in a cleaner order.",
            "Good planning improves Task Response and Coherence together."
          ], "General"),
          createNoteCard("Write for the task, not just the topic", [
            "Always match what the question asks: describe, compare, explain, discuss, or give an opinion.",
            "A strong answer can still lose marks if it answers the wrong task.",
            "Underline the instruction words before you start."
          ], "Task Response"),
          createNoteCard("Use clear paragraph roles", [
            "Each paragraph should have a job: overview, detail group, argument, explanation, or conclusion.",
            "Do not add paragraphs just to look academic; build them around clear ideas.",
            "Strong paragraph control makes the essay easier to follow and easier to score well."
          ], "Structure"),
          createNoteCard("Writing Task 1: overview first", [
            "In Task 1, the overview is one of the most important scoring features.",
            "After reading the visual, identify the biggest trends, highest and lowest points, or key comparisons.",
            "Save minor details for body paragraphs and keep the overview broad."
          ], "Task 1"),
          createNoteCard("Writing Task 1: group data logically", [
            "Do not describe every number one by one in random order.",
            "Group similar trends, similar categories, or time periods together.",
            "This makes the report feel analytical instead of mechanical."
          ], "Task 1"),
          createNoteCard("Writing Task 1: compare, do not list", [
            "IELTS rewards comparison language more than simple reporting.",
            "Show relationships such as higher than, lower than, similar to, doubled, or remained stable.",
            "Use figures as evidence, not as the whole paragraph."
          ], "Task 1"),
          createNoteCard("Writing Task 2: answer the exact question", [
            "If the essay asks for your opinion, make your position clear and keep it clear throughout.",
            "If it asks for both views, cover both fairly before you conclude.",
            "Never rely on a memorised essay shape without checking what the prompt really wants."
          ], "Task 2"),
          createNoteCard("Writing Task 2: develop ideas deeply", [
            "One well-explained idea is stronger than three shallow ideas.",
            "After each main point, add a reason, explanation, or realistic example.",
            "Ask yourself: why is this true, and what does it lead to?"
          ], "Task 2"),
          createNoteCard("Use examples that feel plausible", [
            "Your examples do not need to be personal or factual, but they should sound believable.",
            "Keep them short and useful; do not let one example become half the paragraph.",
            "Examples should support the main idea, not replace it."
          ], "Support"),
          createNoteCard("Control vocabulary and grammar", [
            "Do not force rare words if you cannot use them naturally.",
            "Accurate, flexible language scores better than ambitious but unstable language.",
            "Vary sentence structure, but stay readable and controlled."
          ], "Language"),
          createNoteCard("Manage time across both tasks", [
            "Task 2 normally deserves more time because it carries more weight.",
            "Leave a short final review window to catch grammar slips, missing articles, or repeated wording.",
            "Do not let Task 1 expand so much that Task 2 loses quality."
          ], "Timing"),
          createNoteCard("Final writing checklist", [
            "Check that every paragraph has a clear purpose and that your ideas answer the task directly.",
            "Look for repeated words, missing verbs, article mistakes, and punctuation slips.",
            "If your conclusion says something new, rewrite it to summarize your real position instead."
          ], "Review"),
        ]));
      }

      if (kind === "writingSamplesTask1") {
        resourceHubBadge.textContent = "Writing sample library";
        resourceHubTitle.textContent = "Writing Task 1 sample answers";
        resourceHubSubtitle.textContent = "Browse all available Task 1 prompts, choose a band score, read the sample answer, and open the score explanation only when you need it.";
        addSection("writing-task1-sample-library", "Task 1 sample library", "Every current and future Task 1 prompt can live here when sample-answer metadata is added.", () => renderWritingSampleLibrary("task1"));
      }

      if (kind === "writingSamplesTask2") {
        resourceHubBadge.textContent = "Writing sample library";
        resourceHubTitle.textContent = "Writing Task 2 sample answers";
        resourceHubSubtitle.textContent = "Browse all available Task 2 prompts, choose a band score, read the sample answer, and open the score explanation only when you need it.";
        addSection("writing-task2-sample-library", "Task 2 sample library", "Every current and future Task 2 prompt can live here when sample-answer metadata is added.", () => renderWritingSampleLibrary("task2"));
      }

      if (kind === "speaking") {
        resourceHubBadge.textContent = "Speaking page";
        resourceHubTitle.textContent = "Speaking practice, likely questions, tips, and sample answers";
        resourceHubSubtitle.textContent = "Keep speaking as its own dedicated page with both practice and coaching resources.";
        addSection("speaking-practice", "Practice speaking", "Open the live speaking workspace directly.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          grid.appendChild(createCatalogCard({
            kicker: "Speaking module",
            title: "IELTS Speaking Practice",
            copy: "Use the current speaking module for guided response flow and recording practice.",
            meta: ["Independent practice", "Voice workflow"],
            primaryLabel: "Open speaking",
            onPrimary: () => openSpeakingFromMenu(),
          }));
          return grid;
        });
        addSection("speaking-predicted", "Predicted speaking questions", "Use likely prompt themes as warm-up or homework material.", () => renderStaticTips([
          createNoteCard("People and relationships", ["Describe someone who influenced you.", "Describe a helpful friend or teacher."], "Likely theme"),
          createNoteCard("Places and experiences", ["Describe a place you would like to revisit.", "Describe a crowded place you have been to."], "Likely theme"),
          createNoteCard("Habits and routines", ["Describe a skill you want to improve.", "Describe something you do to stay focused."], "Likely theme"),
        ]));
        addSection("speaking-tips", "Tips for speaking", "General speaking strategy plus part-specific reminders students can use before practice.", () => renderStaticTips([
          createNoteCard("Keep fluency moving", [
            "A small mistake is usually less damaging than stopping completely.",
            "If you lose a word, explain the idea another way and keep going.",
            "The examiner is listening for communication, not perfection in every second."
          ], "General"),
          createNoteCard("Expand every answer once", [
            "After your first answer, add one more layer: an example, a reason, a feeling, or a short story.",
            "This helps answers sound natural instead of too short.",
            "Think in patterns like point plus support, not just point alone."
          ], "Development"),
          createNoteCard("Use natural signposting", [
            "Simple phrases like 'for example', 'actually', 'to be honest', and 'the main reason is' help you sound organized.",
            "Use signposting to connect ideas, not to fill silence mechanically.",
            "Natural transitions usually score better than memorised templates."
          ], "Coherence"),
          createNoteCard("Part 1: stay direct and personal", [
            "Answer the question first, then add a short detail from your own experience.",
            "Do not turn Part 1 into a mini-essay; keep it conversational.",
            "Aim for 2 to 4 developed sentences rather than one-word answers."
          ], "Part 1"),
          createNoteCard("Part 2: plan the cue card fast", [
            "Use the one-minute preparation time to note keywords, not full sentences.",
            "Make a simple beginning, middle, and ending so the talk keeps moving.",
            "Cover every bullet point, but do not sound like you are reading a checklist."
          ], "Part 2"),
          createNoteCard("Part 2: keep speaking for the full time", [
            "If you finish the main story early, add details about how you felt, why it mattered, or what happened after.",
            "Extra detail is usually safer than stopping too soon.",
            "Think of who, where, when, what, why, and how to extend naturally."
          ], "Part 2"),
          createNoteCard("Part 3: think bigger than yourself", [
            "These questions often need broader opinions, comparisons, or social ideas, not just personal examples.",
            "State your view clearly, then explain why and support it.",
            "If the topic feels abstract, compare past and present or individual and society."
          ], "Part 3"),
          createNoteCard("Pronunciation is clarity first", [
            "You do not need a British or American accent to score well.",
            "Clear word stress, clear endings, and natural pacing matter more than accent imitation.",
            "Slow down slightly if clarity drops when you speak quickly."
          ], "Pronunciation"),
          createNoteCard("Lexical resource without overreaching", [
            "Use vocabulary you truly control instead of forcing rare words.",
            "Paraphrase naturally when a perfect word does not come immediately.",
            "Flexible everyday language often sounds stronger than memorised 'high-band' phrases."
          ], "Vocabulary"),
          createNoteCard("Recover smoothly when you get stuck", [
            "If you freeze, use a bridge like 'let me think for a second' or 'what I mean is'.",
            "Then restart with a simpler version of the same idea.",
            "A calm recovery usually sounds better than a long silence."
          ], "Recovery"),
          createNoteCard("Final speaking checklist", [
            "Answer the question directly, then extend once.",
            "Keep a steady pace and make sure your words stay clear.",
            "Sound natural, engaged, and willing to communicate, not memorised."
          ], "Review"),
        ]));
        addSection("speaking-samples", "Sample answers", "Use sample structures as models for pacing and development, not scripts to memorize.", () => renderStaticTips([
          createNoteCard("Short sample structure", ["Answer directly.", "Add one concrete detail.", "Finish with a feeling or conclusion."], "Part 1"),
          createNoteCard("Cue-card sample structure", ["Set the scene.", "Cover each bullet point.", "Close with why it mattered."], "Part 2"),
          createNoteCard("Discussion sample structure", ["State your view.", "Explain why.", "Give an example or contrast.", "Conclude clearly."], "Part 3"),
        ]));
      }

      if (kind === "contact") {
        resourceHubBadge.textContent = "Contact";
        resourceHubTitle.textContent = "Contact IELTS Mock";
        resourceHubSubtitle.textContent = "Use the support email or send a direct contact form message to the IELTS Mock team.";
        addSection("contact-overview", "Contact details", "Use the support email or the form below for technical issues, account support, feedback, or general contact.", () => createContactSection());
      }

      if (focusId) {
        setTimeout(() => document.getElementById(focusId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 40);
      }
    }

function startFreshExam() {
      try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
      resetEngineInitFlags();
      clearAllStudentAttemptKeys();
      R()?.setLaunchContext?.({
        mode: "full",
        testId: window.IELTS?.Registry?.getActiveTestId?.() || "ielts1",
      });
      safe(() => Modal().hideModal());

      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("listening"); } catch (e) {}
      try { UI().setExamNavStatus("Status: Listening in progress"); } catch (e) {}
      setExamRouteForLaunch((window.IELTS?.Registry?.getActiveTestId?.() || "ielts1"), "listening");

      try {
        startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to start:', e));
      } catch (e) {
        console.error("Listening failed to start:", e);
        try { showNotice("Listening failed to load. Please refresh once and try again.", "Listening"); } catch (_) {}
      }

      // if audio already bound, ensure fallback ended listener exists
      const a = document.getElementById("listeningAudio");
      if (a && !a.dataset.gateBound) {
        a.dataset.gateBound = "1";
        a.addEventListener("ended", () => {
          setTimeout(showListeningGate, 400);
          setTimeout(showListeningGate, 1200);
        });
      }
    }

    function startFreshExamForTest(testId) {
      try { setActiveTestId(testId); } catch (e) {}
      startFreshExam();
    }

    function startAssignedPractice(assignmentTargetId) {
      const value = String(assignmentTargetId || "").trim();
      assignmentLaunchDebugLog("startAssignedPractice:enter", {
        assignmentTargetId,
        value,
        activeViewBefore: document.body?.dataset?.activeView || "",
        hashBefore: window.location.hash,
        pathBefore: window.location.pathname,
      });
      if (!value.startsWith("practice|")) return false;
      const parts = value.split("|");
      const type = parts[1] || "";
      const testId = parts[2] || (R()?.TESTS?.defaultTestId || "ielts1");
      const scope = parts[3] || "";
      assignmentLaunchDebugLog("startAssignedPractice:parsed", { type, testId, scope, parts });
      if (type === "reading") {
        if (scope && scope.startsWith("section")) {
          launchReadingOnly(testId, `part${String(scope).replace("section", "")}`);
          return true;
        }
        launchReadingOnly(testId);
        return true;
      }
      if (type === "listening") {
        if (scope && scope.startsWith("section")) {
          const pageIndex = Number(String(scope).replace("section", "")) - 1;
          launchListeningOnly(testId, Number.isFinite(pageIndex) ? pageIndex : undefined);
          return true;
        }
        launchListeningOnly(testId);
        return true;
      }
      if (type === "writing") {
        if (scope === "task1" || scope === "task2") {
          launchWritingOnly(testId, scope);
          return true;
        }
        launchWritingOnly(testId);
        return true;
      }
      if (type === "reading-task") {
        const taskType = parts[2] || "";
        if (taskType) {
          launchReadingPractice(taskType);
          return true;
        }
      }
      return false;
    }

    window.IELTS = window.IELTS || {};
    window.IELTS.App = window.IELTS.App || {};
    window.IELTS.App.startFreshExamForTest = startFreshExamForTest;
    window.IELTS.App.startAssignedPractice = startAssignedPractice;
    window.IELTS.App.launchListeningOnly = launchListeningOnly;
    window.IELTS.App.launchReadingOnly = launchReadingOnly;
    window.IELTS.App.launchWritingOnly = launchWritingOnly;
    window.IELTS.App.launchReadingPractice = launchReadingPractice;
    window.IELTS.App.leavePracticeReviewToHome = leavePracticeReviewToHome;
    window.IELTS.App.startFreshExam = startFreshExam;
    window.IELTS.App.startFreshExamByAssignment = function (testId) {
      try { setActiveTestId(testId); } catch (e) {}
      try { startFreshExam(); } catch (e) {}
    };
    window.IELTS.Practice = window.IELTS.Practice || {};
    window.IELTS.Practice.submitObjectiveSection = submitObjectiveSectionPractice;
    window.IELTS.Practice.buildPracticeExamId = derivePracticeExamId;
    window.IELTS.Practice.buildPracticeLabel = derivePracticeLabel;

    if (startBtn) startBtn.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); }, "ielts1");
    if (startBtn2) startBtn2.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); }, "ielts1");
    if (startBtnT2) startBtnT2.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts2"); startFreshExam(); }, "ielts2");
    if (startBtnT2b) startBtnT2b.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts2"); startFreshExam(); }, "ielts2");
    if (startBtnT3) startBtnT3.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts3"); startFreshExam(); }, "ielts3");
    if (startBtnT3b) startBtnT3b.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts3"); startFreshExam(); }, "ielts3");
    if (footerStartTest1Btn) footerStartTest1Btn.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); }, "ielts1");
    if (homeStartFullMockBtn && homeStartFullMockBtn.tagName === "BUTTON") homeStartFullMockBtn.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); }, "ielts1");
    const homePlacementStartBtn = $("homePlacementStartBtn");
    if (homePlacementStartBtn && homePlacementStartBtn.tagName === "BUTTON") homePlacementStartBtn.onclick = () => { UI().showOnly("placementTest"); try { Router().setHashRoute(getActiveTestId(), "placementTest"); } catch(e) {} };
    if (homeHeroFocusStartBtn) homeHeroFocusStartBtn.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); }, "ielts1");
    if (homeOpenAssignmentsBtn) homeOpenAssignmentsBtn.onclick = () => {
      if (!window.IELTS?.Auth?.isSignedIn?.()) {
        window.IELTS?.Auth?.openLoginGate?.("Please log in to open assignments.");
        return;
      }
      const assignmentsSection = $("studentAssignmentsSection");
      if (assignmentsSection && !assignmentsSection.classList.contains("hidden")) {
        assignmentsSection.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      openHistoryFromMenu();
    };
    if (homeOpenHistoryQuickBtn) homeOpenHistoryQuickBtn.onclick = () => openHistoryFromMenu();
    if (openDashboardBtn) openDashboardBtn.onclick = (e) => {
      e.preventDefault();
      if (!window.IELTS?.Auth?.isSignedIn?.()) {
        window.IELTS?.Auth?.openLoginGate?.("Please log in to open your dashboard.");
        return;
      }
      toggleAccountMenu();
    };
    if (footerOpenContactBtn) footerOpenContactBtn.onclick = () => openResourceHub("contact");
    if (menuDashboardProfileBtn) menuDashboardProfileBtn.onclick = () => { closeAccountMenu(); requireSignedIn(() => window.IELTS?.Dashboard?.openTab?.("overview"), "Please log in to open your profile."); };
    if (menuDashboardSettingsBtn) menuDashboardSettingsBtn.onclick = () => { closeAccountMenu(); requireSignedIn(() => window.IELTS?.Dashboard?.openTab?.("settings"), "Please log in to open your settings."); };
    if (menuHistoryBtn) menuHistoryBtn.onclick = () => openHistoryFromMenu();
    if (menuSpeakingBtn) menuSpeakingBtn.onclick = () => openSpeakingFromMenu();
    if (menuToggleAdminViewBtn) menuToggleAdminViewBtn.onclick = () => toggleAdminViewFromMenu();
    if (adminResultsBtn) adminResultsBtn.onclick = () => openAdminResultsView(false, "full");
    if (adminPageResultsBtn) adminPageResultsBtn.onclick = () => openAdminResultsView(false, adminState.mode);
    if (adminPageClassroomsBtn) adminPageClassroomsBtn.onclick = () => openAdminClassroomsView().catch((e) => setClassroomProgressStatus(e?.message || "Could not open classrooms.", "error"));
    if (adminPageAssignmentsBtn) adminPageAssignmentsBtn.onclick = () => { UI().showOnly("adminResults"); window.IELTS?.Assignments?.openAssignmentsPage?.(); };
    if (adminPageQuestionAnalyticsBtn) adminPageQuestionAnalyticsBtn.onclick = () => {
      openAdminQuestionAnalyticsView().catch((e) => setQuestionAnalyticsStatus(e?.message || "Could not open question analytics.", "error"));
    };
    const adminPageQuestionsBtn = $("adminPageQuestionsBtn");
    if (adminPageQuestionsBtn) adminPageQuestionsBtn.onclick = () => { UI().showOnly("adminResults"); setAdminPage("questions"); loadAdminPendingQuestions(); };
    const adminQuestionsRefreshBtn = $("adminQuestionsRefreshBtn");
    if (adminQuestionsRefreshBtn) adminQuestionsRefreshBtn.onclick = () => loadAdminPendingQuestions();
    if (adminClassroomsToggleBtn) adminClassroomsToggleBtn.onclick = () => {
      if (adminState.page === "classrooms") openAdminResultsView(false, adminState.mode);
      else openAdminClassroomsView().catch((e) => setClassroomProgressStatus(e?.message || "Could not open classrooms.", "error"));
    };
    if (adminClassroomsRefreshBtn) adminClassroomsRefreshBtn.onclick = () => loadClassroomAdminData(true).catch(() => null);
    if (adminClassroomProgressRefreshBtn) {
      adminClassroomProgressRefreshBtn.onclick = () =>
        Promise.all([
          loadClassroomProgressData(true),
          loadClassroomCoverageData(true),
        ]).catch((e) => setClassroomProgressStatus(e?.message || "Could not load class progress.", "error"));
    }
    if (adminClassroomManagementPanel) {
      adminClassroomManagementPanel.addEventListener("toggle", () => {
        if (adminClassroomManagementPanel.open) {
          loadClassroomAdminData(true).catch((e) => setClassroomStatus(e?.message || "Could not load classrooms.", "error"));
        }
      });
    }
    if (adminCreateClassroomBtn) adminCreateClassroomBtn.onclick = () => createClassroomFromAdmin().catch((e) => setClassroomStatus(e?.message || "Could not create classroom.", "error"));
    if (adminSaveStudentBtn) adminSaveStudentBtn.onclick = () => saveStudentFromAdmin().catch((e) => setClassroomStatus(e?.message || "Could not save student.", "error"));
    if (adminMoveStudentClassroomBtn) adminMoveStudentClassroomBtn.onclick = () => moveSelectedStudentToClassroom().catch((e) => setClassroomStatus(e?.message || "Could not move student to classroom.", "error"));
    if (adminRemoveStudentClassroomBtn) adminRemoveStudentClassroomBtn.onclick = () => removeSelectedStudentFromClassroom().catch((e) => setClassroomStatus(e?.message || "Could not remove student from classroom.", "error"));
    if (adminResetStudentLinkBtn) adminResetStudentLinkBtn.onclick = () => resetSelectedStudentLink().catch((e) => setClassroomStatus(e?.message || "Could not reset linked account.", "error"));
    if (adminStudentProgressCloseBtn) adminStudentProgressCloseBtn.onclick = () => $("adminStudentProgressDetail")?.classList.add("hidden");
    if (adminStudentSearchInput) adminStudentSearchInput.addEventListener("input", renderClassroomStudents);
    if (adminClassroomStudentSearchInput) adminClassroomStudentSearchInput.addEventListener("input", () => renderSelectedClassroomWorkspace());
    if (adminClassroomSelect) adminClassroomSelect.addEventListener("change", () => {
      classroomProgressState.selectedClassroomId = String(adminClassroomSelect.value || "");
      renderSelectedClassroomWorkspace();
      $("adminStudentProgressDetail")?.classList.add("hidden");
      if (adminState.page === "questionAnalytics") {
        loadQuestionAnalytics(false).catch(() => null);
      }
    });
    if (adminClassCoverageTestFilter) adminClassCoverageTestFilter.addEventListener("change", () => {
      classroomCoverageState.selectedTestId = String(adminClassCoverageTestFilter.value || "");
      renderClassroomCoverageWorkspace();
    });
    if (adminClassCoverageScopeFilter) adminClassCoverageScopeFilter.addEventListener("change", () => {
      classroomCoverageState.scope = String(adminClassCoverageScopeFilter.value || "") === "untaken" ? "untaken" : "all";
      renderClassroomCoverageWorkspace();
    });
    if (adminQuestionAnalyticsRefreshBtn) adminQuestionAnalyticsRefreshBtn.onclick = () => loadQuestionAnalytics(true);
    if (qaSectionFilter) qaSectionFilter.addEventListener("change", () => loadQuestionAnalytics(false));
    if (qaClassroomFilter) qaClassroomFilter.addEventListener("change", () => loadQuestionAnalytics(false));
    if (qaTestFilter) qaTestFilter.addEventListener("change", () => loadQuestionAnalytics(false));
    if (qaMinAttemptsFilter) qaMinAttemptsFilter.addEventListener("change", () => loadQuestionAnalytics(false));
    if (qaDifficultyFilter) qaDifficultyFilter.addEventListener("change", () => loadQuestionAnalytics(false));
    if (qaQuestionFilter) qaQuestionFilter.addEventListener("change", () => loadQuestionAnalytics(false));
    if (adminExistingAccountSearch) adminExistingAccountSearch.addEventListener("input", renderExistingAccountMatches);
    if (adminResultsHomeBtn) adminResultsHomeBtn.onclick = () => {
      UI().showOnly("home");
      try { history.replaceState({}, "", "/"); } catch (e) {}
      UI().updateHomeStatusLine();
      renderHomeResumeAction();
      UI().setExamNavStatus("Status: Home");
    };
    if (adminResultsModeFullBtn) adminResultsModeFullBtn.onclick = () => openAdminResultsView(false, "full");
    if (adminResultsModePracticeBtn) adminResultsModePracticeBtn.onclick = () => openAdminResultsView(false, "practice");
    const adminResultsModeDiagnosticBtn = $("adminResultsModeDiagnosticBtn");
    if (adminResultsModeDiagnosticBtn) adminResultsModeDiagnosticBtn.onclick = () => openAdminResultsView(false, "diagnostic");
    if (navResultsBtn) navResultsBtn.onclick = () => openAdminResultsView(false, "full");
    if (adminRefreshBtn) adminRefreshBtn.onclick = () => openAdminResultsView(true);
    if (adminExportBtn) adminExportBtn.onclick = () => exportAdminRowsCsv();
    renderHomeMenus();
    renderHomeMetrics();
    if (pendingStartupRouteAction) {
      setTimeout(() => {
        try {
          pendingStartupRouteAction();
        } catch (e) {}
      }, 0);
    }
    if (pendingResourceHubKind) {
      openResourceHub(pendingResourceHubKind);
    }
    if (pendingPlacementStartupRoute) {
      try { UI().showOnly("placementTest"); } catch (e) {}
    }
    if (pendingVocabularyStartupRoute) {
      try {
        if (window.IELTS?.Auth?.isSignedIn?.()) {
          window.IELTS?.Vocabulary?.open?.("dashboard");
        } else {
          UI().showOnly("vocabulary");
          window.IELTS?.Auth?.openLoginGate?.("Please log in to open Vocabulary.");
        }
      } catch (e) {}
    }
    if (pendingRecentQuestionsStartupRoute) {
      try {
        UI().showOnly("recentQuestions");
        window.IELTS?.RecentQuestions?.render?.();
      } catch (e) {}
    }
    if (resourceHubBackBtn) resourceHubBackBtn.onclick = () => {
      UI().showOnly("home");
      try { history.replaceState({}, "", "/"); } catch (e) {}
      renderHomeResumeAction();
      UI().setExamNavStatus("Status: Home");
    };
    $("dashboardOpenVocabularyBtn")?.addEventListener("click", () => {
      window.IELTS?.Vocabulary?.open?.();
    });
    $("adminResultsSearch")?.addEventListener("input", applyAdminFilters);
    $("adminResultsExamFilter")?.addEventListener("change", applyAdminFilters);
    $("adminResultsMonthFilter")?.addEventListener("change", applyAdminFilters);
    $("adminResultsYearFilter")?.addEventListener("change", applyAdminFilters);
    $("adminResultsClassFilter")?.addEventListener("change", applyAdminFilters);
    $("adminResultsSort")?.addEventListener("change", applyAdminFilters);
    window.addEventListener("ielts:viewmodechange", (event) => {
      syncAdminToggleMenu();
      if (event?.detail?.isAdmin && document.body?.dataset?.activeView === "adminResults") {
        prefetchAdminResults().catch(() => {});
      }
      setTimeout(reconcileStartupRoute, 0);
    });
    window.addEventListener("ielts:authchanged", () => {
      syncAdminToggleMenu();
      setTimeout(reconcileStartupRoute, 0);
      refreshHomePlacementPreview().catch(() => {});
    });
    syncAdminToggleMenu();

    // ── New pages init ──────────────────────────────────────────────────────────────
    try { window.IELTS?.Grammar?.init?.(); } catch (e) {}
    try { window.IELTS?.PlacementTest?.init?.(); } catch (e) {}
    try { window.IELTS?.ResourcesPage?.init?.(); } catch (e) {}
    try { window.IELTS?.RecentQuestions?.init?.(); } catch (e) {}
    // ── End new pages init ───────────────────────────────────────────────────────

    // ── Assignments module init ──────────────────────────────────────────────
    try { window.IELTS?.Assignments?.init?.(); } catch (e) {}
    // Reload student assignments when auth state changes (sign-in / sign-out)
    window.addEventListener("ielts:authchanged", () => {
      try { window.IELTS?.Assignments?.clearAccessCache?.(); } catch (e) {}
      if (!isAdminView() && window.IELTS?.Auth?.isSignedIn?.()) {
        window.IELTS?.Assignments?.loadStudentAssignments?.();
      }
    });
    // Load student assignments on first load if already signed in
    if (!isAdminView() && window.IELTS?.Auth?.isSignedIn?.()) {
      try { window.IELTS?.Assignments?.loadStudentAssignments?.(); } catch (e) {}
    }
    refreshHomePlacementPreview().catch(() => {});
    // ── End Assignments init ─────────────────────────────────────────────────

    window.addEventListener("focus", () => {
      renderHomeResumeAction();
      refreshHomePlacementPreview().catch(() => {});
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        renderHomeResumeAction();
        refreshHomePlacementPreview().catch(() => {});
      }
    });
    setTimeout(reconcileStartupRoute, 0);
    setTimeout(() => { try { window.IELTS?.Router?.initFromPath?.(); } catch (e) {} }, 0);
    $("adminDetailCloseBtn")?.addEventListener("click", closeAdminDetail);
    $("adminResultsTbody")?.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-admin-view]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-admin-view"));
      const row = adminState.filtered[idx];
      if (row) renderAdminDetail(row, { sourceRowId: btn.getAttribute("data-admin-row-id") || null });
    });

    // If student refreshes after Listening is already submitted, show gate (not auto-reading).
    // BUT: if they landed on home / no hash with an active attempt, the gates must NOT
    // hijack the screen — show the "Resume or Leave?" prompt instead.  The gates will
    // fire naturally once the student returns to their section via the prompt.
    if (!isAdminView()) {
      const startupView = (safe(() => Router().parseHashRoute()?.view)) || "";
      if (!isExamRouteView(startupView) && hasResumableStudentAttempt()) {
        // Suppress gates while the resume prompt is open.
        try { window.__IELTS_SUPPRESS_AUTO_GATES__ = true; } catch (e) {}
        const resumeView = getResumableStudentView();
        if (resumeView) {
          promptResumeStudentExamRoute({ view: resumeView, testId: getActiveTestId() });
        } else {
          // No deterministic section to resume — release suppression and run gates normally.
          try { window.__IELTS_SUPPRESS_AUTO_GATES__ = false; } catch (e) {}
          showListeningGate();
          showReadingGate();
        }
      } else {
        showListeningGate();
        showReadingGate();
      }
    }

    document.addEventListener("click", (e) => {
      if (!homeAccountDropdown || !openDashboardBtn) return;
      const trigger = e.target?.closest?.("#openDashboardBtn");
      const inside = e.target?.closest?.("#homeAccountDropdown");
      if (!trigger && !inside) closeAccountMenu();
    });

    document.addEventListener("click", (e) => {
      const trigger = e.target?.closest?.(".home-skill-trigger");
      const inside = e.target?.closest?.(".home-skill-dropdown");
      if (!trigger && !inside) {
        document.querySelectorAll(".home-skill-dropdown").forEach((el) => el.classList.add("hidden"));
      }
    });

    // End of main init
  });

  // -----------------------------
  // Fallback handlers: ensure buttons work even if earlier init threw
  // -----------------------------
  (function () {
    function safeCall(fnPath, args) {
      try {
        const parts = fnPath.split('.');
        let fn = window;
        for (const p of parts) { if (!fn) { fn = undefined; break; } fn = fn[p]; }
        if (typeof fn === 'function') return fn.apply(null, args || []);
      } catch (e) {
        console.error('safeCall error', fnPath, e);
      }
    }

    function installFallback() {
      if (window.__IELTS_FALLBACK_INSTALLED__) return;
      window.__IELTS_FALLBACK_INSTALLED__ = true;

      document.addEventListener('click', function (e) {
        const b = e.target.closest && e.target.closest('button');
        if (!b) return;
        const id = b.id || (b.textContent && b.textContent.trim());
        try {
          if (id === 'startIelts1Btn' || /Start Test 1|Open Test 1/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts1']);
            return;
          }
          if (id === 'startIelts2Btn' || /Start Test 2|Open Test 2/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts2']);
            return;
          }
          if (id === 'startIelts3Btn' || /Start Test 3|Open Test 3/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts3']);
            return;
          }
          if (id === 'startIelts4Btn' || /Start Test 4|Open Test 4/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts4']);
            return;
          }
          if (id === 'startIelts5Btn' || /Start Test 5|Open Test 5/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts5']);
            return;
          }
          if (id === 'startIelts6Btn' || /Start Test 6|Open Test 6/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts6']);
            return;
          }
          if (id === 'startIelts7Btn' || /Start Test 7|Open Test 7/i.test(id)) {
            safeCall('IELTS.App.startFreshExamForTest', ['ielts7']);
            return;
          }
          if (id === 'dashboardOpenVocabularyBtn' || /Open vocabulary/i.test(id)) {
            safeCall('IELTS.Vocabulary.open');
            return;
          }
          if (id === 'openHistoryBtn' || /My History/i.test(id)) {
            safeCall('IELTS.History.openHistory');
            return;
          }
          if (id === 'historyBackBtn') {
            safeCall('IELTS.History.closeHistory');
            safeCall('IELTS.UI.showOnly', ['home']);
            return;
          }
          if (id === 'historyDetailCloseBtn') {
            safeCall('IELTS.History.closeHistory');
            return;
          }
          if (id === 'openSpeakingExamBtn') {
            safeCall('IELTS.Speaking.initSpeakingExam');
            safeCall('IELTS.UI.showOnly', ['speaking']);
            return;
          }
          if (id === 'backFromSpeakingBtn') {
            safeCall('IELTS.UI.showOnly', ['home']);
            safeCall('IELTS.UI.setExamNavStatus', ['Status: Home']);
            return;
          }
          if (id === 'navToHomeBtn' || id === 'navToListeningBtn' || id === 'navToReadingBtn' || id === 'navToWritingBtn' || id === 'navToResultsBtn') {
            // best-effort: call the UI navigation helpers
            if (id === 'navToHomeBtn') {
              try { const la = document.getElementById('listeningAudio'); if (la && !la.paused) { la.pause(); la.currentTime = 0; } } catch (e) {}
              try { const sp = document.getElementById('speakingPlayback'); if (sp && !sp.paused) { sp.pause(); sp.currentTime = 0; } } catch (e) {}
              safeCall('IELTS.UI.showOnly', ['home']);
              safeCall('IELTS.UI.updateHomeStatusLine');
              return;
            }
            if (id === 'navToListeningBtn') {
              safeCall('IELTS.UI.setExamStarted', [true]);
              safeCall('IELTS.Engines.Listening.initListeningSystem');
              safeCall('IELTS.UI.showOnly', ['listening']);
              return;
            }
            if (id === 'navToReadingBtn') {
              safeCall('IELTS.UI.setExamStarted', [true]);
              safeCall('IELTS.Engines.Reading.startReadingSystem');
              safeCall('IELTS.UI.showOnly', ['reading']);
              return;
            }
            if (id === 'navToWritingBtn') {
              safeCall('IELTS.UI.setExamStarted', [true]);
              safeCall('IELTS.Engines.Writing.startWritingSystem');
              safeCall('IELTS.UI.showOnly', ['writing']);
              return;
            }
            if (id === 'navToResultsBtn') {
              safeCall('IELTS.UI.showOnly', ['adminResults']);
              return;
            }
          }
          if (id === 'logoutBtn' || /Log out/i.test(id)) {
            safeCall('IELTS.Auth.logout');
            return;
          }
        } catch (err) {
          console.error('fallback handler failed', err);
        }
      }, { capture: true });

    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', installFallback, { once: true });
    } else {
      installFallback();
    }
  })();

})();
