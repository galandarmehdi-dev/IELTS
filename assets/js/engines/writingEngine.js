/* assets/js/engines/writingEngine.js */
/* STEP 1 PATCH V5 — smaller Supabase payload + non-blocking history save */
(function () {
  "use strict";

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const Modal = () => window.IELTS.Modal;

  function startWritingSystem() {
    if (window.__IELTS_WRITING_INIT__) return;
    window.__IELTS_WRITING_INIT__ = true;
    const LAUNCH_CONTEXT = (typeof R().getLaunchContext === "function" && R().getLaunchContext()) || null;

    const activeTestId =
      (typeof R().getActiveTestId === "function" && R().getActiveTestId()) ||
      S().get("IELTS:EXAM:activeTestId", R().TESTS?.defaultTestId || "ielts1");

    const cfg =
      (typeof R().getTestConfig === "function" && R().getTestConfig(activeTestId)) ||
      R().TESTS?.byId?.[activeTestId] ||
      R().TESTS?.byId?.[R().TESTS?.defaultTestId] ||
      {};

    const namespacedKeys =
      (typeof R().getScopedKeys === "function" && R().getScopedKeys(activeTestId)) ||
      (typeof R().keysFor === "function" && R().keysFor(activeTestId)) ||
      {};
    const legacyKeys = R().LEGACY?.writingKeys || R().TESTS?.writingKeys || {};

    const W = {
      TEST_ID: (typeof R().getLaunchContext === "function" && R().getLaunchContext()?.storageScope)
        ? `${R().getLaunchContext().storageScope}:WRITING`
        : (cfg.writingTestId || R().TESTS?.byId?.[R().TESTS?.defaultTestId || "ielts1"]?.writingTestId || "ielts-writing-001"),
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
      graphImg.style.transform = `scale(${zoom})`;
      graphImg.style.transformOrigin = "top center";
      if (zoomResetBtn) zoomResetBtn.textContent = `${Math.round(zoom * 100)}%`;
      try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch (e) {}
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

    function focusRequestedTask() {
      const task = String(LAUNCH_CONTEXT?.focusTask || "").trim();
      if (!task) return;
      const target = task === "task2" ? wt2 : wt1;
      if (!target) return;
      setTimeout(() => {
        try {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.focus();
        } catch (e) {}
      }, 40);
    }

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

    function hasAnyWritingText(writingPayload) {
      const task1 = String(writingPayload?.answers?.task1 || "").trim();
      const task2 = String(writingPayload?.answers?.task2 || "").trim();
      return Boolean(task1 || task2);
    }

    function fetchWithTimeout(url, options = {}, timeoutMs = Number(R().TIMEOUTS?.resultFetchMs || 45000)) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = setTimeout(() => {
        try { controller?.abort(); } catch (e) {}
      }, Math.max(1000, Number(timeoutMs) || Number(R().TIMEOUTS?.resultFetchMs || 45000)));

      const nextOptions = { ...options };
      if (controller) nextOptions.signal = controller.signal;

      return fetch(url, nextOptions).finally(() => clearTimeout(timer));
    }

    async function withTimeout(promise, timeoutMs, label) {
      let timer = null;
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label || "Operation"} timed out`)), timeoutMs);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        clearTimeout(timer);
      }
    }

    function buildSlimHistoryPayload(finalPayload) {
      const listening = finalPayload?.listening || null;
      const reading = finalPayload?.reading || null;
      const writing = finalPayload?.writing || null;

      return {
        examId: finalPayload?.examId || null,
        submittedAt: finalPayload?.submittedAt || null,
        studentFullName: finalPayload?.studentFullName || null,
        reason: finalPayload?.reason || null,
        listening: listening ? {
          saved: true,
          testId: listening.testId || null,
          answerCount: Object.keys(listening.answers || {}).length
        } : null,
        reading: reading ? {
          saved: true,
          testId: reading.testId || null,
          answerCount: Object.keys(reading.answers || {}).length
        } : null,
        writing: writing ? {
          saved: true,
          testId: writing.testId || null,
          task1Words: Number(writing?.wordCount?.task1 || 0),
          task2Words: Number(writing?.wordCount?.task2 || 0)
        } : null
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
          active_test_id: listening?.activeTestId || reading?.activeTestId || finalPayload?.examId || null,
          submitted_at: finalPayload?.submittedAt || new Date().toISOString(),
          reason: writing?.reason || reading?.reason || listening?.reason || null,
          listening_test_id: listening?.testId || null,
          reading_test_id: reading?.testId || null,
          writing_test_id: writing?.testId || null,
          writing_task1: task1,
          writing_task2: task2,
          task1_words: Number(writing?.wordCount?.task1 || 0),
          task2_words: Number(writing?.wordCount?.task2 || 0),
          final_payload: buildSlimHistoryPayload(finalPayload),
        };

        const insertPromise = supabase.from(historyTable).insert(record);
        const result = await withTimeout(insertPromise, Number(R().TIMEOUTS?.historyInsertMs || 25000), "History save");
        const error = result?.error || null;
        if (error) throw error;
        return { ok: true };
      } catch (err) {
        console.error("Supabase history save failed:", err);
        return { ok: false, error: err, message: String(err?.message || err || "History save failed") };
      }
    }

    async function fetchStudentResultFromBackend(finalPayload) {
      const url = R().buildAdminApiUrl?.({
        action: "studentResult",
        submittedAt: finalPayload?.submittedAt || "",
        studentFullName: finalPayload?.studentFullName || "",
        examId: finalPayload?.examId || "",
        reason: finalPayload?.writing?.reason || "",
      });
      if (!url) return { ok: false, error: "Missing endpoint" };

      const token = await window.IELTS?.Auth?.getAccessToken?.();
      const res = await fetchWithTimeout(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      }, Number(R().TIMEOUTS?.resultFetchMs || 45000));
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true) {
        throw new Error((data && data.error) || `HTTP ${res.status}`);
      }
      return data;
    }

    async function updateAttemptScoresInSupabase(finalPayload, markedResult) {
      try {
        const supabase = window.IELTS?.Auth?.supabase;
        const authUser = window.IELTS?.Auth?.getSavedUser?.() || null;
        const historyTable = window.IELTS?.Registry?.HISTORY_TABLE || "exam_attempts";
        if (!supabase || !authUser?.id || !markedResult) return { ok: false, skipped: true };

        const patch = {
          listening_total: markedResult.listeningTotal ?? null,
          listening_band: markedResult.listeningBand ?? null,
          reading_total: markedResult.readingTotal ?? null,
          reading_band: markedResult.readingBand ?? null,
          final_writing_band: markedResult.finalWritingBand ?? null,
          task1_band: markedResult.task1Band ?? null,
          task2_band: markedResult.task2Band ?? null,
          task1_breakdown: markedResult.task1Breakdown ?? null,
          task2_breakdown: markedResult.task2Breakdown ?? null,
          task1_feedback: markedResult.task1Feedback ?? null,
          task2_feedback: markedResult.task2Feedback ?? null,
          overall_feedback: markedResult.overallFeedback ?? null,
        };

        const updatePromise = supabase
          .from(historyTable)
          .update(patch)
          .eq("user_id", authUser.id)
          .eq("submitted_at", String(finalPayload?.submittedAt || ""))
          .eq("exam_id", String(finalPayload?.examId || ""));

        const result = await withTimeout(updatePromise, Number(R().TIMEOUTS?.historyUpdateMs || 12000), "History score update");
        const error = result?.error || null;
        if (error) throw error;
        return { ok: true };
      } catch (err) {
        console.error("Supabase score update failed:", err);
        return { ok: false, error: err };
      }
    }

    function startMarkedResultPolling(finalPayload) {
      const maxAttempts = Number(R().POLLING?.markedResultMaxAttempts || 18);
      const intervalMs = Number(R().POLLING?.markedResultIntervalMs || 10000);
      let attempts = 0;

      const tick = async () => {
        attempts += 1;
        try {
          const data = await fetchStudentResultFromBackend(finalPayload);
          if (data?.graded && data?.result) {
            await updateAttemptScoresInSupabase(finalPayload, data.result);
            try { window.IELTS?.History?.refresh?.(); } catch (e) {}
            return;
          }
        } catch (err) {
          console.error("Marked result polling failed:", err);
        }
        if (attempts < maxAttempts) {
          setTimeout(tick, intervalMs);
        }
      };

      setTimeout(tick, 4000);
    }

    async function submitFinalExam(reason) {
      if (hasSubmitted) return;

      try {
        let fullName = getStudentFullName();

        if (!UI().isValidFullName(fullName)) {
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

        const submitReason = String(reason || "Student submitted exam.").trim() || "Student submitted exam.";
        const submittedAt = new Date().toISOString();
        const writingPayload = collectWritingPayload(submitReason);
        writingPayload.reason = submitReason;
        writingPayload.submittedAt = submittedAt;
        S().setJSON(W.keys.lastSubmission, writingPayload);

        const listening = S().getJSON(W.listeningKeys.lastSubmission, null);
        const reading = S().getJSON(`${W.readingTestId}:lastSubmission`, null);

        const activeTestId = R().getActiveTestId
          ? R().getActiveTestId()
          : (window.IELTS?.Storage?.get("IELTS:EXAM:activeTestId") || "ielts1");

        const testNumber = String(activeTestId).replace("ielts", "");
        const examId = `ielts-full-${testNumber.padStart(3, "0")}`;

        const finalPayload = {
          examId,
          submittedAt,
          studentFullName: fullName,
          reason: submitReason,
          listening,
          reading,
          writing: writingPayload,
        };

        S().setJSON(R().EXAM.keys.finalSubmission, finalPayload);
        S().set(R().EXAM.keys.finalSubmitted, "true");

        UI().lockWholeExamAfterFinalSubmit();

        const hasWritingText = hasAnyWritingText(writingPayload);

        // Save history immediately so a flaky backend response does not erase the student's record.
        const historyResult = await saveAttemptToSupabase(finalPayload);

        const endpoint = String(R().ADMIN_API_PATH || "").trim();
        let sheetsSaved = false;
        let submissionWarning = "";
        if (endpoint) {
          try {
            const body = new URLSearchParams({
              payload: JSON.stringify(finalPayload)
            });

            const res = await fetchWithTimeout(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
              },
              body: body.toString()
            }, Number(R().TIMEOUTS?.submissionPostMs || 45000));

            const text = await res.text();
            let json = null;
            try { json = JSON.parse(text); } catch (e) {}

            const okResponse = res.ok && (
              /^OK\b/i.test(String(text || "").trim()) ||
              (json && json.ok === true)
            );

            if (!okResponse) {
              throw new Error((json && json.error) || text || `HTTP ${res.status}`);
            }
            sheetsSaved = true;
          } catch (sheetErr) {
            console.error("Backend submission response failed:", sheetErr);
            submissionWarning = String(sheetErr?.message || sheetErr || "Submission response failed");
          }
        }

        if (hasWritingText) {
          try {
            const immediate = await fetchStudentResultFromBackend(finalPayload);
            if (immediate?.graded && immediate?.result) {
              await updateAttemptScoresInSupabase(finalPayload, immediate.result);
              sheetsSaved = true;
            } else {
              startMarkedResultPolling(finalPayload);
            }
          } catch (err) {
            console.error("Immediate marked-result fetch failed:", err);
            startMarkedResultPolling(finalPayload);
          }
        }

        if (historyResult?.ok) {
          try { window.IELTS?.History?.refresh?.(); } catch (e) {}
        }

        window.__IELTS_FINAL_SUBMIT_REASON__ = "";
        Modal().showModal(
          "Exam submitted",
          sheetsSaved
            ? (historyResult?.ok
                ? (hasWritingText
                    ? "Submitted successfully. Google Sheets is saved, and writing will appear in your history after grading finishes."
                    : "Submitted successfully. Google Sheets and history are both saved.")
                : (hasWritingText
                    ? "Submitted successfully to Google Sheets. History may appear after a short delay."
                    : "Submitted successfully to Google Sheets. History may appear after a short delay."))
            : (historyResult?.ok
                ? (submissionWarning
                    ? "Your submission was saved to your history, but the server response was unreliable. If the test already appears in admin results, it will sync here shortly."
                    : "Saved to your history for this account.")
                : "Saved locally on this browser."),
          { mode: "confirm" }
        );
      } catch (err) {
        console.error("submitFinalExam crashed:", err);
        window.__IELTS_FINAL_SUBMIT_REASON__ = "";
        Modal().showModal(
          "Submission error",
          "Something went wrong during submission. Your latest answers are still saved on this browser. Please refresh and try again.",
          { mode: "confirm" }
        );
      }
    }

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
    focusRequestedTask();

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
