/* assets/js/app.js (v5: reliable gates + always-new attempt for students) */
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

  function safe(fn) {
    try {
      return fn();
    } catch {
      return undefined;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Bind modal buttons once
    if (window.IELTS?.Modal && typeof window.IELTS.Modal.bindModalOnce === "function") {
      window.IELTS.Modal.bindModalOnce();
      // Boot safety: never show modal on first load
      safe(() => Modal().hideModal());
      const m = document.getElementById("modal");
      if (m) m.classList.add("hidden");
    }

    // Init admin/session gate + apply UI lockdown for students
    safe(() => window.IELTS?.Access?.init?.());
    safe(() => UI()?.applyStudentLockdownUI?.());

    const isAdmin = isAdminView();
    const $ = UI().$;

    // Single beforeunload guard (engines should NOT bind their own to avoid duplicates)
    if (!window.IELTS.__BEFOREUNLOAD_BOUND) {
      window.IELTS.__BEFOREUNLOAD_BOUND = true;
      window.addEventListener("beforeunload", (e) => {
        try {
          // Admin view can navigate freely
          if (isAdminView()) return;

          const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
          if (finalDone) return;

          const listeningStartedKey = R().TESTS?.listeningKeys?.started;
          const listeningSubmittedKey = R().TESTS?.listeningKeys?.submitted;
          const writingStartedKey = R().TESTS?.writingKeys?.started;
          const writingSubmittedKey = R().TESTS?.writingKeys?.submitted;

          const anyInProgress =
            (listeningStartedKey && S().get(listeningStartedKey, "false") === "true") ||
            (listeningSubmittedKey && S().get(listeningSubmittedKey, "false") === "true") ||
            (S().get(readingSubmittedKey(), "false") === "true") ||
            (writingStartedKey && S().get(writingStartedKey, "false") === "true") ||
            (writingSubmittedKey && S().get(writingSubmittedKey, "false") === "true");

          if (anyInProgress) {
            e.preventDefault();
            e.returnValue = "";
          }
        } catch (err) {
          // Fail safe: never block navigation due to an unexpected error
        }
      });
    }


    // Key helpers
    const readingSubmittedKey = () => `${R().TESTS.readingTestId}:submitted`;

    // -----------------------------
    // Always-new attempt behavior
    // -----------------------------
    function clearAllStudentAttemptKeys() {
      // Keep admin session, wipe everything else that belongs to attempts.
      try {
        const keep = new Set(["IELTS:ADMIN:session"]);
        const prefixes = ["IELTS:", "ielts-reading-", "ielts-writing-", "ielts-full-"];
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (keep.has(k)) continue;
          if (prefixes.some((p) => k.startsWith(p))) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }

    // If student lands on "submitted" overlay, do NOT trap them forever.
    // They should be able to start a new attempt.
    const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);
    if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) {
      S().set(R().EXAM.keys.finalSubmitted, "false");
    }

    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    if (finalDone && !isAdmin) {
      // Student: auto-clear so Start Exam always works
      clearAllStudentAttemptKeys();
    }

    // -----------------------------
    // Reliable gates (Listening→Reading, Reading→Writing)
    // -----------------------------
    let showingGate = false;

    // Start an engine even if scripts load slightly later than app.js (split build safety)
    function startEngineWhenReady(engineName, fnName, { tries = 25, intervalMs = 120 } = {}) {
      let n = 0;
      const tick = () => {
        n += 1;
        const fn = window.IELTS?.Engines?.[engineName]?.[fnName];
        if (typeof fn === "function") {
          try { fn(); } catch (e) {}
          return true;
        }
        return false;
      };
      if (tick()) return;
      const id = setInterval(() => {
        if (tick() || n >= tries) clearInterval(id);
      }, intervalMs);
    }


    function showListeningGate() {
      if (isAdmin || showingGate) return;
      const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      if (!listeningDone || readingDone) return;

      showingGate = true;
      safe(() => UI().showOnly("listening"));
      safe(() => UI().setExamNavStatus("Status: Listening finished"));

      safe(() =>
        Modal().showModal(
          "Listening finished",
          "Your Listening has been submitted. Click Start Reading to continue.",
          {
            mode: "gate",
            submitText: "Start Reading",
            onConfirm: () => {
              showingGate = false;
              safe(() => UI().setExamStarted(true));
              // Prefer routing first so the Reading view is active, then start the engine.
              safe(() => window.IELTS?.Router?.setHashRoute?.("ielts1", "reading"));
              safe(() => UI().showOnly("reading"));
              safe(() => UI().setExamNavStatus("Status: Reading in progress"));
              // Start (or resume) Reading timer/render. Guard inside engine prevents double init.
              safe(() => startEngineWhenReady("Reading", "startReadingSystem"));

            },
          }
        )
      );
    }

    function showReadingGate() {
      if (isAdmin || showingGate) return;
      const listeningDone = S().get(R().TESTS.listeningKeys.submitted, "false") === "true";
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      const writingStarted = S().get(R().TESTS.writingKeys.started, "false") === "true";
      if (!listeningDone || !readingDone || writingStarted) return;

      showingGate = true;
      safe(() => UI().showOnly("reading"));
      safe(() => UI().setExamNavStatus("Status: Reading finished"));

      safe(() =>
        Modal().showModal(
          "Reading finished",
          "Your Reading has been submitted. Click Start Writing to continue.",
          {
            mode: "gate",
            submitText: "Start Writing",
            onConfirm: () => {
              showingGate = false;
              safe(() => startEngineWhenReady("Writing", "startWritingSystem"));
              safe(() => UI().showOnly("writing"));
              safe(() => UI().setExamNavStatus("Status: Writing in progress"));
              safe(() => window.IELTS?.Router?.setHashRoute?.("ielts1", "writing"));
            },
          }
        )
      );
    }

    // Event-based (preferred)
    document.addEventListener("listening:submitted", showListeningGate);
    document.addEventListener("reading:submitted", showReadingGate);

    // Storage-based fallback polling (in case an event is missed)
    let lastListen = S().get(R().TESTS.listeningKeys.submitted, "false");
    let lastRead = S().get(readingSubmittedKey(), "false");
    // Initial gate checks (refresh-safe)
    showListeningGate();
    showReadingGate();

    // Lightweight fallback poll: only for a short window after load to catch edge cases
    let __gatePollTicks = 0;
    const __gatePollMaxTicks = 25; // ~20s at 800ms
    const __gatePollId = setInterval(() => {
      __gatePollTicks += 1;

      try {
        const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
        const writingStarted = S().get(R().TESTS.writingKeys.started, "false") === "true";
        if (finalDone || writingStarted || __gatePollTicks >= __gatePollMaxTicks) {
          clearInterval(__gatePollId);
          return;
        }
      } catch (e) {}

      if (isAdmin) return;
      const curListen = S().get(R().TESTS.listeningKeys.submitted, "false");
      const curRead = S().get(readingSubmittedKey(), "false");

      // If changed to true, run gates
      if (curListen !== lastListen) {
        lastListen = curListen;
        if (curListen === "true") showListeningGate();
      }
      if (curRead !== lastRead) {
        lastRead = curRead;
        if (curRead === "true") showReadingGate();
      }
    }, 800);

    // Attach a direct audio ended fallback for listening
    const aud = document.getElementById("listeningAudio");
    if (aud && !aud.dataset.gateBound) {
      aud.dataset.gateBound = "1";
      aud.addEventListener("ended", () => {
        // Give engine time to set submitted key
        setTimeout(showListeningGate, 400);
        setTimeout(showListeningGate, 1200);
      });
    }

    // -----------------------------
    // Admin nav buttons (unchanged)
    // -----------------------------
    const toHome = $("navToHomeBtn");
    const toL = $("navToListeningBtn");
    const toR = $("navToReadingBtn");
    const toW = $("navToWritingBtn");
    const resetBtn = $("resetExamBtn");

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
        if (!isAdmin) return;
        UI().setExamStarted(true);
        window.IELTS.Engines.Listening.initListeningSystem();
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Viewing Listening");
      };
    }

    if (toR) {
      toR.onclick = () => {
        if (!isAdmin) return;
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
        if (!isAdmin) return;
        const writingStarted = S().get(R().TESTS.writingKeys.started, "false") === "true";
        const readingSubmitted = S().get(readingSubmittedKey(), "false") === "true";
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
        if (!isAdmin) return;
        const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
        if (!ok) return;
        UI().setExamStarted(false);
        UI().resetExamAttempt();
      };
    }

    // -----------------------------
    // Hash route support (ADMIN ONLY)
    // -----------------------------
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

    // -----------------------------
    // Default to home
    // -----------------------------
    UI().showOnly("home");
    UI().updateHomeStatusLine();

    // -----------------------------
    // Home buttons: START ALWAYS = NEW ATTEMPT
    // -----------------------------
    const startBtn = $("startIelts1Btn");
    const startBtn2 = $("cardStartIelts1Btn");
    const contBtn = $("homeContinueBtn");

    function startFreshExam() {
      clearAllStudentAttemptKeys();
      safe(() => Modal().hideModal());

      safe(() => UI().setExamStarted(true));
      safe(() => window.IELTS.Engines.Listening.initListeningSystem());
      safe(() => UI().showOnly("listening"));
      safe(() => UI().setExamNavStatus("Status: Listening in progress"));
      safe(() => window.IELTS?.Router?.setHashRoute?.("ielts1", "listening"));

      // if audio already bound, ensure fallback ended listener exists
      const a = document.getElementById("listeningAudio");
      if (a && !a.dataset.gateBound) {
        a.dataset.gateBound = "1";
        a.addEventListener("ended", () => {
          setTimeout(showListeningGate, 400);
          setTimeout(showListeningGate, 1200);
        });
      }
    }

    if (startBtn) startBtn.onclick = startFreshExam;
    if (startBtn2) startBtn2.onclick = startFreshExam;
    if (contBtn) contBtn.onclick = startFreshExam;

    // If student refreshes after Listening is already submitted, show gate (not auto-reading)
    if (!isAdmin) {
      showListeningGate();
      showReadingGate();
    }
  });
})();
