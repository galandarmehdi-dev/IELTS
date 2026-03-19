/* assets/js/engines/writingEngine.js */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function startWritingSystem() {
    if (window.__IELTS_WRITING_INIT__) return;
    window.__IELTS_WRITING_INIT__ = true;
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
    const graphViewport = $("writingGraphViewport");
    const graphImg = $("writingTask1GraphImg") || writingSection.querySelector(".writing-graph img");
    const zoomInBtn = $("writingZoomInBtn");
    const zoomOutBtn = $("writingZoomOutBtn");
    const zoomResetBtn = $("writingZoomResetBtn");
    const ZOOM_KEY = "IELTSPREF:writingGraphZoom";

function applyActiveWritingContent() {
  const content = (typeof R().getActiveTestContent === "function" && R().getActiveTestContent()) || {};
  const writing = content.writing || {};
  const cards = writingSection.querySelectorAll(".writing-card");
  if (cards.length < 2) return;

  const task1Inst = cards[0].querySelector(".writing-inst");
  const task1GraphImg = cards[0].querySelector(".writing-graph img");
  const task2Inst = cards[1].querySelector(".writing-inst");

  if (task1Inst && writing.task1Html) task1Inst.innerHTML = writing.task1Html;
  if (task1GraphImg && writing.task1ImageSrc) task1GraphImg.src = writing.task1ImageSrc;
  if (task2Inst && writing.task2Html) task2Inst.innerHTML = writing.task2Html;
}

    function setGraphZoom(value) {
      if (!graphImg) return 1;
      const zoom = Math.max(1, Math.min(3, Number(value) || 1));
      graphImg.style.width = `${Math.round(zoom * 100)}%`;
      if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(zoom * 100)}%`;
      try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch {}
      return zoom;
    }

    function initGraphZoomControls() {
      const savedZoom = localStorage.getItem(ZOOM_KEY) || "1";
      setGraphZoom(savedZoom);
      if (!graphImg || !graphViewport || graphViewport.dataset.zoomBound === "1") return;
      graphViewport.dataset.zoomBound = "1";

      zoomInBtn?.addEventListener("click", () => {
        const current = Number(localStorage.getItem(ZOOM_KEY) || graphImg.style.width.replace('%','') / 100 || 1);
        setGraphZoom(current + 0.25);
      });
      zoomOutBtn?.addEventListener("click", () => {
        const current = Number(localStorage.getItem(ZOOM_KEY) || graphImg.style.width.replace('%','') / 100 || 1);
        setGraphZoom(current - 0.25);
      });
      zoomResetBtn?.addEventListener("click", () => setGraphZoom(1));
      graphViewport.addEventListener("wheel", (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        const current = Number(localStorage.getItem(ZOOM_KEY) || graphImg.style.width.replace('%','') / 100 || 1);
        setGraphZoom(current + (e.deltaY < 0 ? 0.1 : -0.1));
      }, { passive: false });
    }

    applyActiveWritingContent();
    initGraphZoomControls();

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
  const answers =
    S().getJSON(W.keys.answers, { task1: wt1?.value || "", task2: wt2?.value || "" }) || {
      task1: wt1?.value || "",
      task2: wt2?.value || "",
    };

  const activeContent =
    (typeof R().getActiveTestContent === "function" && R().getActiveTestContent()) || {};
  const writingContent = activeContent.writing || {};

  const stripHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = String(html || "");
    return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
  };

  return {
    type: "writing",
    testId: W.TEST_ID,
    submittedAt: new Date().toISOString(),
    reason,
    studentFullName: fullName,
    durationMinutes: W.DURATION_MINUTES,
    remainingSeconds,

    prompts: {
      task1Html: writingContent.task1Html || "",
      task1Text: stripHtml(writingContent.task1Html || ""),
      task1ImageSrc: writingContent.task1ImageSrc || "",
      task2Html: writingContent.task2Html || "",
      task2Text: stripHtml(writingContent.task2Html || ""),
    },

    answers,
    wordCount: {
      task1: UI().wordCount(answers.task1),
      task2: UI().wordCount(answers.task2),
    },
  };
}

async function saveAttemptToSupabase(finalPayload) {
  try {
    const supabase = window.IELTS?.Auth?.supabase;
    const authUser = window.IELTS?.Auth?.getSavedUser?.() || null;
    const historyTable = window.IELTS?.Registry?.HISTORY_TABLE || "exam_attempts";
    if (!supabase || !authUser?.id) return { ok: false, skipped: true };

    const listening = finalPayload?.listening || {};
    const reading = finalPayload?.reading || {};
    const writing = finalPayload?.writing || {};
    const task1 = String(writing?.answers?.task1 || "");
    const task2 = String(writing?.answers?.task2 || "");

    const record = {
      user_id: authUser.id,
      user_email: authUser.email || null,
      student_full_name: finalPayload?.studentFullName || authUser.name || null,
      exam_id: finalPayload?.examId || null,
      active_test_id: listening?.activeTestId || reading?.activeTestId || null,
      submitted_at: finalPayload?.submittedAt || new Date().toISOString(),
      reason: writing?.reason || reading?.reason || listening?.reason || null,
      listening_test_id: listening?.testId || null,
      reading_test_id: reading?.testId || null,
      writing_test_id: writing?.testId || null,
      listening_answers: listening?.answers || {},
      reading_answers: reading?.answers || {},
      writing_task1: task1,
      writing_task2: task2,
      task1_words: Number(writing?.wordCount?.task1 || 0),
      task2_words: Number(writing?.wordCount?.task2 || 0),
      final_payload: finalPayload,
    };

    const { error } = await supabase.from(historyTable).insert(record);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("Supabase history save failed:", err);
    return { ok: false, error: err };
  }
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

      // Determine examId dynamically
const activeTestId = R().getActiveTestId
  ? R().getActiveTestId()
  : (window.IELTS?.Storage?.get("IELTS:EXAM:activeTestId") || "ielts1");

const testNumber = String(activeTestId).replace("ielts", "");
const examId = `ielts-full-${testNumber.padStart(3, "0")}`;

// Build FINAL payload
const finalPayload = {
  examId: examId,
  submittedAt: new Date().toISOString(),
  studentFullName: fullName,
  listening,
  reading,
  writing: writingPayload,
};

      S().setJSON(R().EXAM.keys.finalSubmission, finalPayload);
      S().set(R().EXAM.keys.finalSubmitted, "true");

      UI().lockWholeExamAfterFinalSubmit();

      const historyResult = await saveAttemptToSupabase(finalPayload);

      // Send to admin if endpoint set
const endpoint = R().ADMIN_ENDPOINT;
if (endpoint) {
  try {
    const body = new URLSearchParams({
      payload: JSON.stringify(finalPayload)
    });

    const res = await fetch(endpoint, {
      method: "POST",
      body
    });

    const text = await res.text();

    if (!res.ok || !/^OK\b/i.test(text)) {
      throw new Error(text || `HTTP ${res.status}`);
    }

    window.__IELTS_FINAL_SUBMIT_REASON__ = "";
    Modal().showModal(
      "Exam submitted",
      historyResult?.ok ? "Submitted successfully and saved to your history." : "Submitted successfully to Google Sheets. History save was skipped on this device.",
      { mode: "confirm" }
    );
    return;
  } catch (err) {
    console.error("Final submit failed:", err);
    window.__IELTS_FINAL_SUBMIT_REASON__ = "";
    Modal().showModal(
      "Submitted (local only)",
      historyResult?.ok ? "Could not send to Google Sheets, but the test was saved to your history." : "Could not send to Google Sheets. Saved locally on this browser.",
      { mode: "confirm" }
    );
    return;
  }
}
      window.__IELTS_FINAL_SUBMIT_REASON__ = "";
      Modal().showModal("Submitted", historyResult?.ok ? "Saved to your history for this account." : "Saved locally on this browser.", { mode: "confirm" });
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
