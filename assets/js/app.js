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


  // Start engine method when split bundles load out-of-order.
  // Retries for a short period, and logs failures instead of silently swallowing them.
  function startEngineWhenReady(engineName, methodName, { maxMs = 3500, intervalMs = 100 } = {}) {
    const startAt = Date.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        const fn = window.IELTS?.Engines?.[engineName]?.[methodName];
        if (typeof fn === "function") {
          try {
            fn();
            resolve(true);
          } catch (e) {
            console.error(`[IELTS] Failed to start ${engineName}.${methodName}`, e);
            reject(e);
          }
          return;
        }
        if (Date.now() - startAt >= maxMs) {
          const err = new Error(`Engine not ready: ${engineName}.${methodName}`);
          console.error("[IELTS]", err);
          reject(err);
          return;
        }
        setTimeout(tick, intervalMs);
      };
      tick();
    });
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

    // Key helpers
    const readingSubmittedKey = () => `${R().TESTS.readingTestId}:submitted`;

    // -----------------------------
    // Always-new attempt behavior
    // -----------------------------
    function clearAllStudentAttemptKeys() {
      // Keep admin session, wipe everything else that belongs to attempts.
      try {
        const keep = new Set(["IELTS:ADMIN:session", "IELTS:TEST:session"]);
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
            onConfirm: async () => {
              showingGate = false;

              // Move to Reading view first, then start the engine (more reliable).
              try { UI().setExamStarted(true); } catch (e) {}
              try { window.IELTS?.Router?.setHashRoute?.("ielts1", "reading"); } catch (e) {}
              try { UI().showOnly("reading"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Reading in progress"); } catch (e) {}

              // Start engine (retry briefly if split bundle not ready yet)
              try {
                await startEngineWhenReady("Reading", "startReadingSystem");
              } catch (e) {
                // Visible fallback: keep user on Reading screen even if engine failed.
                try {
                  window.alert("Reading failed to start. Please refresh the page and try again.");
                } catch (_) {}
              }
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
            onConfirm: async () => {
              showingGate = false;

              try { UI().setExamStarted(true); } catch (e) {}
              try { window.IELTS?.Router?.setHashRoute?.("ielts1", "writing"); } catch (e) {}
              try { UI().showOnly("writing"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Writing in progress"); } catch (e) {}

              try {
                await startEngineWhenReady("Writing", "startWritingSystem");
              } catch (e) {
                try { window.alert("Writing failed to start. Please refresh the page and try again."); } catch (_) {}
              }
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
    setInterval(() => {
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

      // Also keep checking in case state was already true (refresh)
      showListeningGate();
      showReadingGate();
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
      // Student test password gate
      if (!isAdmin) {
        const ok = safe(() => window.IELTS?.Access?.ensureTestAccess?.());
        if (ok !== true) return;
      }

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
