/* assets/js/engines/writingEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function startWritingSystem() {
    const W = {
      TEST_ID: R().TESTS.writingTestId,
      DURATION_MINUTES: 60,
      keys: R().TESTS.writingKeys,
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

    function getStudentFullName() {
      return (S().get(W.keys.studentName, "") || "").trim().replace(/\s+/g, " ");
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
        // Force modal final mode (name required) instead of looping alerts
        Modal().showModal("Name required", "Please type your Name and Surname to submit the exam.", {
          mode: "final",
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
      const listening = S().getJSON(R().TESTS.listeningKeys.lastSubmission, null);
      const reading = S().getJSON(`${R().TESTS.readingTestId}:lastSubmission`, null);

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
          await fetch(endpoint, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          });

          Modal().showModal("Exam submitted", "Submitted and sent to Google Sheets.", { mode: "confirm" });
          return;
        } catch {
          Modal().showModal("Submitted (local only)", "Could not send to admin endpoint. Saved locally.", { mode: "confirm" });
          return;
        }
      }

      Modal().showModal("Submitted (local only)", "ADMIN_ENDPOINT is not set. The exam is saved locally.", { mode: "confirm" });
    }

    // expose for modal final submit button
    window.__IELTS_SUBMIT_FINAL__ = submitFinalExam;

    function startTimer() {
      if (timeEl) timeEl.textContent = UI().formatTime(remainingSeconds);

      timer = setInterval(() => {
        if (hasSubmitted) return;

        remainingSeconds = Math.max(0, remainingSeconds - 1);
        if (timeEl) timeEl.textContent = UI().formatTime(remainingSeconds);

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
      if (t === wt1 || t === wt2) saveWriting();
    });

    const endBtn = $("endExamBtn");
    if (endBtn) {
      endBtn.onclick = () => {
        Modal().showModal("End exam", "Are you sure you want to end the exam and submit?", {
          mode: "final", // name required
          showCancel: true,
          submitText: "Submit",
          cancelText: "Cancel",
          onConfirm: async () => {
            // modal final submit button will call __IELTS_SUBMIT_FINAL__
            // but in case name already exists we can force submit here:
            const fullName = getStudentFullName();
            if (UI().isValidFullName(fullName)) {
              await submitFinalExam("Student ended the exam.");
            }
          },
        });
      };
    }

    loadWriting();
    S().set(W.keys.started, "true");

    if (hasSubmitted) {
      writingSection.classList.add("view-only");
      if (timeEl) timeEl.textContent = UI().formatTime(remainingSeconds);
    } else {
      startTimer();
    }

    window.addEventListener("beforeunload", (e) => {
      const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
      if (!finalDone) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Engines = window.IELTS.Engines || {};
  window.IELTS.Engines.Writing = { startWritingSystem };
})();
