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

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function bandText(value) {
    const n = num(value);
    return n === null ? "—" : n.toFixed(1);
  }

  function scoreText(total, band) {
    const t = num(total);
    const b = num(band);
    if (t === null && b === null) return "—";
    if (t !== null && b !== null) return `${t} / 40 · Band ${b.toFixed(1)}`;
    if (t !== null) return `${t} / 40`;
    return `Band ${b.toFixed(1)}`;
  }

  function detailBandLine(label, value) {
    const n = num(value);
    return `${label}: <b>${n === null ? "—" : n.toFixed(1)}</b>`;
  }

  async function loadRows() {
    const supabase = Auth()?.supabase;
    const user = Auth()?.getSavedUser?.();
    const table = Registry()?.HISTORY_TABLE || "exam_attempts";
    if (!supabase || !user?.id) return [];

    const { data, error } = await supabase
      .from(table)
      .select("id,user_id,user_email,student_full_name,exam_id,active_test_id,submitted_at,reason,task1_words,task2_words,writing_task1,writing_task2,final_payload,listening_total,listening_band,reading_total,reading_band,final_writing_band,task1_band,task1_breakdown,task1_feedback,task2_band,task2_breakdown,task2_feedback,overall_feedback")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  }

  function renderSummary(rows) {
    const count = rows.length;
    const avgListening = count ? (rows.reduce((sum, row) => sum + (num(row.listening_band) || 0), 0) / count) : 0;
    const avgReading = count ? (rows.reduce((sum, row) => sum + (num(row.reading_band) || 0), 0) / count) : 0;
    const avgWriting = count ? (rows.reduce((sum, row) => sum + (num(row.final_writing_band) || 0), 0) / count) : 0;

    $("historyStatCount").textContent = String(count);
    $("historyStatListening").textContent = avgListening.toFixed(1);
    $("historyStatReading").textContent = avgReading.toFixed(1);
    $("historyStatWriting").textContent = avgWriting.toFixed(1);
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
    tbody.innerHTML = rows.map((row, idx) => `
      <tr>
        <td>${escapeHtml(fmtDate(row.submitted_at))}<br><span class="small">${escapeHtml(row.student_full_name || "—")}</span></td>
        <td>${escapeHtml(examLabel(row))}</td>
        <td>${escapeHtml(scoreText(row.listening_total, row.listening_band))}</td>
        <td>${escapeHtml(scoreText(row.reading_total, row.reading_band))}</td>
        <td>${escapeHtml(bandText(row.final_writing_band) === "—" ? "—" : `Band ${bandText(row.final_writing_band)}`)}</td>
        <td>T1: ${escapeHtml(String(row.task1_words || 0))}<br>T2: ${escapeHtml(String(row.task2_words || 0))}</td>
        <td><button class="btn secondary" type="button" data-history-view="${idx}">View</button></td>
      </tr>
    `).join("");
    renderSummary(rows);
  }

  function renderDetail(row) {
    const detail = $("historyDetail");
    if (!detail || !row) return;

    $("historyDetailTitle").textContent = examLabel(row);
    $("historyDetailMeta").innerHTML =
      `Submitted: <b>${escapeHtml(fmtDate(row.submitted_at))}</b><br>` +
      `Name used: <b>${escapeHtml(row.student_full_name || "—")}</b><br>` +
      `Email: <b>${escapeHtml(row.user_email || "—")}</b><br>` +
      `Reason: <b>${escapeHtml(row.reason || "—")}</b>`;

    $("historyDetailScores").innerHTML =
      `Listening: <b>${escapeHtml(scoreText(row.listening_total, row.listening_band))}</b><br>` +
      `Reading: <b>${escapeHtml(scoreText(row.reading_total, row.reading_band))}</b><br>` +
      `Overall Writing: <b>${escapeHtml(bandText(row.final_writing_band) === "—" ? "—" : `Band ${bandText(row.final_writing_band)}`)}</b><br>` +
      `Writing words: <b>${escapeHtml(String(totalWords(row)))}</b>`;

    $("historyDetailTask1Score").innerHTML =
      `${detailBandLine("Band", row.task1_band)}<br>` +
      `Breakdown:<br><div class="history-detail-text">${escapeHtml(String(row.task1_breakdown || "—")).replace(/\n/g, "<br>")}</div>`;

    $("historyDetailTask1").textContent = row.writing_task1 || "";
    $("historyDetailTask1Feedback").textContent = String(row.task1_feedback || "");

    $("historyDetailTask2Score").innerHTML =
      `${detailBandLine("Band", row.task2_band)}<br>` +
      `Breakdown:<br><div class="history-detail-text">${escapeHtml(String(row.task2_breakdown || "—")).replace(/\n/g, "<br>")}</div>`;

    $("historyDetailTask2").textContent = row.writing_task2 || "";
    $("historyDetailTask2Feedback").textContent = String(row.task2_feedback || "");

    $("historyDetailOverallWriting").innerHTML =
      `Overall Writing: <b>${escapeHtml(bandText(row.final_writing_band) === "—" ? "—" : `Band ${bandText(row.final_writing_band)}`)}</b><br><br>` +
      `<div class="history-detail-text">${escapeHtml(String(row.overall_feedback || "—")).replace(/\n/g, "<br>")}</div>`;

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
