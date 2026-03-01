/* assets/js/app.js */
(function () {
  "use strict";

  console.log("JS is running (split build)");

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Router = () => window.IELTS.Router;
  const Modal = () => window.IELTS.Modal;

  document.addEventListener("DOMContentLoaded", () => {
    // bind modal buttons once
    if (window.IELTS && window.IELTS.Modal && typeof window.IELTS.Modal.bindModalOnce === "function") {
  window.IELTS.Modal.bindModalOnce();
} else {
  console.error("Modal module not loaded properly.");
}

    const $ = UI().$;

    const toL = $("navToListeningBtn");
    const toR = $("navToReadingBtn");
    const toW = $("navToWritingBtn");
    const resetBtn = $("resetExamBtn");

    // Final submitted?
    // If browser somehow has finalSubmitted=true but no payload, treat as NOT submitted
const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);
if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) {
  S().set(R().EXAM.keys.finalSubmitted, "false");
}
    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    if (finalDone) {
      UI().setExamNavStatus("Status: Submitted (Review mode)");

      const ls = $("listeningSection");
      if (ls) ls.classList.add("view-only");

      const rc = $("readingControls");
      const cont = $("container");
      if (rc) rc.classList.add("view-only");
      if (cont) cont.classList.add("view-only");

      const ws = $("writingSection");
      if (ws) ws.classList.add("view-only");

      UI().showOnly("writing");
return;
    }

    // NAV buttons
    if (toL) {
      toL.onclick = () => {
        UI().setExamStarted(true);
        window.IELTS.Engines.Listening.initListeningSystem();
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Viewing Listening");
      };
    }

    if (toR) {
      toR.onclick = () => {
        const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
        if (!listeningDone) {
          UI().showOnly("listening");
          Modal().showModal("Reading locked", "You must finish Listening before opening Reading.", { mode: "confirm" });
          return;
        }

        UI().setExamStarted(true);
        window.IELTS.Engines.Reading.startReadingSystem();
        UI().clearReadingLockStyles();
        UI().showOnly("reading");
        UI().setExamNavStatus("Status: Viewing Reading");
      };
    }

    if (toW) {
      toW.onclick = () => {
        const writingStarted = S().get(R().TESTS.writingKeys.started, "false") === "true";
        const readingSubmitted = S().get(`${R().TESTS.readingTestId}:submitted`, "false") === "true";

        if (!writingStarted && !readingSubmitted) {
          Modal().showModal("Writing locked", "You must submit Reading before opening Writing.", { mode: "confirm" });
          UI().showOnly("reading");
          UI().setExamNavStatus("Status: Viewing Reading");
          return;
        }

        UI().setExamStarted(true);
        if (!writingStarted) window.IELTS.Engines.Writing.startWritingSystem();
        else UI().showOnly("writing");

        UI().setExamNavStatus("Status: Viewing Writing");
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
        if (!ok) return;
        UI().setExamStarted(false);
        UI().resetExamAttempt();
      };
    }

    // Auto-resume based on progress
    const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
    if (listeningDone) {
      window.IELTS.Engines.Reading.startReadingSystem();
      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading in progress");
      return;
    }

    // Hash route support
    const route = Router().parseHashRoute();
    if (route && route.view) {
      if (route.view === "listening") {
        UI().setExamStarted(true);
        window.IELTS.Engines.Listening.initListeningSystem();
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Listening in progress");
        return;
      }
      if (route.view === "reading") {
        UI().setExamStarted(true);
        window.IELTS.Engines.Reading.startReadingSystem();
        UI().showOnly("reading");
        UI().setExamNavStatus("Status: Viewing Reading");
        return;
      }
      if (route.view === "writing") {
        UI().setExamStarted(true);
        window.IELTS.Engines.Writing.startWritingSystem();
        UI().showOnly("writing");
        UI().setExamNavStatus("Status: Viewing Writing");
        return;
      }
    }

    // Default to home
    UI().showOnly("home");
    UI().updateHomeStatusLine();

    // Home buttons
    const startBtn = $("startIelts1Btn");
    const startBtn2 = $("cardStartIelts1Btn");
    const contBtn = $("homeContinueBtn");
    const resetHomeBtn = $("homeNewAttemptBtn");
    const resetCardBtn = $("cardResetBtn");
    const howBtn = $("homeHowItWorksBtn");

    function startOrContinueExam() {
      UI().setExamStarted(true);
      window.IELTS.Engines.Listening.initListeningSystem();

      const finalDone2 = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
      const listeningDone2 = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";

      if (finalDone2) {
        UI().showOnly("writing");
        UI().setExamNavStatus("Status: Submitted (Review mode)");
        return;
      }

      if (listeningDone2) {
        window.IELTS.Engines.Reading.startReadingSystem();
        UI().showOnly("reading");
        UI().setExamNavStatus("Status: Reading in progress");
        return;
      }

      UI().showOnly("listening");
      UI().setExamNavStatus("Status: Listening in progress");
    }

    if (startBtn) startBtn.onclick = startOrContinueExam;
    if (startBtn2) startBtn2.onclick = startOrContinueExam;
    if (contBtn) contBtn.onclick = startOrContinueExam;

    if (howBtn) {
      howBtn.onclick = () => {
        const el = $("homeHowItWorks");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }

    function clearAttemptFromHome() {
      const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
      if (!ok) return;
      UI().setExamStarted(false);
      UI().resetExamAttempt();
    }

    if (resetHomeBtn) resetHomeBtn.onclick = clearAttemptFromHome;
    if (resetCardBtn) resetCardBtn.onclick = clearAttemptFromHome;
  });
})();
