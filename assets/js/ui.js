/* assets/js/ui.js */
(function () {
  "use strict";

  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

  function $(id) {
    return document.getElementById(id);
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
    // Home
    const home = $("homeSection");

    // Listening
    const listening = $("listeningSection");

    // Reading (not wrapped in a section in your HTML)
    const readingControls = $("readingControls");
    const readingContainer = $("container");

    // Writing
    const writing = $("writingSection");

    // Modal should not be auto-hidden here (modal controls itself)
    const isHome = view === "home";
    const isListening = view === "listening";
    const isReading = view === "reading";
    const isWriting = view === "writing";

    if (home) home.classList.toggle("hidden", !isHome);

    if (listening) listening.classList.toggle("hidden", !isListening);

    if (readingControls) readingControls.classList.toggle("hidden", !isReading);
    if (readingContainer) readingContainer.classList.toggle("hidden", !isReading);

    if (writing) writing.classList.toggle("hidden", !isWriting);

    // Exam nav hidden on home, visible elsewhere
    showExamNav(!isHome);

    // Remember last view (optional, used by app.js auto-resume)
    try {
      S()?.set(R().KEYS.HOME_LAST_VIEW, view);
    } catch {}
  }

  function setExamStarted(v) {
    try {
      S().set(R().KEYS.EXAM_STARTED, v ? "true" : "false");
    } catch {}
  }

  function updateHomeStatusLine(text) {
    const el = $("homeStatusLine");
    if (el) el.textContent = text;
  }

  function formatTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    const m = String(mm).padStart(2, "0");
    const se = String(ss).padStart(2, "0");
    return `${m}:${se}`;
  }

  function wordCount(text) {
    const t = String(text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  // Simple “two words minimum” name check
  function isValidFullName(name) {
    const n = String(name || "").trim().replace(/\s+/g, " ");
    if (n.length < 3) return false;
    const parts = n.split(" ");
    if (parts.length < 2) return false;
    // avoid single-letter parts like "A B"
    if (parts.some((p) => p.length < 2)) return false;
    return true;
  }

  function clearReadingLockStyles() {
    const c = $("container");
    if (!c) return;
    c.style.pointerEvents = "";
    c.style.filter = "";
    c.style.userSelect = "";
  }

  function lockWholeExamAfterFinalSubmit() {
    // Used after final submit: make everything view-only
    const listening = $("listeningSection");
    const readingControls = $("readingControls");
    const readingContainer = $("container");
    const writing = $("writingSection");

    listening?.classList.add("view-only");
    readingControls?.classList.add("view-only");
    readingContainer?.classList.add("view-only");
    writing?.classList.add("view-only");
  }

  function resetExamAttempt() {
    // Clear saved keys and go home
    // Prefix-based cleanup is safest
    try {
      S().removeByPrefixes([
        "IELTS:",
        "ielts-reading-",
        "ielts-writing-",
        "ielts-full-",
      ]);
    } catch {}

    // Also clear a couple known keys explicitly
    try {
      S().remove(R().EXAM.keys.finalSubmission);
      S().remove(R().EXAM.keys.finalSubmitted);
      S().remove(R().KEYS.EXAM_STARTED);
      S().remove(R().KEYS.HOME_LAST_VIEW);
    } catch {}

    // Hard reload to reset one-time init guards
    location.hash = "";
    location.reload();
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
  };
})();
