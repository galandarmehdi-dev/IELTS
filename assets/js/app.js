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
    if (finalDone && !isAdmin) {
      // A previous attempt exists on this browser. Do not lock the UI; allow a fresh start.
      try { UI().showOnly("home"); } catch {}
      try { UI().updateHomeStatusLine("Status: Previous attempt detected — click START to begin a new attempt."); } catch {}
      try { UI().setExamNavStatus("Status: Home"); } catch {}
      // continue boot normally (no return)
    } else if (finalDone && isAdmin) {
      // Admin can still view the submitted state if needed
      if (typeof UI().showSubmittedOverlay === "function") {
        UI().showSubmittedOverlay("Your exam has been submitted. Please wait for your teacher.");
      } else {
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
    // =========================
    // AUTO-RESUME
    // =========================
    // Students: always start from Home (fresh attempt is triggered by START).
    // Admin: hash routes still supported below.
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
      // ALWAYS start a fresh attempt (no resume).
      // Clear attempt keys for STUDENTS too (but keep admin session).
      try {
        const keepKey = "IELTS:ADMIN:session";
        // remove IELTS:* except admin session
        for (let j = localStorage.length - 1; j >= 0; j--) {
          const k = localStorage.key(j);
          if (!k) continue;
          if (k === keepKey) continue;
          if (k.startsWith("IELTS:") || k.startsWith("ielts-reading-") || k.startsWith("ielts-writing-") || k.startsWith("ielts-full-")) {
            localStorage.removeItem(k);
          }
        }
      } catch {}

      try { UI().setExamStarted(true); } catch {}
      try { UI().clearReadingLockStyles?.(); } catch {}

      // Ensure engines re-bind cleanly
      try { window.IELTS.Engines.Listening.initListeningSystem(); } catch {}

      // Route into Listening
      if (window.IELTS?.Router?.setHashRoute) {
        window.IELTS.Router.setHashRoute("ielts1", "listening");
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
