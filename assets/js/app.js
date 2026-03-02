/* assets/js/app.js */
(function () {
  "use strict";

  console.log("JS is running (split build)");

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Router = () => window.IELTS.Router;
  const Modal = () => window.IELTS.Modal;

  function isAdmin() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch {
      return false;
    }
  }

  function startListeningView() {
    UI().setExamStarted(true);
    window.IELTS.Engines.Listening.initListeningSystem();
    UI().showOnly("listening");
    UI().setExamNavStatus("Status: Listening in progress");
    try {
      Router()?.setHashRoute?.("ielts1", "listening");
    } catch {}
  }

  function startReadingView() {
    UI().setExamStarted(true);
    window.IELTS.Engines.Reading.startReadingSystem();
    UI().clearReadingLockStyles?.();
    UI().showOnly("reading");
    UI().setExamNavStatus("Status: Reading in progress");
    try {
      Router()?.setHashRoute?.("ielts1", "reading");
    } catch {}
  }

  function startWritingView() {
    UI().setExamStarted(true);
    window.IELTS.Engines.Writing.startWritingSystem();
    UI().showOnly("writing");
    UI().setExamNavStatus("Status: Writing in progress");
    try {
      Router()?.setHashRoute?.("ielts1", "writing");
    } catch {}
  }

  function showGateToReading() {
    // Only show gate if we're still in listening view and not already in reading/writing
    const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
    if (!listeningDone) return;

    // Make sure Listening screen isn't interactive anymore
    UI().setExamNavStatus("Status: Listening completed");

    Modal().showModal(
      "Listening finished",
      "Are you ready to start Reading?",
      {
        mode: "lockedAction",
        submitText: "Start Reading",
        onConfirm: () => {
          startReadingView();
        },
      }
    );
  }

  function showGateToWriting() {
    Modal().showModal(
      "Reading finished",
      "Are you ready to start Writing?",
      {
        mode: "lockedAction",
        submitText: "Start Writing",
        onConfirm: () => {
          startWritingView();
        },
      }
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    // bind modal buttons once
    if (window.IELTS?.Modal?.bindModalOnce) {
      window.IELTS.Modal.bindModalOnce();
      try {
        window.IELTS.Modal.forceHideModal?.();
      } catch {}
    }

    // init access/session
    try {
      window.IELTS?.Access?.init?.();
    } catch {}

    // apply UI lockdown rules (copy/download/right click/etc)
    try {
      UI()?.applyStudentLockdownUI?.();
    } catch {}

    const $ = UI().$;

    // --- Global events ---
    document.addEventListener("listening:submitted", () => {
      // Always gate into Reading (students + admin)
      showGateToReading();
    });

    document.addEventListener("reading:ended", () => {
      showGateToWriting();
    });

    // Final submitted?
    const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);
    if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) {
      S().set(R().EXAM.keys.finalSubmitted, "false");
    }

    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    if (finalDone) {
      UI().showSubmittedOverlay?.("Your exam has been submitted. Please wait for your teacher.");
      return;
    }

    // --- Admin nav buttons (same UI, but admin can click) ---
    const toHome = $("navToHomeBtn");
    const toL = $("navToListeningBtn");
    const toR = $("navToReadingBtn");
    const toW = $("navToWritingBtn");
    const resetBtn = $("resetExamBtn");

    if (toHome) {
      toHome.onclick = () => {
        if (!isAdmin()) return;
        UI().showOnly("home");
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
        try { Router()?.setHashRoute?.("ielts1", "home"); } catch {}
      };
    }

    if (toL) {
      toL.onclick = () => {
        if (!isAdmin()) return;
        startListeningView();
      };
    }

    if (toR) {
      toR.onclick = () => {
        if (!isAdmin()) return;
        const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
        if (!listeningDone) {
          Modal().showModal("Reading locked", "You must finish Listening before opening Reading.", {
            mode: "confirm",
          });
          UI().showOnly("listening");
          return;
        }
        startReadingView();
      };
    }

    if (toW) {
      toW.onclick = () => {
        if (!isAdmin()) return;
        const readingDone = S().get(R().TESTS.readingKeys.submitted, "false") === "true";
        if (!readingDone) {
          Modal().showModal("Writing locked", "You must finish Reading before opening Writing.", {
            mode: "confirm",
          });
          UI().showOnly("reading");
          return;
        }
        startWritingView();
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (!isAdmin()) return;
        const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
        if (!ok) return;
        UI().setExamStarted(false);
        UI().resetExamAttempt();
      };
    }

    // --- Auto resume (same for everyone) ---
    const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
    const readingDone = S().get(R().TESTS.readingKeys.submitted, "false") === "true";

    if (listeningDone && !readingDone) {
      // Don't auto start reading; show a required gate so students/admin click explicitly
      UI().showOnly("listening");
      showGateToReading();
      return;
    }

    if (listeningDone && readingDone) {
      // resume writing
      startWritingView();
      return;
    }

    // Default: home
    UI().showOnly("home");
    UI().updateHomeStatusLine();

    // Home buttons
    const startBtn = $("startIelts1Btn");
    const startBtn2 = $("cardStartIelts1Btn");
    const contBtn = $("homeContinueBtn");
    const resetHomeBtn = $("homeNewAttemptBtn");
    const resetCardBtn = $("cardResetBtn");
    const howBtn = $("homeHowItWorksBtn");

    function startExam() {
      // Always start Listening UI immediately; routing is secondary.
      startListeningView();
    }

    if (startBtn) startBtn.onclick = startExam;
    if (startBtn2) startBtn2.onclick = startExam;
    if (contBtn) contBtn.onclick = startExam;

    if (howBtn) {
      howBtn.onclick = () => {
        const el = $("homeHowItWorks");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }

    function clearAttemptFromHome() {
      if (!isAdmin()) return;
      const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
      if (!ok) return;
      UI().setExamStarted(false);
      UI().resetExamAttempt();
    }

    if (resetHomeBtn) resetHomeBtn.onclick = clearAttemptFromHome;
    if (resetCardBtn) resetCardBtn.onclick = clearAttemptFromHome;
  });
})();
