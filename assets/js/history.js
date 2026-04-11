(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  const UI = () => window.IELTS?.UI;
  const Auth = () => window.IELTS?.Auth;
  const Registry = () => window.IELTS?.Registry;
  const Router = () => window.IELTS?.Router;

  const state = { rows: [], email: "" };
  const detailState = { sourceRowId: null, sourceScrollY: 0 };
  const objectiveDetailCache = new Map();
  const objectivePrefetchPending = new Set();
  const historyPrefetchState = { promise: null, email: "", startedAt: 0 };
  const LOCAL_HISTORY_KEY_PREFIX = "IELTS:LOCAL:HISTORY:";
  const LOCAL_HISTORY_LAST_OPEN_KEY = "IELTS:LOCAL:HISTORY:lastOpen";
  const HISTORY_REMOTE_CACHE_KEY_PREFIX = "IELTS:REMOTE:HISTORY:";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function examLabel(row) {
    const examId = String(row.exam_id || row.examId || row.active_test_id || "");
    if (/^ielts-practice-/i.test(examId)) {
      return String(row?.final_payload?.practiceLabel || examId).replace(/^ielts-/, "").trim() || "Practice";
    }
    const m = examId.match(/(\d+)/);
    return m ? `IELTS Test ${Number(m[1])}` : (examId || "IELTS Test");
  }

  function totalWords(row) {
    return Number(row.task1_words || 0) + Number(row.task2_words || 0);
  }

  function nullableNumber(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (!text) return null;
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }

  function hasAnyObjectiveAnswers(payloadSection) {
    if (!payloadSection) return false;
    if (Array.isArray(payloadSection)) return payloadSection.length > 0;
    if (typeof payloadSection === "object") {
      return Object.values(payloadSection).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (value && typeof value === "object") return Object.keys(value).length > 0;
        return String(value ?? "").trim() !== "";
      });
    }
    return String(payloadSection).trim() !== "";
  }

  function taskHasContent(words, text) {
    const wordCount = nullableNumber(words);
    return (wordCount !== null && wordCount > 0) || String(text || "").trim() !== "";
  }

  function writingWordText(words, text) {
    return taskHasContent(words, text) ? String(nullableNumber(words) || 0) : "null";
  }

  function effectiveWritingBand(row) {
    const finalBand = nullableNumber(row?.final_writing_band);
    const task1Band = nullableNumber(row?.task1_band);
    const task2Band = nullableNumber(row?.task2_band);
    const hasTask1 = taskHasContent(row?.task1_words, row?.writing_task1);
    const hasTask2 = taskHasContent(row?.task2_words, row?.writing_task2);
    if (!hasTask1 && !hasTask2) return null;
    if (hasTask1 && hasTask2) {
      if (finalBand !== null) return finalBand;
      if (task1Band !== null && task2Band !== null) {
        return Math.round(((task1Band + task2Band) / 2) * 2) / 2;
      }
      return task1Band ?? task2Band ?? null;
    }
    if (hasTask1) return task1Band;
    if (hasTask2) return task2Band;
    return null;
  }

  function hasWritingContent(row) {
    return taskHasContent(row?.task1_words, row?.writing_task1) || taskHasContent(row?.task2_words, row?.writing_task2);
  }

  function objectiveSectionStatus(row, section) {
    const totalKey = `${section}_total`;
    const bandKey = `${section}_band`;
    const totalQuestionsKey = `${section}_total_questions`;
    const payload = row?.final_payload || {};
    const total = nullableNumber(row?.[totalKey]);
    const band = nullableNumber(row?.[bandKey]);
    const totalQuestions = nullableNumber(row?.[totalQuestionsKey]) || 40;
    if (total !== null || band !== null) {
      const compact = total !== null
        ? `${total} / ${totalQuestions}${band !== null ? ` · ${band.toFixed(1)}` : ""}`
        : `Band ${band === null ? "null" : band.toFixed(1)}`;
      return {
        state: "scored",
        total,
        band,
        listText: compact,
        detailText: `${total === null ? "null" : total} / ${totalQuestions} (Band ${band === null ? "null" : band.toFixed(1)})`,
      };
    }
    if (hasAnyObjectiveAnswers(payload?.[section])) {
      return {
        state: "saved",
        total: null,
        band: null,
        listText: "Saved",
        detailText: "Saved",
      };
    }
    return {
      state: "null",
      total: null,
      band: null,
      listText: "null",
      detailText: "null",
    };
  }

  function writingStatus(row) {
    const band = effectiveWritingBand(row);
    if (band !== null) {
      return {
        state: "scored",
        band,
        text: `Band ${band.toFixed(1)}`,
      };
    }
    if (hasWritingContent(row)) {
      return {
        state: "pending",
        band: null,
        text: "Pending",
      };
    }
    return {
      state: "null",
      band: null,
      text: "null",
    };
  }

  function clearElement(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function appendLabeledLine(container, label, value, { bold = true } = {}) {
    if (!container) return;
    const line = document.createElement("div");
    line.append(`${label}: `);
    const valueEl = document.createElement(bold ? "b" : "span");
    valueEl.textContent = String(value ?? "");
    line.appendChild(valueEl);
    container.appendChild(line);
  }

  function appendTextBlock(container, text, fallback = "—") {
    if (!container) return;
    const block = document.createElement("div");
    block.className = "admin-detail-text";
    block.textContent = String(text ?? "").trim() || fallback;
    container.appendChild(block);
  }

  function renderObjectiveReviewInto(container, items, emptyMessage) {
    if (!container) return;
    clearElement(container);
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "objective-review-empty";
      empty.textContent = emptyMessage || "No answer review available yet.";
      container.appendChild(empty);
      return;
    }

    const table = document.createElement("table");
    table.className = "objective-review-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["Q#", "Student", "Correct", "Mark"].forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((item) => {
      const tr = document.createElement("tr");
      [String(item.q ?? "—"), String(item.student || "—"), String(item.correct || "—")].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });
      const markTd = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `objective-review-mark ${item.mark ? "ok" : "bad"}`;
      badge.textContent = item.mark ? "Correct" : "Wrong";
      markTd.appendChild(badge);
      tr.appendChild(markTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  async function fetchObjectiveDetailForRow(row) {
    const payload = row?.final_payload || {};
    if (payload?.attemptKind === "practice" && ["listening", "reading"].includes(String(payload?.practiceSection || ""))) {
      const url = Registry()?.buildAdminApiUrl?.({
        action: "practiceResultDetail",
        id: payload?.practiceId || row?.practice_id || row?.id || "",
        t: Date.now(),
      });
      if (!url) return null;
      const token = await window.IELTS?.Auth?.getAccessToken?.();
      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true || !data.result) return null;
      return data.result;
    }

    const cacheKey = buildMatchKey(row);
    if (objectiveDetailCache.has(cacheKey)) return objectiveDetailCache.get(cacheKey);

    const url = Registry()?.buildAdminApiUrl?.({
      action: "studentObjectiveDetail",
      submittedAt: row.submitted_at || "",
      studentFullName: row.student_full_name || "",
      examId: row.exam_id || row.active_test_id || "",
      reason: row.reason || "",
      t: Date.now(),
    });
    if (!url) return null;

    const token = await window.IELTS?.Auth?.getAccessToken?.();
    const res = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true || !data.result) return null;
    objectiveDetailCache.set(cacheKey, data.result);
    return data.result;
  }

  function prefetchObjectiveDetails(rows, limit) {
    (rows || [])
      .slice(0, Math.max(0, Number(limit) || 0))
      .forEach((row) => {
        const cacheKey = buildMatchKey(row);
        if (!cacheKey || objectiveDetailCache.has(cacheKey) || objectivePrefetchPending.has(cacheKey)) return;
        objectivePrefetchPending.add(cacheKey);
        fetchObjectiveDetailForRow(row)
          .catch(() => null)
          .finally(() => objectivePrefetchPending.delete(cacheKey));
      });
  }

  function renderObjectiveReview(prefix, result) {
    const listeningEl = $(`${prefix}ListeningReview`);
    const readingEl = $(`${prefix}ReadingReview`);
    renderObjectiveReviewInto(listeningEl, result?.listening, "Listening answer review is not available for this attempt yet.");
    renderObjectiveReviewInto(readingEl, result?.reading, "Reading answer review is not available for this attempt yet.");
  }

  async function withTimeout(promise, timeoutMs, label) {
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label || "Operation"} timed out`)), Math.max(1000, Number(timeoutMs) || 20000));
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  }

  function getHistoryEmail() {
    const user = getHistoryUser();
    return String(user?.email || "").trim().toLowerCase();
  }

  function getHistoryUser() {
    return Auth()?.getSavedUser?.() || Auth()?.getSharedSession?.()?.user || null;
  }

  function getLocalHistoryStorageKey(email) {
    return `${LOCAL_HISTORY_KEY_PREFIX}${String(email || "").trim().toLowerCase()}`;
  }

  function loadLocalRows(email) {
    const key = getLocalHistoryStorageKey(email);
    try {
      const rows = window.IELTS?.Storage?.getJSON?.(key, []) || [];
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalRows(email, rows) {
    const key = getLocalHistoryStorageKey(email);
    try {
      window.IELTS?.Storage?.setJSON?.(key, Array.isArray(rows) ? rows.slice(0, 50) : []);
    } catch (e) {}
  }

  function getRemoteHistoryCacheKey(email) {
    return `${HISTORY_REMOTE_CACHE_KEY_PREFIX}${String(email || "").trim().toLowerCase()}`;
  }

  function loadRemoteHistoryCache(email) {
    try {
      return window.IELTS?.Storage?.getJSON?.(getRemoteHistoryCacheKey(email), []) || [];
    } catch (e) {
      return [];
    }
  }

  function saveRemoteHistoryCache(email, rows) {
    try {
      window.IELTS?.Storage?.setJSON?.(getRemoteHistoryCacheKey(email), Array.isArray(rows) ? rows.slice(0, 50) : []);
    } catch (e) {}
  }

  async function loadRows() {
    const supabase = Auth()?.supabase;
    const user = getHistoryUser();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    const email = String(user?.email || "").trim().toLowerCase();
    const localRows = email ? loadLocalRows(email) : [];
    const isSharedPassword = String(user?.provider || user?.app_metadata?.provider || "").trim().toLowerCase() === "shared-password";
    if (!email) return [];
    if (!supabase || isSharedPassword) return localRows;

    const query = supabase
      .from(table)
      .select("id,user_id,user_email,student_full_name,exam_id,active_test_id,submitted_at,reason,task1_words,task2_words,writing_task1,writing_task2,final_payload,listening_total,listening_band,reading_total,reading_band,final_writing_band,task1_band,task2_band,task1_breakdown,task2_breakdown,task1_feedback,task2_feedback,overall_feedback")
      .ilike("user_email", email)
      .order("submitted_at", { ascending: false })
      .limit(50);

    const { data, error } = await withTimeout(query, Number(Registry()?.TIMEOUTS?.historyLoadMs || 20000), "History load");
    if (error) throw error;
    const merged = mergeRowsByMatchKey(Array.isArray(data) ? data : [], localRows);
    saveRemoteHistoryCache(email, merged);
    return merged;
  }


  async function fetchStudentResultForRow(row) {
    const url = Registry()?.buildAdminApiUrl?.({
      action: "studentResult",
      submittedAt: row.submitted_at || "",
      studentFullName: row.student_full_name || "",
      examId: row.exam_id || row.active_test_id || "",
      reason: row.reason || "",
      t: Date.now(),
    });
    if (!url) return null;

    const timeoutMs = Number(Registry()?.TIMEOUTS?.historySyncMs || 45000);
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => {
      try { controller?.abort("history-timeout"); } catch (e) {}
    }, timeoutMs);

    try {
      const token = await window.IELTS?.Auth?.getAccessToken?.();
      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller ? controller.signal : undefined
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true) return null;
      return data;
    } catch (err) {
      if (String(err?.name || "") === "AbortError") return null;
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function buildMatchKey(row) {
    return [
      String(row?.submittedAt || row?.submitted_at || "").trim().toLowerCase(),
      String(row?.studentFullName || row?.student_full_name || "").replace(/\s+/g, " ").trim().toLowerCase(),
      String(row?.examId || row?.exam_id || row?.active_test_id || "").trim().toLowerCase(),
      String(row?.reason || "").replace(/\s+/g, " ").trim().toLowerCase(),
    ].join("::");
  }

  function mergeRowsByMatchKey(primaryRows, secondaryRows) {
    const byKey = new Map();
    (Array.isArray(secondaryRows) ? secondaryRows : []).forEach((row) => {
      const key = buildMatchKey(row);
      if (!key) return;
      byKey.set(key, row);
    });
    (Array.isArray(primaryRows) ? primaryRows : []).forEach((row) => {
      const key = buildMatchKey(row);
      if (!key) return;
      const existing = byKey.get(key) || {};
      byKey.set(key, { ...existing, ...row });
    });
    return Array.from(byKey.values()).sort((a, b) => {
      const aTime = new Date(a?.submitted_at || a?.submittedAt || 0).getTime() || 0;
      const bTime = new Date(b?.submitted_at || b?.submittedAt || 0).getTime() || 0;
      return bTime - aTime;
    });
  }

  function buildLocalAttemptRow(finalPayload) {
    const user = getHistoryUser() || {};
    const listening = finalPayload?.listening || {};
    const reading = finalPayload?.reading || {};
    const writing = finalPayload?.writing || {};
    return {
      id: `local:${buildMatchKey(finalPayload)}`,
      user_id: String(Auth()?.getIdentityKey?.() || user?.identityKey || user?.email || user?.id || "").trim().toLowerCase(),
      user_email: String(user?.email || "").trim().toLowerCase(),
      student_full_name: finalPayload?.studentFullName || user?.name || "",
      exam_id: finalPayload?.examId || "",
      active_test_id: listening?.activeTestId || reading?.activeTestId || finalPayload?.examId || "",
      submitted_at: finalPayload?.submittedAt || new Date().toISOString(),
      reason: finalPayload?.reason || writing?.reason || reading?.reason || listening?.reason || "",
      writing_task1: String(writing?.answers?.task1 || ""),
      writing_task2: String(writing?.answers?.task2 || ""),
      task1_words: Number(writing?.wordCount?.task1 || 0),
      task2_words: Number(writing?.wordCount?.task2 || 0),
      final_payload: {
        attemptKind: finalPayload?.attemptKind || null,
        practiceSection: finalPayload?.practiceSection || null,
        practiceLabel: finalPayload?.practiceLabel || null,
        practiceId: finalPayload?.practiceId || null,
        examId: finalPayload?.examId || "",
        submittedAt: finalPayload?.submittedAt || "",
        studentFullName: finalPayload?.studentFullName || "",
        reason: finalPayload?.reason || "",
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
      },
      listening_total: null,
      listening_band: null,
      reading_total: null,
      reading_band: null,
      final_writing_band: null,
      task1_band: null,
      task2_band: null,
      task1_breakdown: null,
      task2_breakdown: null,
      task1_feedback: null,
      task2_feedback: null,
      overall_feedback: null,
    };
  }

  function rememberLocalAttempt(finalPayload, options = {}) {
    const email = getHistoryEmail();
    if (!email || !finalPayload?.submittedAt) return null;
    const row = buildLocalAttemptRow(finalPayload);
    const rows = mergeRowsByMatchKey([row], loadLocalRows(email));
    saveLocalRows(email, rows);
    const key = buildMatchKey(row);
    if (options.openAfterSubmit && key) {
      try { window.IELTS?.Storage?.set(LOCAL_HISTORY_LAST_OPEN_KEY, key); } catch (e) {}
    }
    return row;
  }

  function getLastOpenHistoryKey() {
    try {
      return String(window.IELTS?.Storage?.get(LOCAL_HISTORY_LAST_OPEN_KEY, "") || "");
    } catch (e) {
      return "";
    }
  }

  function clearLastOpenHistoryKey() {
    try { window.IELTS?.Storage?.remove?.(LOCAL_HISTORY_LAST_OPEN_KEY); } catch (e) {}
  }

  function mergeBackendResult(row, result) {
    if (!result) return row;
    return {
      ...row,
      submitted_at: row.submitted_at || result.submittedAt || "",
      student_full_name: row.student_full_name || result.studentFullName || "",
      exam_id: row.exam_id || result.examId || row.active_test_id || "",
      reason: row.reason || result.reason || "",
      listening_total: result.listeningTotal ?? row.listening_total ?? null,
      listening_band: result.listeningBand ?? row.listening_band ?? null,
      reading_total: result.readingTotal ?? row.reading_total ?? null,
      reading_band: result.readingBand ?? row.reading_band ?? null,
      final_writing_band: result.finalWritingBand ?? row.final_writing_band ?? null,
      task1_band: result.task1Band ?? row.task1_band ?? null,
      task2_band: result.task2Band ?? row.task2_band ?? null,
      task1_breakdown: result.task1Breakdown ?? row.task1_breakdown ?? null,
      task2_breakdown: result.task2Breakdown ?? row.task2_breakdown ?? null,
      task1_feedback: result.task1Feedback ?? row.task1_feedback ?? null,
      task2_feedback: result.task2Feedback ?? row.task2_feedback ?? null,
      overall_feedback: result.overallFeedback ?? row.overall_feedback ?? null,
      writing_task1: result.writingTask1 ?? row.writing_task1 ?? "",
      writing_task2: result.writingTask2 ?? row.writing_task2 ?? "",
      task1_words: result.task1Words ?? row.task1_words ?? 0,
      task2_words: result.task2Words ?? row.task2_words ?? 0,
    };
  }

  async function fetchStudentResultsForRows(rows) {
    const endpoint = Registry()?.buildAdminApiUrl?.({ action: "studentResults" });
    const eligibleRows = (rows || []).filter((row) => {
      const payload = row?.final_payload || {};
      return !(payload?.attemptKind === "practice" && ["listening", "reading"].includes(String(payload?.practiceSection || "")));
    });
    if (!endpoint || !eligibleRows.length) return [];
    const token = await window.IELTS?.Auth?.getAccessToken?.();
    const res = await fetch(endpoint.toString(), {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        rows: eligibleRows.map((row) => ({
          submittedAt: row.submitted_at || "",
          studentFullName: row.student_full_name || "",
          examId: row.exam_id || row.active_test_id || "",
          reason: row.reason || "",
        })),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.ok !== true || !Array.isArray(data.results)) return [];
    return data.results;
  }

  async function fetchMergedHistoryRows(email) {
    let rows = await loadRows();
    const practiceEndpoint = Registry()?.buildAdminApiUrl?.({ action: "studentPracticeResults" });
    if (practiceEndpoint) {
      const token = await window.IELTS?.Auth?.getAccessToken?.();
      const practiceRes = await fetch(practiceEndpoint.toString(), {
        method: "GET",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).catch(() => null);
      const practiceData = await practiceRes?.json?.().catch(() => null);
      if (practiceRes?.ok && practiceData?.ok === true && Array.isArray(practiceData.results)) {
        rows = mergeRowsByMatchKey(rows, practiceData.results);
      }
    }
    const backendResults = await fetchStudentResultsForRows(rows).catch(() => []);
    if (backendResults.length) {
      const byKey = new Map(backendResults.map((entry) => [String(entry.requestedKey || ""), entry.result]).filter((pair) => pair[0]));
      rows = rows.map((row) => mergeBackendResult(row, byKey.get(buildMatchKey(row))));
    }
    if (email) saveRemoteHistoryCache(email, rows);
    return rows;
  }

  function prefetchHistoryRows() {
    const email = getHistoryEmail();
    if (!email) return Promise.resolve([]);
    const now = Date.now();
    if (historyPrefetchState.promise && historyPrefetchState.email === email) return historyPrefetchState.promise;
    if (state.rows.length && state.email === email && historyPrefetchState.email === email && now - historyPrefetchState.startedAt < 30000) {
      return Promise.resolve(state.rows.slice());
    }
    historyPrefetchState.email = email;
    historyPrefetchState.startedAt = now;
    historyPrefetchState.promise = fetchMergedHistoryRows(email)
      .then((rows) => {
        state.rows = rows;
        state.email = email;
        return rows;
      })
      .finally(() => {
        historyPrefetchState.promise = null;
      });
    return historyPrefetchState.promise;
  }

  async function syncRowToSupabase(row, result) {
    const supabase = Auth()?.supabase;
    const user = getHistoryUser();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    const email = String(user?.email || "").trim().toLowerCase();
    const isSharedPassword = String(user?.provider || user?.app_metadata?.provider || "").trim().toLowerCase() === "shared-password";
    if (isSharedPassword) return false;
    if (!supabase || !email || !row?.id || !result) return false;

    const patch = {
      listening_total: result.listeningTotal ?? null,
      listening_band: result.listeningBand ?? null,
      reading_total: result.readingTotal ?? null,
      reading_band: result.readingBand ?? null,
      final_writing_band: result.finalWritingBand ?? null,
      task1_band: result.task1Band ?? null,
      task2_band: result.task2Band ?? null,
      task1_breakdown: result.task1Breakdown ?? null,
      task2_breakdown: result.task2Breakdown ?? null,
      task1_feedback: result.task1Feedback ?? null,
      task2_feedback: result.task2Feedback ?? null,
      overall_feedback: result.overallFeedback ?? null,
    };

    const { error } = await supabase.from(table).update(patch).eq("id", row.id).ilike("user_email", email);
    return !error;
  }

  function isPending(row) {
    return writingStatus(row).state === "pending";
  }

  async function refreshPendingRows(rows) {
    const limit = Number(Registry()?.POLLING?.historyRefreshPendingLimit || 8);
    const pending = (rows || []).filter(isPending).slice(0, limit);
    if (!pending.length) return false;

    let updatedAny = false;
    for (const row of pending) {
      try {
        const data = await fetchStudentResultForRow(row);
        if (data?.graded && data?.result) {
          const ok = await syncRowToSupabase(row, data.result);
          if (ok) updatedAny = true;
        }
      } catch (err) {
        if (String(err?.name || "") !== "AbortError") {
          console.error("History sync failed:", err);
        }
      }
    }
    return updatedAny;
  }


  function renderSummary(rows) {
    const setText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = String(value);
    };

    const avg = (items, key) => {
      const nums = items
        .map((r) => key === "final_writing_band" ? effectiveWritingBand(r) : nullableNumber(r?.[key]))
        .filter((n) => n !== null);
      if (!nums.length) return "null";
      return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
    };

    setText("historyStatCount", rows.length);
    setText("historyStatListening", avg(rows, "listening_band"));
    setText("historyStatReading", avg(rows, "reading_band"));
    setText("historyStatWriting", avg(rows, "final_writing_band"));
    setText("historyStatLatest", rows[0] ? fmtDate(rows[0].submitted_at) : "—");
    setText("historyStatWords", rows[0] ? totalWords(rows[0]) : 0);
  }

  function renderTable(rows) {
    const tbody = $("historyTbody");
    const empty = $("historyEmpty");
    if (!tbody || !empty) return;

    clearElement(tbody);
    if (!rows.length) {
      empty.classList.remove("hidden");
      renderSummary([]);
      return;
    }

    empty.classList.add("hidden");
    rows.forEach((row, idx) => {
      const listeningStatus = objectiveSectionStatus(row, "listening");
      const readingStatus = objectiveSectionStatus(row, "reading");
      const writing = writingStatus(row);
      const rowId = `history-row-${idx}`;
      const tr = document.createElement("tr");
      tr.id = rowId;

      const submittedTd = document.createElement("td");
      submittedTd.textContent = fmtDate(row.submitted_at);
      tr.appendChild(submittedTd);

      const examTd = document.createElement("td");
      examTd.textContent = examLabel(row);
      tr.appendChild(examTd);

      const nameTd = document.createElement("td");
      nameTd.textContent = row.student_full_name || "—";
      tr.appendChild(nameTd);

      const listeningTd = document.createElement("td");
      listeningTd.textContent = listeningStatus.listText;
      tr.appendChild(listeningTd);

      const readingTd = document.createElement("td");
      readingTd.textContent = readingStatus.listText;
      tr.appendChild(readingTd);

      const writingTd = document.createElement("td");
      writingTd.append(writing.text);
      writingTd.appendChild(document.createElement("br"));
      const small = document.createElement("span");
      small.className = "small";
      small.textContent = `T1: ${writingWordText(row.task1_words, row.writing_task1)} · T2: ${writingWordText(row.task2_words, row.writing_task2)}`;
      writingTd.appendChild(small);
      tr.appendChild(writingTd);

      const actionTd = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.type = "button";
      btn.setAttribute("data-history-view", String(idx));
      btn.setAttribute("data-history-row-id", rowId);
      btn.textContent = "View";
      actionTd.appendChild(btn);
      tr.appendChild(actionTd);

      tbody.appendChild(tr);
    });
    renderSummary(rows);
  }

  async function renderDetail(row, options = {}) {
    const detail = $("historyDetail");
    if (!detail || !row) return;
    detailState.sourceRowId = options.sourceRowId || null;
    detailState.sourceScrollY = window.scrollY || 0;
    const payload = row.final_payload || {};
    const listeningStatus = objectiveSectionStatus(row, "listening");
    const readingStatus = objectiveSectionStatus(row, "reading");
    const writing = writingStatus(row);
    $("historyDetailTitle").textContent = examLabel(row);
    const metaEl = $("historyDetailMeta");
    clearElement(metaEl);
    appendLabeledLine(metaEl, "Submitted", fmtDate(row.submitted_at));
    appendLabeledLine(metaEl, "Name used", row.student_full_name || "—");
    appendLabeledLine(metaEl, "Email", row.user_email || "—");

    const scoresEl = $("historyDetailScores");
    clearElement(scoresEl);
    appendLabeledLine(scoresEl, "Exam ID", row.exam_id || row.active_test_id || "—");
    appendLabeledLine(scoresEl, "Listening", listeningStatus.detailText);
    appendLabeledLine(scoresEl, "Reading", readingStatus.detailText);
    appendLabeledLine(scoresEl, "Writing", writing.text);
    appendLabeledLine(scoresEl, "Writing words", String(totalWords(row) || "null"));
    scoresEl.appendChild(document.createElement("br"));
    appendLabeledLine(scoresEl, "Task 1 band", nullableNumber(row.task1_band) !== null ? nullableNumber(row.task1_band).toFixed(1) : "null");
    appendLabeledLine(scoresEl, "Task 2 band", nullableNumber(row.task2_band) !== null ? nullableNumber(row.task2_band).toFixed(1) : "null");
    appendLabeledLine(scoresEl, "Overall Writing score", writing.text);
    const setText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value || "";
    };
    const setScore = (id, label, value) => {
      const el = $(id);
      clearElement(el);
      appendLabeledLine(el, label, value);
    };
    setScore("historyDetailTask1Score", "Task 1 band", row.task1_band || "—");
    setScore("historyDetailTask2Score", "Task 2 band", row.task2_band || "—");
    const overallFeedbackEl = $("historyDetailOverallFeedback");
    clearElement(overallFeedbackEl);
    appendTextBlock(overallFeedbackEl, row.overall_feedback || "", "No overall feedback yet.");
    setText("historyDetailTask1", row.writing_task1 || "");
    setText("historyDetailTask2", row.writing_task2 || "");
    setText("historyDetailTask1Feedback", row.task1_feedback || "");
    setText("historyDetailTask2Feedback", row.task2_feedback || "");
    renderObjectiveReview("historyDetail", null);
    detail.classList.remove("hidden");
    try {
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {}
    try {
      const objectiveResult = await fetchObjectiveDetailForRow(row);
      renderObjectiveReview("historyDetail", objectiveResult);
    } catch (e) {
      renderObjectiveReview("historyDetail", null);
    }
  }

  async function openHistory() {
    try {
      if (!getHistoryUser()) return;
      UI()?.showOnly?.("history");
      try {
        const testId = Registry()?.getActiveTestId?.() || Registry()?.TESTS?.defaultTestId || "ielts1";
        Router()?.setHashRoute?.(testId, "history");
      } catch (e) {}
      const email = getHistoryEmail();
      const cachedRows = email ? mergeRowsByMatchKey(loadRemoteHistoryCache(email), loadLocalRows(email)) : [];
      if (cachedRows.length) {
        state.rows = cachedRows;
        state.email = email;
        renderTable(cachedRows);
        prefetchObjectiveDetails(cachedRows, 4);
      } else if (state.rows.length && state.email === email) {
        renderTable(state.rows);
      } else if ($("historyTbody")) {
        $("historyTbody").innerHTML = '<tr><td colspan="7">Loading history...</td></tr>';
      }
      let rows = await prefetchHistoryRows();
      state.rows = rows;
      state.email = email;
      renderTable(rows);
      prefetchObjectiveDetails(rows, 4);
      const pendingOpenKey = getLastOpenHistoryKey();
      if (pendingOpenKey) {
        const idx = rows.findIndex((row) => buildMatchKey(row) === pendingOpenKey);
        if (idx >= 0) {
          clearLastOpenHistoryKey();
          await renderDetail(rows[idx], {
            sourceRowId: `history-row-${idx}`
          });
        }
      }
      if (!rows.length) {
        const lastLocal = window.IELTS?.Storage?.getJSON?.(window.IELTS?.Registry?.EXAM?.keys?.finalSubmission || "IELTS:EXAM:finalSubmission", null);
        if (lastLocal?.submittedAt) {
          const tbody = $("historyTbody");
          if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7">No synced history yet. Your latest submission is saved locally and may appear here after the next refresh.</td></tr>';
          }
        }
      }
      refreshPendingRows(rows).then(async (updated) => {
        if (!updated) return;
        let refreshedRows = await fetchMergedHistoryRows(email);
        state.rows = refreshedRows;
        state.email = email;
        if (email) saveRemoteHistoryCache(email, refreshedRows);
        renderTable(refreshedRows);
        prefetchObjectiveDetails(refreshedRows, 4);
      }).catch(() => {});
    } catch (err) {
      const tbody = $("historyTbody");
      if (tbody) tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message || "Could not load history.")}</td></tr>`;
    }
  }

  function closeHistory() {
    const detail = $("historyDetail");
    detail?.classList.add("hidden");
    if (detailState.sourceRowId) {
      const source = document.getElementById(detailState.sourceRowId);
      if (source) {
        try {
          source.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (e) {}
      } else {
        try { window.scrollTo({ top: detailState.sourceScrollY || 0, behavior: "smooth" }); } catch (e) {}
      }
      detailState.sourceRowId = null;
      return;
    }
    UI()?.showOnly?.("home");
    UI()?.updateHomeStatusLine?.("Status: Signed in");
    try {
      const testId = Registry()?.getActiveTestId?.() || Registry()?.TESTS?.defaultTestId || "ielts1";
      Router()?.setHashRoute?.(testId, "home");
    } catch (e) {}
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-history-view]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-history-view"));
    renderDetail(state.rows[idx], {
      sourceRowId: btn.getAttribute("data-history-row-id") || null
    });
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.History = { openHistory, closeHistory, refresh: openHistory, loadRows, rememberLocalAttempt, prefetch: prefetchHistoryRows };

  document.addEventListener("partials:loaded", () => {
    $("openHistoryBtn")?.addEventListener("click", openHistory);
    $("historyRefreshBtn")?.addEventListener("click", openHistory);
    $("historyBackBtn")?.addEventListener("click", closeHistory);
    $("historyDetailCloseBtn")?.addEventListener("click", () => $("historyDetail")?.classList.add("hidden"));
    window.addEventListener("ielts:authchanged", () => {
      if (getHistoryUser()) prefetchHistoryRows().catch(() => {});
    });
    if (getHistoryUser()) prefetchHistoryRows().catch(() => {});
  }, { once: true });
})();
