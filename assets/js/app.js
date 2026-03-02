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
    // Student flow gates (Listening → Reading, Reading → Writing)
    document.addEventListener("listening:submitted", () => {
      if (isAdminView()) return;

   const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      if (readingDone) return;

      try {
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Listening finished");
        Modal().showModal("Listening finished", "Your Listening has been submitted. Click Start Reading to continue.", {
          mode: "gate",
          locked: true,
          submitText: "Start Reading",
          onConfirm: () => {
            window.IELTS.Engines.Reading.startReadingSystem();
            UI().showOnly("reading");
            UI().setExamNavStatus("Status: Reading in progress");
          },
        });
      } catch {}
    });

    document.addEventListener("reading:submitted", () => {
      if (isAdminView()) return;

      const writingStarted = S().get(R().TESTS.writingKeys.started, "false") === "true";
      if (writingStarted) return;

      try {
        UI().showOnly("reading");
        UI().setExamNavStatus("Status: Reading finished");
        Modal().showModal("Reading finished", "Your Reading has been submitted. Click Start Writing to continue.", {
          mode: "gate",
          locked: true,
          submitText: "Start Writing",
          onConfirm: () => {
            window.IELTS.Engines.Writing.startWritingSystem();
            UI().showOnly("writing");
            UI().setExamNavStatus("Status: Writing in progress");
          },
        });
      } catch {}
    });



    const isAdmin = isAdminView();
    const $ = UI().$;
// --- Reading uses dynamic keys: `${readingTestId}:submitted`
const readingKey = (suffix) => `${R().TESTS.readingTestId}:${suffix}`;
const readingSubmittedKey = () => readingKey("submitted");
    
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
    const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
    const readingDone = S().get(readingSubmittedKey(), "false") === "true";
    const writingStarted = S().get(R().TESTS.writingKeys.started, "false") === "true";

    // If Listening finished but Reading not started/submitted -> show a non-closeable gate
    if (listeningDone && !readingDone) {
      // Keep student on listening view; they must click Start Reading
      UI().showOnly("listening");
      UI().setExamNavStatus("Status: Listening finished");

      try {
        Modal().showModal("Listening finished", "Your Listening has been submitted. Click Start Reading to continue.", {
          mode: "gate",
          locked: true,
          submitText: "Start Reading",
          onConfirm: () => {
            window.IELTS.Engines.Reading.startReadingSystem();
            UI().showOnly("reading");
            UI().setExamNavStatus("Status: Reading in progress");
          },
        });
      } catch {}
      return;
    }

    // If Reading finished but Writing not started -> show a non-closeable gate
    if (listeningDone && readingDone && !writingStarted) {
      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading finished");

      try {
        Modal().showModal("Reading finished", "Your Reading has been submitted. Click Start Writing to continue.", {
          mode: "gate",
          locked: true,
          submitText: "Start Writing",
          onConfirm: () => {
            window.IELTS.Engines.Writing.startWritingSystem();
            UI().showOnly("writing");
            UI().setExamNavStatus("Status: Writing in progress");
          },
        });
      } catch {}
      return;
    }

    // If Writing already started, resume it
    if (writingStarted) {
      window.IELTS.Engines.Writing.startWritingSystem();
      UI().showOnly("writing");
      UI().setExamNavStatus("Status: Writing in progress");
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

  // make sure engines are ready
  window.IELTS.Engines.Listening.initListeningSystem();

  const finalDone2 = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
  const listeningDone2 = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
  const readingDone2 = S().get(readingSubmittedKey(), "false") === "true";

  // If fully submitted, show locked overlay and do NOT route back into exam
  if (finalDone2) {
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute("ielts1", "submitted");
    }
    if (typeof UI().showSubmittedOverlay === "function") {
      UI().showSubmittedOverlay("Your exam has been submitted. Please wait for your teacher.");
    } else {
      UI().showOnly("writing");
      UI().setExamNavStatus("Status: Submitted");
    }
    return;
  }

  // If listening submitted but reading not submitted -> go reading
  if (listeningDone2 && !readingDone2) {
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute("ielts1", "reading");
    } else {
      window.IELTS.Engines.Reading.startReadingSystem();
      UI().showOnly("reading");
      UI().setExamNavStatus("Status: Reading in progress");
    }
    return;
  }

  // If reading submitted -> go writing
  if (listeningDone2 && readingDone2) {
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute("ielts1", "writing");
    } else {
      window.IELTS.Engines.Writing.startWritingSystem?.();
      UI().showOnly("writing");
      UI().setExamNavStatus("Status: Writing in progress");
    }
    return;
  }

  // Otherwise -> start listening
  if (window.IELTS?.Router?.setHashRoute) {
    window.IELTS.Router.setHashRoute("ielts1", "listening");
  } else {
    UI().showOnly("listening");
    UI().setExamNavStatus("Status: Listening in progress");
  }
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
