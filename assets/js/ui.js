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

  // ✅ ADD THIS BLOCK RIGHT HERE (still inside showOnly)
  try {
    const router = window.IELTS?.Router;

    if (router?.setHashRoute) {
      if (view === "home") {
        // keep homepage clean (no hash)
        if (location.hash) {
          history.replaceState(null, "", location.pathname + location.search);
        }
      } else {
        // exam routes like: #/ielts1/listening, #/ielts1/reading, #/ielts1/writing
        router.setHashRoute("ielts1", view);
      }
    }
  } catch {}

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

// =====================
// STUDENT ANTI-CHEAT (best-effort, browser-limited)
// =====================
let __IELTS_ANTI_CHEAT_BOUND__ = false;

function isStudentInActiveAttempt() {
  try {
    if (isAdminView()) return false;
    const started = S()?.get(R().KEYS.EXAM_STARTED, "false") === "true";
    const finalDone = S()?.get(R().EXAM.keys.finalSubmitted, "false") === "true";
    return started && !finalDone;
  } catch {
    return false;
  }
}

function allowContextMenuForCopyPasteOnly(e) {
  // Allow right-click on inputs/textareas (paste) OR when user has a selection (copy).
  const t = e.target;
  const tag = (t && t.tagName ? String(t.tagName).toLowerCase() : "");
  const isEditable =
    !!(t && (t.isContentEditable || tag === "input" || tag === "textarea" || tag === "select"));
  const hasSelection = !!(window.getSelection && String(window.getSelection().toString() || "").trim());

  if (isEditable || hasSelection) return; // allow copy/paste menus
  e.preventDefault();
}

function blockFindOnPageShortcut(e) {
  // Block Ctrl/Cmd+F and F3/Enter find-next style keys.
  const k = String(e.key || "").toLowerCase();
  const isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform || "");
  const mod = isMac ? e.metaKey : e.ctrlKey;

  if (mod && k === "f") {
    e.preventDefault();
    e.stopPropagation();
  }
  // Optional: also block F3 (find next)
  if (k === "f3") {
    e.preventDefault();
    e.stopPropagation();
  }
}

function showFocusLostSubmitGate(reason) {
  // We cannot truly prevent tab switching/minimize/close in browsers.
  // Best effort: when student returns, lock the UI and require final submit.
  if (!isStudentInActiveAttempt()) return;

  try {
    // Ensure Writing engine exists so modal "final" submit can work (needs __IELTS_SUBMIT_FINAL__)
    window.IELTS?.Engines?.Writing?.startWritingSystem?.();
  } catch {}

  try { showOnly("writing"); } catch {}
  try { setExamNavStatus("Status: Submission required"); } catch {}

  try {
    window.IELTS?.Modal?.showModal?.(
      "Exam locked",
      (reason || "You left the exam window.") +
        " To continue, you must end the exam and submit using your Name and Surname.",
      {
        mode: "final",
        showCancel: false,
        submitText: "Submit exam",
      }
    );
  } catch {}
}

function bindStudentAntiCheatOnce() {
  if (__IELTS_ANTI_CHEAT_BOUND__) return;
  __IELTS_ANTI_CHEAT_BOUND__ = true;

  // Right-click policy
  document.addEventListener(
    "contextmenu",
    (e) => {
      if (isAdminView()) return;
      allowContextMenuForCopyPasteOnly(e);
    },
    true
  );

  // Block Ctrl/Cmd+F
  document.addEventListener("keydown", (e) => {
    if (isAdminView()) return;
    blockFindOnPageShortcut(e);
  }, true);

  // Warn on close/refresh while attempt active
  window.addEventListener("beforeunload", (e) => {
    if (!isStudentInActiveAttempt()) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // Detect focus loss / tab change and force submit gate on return
  window.addEventListener("blur", () => {
    if (!isStudentInActiveAttempt()) return;
    // mark a flag so we only gate when they come back
    try { S()?.set("IELTS:ANTI_CHEAT:focusLost", "true"); } catch {}
  });

  document.addEventListener("visibilitychange", () => {
    if (!isStudentInActiveAttempt()) return;
    if (document.hidden) {
      try { S()?.set("IELTS:ANTI_CHEAT:focusLost", "true"); } catch {}
      return;
    }
    // Returned to tab
    const lost = S()?.get("IELTS:ANTI_CHEAT:focusLost", "false") === "true";
    if (lost) {
      try { S()?.set("IELTS:ANTI_CHEAT:focusLost", "false"); } catch {}
      showFocusLostSubmitGate("You changed the exam window/tab.");
    }
  });

  window.addEventListener("focus", () => {
    if (!isStudentInActiveAttempt()) return;
    const lost = S()?.get("IELTS:ANTI_CHEAT:focusLost", "false") === "true";
    if (lost) {
      try { S()?.set("IELTS:ANTI_CHEAT:focusLost", "false"); } catch {}
      showFocusLostSubmitGate("You changed the exam window/tab.");
    }
  });
}

function applyStudentLockdownUI() {
  // Bind anti-cheat listeners (students only)
  try { bindStudentAntiCheatOnce(); } catch {}

    // Hide Copy/Download utility buttons for students
  if (!isAdminView()) {
    [
      // Listening
      "downloadListeningBtn",
      "copyListeningBtn",

      "submitListeningBtn",
      // Reading
      "downloadBtn",
      "copyBtn",

      "submitBtn",
      // Writing
      "downloadWritingBtn",
      "copyWritingBtn",
    ].forEach((id) => $(id)?.classList.add("hidden"));
  }
  // Hide global exam navigation actions for students
  const nav = $("examNav");
  if (nav && !isAdminView()) {
    nav.classList.add("student-locked");
    // hide buttons if they exist
    ["navToHomeBtn","navToListeningBtn","navToReadingBtn","navToWritingBtn","resetExamBtn"].forEach((id) => {
      const b = $(id);
      if (b) b.classList.add("hidden");
    });
  }

  // Hide “new attempt / clear browser” from home for students
  if (!isAdminView()) {
    $("homeNewAttemptBtn")?.classList.add("hidden");
    $("cardResetBtn")?.classList.add("hidden");
  }
}

// Completely hide exam UI (so student cannot see questions after final submit)
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
