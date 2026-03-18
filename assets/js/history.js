(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  const UI = () => window.IELTS?.UI;
  const Auth = () => window.IELTS?.Auth;
  const Registry = () => window.IELTS?.Registry;

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

  async function loadRows() {
    const supabase = Auth()?.supabase;
    const user = Auth()?.getSavedUser?.();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    if (!supabase || !user?.id) return [];

    const { data, error } = await supabase
      .from(table)
      .select("id,user_email,student_full_name,exam_id,active_test_id,submitted_at,reason,task1_words,task2_words,writing_task1,writing_task2,final_payload")
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function renderSummary(rows) {
    $("historyStatCount").textContent = String(rows.length);
    $("historyStatLatest").textContent = rows[0] ? fmtDate(rows[0].submitted_at) : "—";
    $("historyStatWords").textContent = rows[0] ? String(totalWords(rows[0])) : "0";
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
          <td>${escapeHtml(listeningSaved)}</td>
          <td>${escapeHtml(readingSaved)}</td>
          <td>T1: ${escapeHtml(String(row.task1_words || 0))}<br>T2: ${escapeHtml(String(row.task2_words || 0))}</td>
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
    $("historyDetailScores").innerHTML = `Exam ID: <b>${escapeHtml(row.exam_id || row.active_test_id || "—")}</b><br>Listening saved: <b>${escapeHtml(payload.listening ? "Yes" : "No")}</b><br>Reading saved: <b>${escapeHtml(payload.reading ? "Yes" : "No")}</b><br>Writing words: <b>${escapeHtml(String(totalWords(row)))}</b>`;
    $("historyDetailTask1").textContent = row.writing_task1 || "";
    $("historyDetailTask2").textContent = row.writing_task2 || "";
    detail.classList.remove("hidden");
  }

  async function openHistory() {
    try {
      if (!Auth()?.getSavedUser?.()) return;
      UI()?.showOnly?.("home");
      $("homeSection")?.classList.add("hidden");
      $("listeningSection")?.classList.add("hidden");
      $("readingControls")?.classList.add("hidden");
      $("container")?.classList.add("hidden");
      $("writingSection")?.classList.add("hidden");
      $("adminResultsSection")?.classList.add("hidden");
      $("examNav")?.classList.add("hidden");
      $("historySection")?.classList.remove("hidden");
      if ($("historyTbody")) $("historyTbody").innerHTML = '<tr><td colspan="7">Loading history...</td></tr>';
      const rows = await loadRows();
      state.rows = rows;
      renderTable(rows);
    } catch (err) {
      const tbody = $("historyTbody");
      if (tbody) tbody.innerHTML = `<tr><td colspan="7">${escapeHtml(err.message || "Could not load history.")}</td></tr>`;
    }
  }

  function closeHistory() {
    $("historySection")?.classList.add("hidden");
    $("historyDetail")?.classList.add("hidden");
    $("homeSection")?.classList.remove("hidden");
    UI()?.showOnly?.("home");
    UI()?.updateHomeStatusLine?.("Status: Signed in");
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-history-view]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-history-view"));
    renderDetail(state.rows[idx]);
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.History = { openHistory, closeHistory, refresh: openHistory };

  window.addEventListener("DOMContentLoaded", () => {
    $("openHistoryBtn")?.addEventListener("click", openHistory);
    $("historyRefreshBtn")?.addEventListener("click", openHistory);
    $("historyBackBtn")?.addEventListener("click", closeHistory);
    $("historyDetailCloseBtn")?.addEventListener("click", () => $("historyDetail")?.classList.add("hidden"));
  });
})();
