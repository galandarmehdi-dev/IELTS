/* assets/js/app.js (patched: attempt-based flow + reliable start + clean submitted home + admin skip listening) */
(function () {
  "use strict";

  console.log("JS is running (split build)");

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Router = () => window.IELTS.Router;
  const Modal = () => window.IELTS.Modal;

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch {
      return false;
    }
  }

  function ensureAttemptForExam_() {
    try { S()?.ensureAttemptId?.(); } catch {}
  }

  // Reliable start/continue (works even if Router loads early/late)
  function startOrContinueExam() {
    const $ = UI().$;

    // create/ensure attempt scope at the moment the user starts
    ensureAttemptForExam_();
    UI().setExamStarted(true);

    // init listening system only now
    try { window.IELTS.Engines.Listening.initListeningSystem(); } catch {}

    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    const listeningDone = S().get("IELTS:LISTENING:submitted", "false") === "true";
    const readingDone = S().get(`${R().TESTS.readingTestId}:submitted`, "false") === "true";

    if (finalDone) {
      UI().showSubmittedOverlay("Status: Submitted. Please wait for your teacher.");
      return;
    }

    // If listening is done, continue to reading unless reading already submitted
    if (listeningDone && !readingDone) {
      try { window.IELTS.Engines.Reading.startReadingSystem(); } catch {}
      UI().clearReadingLockStyles();
      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading in progress");
      return;
    }

    // If reading is done, go to writing
    if (listeningDone && readingDone) {
      try { window.IELTS.Engines.Writing.startWritingSystem?.(); } catch {}
      UI().showOnly("writing");
      UI().setExamNavStatus("Status: Writing in progress");
      return;
    }

    // Default: start listening
    UI().showOnly("listening");
    UI().setExamNavStatus("Status: Listening in progress");
  }

  function addAdminSkipListeningButton_() {
    if (!isAdminView()) return;
    const $ = UI().$;
    const nav = $("examNav");
    if (!nav) return;

    // avoid duplicates
    if ($("adminSkipListeningBtn")) return;

    const btn = document.createElement("button");
    btn.id = "adminSkipListeningBtn";
    btn.className = "pill ghost";
    btn.type = "button";
    btn.textContent = "Skip Listening (dev)";
    btn.style.marginLeft = "8px";

    btn.onclick = () => {
      ensureAttemptForExam_();
      try {
        const aud = document.getElementById("listeningAudio");
        if (aud && typeof aud.pause === "function") aud.pause();
      } catch {}

      // mark listening as submitted (attempt-scoped automatically by Storage)
      S().set("IELTS:LISTENING:submitted", "true");

      try { document.dispatchEvent(new CustomEvent("listening:submitted")); } catch {}

      try { window.IELTS.Engines.Reading.startReadingSystem(); } catch {}
      UI().clearReadingLockStyles();
      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading in progress (dev)");
    };

    // place near existing nav buttons
    nav.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // bind modal buttons once
    if (window.IELTS && window.IELTS.Modal && typeof window.IELTS.Modal.bindModalOnce === "function") {
      window.IELTS.Modal.bindModalOnce();
      try { Modal().hideModal(); } catch {}
      const m = document.getElementById("modal");
      if (m) m.classList.add("hidden");
    } else {
      console.error("Modal module not loaded properly.");
    }

    // Init admin/session gate (if present) + apply UI lockdown for students
    try { window.IELTS?.Access?.init?.(); } catch {}
    try { UI()?.applyStudentLockdownUI?.(); } catch {}

    const isAdmin = isAdminView();
    const $ = UI().$;

    // Student auto-flow gates
    let listeningGateShown = false;
    let readingGateShown = false;

    document.addEventListener("listening:submitted", () => {
      if (isAdmin) return;
      if (listeningGateShown) return;
      listeningGateShown = true;

      UI().showOnly("listening");
      UI().setExamNavStatus("Status: Listening finished");

      Modal().showModal(
        "Listening finished",
        "The Listening audio has ended and your answers have been submitted. Click START READING to continue.",
        {
          mode: "gate",
          submitText: "Start Reading",
          onConfirm: () => {
            window.IELTS.Engines.Reading.startReadingSystem();
            UI().clearReadingLockStyles();
            UI().showOnly("reading");
            UI().setExamNavStatus("Status: Reading in progress");
          },
        }
      );
    });

    document.addEventListener("reading:submitted", () => {
      if (isAdmin) return;
      if (readingGateShown) return;
      readingGateShown = true;

      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading finished");

      Modal().showModal(
        "Reading finished",
        "Your Reading time has ended and your answers have been submitted. Click START WRITING to continue.",
        {
          mode: "gate",
          submitText: "Start Writing",
          onConfirm: () => {
            window.IELTS.Engines.Writing.startWritingSystem();
            UI().showOnly("writing");
            UI().setExamNavStatus("Status: Writing in progress");
          },
        }
      );
    });

    // Home buttons
    const startBtn = $("startIelts1Btn");
    const startBtn2 = $("startBtn");   // if present on another UI
    const contBtn = $("continueBtn");  // if present
    if (startBtn) startBtn.onclick = startOrContinueExam;
    if (startBtn2) startBtn2.onclick = startOrContinueExam;
    if (contBtn) contBtn.onclick = startOrContinueExam;

    const homeNewAttemptBtn = $("homeNewAttemptBtn");
    if (homeNewAttemptBtn) {
      homeNewAttemptBtn.onclick = () => {
        UI().newAttempt?.();
      };
    }

    const resetBtn = $("resetExamBtn");
    if (resetBtn) resetBtn.onclick = () => UI().resetExamAttempt?.();

    // If finalSubmitted=true but no payload, treat as NOT submitted
    const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);
    if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) {
      S().set(R().EXAM.keys.finalSubmitted, "false");
    }

    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    if (finalDone && !isAdmin) {
      UI().showSubmittedOverlay("Status: Submitted. Please wait for your teacher.");
      return;
    }

    // Default landing
    UI().showOnly("home");
    UI().setExamNavStatus("Status: Ready");
    UI().updateHomeStatusLine("Status: Ready");

    // Admin: add dev helper
    addAdminSkipListeningButton_();
  });
})();
