/* assets/js/ui.js (patched: fixed showOnly + clean submitted UX + attempt-based reset/new attempt) */
(function () {
  "use strict";

  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  function $(id) {
    return document.getElementById(id);
  }

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch {
      return false;
    }
  }

  function setExamNavStatus(text) {
    const el = $("examNavStatus");
    if (el) el.textContent = text;
  }

  function showExamNav(show) {
    const nav = $("examNav");
    if (!nav) return;
    nav.classList.toggle("hidden", !show);
  }

  function showOnly(view) {
    const home = $("homeSection");
    const listening = $("listeningSection");
    const readingControls = $("readingControls");
    const readingContainer = $("container");
    const writing = $("writingSection");

    const isHome = view === "home";
    const isListening = view === "listening";
    const isReading = view === "reading";
    const isWriting = view === "writing";

    if (home) home.classList.toggle("hidden", !isHome);
    if (listening) listening.classList.toggle("hidden", !isListening);
    if (readingControls) readingControls.classList.toggle("hidden", !isReading);
    if (readingContainer) readingContainer.classList.toggle("hidden", !isReading);
    if (writing) writing.classList.toggle("hidden", !isWriting);

    showExamNav(!isHome);

    // Remember last view (attempt-scoped via Storage)
    try {
      S()?.set(R().KEYS.HOME_LAST_VIEW, view);
    } catch {}

    // Sync hash route if router is available
    try {
      const router = window.IELTS?.Router;
      if (router?.setHashRoute) {
        if (view === "home") {
          if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        } else {
          router.setHashRoute("ielts1", view);
        }
      }
    } catch {}
  }

  function setExamStarted(v) {
    try {
      // ensure attempt exists when exam starts
      if (v) S()?.ensureAttemptId?.();
      S().set(R().KEYS.EXAM_STARTED, v ? "true" : "false");
    } catch {}
  }

  function updateHomeStatusLine(text) {
    const el = $("homeStatusLine");
    if (!el) return;
    el.textContent =
      (typeof text === "string" && text.trim()) ? text : "Status: Ready";
  }

  function formatTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  }

  function wordCount(text) {
    return String(text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function isValidFullName(name) {
    const s = String(name || "").trim();
    if (!s) return false;
    // at least 2 parts
    const parts = s.split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.every((p) => p.length >= 2);
  }

  function clearReadingLockStyles() {
    document.body.classList.remove("reading-locked");
  }

  function lockWholeExamAfterFinalSubmit() {
    // used by writing engine; keep but do not break homepage UX
    try {
      setExamNavStatus("Status: Submitted");
    } catch {}
  }

  function resetExamAttempt() {
    // Admin-only full reset (clears ALL attempts + legacy keys)
    if (!isAdminView()) return;
    try {
      S()?.clearAllAttemptsAndLegacy?.();
    } catch {}
    try { location.hash = ""; } catch {}
    location.reload();
  }

  function newAttempt() {
    // Admin-only "New attempt" that does NOT wipe prior attempts
    if (!isAdminView()) return;
    try {
      S()?.startNewAttempt?.();
      // clear started/last view for the new attempt (attempt-scoped)
      S()?.set(R().KEYS.EXAM_STARTED, "false");
      S()?.set(R().KEYS.HOME_LAST_VIEW, "home");
      S()?.set(R().EXAM.keys.finalSubmitted, "false");
    } catch {}
    try { location.hash = ""; } catch {}
    // Do not reload; just show home cleanly
    showOnly("home");
    updateHomeStatusLine("Status: Ready (new attempt)");
    setExamNavStatus("Status: Ready");
  }

  function applyStudentLockdownUI() {
    // Hide admin-only buttons on home for students
    if (!isAdminView()) {
      $("homeNewAttemptBtn")?.classList.add("hidden");
      $("cardResetBtn")?.classList.add("hidden");
      $("resetExamBtn")?.classList.add("hidden");
    }
  }

  function showSubmittedOverlay(text) {
    // NEW UX: do NOT hide everything globally.
    // Student: show home with a clear message and disable Start.
    // Admin: show home with "New attempt" available.
    showOnly("home");
    setExamNavStatus("Status: Submitted");
    updateHomeStatusLine(text || "Status: Submitted");

    const startBtn = $("startIelts1Btn");
    if (startBtn && !isAdminView()) {
      startBtn.disabled = true;
      startBtn.classList.add("disabled");
    }
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.UI = {
    $,
    showOnly,
    setExamNavStatus,
    setExamStarted,
    updateHomeStatusLine,
    formatTime,
    wordCount,
    isValidFullName,
    clearReadingLockStyles,
    lockWholeExamAfterFinalSubmit,
    resetExamAttempt,
    newAttempt,
    applyStudentLockdownUI,
    showSubmittedOverlay,
  };
})();
