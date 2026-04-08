(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  const UI = () => window.IELTS?.UI;
  const Auth = () => window.IELTS?.Auth;
  const Registry = () => window.IELTS?.Registry;
  const Router = () => window.IELTS?.Router;

  const state = { rows: [] };
  const detailState = { sourceRowId: null, sourceScrollY: 0 };
  const objectiveDetailCache = new Map();
  const objectivePrefetchPending = new Set();
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
    const m = examId.match(/(\d+)/);
    return m ? `IELTS Test ${Number(m[1])}` : (examId || "IELTS Test");
  }

  function totalWords(row) {
    return Number(row.task1_words || 0) + Number(row.task2_words || 0);
  }

  function buildObjectiveReviewHtml(items, emptyMessage) {
    const rows = Array.isArray(items) ? items : [];
    if (!rows.length) {
      return `<div class="objective-review-empty">${escapeHtml(emptyMessage || "No answer review available yet.")}</div>`;
    }
    return `
      <table class="objective-review-table">
        <thead>
          <tr>
            <th>Q#</th>
            <th>Student</th>
            <th>Correct</th>
            <th>Mark</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((item) => `
            <tr>
              <td>${escapeHtml(String(item.q ?? "—"))}</td>
              <td>${escapeHtml(String(item.student || "—"))}</td>
              <td>${escapeHtml(String(item.correct || "—"))}</td>
              <td><span class="objective-review-mark ${item.mark ? "ok" : "bad"}">${item.mark ? "Correct" : "Wrong"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  async function fetchObjectiveDetailForRow(row) {
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
    if (listeningEl) {
      listeningEl.innerHTML = buildObjectiveReviewHtml(result?.listening, "Listening answer review is not available for this attempt yet.");
    }
    if (readingEl) {
      readingEl.innerHTML = buildObjectiveReviewHtml(result?.reading, "Reading answer review is not available for this attempt yet.");
    }
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
    const user = Auth()?.getSavedUser?.();
    return String(user?.email || "").trim().toLowerCase();
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
    const user = Auth()?.getSavedUser?.();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    const email = String(user?.email || "").trim().toLowerCase();
    const localRows = email ? loadLocalRows(email) : [];
    if (!email) return [];
    if (!supabase) return localRows;

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
    const user = Auth()?.getSavedUser?.() || {};
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
    if (!endpoint || !rows?.length) return [];
    const token = await window.IELTS?.Auth?.getAccessToken?.();
    const res = await fetch(endpoint.toString(), {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        rows: rows.map((row) => ({
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

  async function syncRowToSupabase(row, result) {
    const supabase = Auth()?.supabase;
    const user = Auth()?.getSavedUser?.();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    const email = String(user?.email || "").trim().toLowerCase();
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
    const hasWriting =
      String(row?.writing_task1 || "").trim() !== "" ||
      String(row?.writing_task2 || "").trim() !== "";
    if (!hasWriting) return false;
    return String(row?.final_writing_band || "").trim() === "";
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
        .map((r) => Number(r?.[key]))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (!nums.length) return "0.0";
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

    if (!rows.length) {
      tbody.innerHTML = "";
      empty.classList.remove("hidden");
      renderSummary([]);
      return;
    }

    empty.classList.add("hidden");
    tbody.innerHTML = rows.map((row, idx) => {
      const payload = row.final_payload || {};
      const listeningSaved = payload.listening ? "Saved" : "—";
      const readingSaved = payload.reading ? "Saved" : "—";
      const rowId = `history-row-${idx}`;
      return `
        <tr id="${rowId}">
          <td>${escapeHtml(fmtDate(row.submitted_at))}</td>
          <td>${escapeHtml(examLabel(row))}</td>
          <td>${escapeHtml(row.student_full_name || "—")}</td>
          <td>${escapeHtml(row.listening_band ? `Band ${row.listening_band}` : listeningSaved)}</td>
          <td>${escapeHtml(row.reading_band ? `Band ${row.reading_band}` : readingSaved)}</td>
          <td>${escapeHtml(row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending")}<br><span class="small">T1: ${escapeHtml(String(row.task1_words || 0))} · T2: ${escapeHtml(String(row.task2_words || 0))}</span></td>
          <td><button class="btn secondary" type="button" data-history-view="${idx}" data-history-row-id="${rowId}">View</button></td>
        </tr>
      `;
    }).join("");
    renderSummary(rows);
  }

  async function renderDetail(row, options = {}) {
    const detail = $("historyDetail");
    if (!detail || !row) return;
    detailState.sourceRowId = options.sourceRowId || null;
    detailState.sourceScrollY = window.scrollY || 0;
    const payload = row.final_payload || {};
    $("historyDetailTitle").textContent = examLabel(row);
    $("historyDetailMeta").innerHTML = `Submitted: <b>${escapeHtml(fmtDate(row.submitted_at))}</b><br>Name used: <b>${escapeHtml(row.student_full_name || "—")}</b><br>Email: <b>${escapeHtml(row.user_email || "—")}</b>`;
    $("historyDetailScores").innerHTML = `Exam ID: <b>${escapeHtml(row.exam_id || row.active_test_id || "—")}</b><br>Listening: <b>${escapeHtml(row.listening_total != null && row.listening_total !== "" ? `${row.listening_total} / 40 (Band ${row.listening_band || "—"})` : "Pending")}</b><br>Reading: <b>${escapeHtml(row.reading_total != null && row.reading_total !== "" ? `${row.reading_total} / 40 (Band ${row.reading_band || "—"})` : "Pending")}</b><br>Writing: <b>${escapeHtml(row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending")}</b><br>Writing words: <b>${escapeHtml(String(totalWords(row)))}</b><br><br>Task 1 band: <b>${escapeHtml(row.task1_band || "—")}</b><br>Task 2 band: <b>${escapeHtml(row.task2_band || "—")}</b><br>Overall Writing score: <b>${escapeHtml(row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending")}</b>`;
    const setText = (id, value) => {
      const el = $(id);
      if (el) el.textContent = value || "";
    };
    const setHtml = (id, value) => {
      const el = $(id);
      if (el) el.innerHTML = value || "";
    };
    setHtml("historyDetailTask1Score", `Task 1 band: <b>${escapeHtml(row.task1_band || "—")}</b>`);
    setHtml("historyDetailTask2Score", `Task 2 band: <b>${escapeHtml(row.task2_band || "—")}</b>`);
    setHtml("historyDetailOverallFeedback", `${escapeHtml(row.overall_feedback || "").replace(/\n/g,"<br>") || "No overall feedback yet."}`);
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
      if (!Auth()?.getSavedUser?.()) return;
      UI()?.showOnly?.("history");
      try {
        const testId = Registry()?.getActiveTestId?.() || Registry()?.TESTS?.defaultTestId || "ielts1";
        Router()?.setHashRoute?.(testId, "history");
      } catch (e) {}
      if ($("historyTbody")) $("historyTbody").innerHTML = '<tr><td colspan="7">Loading history...</td></tr>';
      const email = getHistoryEmail();
      const cachedRows = email ? mergeRowsByMatchKey(loadRemoteHistoryCache(email), loadLocalRows(email)) : [];
      if (cachedRows.length) {
        state.rows = cachedRows;
        renderTable(cachedRows);
        prefetchObjectiveDetails(cachedRows, 4);
      }
      let rows = await loadRows();
      state.rows = rows;
      renderTable(rows);
      prefetchObjectiveDetails(rows, 4);
      const backendPromise = fetchStudentResultsForRows(rows).catch(() => []);
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
      backendPromise.then((backendResults) => {
        if (!backendResults.length) return;
        const byKey = new Map(backendResults.map((entry) => [String(entry.requestedKey || ""), entry.result]).filter((pair) => pair[0]));
        const mergedRows = rows.map((row) => mergeBackendResult(row, byKey.get(buildMatchKey(row))));
        state.rows = mergedRows;
        if (email) saveRemoteHistoryCache(email, mergedRows);
        renderTable(mergedRows);
        prefetchObjectiveDetails(mergedRows, 4);
      }).catch(() => {});

      refreshPendingRows(rows).then(async (updated) => {
        if (!updated) return;
        let refreshedRows = await loadRows();
        const backendResultsAfter = await fetchStudentResultsForRows(refreshedRows).catch(() => []);
        if (backendResultsAfter.length) {
          const byKey = new Map(backendResultsAfter.map((entry) => [String(entry.requestedKey || ""), entry.result]).filter((pair) => pair[0]));
          refreshedRows = refreshedRows.map((row) => mergeBackendResult(row, byKey.get(buildMatchKey(row))));
        }
        state.rows = refreshedRows;
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
  window.IELTS.History = { openHistory, closeHistory, refresh: openHistory, loadRows, rememberLocalAttempt };

  document.addEventListener("partials:loaded", () => {
    $("openHistoryBtn")?.addEventListener("click", openHistory);
    $("historyRefreshBtn")?.addEventListener("click", openHistory);
    $("historyBackBtn")?.addEventListener("click", closeHistory);
    $("historyDetailCloseBtn")?.addEventListener("click", () => $("historyDetail")?.classList.add("hidden"));
  }, { once: true });
})();
