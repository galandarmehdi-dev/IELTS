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

  async function loadRows() {
    const supabase = Auth()?.supabase;
    const user = Auth()?.getSavedUser?.();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    if (!supabase || !user?.id) return [];

    const query = supabase
      .from(table)
      .select("id,user_id,user_email,student_full_name,exam_id,active_test_id,submitted_at,reason,task1_words,task2_words,writing_task1,writing_task2,final_payload,listening_total,listening_band,reading_total,reading_band,final_writing_band,task1_band,task2_band,task1_breakdown,task2_breakdown,task1_feedback,task2_feedback,overall_feedback")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
      .limit(50);

    const { data, error } = await withTimeout(query, Number(Registry()?.TIMEOUTS?.historyLoadMs || 20000), "History load");
    if (error) throw error;
    return Array.isArray(data) ? data : [];
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
    if (!supabase || !user?.id || !row?.id || !result) return false;

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

    const { error } = await supabase.from(table).update(patch).eq("id", row.id).eq("user_id", user.id);
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
      return `
        <tr>
          <td>${escapeHtml(fmtDate(row.submitted_at))}</td>
          <td>${escapeHtml(examLabel(row))}</td>
          <td>${escapeHtml(row.student_full_name || "—")}</td>
          <td>${escapeHtml(row.listening_band ? `Band ${row.listening_band}` : listeningSaved)}</td>
          <td>${escapeHtml(row.reading_band ? `Band ${row.reading_band}` : readingSaved)}</td>
          <td>${escapeHtml(row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending")}<br><span class="small">T1: ${escapeHtml(String(row.task1_words || 0))} · T2: ${escapeHtml(String(row.task2_words || 0))}</span></td>
          <td><button class="btn secondary" type="button" data-history-view="${idx}">View</button></td>
        </tr>
      `;
    }).join("");
    renderSummary(rows);
  }

  function renderDetail(row) {
    const detail = $("historyDetail");
    if (!detail || !row) return;
    const payload = row.final_payload || {};
    $("historyDetailTitle").textContent = examLabel(row);
    $("historyDetailMeta").innerHTML = `Submitted: <b>${escapeHtml(fmtDate(row.submitted_at))}</b><br>Name used: <b>${escapeHtml(row.student_full_name || "—")}</b><br>Email: <b>${escapeHtml(row.user_email || "—")}</b>`;
    $("historyDetailScores").innerHTML = `Exam ID: <b>${escapeHtml(row.exam_id || row.active_test_id || "—")}</b><br>Listening: <b>${escapeHtml(row.listening_total != null && row.listening_total !== "" ? `${row.listening_total} / 40 (Band ${row.listening_band || "—"})` : "Pending")}</b><br>Reading: <b>${escapeHtml(row.reading_total != null && row.reading_total !== "" ? `${row.reading_total} / 40 (Band ${row.reading_band || "—"})` : "Pending")}</b><br>Writing: <b>${escapeHtml(row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending")}</b><br>Writing words: <b>${escapeHtml(String(totalWords(row)))}</b><br><br>Task 1 band: <b>${escapeHtml(row.task1_band || "—")}</b><br>Task 2 band: <b>${escapeHtml(row.task2_band || "—")}</b><br><br><b>Task 1 feedback</b><br>${escapeHtml(row.task1_feedback || "").replace(/\n/g,"<br>")}<br><br><b>Task 2 feedback</b><br>${escapeHtml(row.task2_feedback || "").replace(/\n/g,"<br>")}<br><br><b>Overall feedback</b><br>${escapeHtml(row.overall_feedback || "").replace(/\n/g,"<br>")}`;
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
    setHtml("historyDetailOverallWriting", `Overall Writing band: <b>${escapeHtml(row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending")}</b>`);
    setText("historyDetailTask1", row.writing_task1 || "");
    setText("historyDetailTask2", row.writing_task2 || "");
    setText("historyDetailTask1Feedback", row.task1_feedback || "");
    setText("historyDetailTask2Feedback", row.task2_feedback || "");
    detail.classList.remove("hidden");
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
      let rows = await loadRows();
      const backendResults = await fetchStudentResultsForRows(rows).catch(() => []);
      if (backendResults.length) {
        const byKey = new Map(backendResults.map((entry) => [String(entry.requestedKey || ""), entry.result]).filter((pair) => pair[0]));
        rows = rows.map((row) => mergeBackendResult(row, byKey.get(buildMatchKey(row))));
      }
      state.rows = rows;
      renderTable(rows);
      if (!rows.length) {
        const lastLocal = window.IELTS?.Storage?.getJSON?.(window.IELTS?.Registry?.EXAM?.keys?.finalSubmission || "IELTS:EXAM:finalSubmission", null);
        if (lastLocal?.submittedAt) {
          const tbody = $("historyTbody");
          if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7">No synced history yet. Your latest submission is saved locally and may appear here after the next refresh.</td></tr>';
          }
        }
      }
      const updated = await refreshPendingRows(rows);
      if (updated) {
        rows = await loadRows();
        const backendResultsAfter = await fetchStudentResultsForRows(rows).catch(() => []);
        if (backendResultsAfter.length) {
          const byKey = new Map(backendResultsAfter.map((entry) => [String(entry.requestedKey || ""), entry.result]).filter((pair) => pair[0]));
          rows = rows.map((row) => mergeBackendResult(row, byKey.get(buildMatchKey(row))));
        }
        state.rows = rows;
        renderTable(rows);
      }
    } catch (err) {
      const tbody = $("historyTbody");
      if (tbody) tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message || "Could not load history.")}</td></tr>`;
    }
  }

  function closeHistory() {
    $("historyDetail")?.classList.add("hidden");
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
    renderDetail(state.rows[idx]);
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.History = { openHistory, closeHistory, refresh: openHistory, loadRows };

  document.addEventListener("partials:loaded", () => {
    $("openHistoryBtn")?.addEventListener("click", openHistory);
    $("historyRefreshBtn")?.addEventListener("click", openHistory);
    $("historyBackBtn")?.addEventListener("click", closeHistory);
    $("historyDetailCloseBtn")?.addEventListener("click", () => $("historyDetail")?.classList.add("hidden"));
  }, { once: true });
})();
