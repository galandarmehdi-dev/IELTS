/* assets/js/engines/writingEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function startWritingSystem() {
    // Multi-test safe: resolve config + keys separately so writing timer/storage always exists.
    const activeTestId =
      (typeof R().getActiveTestId === "function" && R().getActiveTestId()) ||
      S().get("IELTS:EXAM:activeTestId", R().TESTS?.defaultTestId || "ielts1");

    const cfg =
      (typeof R().getTestConfig === "function" && R().getTestConfig(activeTestId)) ||
      R().TESTS?.byId?.[activeTestId] ||
      R().TESTS?.byId?.[R().TESTS?.defaultTestId] ||
      {};

    const namespacedKeys = (typeof R().keysFor === "function" && R().keysFor(activeTestId)) || {};
    const legacyKeys = R().LEGACY?.writingKeys || R().TESTS?.writingKeys || {};

    const W = {
      TEST_ID: cfg.writingTestId || R().TESTS?.byId?.[R().TESTS?.defaultTestId || "ielts1"]?.writingTestId || "ielts-writing-001",
      DURATION_MINUTES: 60,
      keys: namespacedKeys.writing || legacyKeys,
      readingTestId: cfg.readingTestId || R().TESTS?.byId?.[R().TESTS?.defaultTestId || "ielts1"]?.readingTestId || "ielts-reading-3parts-001",
      listeningKeys: namespacedKeys.listening || R().LEGACY?.listeningKeys || R().TESTS?.listeningKeys || {},
    };

    const $ = UI().$;
    const writingSection = $("writingSection");
    if (!writingSection) return;

    UI().showOnly("writing");

    let remainingSeconds = W.DURATION_MINUTES * 60;
    const savedRemaining = S().get(W.keys.remaining, null);
    if (savedRemaining && !Number.isNaN(Number(savedRemaining))) {
      remainingSeconds = Math.max(0, Number(savedRemaining));
    }

    let hasSubmitted = S().get(W.keys.submitted, "false") === "true";
    let timer = null;

    const wt1 = $("writingTask1");
    const wt2 = $("writingTask2");
    const wt1Count = $("wt1Count");
    const wt2Count = $("wt2Count");
    const autosaveEl = $("writingAutosave");
    const timeEl = $("writingTimeLeft");

    function setAutosave(text) {
      if (!autosaveEl) return;
      autosaveEl.textContent = text;
      setTimeout(() => {
        if (autosaveEl.textContent === text) autosaveEl.textContent = "Autosave: ready";
      }, 900);
    }

    function updateCounts() {
      if (wt1Count) wt1Count.textContent = `Word count: ${UI().wordCount(wt1?.value || "")}`;
      if (wt2Count) wt2Count.textContent = `Word count: ${UI().wordCount(wt2?.value || "")}`;
    }

    function loadWriting() {
      const data = S().getJSON(W.keys.answers, null);
      if (data) {
        if (wt1 && data.task1 !== undefined) wt1.value = String(data.task1);
        if (wt2 && data.task2 !== undefined) wt2.value = String(data.task2);
      }
      updateCounts();
    }

    function saveWriting() {
      if (hasSubmitted) return;
      const payload = {
        task1: wt1 ? wt1.value : "",
        task2: wt2 ? wt2.value : "",
      };
      S().setJSON(W.keys.answers, payload);
      S().set(W.keys.remaining, String(remainingSeconds));
      setAutosave("Autosave: saved");
      updateCounts();
    }


    // Debounced save (reduces localStorage writes while typing)
    let __saveT = null;
    function saveWritingDebounced() {
      if (__saveT) clearTimeout(__saveT);
      __saveT = setTimeout(() => {
        __saveT = null;
        saveWriting();
      }, 450);
    }
    function getStudentFullName() {
      return (S().get(W.keys.studentName, "") || "").trim().replace(/\s+/g, " ");
    }

    function openFinalSubmitModal(reason, opts = {}) {
      window.__IELTS_FINAL_SUBMIT_REASON__ = String(reason || "Student submitted exam.");
      Modal().showModal(
        opts.title || "Name required",
        opts.text || "Please type your Name and Surname to submit the exam.",
        {
          mode: "final",
          showCancel: opts.showCancel === true,
          submitText: opts.submitText || "Submit",
          cancelText: opts.cancelText || "Cancel",
        }
      );
    }

    function collectWritingPayload(reason) {
      const fullName = getStudentFullName();
      const answers = S().getJSON(W.keys.answers, { task1: wt1?.value || "", task2: wt2?.value || "" }) || {
        task1: wt1?.value || "",
        task2: wt2?.value || "",
      };

      return {
        type: "writing",
        testId: W.TEST_ID,
        submittedAt: new Date().toISOString(),
        reason,
        studentFullName: fullName,
        durationMinutes: W.DURATION_MINUTES,
        remainingSeconds,
        answers,
        wordCount: {
          task1: UI().wordCount(answers.task1),
          task2: UI().wordCount(answers.task2),
        },
      };
    }

    async function submitFinalExam(reason) {
      if (hasSubmitted) return;

      let fullName = getStudentFullName();

      if (!UI().isValidFullName(fullName)) {
        // Force modal final mode (name required) and preserve the original submit reason.
        openFinalSubmitModal(reason, {
          title: "Name required",
          text: "Please type your Name and Surname to submit the exam.",
        });
        return;
      }

      hasSubmitted = true;
      S().set(W.keys.submitted, "true");
      if (timer) clearInterval(timer);

      saveWriting();

      const writingPayload = collectWritingPayload(reason);
      S().setJSON(W.keys.lastSubmission, writingPayload);

      // Build FINAL payload (Listening + Reading + Writing)
      const listening = S().getJSON(W.listeningKeys.lastSubmission, null);
      const reading = S().getJSON(`${W.readingTestId}:lastSubmission`, null);

      const finalPayload = {
        examId: R().EXAM.id,
        submittedAt: new Date().toISOString(),
        studentFullName: fullName,
        listening,
        reading,
        writing: writingPayload,
      };

      S().setJSON(R().EXAM.keys.finalSubmission, finalPayload);
      S().set(R().EXAM.keys.finalSubmitted, "true");

      UI().lockWholeExamAfterFinalSubmit();

      // Send to admin if endpoint set
const endpoint = R().ADMIN_ENDPOINT;
if (endpoint) {
  try {
    const body = new URLSearchParams();
    body.append("payload", JSON.stringify(finalPayload));

    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      body,
    });

    window.__IELTS_FINAL_SUBMIT_REASON__ = "";
    Modal().showModal("Exam submitted", "Submitted. (Request sent to Google Sheets.)", { mode: "confirm" });
    return;
  } catch (err) {
    console.error("Final submit failed:", err);
    window.__IELTS_FINAL_SUBMIT_REASON__ = "";
    Modal().showModal("Submitted (local only)", "Could not send to admin endpoint. Saved locally.", { mode: "confirm" });
    return;
  }
}
      window.__IELTS_FINAL_SUBMIT_REASON__ = "";
      Modal().showModal("Submitted (local only)", "ADMIN_ENDPOINT is not set. The exam is saved locally.", { mode: "confirm" });
    }

    // expose for modal final submit button
    window.__IELTS_SUBMIT_FINAL__ = submitFinalExam;

    function startTimer() {
      const paint = () => {
        const t = UI().formatTime(remainingSeconds);
        if (timeEl) timeEl.textContent = t;
        UI().setExamNavTimer?.(`Time left: ${t}`);
      };

      paint();

      timer = setInterval(() => {
        if (hasSubmitted) return;

        remainingSeconds = Math.max(0, remainingSeconds - 1);
        paint();

        if (remainingSeconds % 5 === 0) saveWriting();

        if (remainingSeconds === 0) {
          clearInterval(timer);
          timer = null;
          submitFinalExam("Writing time is up. Auto-submitted.");
        }
      }, 1000);
    }


    writingSection.addEventListener("input", (e) => {
      const t = e.target;
      if (!t) return;
      if (t === wt1 || t === wt2) saveWritingDebounced();
    });

    const endBtn = $("endExamBtn");
    if (endBtn) {
      endBtn.onclick = () => {
        // Admin-only: students must not end/submit early via button
        const isAdmin = (UI && typeof UI().isAdminView === "function" && UI().isAdminView() === true) || (window.IELTS?.Access?.isAdmin?.() === true) || false;
        if (!isAdmin) return;
        openFinalSubmitModal("Admin ended the exam.", {
          title: "End exam",
          text: "Are you sure you want to end the exam and submit?",
          showCancel: true,
          submitText: "Submit",
          cancelText: "Cancel",
        });
      };
    }

    loadWriting();
    S().set(W.keys.started, "true");

    if (hasSubmitted) {
      writingSection.classList.add("view-only");
      const t = UI().formatTime(remainingSeconds);
      if (timeEl) timeEl.textContent = t;
      UI().setExamNavTimer?.(`Time left: ${t}`);
    } else {
      startTimer();
    }
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Engines = window.IELTS.Engines || {};
  window.IELTS.Engines.Writing = { startWritingSystem };
})();
