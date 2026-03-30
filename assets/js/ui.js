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

  function setExamNavTimer(text) {
    const el = $("examNavTimer");
    if (!el) return;
    const t = (typeof text === "string") ? text.trim() : "";
    el.textContent = t || "";
    el.classList.toggle("hidden", !t);
  }

  function updateExamNavHeightVar() {
    try {
      const nav = $("examNav");
      if (!nav || nav.classList.contains("hidden")) {
        document.documentElement.style.setProperty("--exam-nav-h", "0px");
        return;
      }
      const h = Math.max(0, nav.offsetHeight || 0);
      document.documentElement.style.setProperty("--exam-nav-h", `${h}px`);
    } catch (e) {}
  }

  function showExamNav(show) {
    const nav = $("examNav");
    if (!nav) return;
    nav.classList.toggle("hidden", !show);
    updateExamNavHeightVar();
  }

  function showOnly(view) {
    const home = $("homeSection");
    const resourceHub = $("resourceHubSection");
    const dashboard = $("dashboardSection");
    const listening = $("listeningSection");
    const readingControls = $("readingControls");
    const readingContainer = $("container");
    const writing = $("writingSection");
    const history = $("historySection");
    const speaking = $("speakingSection");
    const adminResults = $("adminResultsSection");

    const isHome = view === "home";
    const isResourceHub = ["fullExamHub", "readingHub", "listeningHub", "writingHub", "speakingHub"].includes(view);
    const isDashboard = view === "dashboard";
    const isListening = view === "listening";
    const isReading = view === "reading";
    const isWriting = view === "writing";
    const isHistory = view === "history";
    const isSpeaking = view === "speaking";
    const isAdminResults = view === "adminResults";

    if (home) home.classList.toggle("hidden", !isHome);
    if (resourceHub) resourceHub.classList.toggle("hidden", !isResourceHub);
    if (dashboard) dashboard.classList.toggle("hidden", !isDashboard);
    if (listening) listening.classList.toggle("hidden", !isListening);
    if (readingControls) readingControls.classList.toggle("hidden", !isReading);
    if (readingContainer) readingContainer.classList.toggle("hidden", !isReading);
    if (writing) writing.classList.toggle("hidden", !isWriting);
    if (history) history.classList.toggle("hidden", !isHistory);
    if (speaking) speaking.classList.toggle("hidden", !isSpeaking);
    if (adminResults) adminResults.classList.toggle("hidden", !isAdminResults);

    const showNav = isListening || isReading || isWriting || isAdminResults;
    showExamNav(showNav);

    try {
      S()?.set(R().KEYS.HOME_LAST_VIEW, view);
    } catch (e) {}
  }

  function setExamStarted(v) {
    try {
      S().set(R().KEYS.EXAM_STARTED, v ? "true" : "false");
    } catch (e) {}
  }

  function updateHomeStatusLine(text) {
    const el = $("homeStatusLine");
    if (!el) return;
    el.textContent = (typeof text === "string" && text.trim()) ? text : "Status: Ready";
  }

  function formatTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function wordCount(text) {
    const t = String(text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  }

  function isValidFullName(name) {
    const n = String(name || "").trim().replace(/\s+/g, " ");
    if (n.length < 3) return false;
    const parts = n.split(" ");
    if (parts.length < 2) return false;
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
    $("listeningSection")?.classList.add("view-only");
    $("readingControls")?.classList.add("view-only");
    $("container")?.classList.add("view-only");
    $("writingSection")?.classList.add("view-only");
  }

  function resetExamAttempt() {
    const isAdmin = window.IELTS?.Access?.isAdmin?.() === true;
    if (!isAdmin) return;
    try { S().removeByPrefixes(["IELTS:", "ielts-reading-", "ielts-writing-", "ielts-full-"]); } catch (e) {}
    try {
      S().remove(R().EXAM.keys.finalSubmission);
      S().remove(R().EXAM.keys.finalSubmitted);
      S().remove(R().KEYS.EXAM_STARTED);
      S().remove(R().KEYS.HOME_LAST_VIEW);
    } catch (e) {}
    try { location.hash = ""; } catch (e) {}
    location.reload();
  }

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch (e) {
      return false;
    }
  }

  function applyStudentLockdownUI() {
    const admin = isAdminView();
    [
      "downloadListeningBtn",
      "copyListeningBtn",
      "downloadBtn",
      "copyBtn",
      "submitListeningBtn",
      "downloadWritingBtn",
      "copyWritingBtn",
      "submitBtn",
      "endExamBtn",
    ].forEach((id) => $(id)?.classList.toggle("hidden", !admin));
    const nav = $("examNav");
    if (nav) {
      nav.classList.toggle("student-locked", !admin);
      ["navToHomeBtn","navToListeningBtn","navToReadingBtn","navToWritingBtn","navToResultsBtn","resetExamBtn"].forEach((id) => {
        const b = $(id);
        if (b) b.classList.toggle("hidden", !admin);
      });
    }
    $("homeNewAttemptBtn")?.classList.toggle("hidden", !admin);
    $("cardResetBtn")?.classList.toggle("hidden", !admin);
    $("homeAdminResultsBtn")?.classList.toggle("hidden", !admin);
    $("navToResultsBtn")?.classList.toggle("hidden", !admin);
  }

  function hideAllExamViews() {
    ["homeSection","resourceHubSection","dashboardSection","listeningSection","readingControls","container","writingSection","examNav"].forEach((id) => $(id)?.classList.add("hidden"));
  }

  function showSubmittedOverlay(text) {
    hideAllExamViews();
    try {
      window.IELTS?.Modal?.showModal?.(
        "Submitted",
        text || "Your exam has been submitted. Please wait for your teacher.",
        { mode: "locked" }
      );
    } catch (e) {}
  }

  try {
    let __navResizeT = null;
    window.addEventListener("resize", () => {
      if (__navResizeT) clearTimeout(__navResizeT);
      __navResizeT = setTimeout(() => {
        __navResizeT = null;
        updateExamNavHeightVar();
      }, 120);
    });
    setTimeout(updateExamNavHeightVar, 0);
  } catch (e) {}

  window.IELTS = window.IELTS || {};
  window.IELTS.UI = {
    $,
    showOnly,
    setExamNavStatus,
    setExamNavTimer,
    setExamStarted,
    updateHomeStatusLine,
    formatTime,
    wordCount,
    isValidFullName,
    clearReadingLockStyles,
    lockWholeExamAfterFinalSubmit,
    resetExamAttempt,
    isAdminView,
    applyStudentLockdownUI,
    hideAllExamViews,
    showSubmittedOverlay,
  };
})();
