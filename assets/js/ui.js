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
  if (!el) return;

  // If text is missing, show a default instead of "undefined"
  el.textContent = (typeof text === "string" && text.trim())
    ? text
    : "Status: Ready";
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
  // Students cannot reset
  const isAdmin =
    (window.IELTS &&
      window.IELTS.Access &&
      typeof window.IELTS.Access.isAdmin === "function" &&
      window.IELTS.Access.isAdmin() === true) ||
    false;

  if (!isAdmin) return;

  // Clear everything related to this exam attempt
  try {
    // Remove by prefixes (your existing helper)
    S().removeByPrefixes(["IELTS:", "ielts-reading-", "ielts-writing-", "ielts-full-"]);
  } catch (e) {}

  try {
    // Also remove known keys explicitly
    S().remove(R().EXAM.keys.finalSubmission);
    S().remove(R().EXAM.keys.finalSubmitted);
    S().remove(R().KEYS.EXAM_STARTED);
    S().remove(R().KEYS.HOME_LAST_VIEW);
  } catch (e) {}

  // Reset route + reload cleanly
  try {
    location.hash = "";
  } catch (e) {}

  location.reload();
}

  window.IELTS = window.IELTS || {};
  function isAdminView() {
  try {
    return window.IELTS?.Access?.isAdmin?.() === true;
  } catch {
    return false;
  }
}

function applyStudentLockdownUI() {
  // Unified UI: keep exam UI the same for everyone.
  // Only difference: admin can navigate between sections for testing.

  const admin = isAdminView();

  // Hide export tools for EVERYONE (prevents leaks during real exam)
  [
    "downloadListeningBtn","copyListeningBtn",
    "downloadBtn","copyBtn",
    "downloadWritingBtn","copyWritingBtn",
  ].forEach((id) => $(id)?.classList.add("hidden"));

  // Exam nav exists in all modes, but only admin can use the buttons.
  const nav = $("examNav");
  if (nav) nav.classList.remove("student-locked");

  ["navToHomeBtn","navToListeningBtn","navToReadingBtn","navToWritingBtn","resetExamBtn"].forEach((id) => {
    const b = $(id);
    if (!b) return;
    if (admin) {
      b.disabled = false;
      b.classList.remove("is-disabled");
      b.title = "";
    } else {
      b.disabled = true;
      b.classList.add("is-disabled");
      b.title = "Locked";
    }
  });

  // Home clear/reset buttons are admin-only; keep them visible but disabled for students
  ["homeNewAttemptBtn","cardResetBtn"].forEach((id) => {
    const b = $(id);
    if (!b) return;
    if (admin) {
      b.disabled = false;
      b.classList.remove("is-disabled");
      b.title = "";
    } else {
      b.disabled = true;
      b.classList.add("is-disabled");
      b.title = "Locked";
    }
  });

  // ===== Restrictions requested =====
  // Block right-click everywhere except inputs/textarea/contenteditable (so paste works there)
  if (!document.body.dataset.__ctxLock) {
    document.body.dataset.__ctxLock = "1";
    document.addEventListener("contextmenu", (e) => {
      const el = e.target;
      const tag = (el && el.tagName ? el.tagName.toLowerCase() : "");
      const editable =
        tag === "input" ||
        tag === "textarea" ||
        (el && el.isContentEditable === true);
      if (editable) return; // allow copy/paste menu
      e.preventDefault();
    }, true);

    // Block Ctrl/Cmd+F (find)
    document.addEventListener("keydown", (e) => {
      const k = String(e.key || "").toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && k === "f") {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  }
}

 // Completely hide exam UI (so student cannot see questions after final submit)
 (so student cannot see questions after final submit)
function hideAllExamViews() {
  const ids = ["homeSection","listeningSection","readingControls","container","writingSection","examNav"];
  ids.forEach((id) => $(id)?.classList.add("hidden"));
}

function showSubmittedOverlay(text) {
  hideAllExamViews();
  try {
    window.IELTS?.Modal?.showModal?.(
      "Submitted",
      text || "Your exam has been submitted. Please wait for your teacher.",
      { mode: "locked" }
    );
  } catch {}
}
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

  // NEW:
  isAdminView,
  applyStudentLockdownUI,
  hideAllExamViews,
  showSubmittedOverlay,
};
})();
