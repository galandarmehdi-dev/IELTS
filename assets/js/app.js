/* assets/js/app.js */
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
    } catch (e) {
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // bind modal buttons once
    if (window.IELTS && window.IELTS.Modal && typeof window.IELTS.Modal.bindModalOnce === "function") {
      window.IELTS.Modal.bindModalOnce();

      // --- BOOT SAFETY: never show modal on first load ---
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

    const toHome = $("navToHomeBtn");
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
      // Student must not be able to go back and view questions after submit
      if (typeof UI().showSubmittedOverlay === "function") {
        UI().showSubmittedOverlay("Your exam has been submitted. Please wait for your teacher.");
      } else {
        // fallback: lock everything and show writing in view-only
        UI().setExamNavStatus("Status: Submitted");
        $("listeningSection")?.classList.add("view-only");
        $("readingControls")?.classList.add("view-only");
        $("container")?.classList.add("view-only");
        $("writingSection")?.classList.add("view-only");
        UI().showOnly("writing");
      }
      return;
    }

    // =========================
    // ADMIN-ONLY NAV BUTTONS
    // =========================
    if (toHome) {
      toHome.onclick = () => {
        if (!isAdmin) return;
        UI().showOnly("home");
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
      };
    }

    if (toL) {
      toL.onclick = () => {
        if (!isAdmin) return; // students cannot manually navigate
        UI().setExamStarted(true);
        window.IELTS.Engines.Listening.initListeningSystem();
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Viewing Listening");
      };
    }

    if (toR) {
      toR.onclick = () => {
        if (!isAdmin) return; // students cannot manually navigate

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
        if (!isAdmin) return; // students cannot manually navigate

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
        if (!isAdmin) return; // students cannot reset
        const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
        if (!ok) return;
        UI().setExamStarted(false);
        UI().resetExamAttempt();
      };
    }

    // =========================
    // AUTO-RESUME (STUDENT FLOW)
    // =========================
    // If listening already submitted, resume Reading (students can refresh)
    const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
    if (listeningDone) {
      window.IELTS.Engines.Reading.startReadingSystem();
      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading in progress");
      return;
    }

    // Hash route support (ADMIN ONLY)
    const route = Router().parseHashRoute();
    if (isAdmin && route && route.view) {
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
      if (route.view === "home") {
        UI().showOnly("home");
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
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
        if (typeof UI().showSubmittedOverlay === "function") {
          UI().showSubmittedOverlay("Your exam has been submitted. Please wait for your teacher.");
        } else {
          UI().showOnly("writing");
          UI().setExamNavStatus("Status: Submitted");
        }
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
      if (!isAdmin) return; // students cannot start a new attempt
      const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
      if (!ok) return;
      UI().setExamStarted(false);
      UI().resetExamAttempt();
    }

    if (resetHomeBtn) resetHomeBtn.onclick = clearAttemptFromHome;
    if (resetCardBtn) resetCardBtn.onclick = clearAttemptFromHome;
  });
})();
