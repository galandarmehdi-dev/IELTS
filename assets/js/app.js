/* assets/js/app.js (v5: reliable gates + always-new attempt for students) */
(function () {
  "use strict";

  console.log("JS is running (split build)");

  const UI = () => window.IELTS.UI;
  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  
  const Router = () => window.IELTS.Router;
  const Modal = () => window.IELTS.Modal;

  async function getAuthHeaders() {
    try {
      const token = await window.IELTS?.Auth?.getAccessToken?.();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
      return {};
    }
  }

  function isAdminView() {
    try {
      return window.IELTS?.Access?.isAdmin?.() === true;
    } catch (e) {
      return false;
    }
  }

  function safe(fn) {
    try {
      return fn();
    } catch (e) {
      return undefined;
    }
  }
  // Active test helpers (multi-test safe defaults)
  function getActiveTestId() {
    return (R()?.getActiveTestId?.() || R()?.TESTS?.defaultTestId || "ielts1");
  }
  function setActiveTestId(id) {
    try { R()?.setActiveTestId?.(id); } catch (e) {}
  }
  function getLaunchContext() {
    try {
      return R()?.getLaunchContext?.() || null;
    } catch (e) {
      return null;
    }
  }
  function isFullExamFlow() {
    const ctx = getLaunchContext();
    return !ctx || ctx.mode === "full";
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

  document.addEventListener("partials:loaded", () => {
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
    window.addEventListener("ielts:viewmodechange", () => {
      safe(() => UI()?.applyStudentLockdownUI?.());
    });

    const $ = UI().$;
    
    const PREF_KEYS = {
      fontScale: "fontScale",
    };

    function getPreferenceStorageKey(key) {
      const userId = window.IELTS?.Auth?.getSavedUser?.()?.id || "guest";
      return `IELTSPREF:${userId}:${key}`;
    }

    function applyFontScale(value) {
      const allowed = new Set(["small", "medium", "large"]);
      const next = allowed.has(value) ? value : "medium";
      try { document.body.setAttribute("data-font-scale", next); } catch (e) {}
      return next;
    }

    function initFontPreference() {
      const select = $("fontSizeSelect");
      const perUserKey = getPreferenceStorageKey(PREF_KEYS.fontScale);
      const saved = (
        localStorage.getItem(perUserKey) ||
        localStorage.getItem("IELTSPREF:fontScale") ||
        "medium"
      ).trim();
      const active = applyFontScale(saved);
      if (select) {
        select.value = active;
        select.addEventListener("change", () => {
          const next = applyFontScale(select.value);
          try {
            localStorage.setItem(perUserKey, next);
            localStorage.removeItem("IELTSPREF:fontScale");
          } catch (e) {}
          try {
            window.dispatchEvent(new CustomEvent("ielts:fontscalechange", { detail: { value: next } }));
          } catch (e) {}
        });
      }
    }

    initFontPreference();
    // -----------------------------
    // Speaking exam (separate)
    // -----------------------------
    try {
      if (
        window.IELTS &&
        window.IELTS.Speaking &&
        typeof window.IELTS.Speaking.initSpeakingExam === "function"
      ) {
        window.IELTS.Speaking.initSpeakingExam();
      } else {
        window.addEventListener("load", () => {
          try {
            if (window.IELTS?.Speaking?.initSpeakingExam) {
              window.IELTS.Speaking.initSpeakingExam();
            }
          } catch (e) {
            console.error("Speaking exam late init failed", e);
          }
        }, { once: true });
      }
    } catch (e) {
      console.error("Speaking exam init failed", e);
    }

    // Key helpers
    const readingSubmittedKey = () => {
      const tid = getActiveTestId();
      const rid = R()?.getScopedReadingTestId?.(tid) || R()?.getTestConfig?.(tid)?.readingTestId || "ielts-reading-3parts-001";
      return `${rid}:submitted`;
    };
    const activeScopedKeys = () => {
      const tid = getActiveTestId();
      return (R()?.getScopedKeys?.(tid)) || (R()?.keysFor?.(tid)) || {};
    };

    // -----------------------------
    // Always-new attempt behavior
    // -----------------------------
    function clearAllStudentAttemptKeys() {
      // Keep admin session, wipe everything else that belongs to attempts.
      try {
        const keep = new Set(["IELTS:ADMIN:session","IELTS:EXAM:activeTestId","IELTS:AUTH:user"]);
        const prefixes = ["IELTS:", "ielts-reading-", "ielts-writing-", "ielts-full-"];
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (keep.has(k)) continue;
          if (prefixes.some((p) => k.startsWith(p))) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {}
    }

    // If student lands on "submitted" overlay, do NOT trap them forever.
    // They should be able to start a new attempt.
    const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);
    if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) {
      S().set(R().EXAM.keys.finalSubmitted, "false");
    }

    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
    if (finalDone && !isAdminView()) {
      // Student: auto-clear so Start Exam always works
      clearAllStudentAttemptKeys();
    }

    // -----------------------------
    // Reliable gates (Listening→Reading, Reading→Writing)
    // -----------------------------
    let showingGate = false;

    function showListeningGate() {
      if (!isFullExamFlow()) return;
      if (isAdminView() || showingGate) return;
      const listeningDone = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false") === "true";
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      if (!listeningDone || readingDone) return;
      // If the user has already moved on to Reading/Writing, do not pull them back to Listening.
      const lastView = S().get(R().KEYS.HOME_LAST_VIEW, "");
      if (lastView === "reading" || lastView === "writing") return;


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
              // Mark that the user has moved on immediately to prevent any “gate loop” pulling them back.
              try { S().set(R().KEYS.HOME_LAST_VIEW, "reading"); } catch (e) {}

              // Keep the gate locked until we have attempted to start Reading.
              // (If listening:submitted fires again for any reason, showListeningGate will ignore it.)
              // Move to Reading view first, then start the engine (more reliable).
              try { UI().setExamStarted(true); } catch (e) {}
              try { UI().showOnly("reading"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Reading in progress"); } catch (e) {}

              try {
                try { window.__IELTS_READING_INIT__ = false; } catch (e) {}
                await startEngineWhenReady("Reading", "startReadingSystem");
              } catch (e) {
                // Visible fallback: keep user on Reading screen even if engine failed.
                try {
                  window.alert("Reading failed to start. Please refresh the page and try again.");
                } catch (_) {}
              } finally {
                showingGate = false;
              }
            },
          }
        )
      );
    }

    function showReadingGate() {
      if (!isFullExamFlow()) return;
      if (isAdminView() || showingGate) return;
      const listeningDone = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false") === "true";
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";
      const writingStarted = S().get((activeScopedKeys()?.writing || R().TESTS.writingKeys).started, "false") === "true";
      if (!listeningDone || !readingDone || writingStarted) return;
      // If the user already moved to Writing, do not pull them back to Reading.
      const lastView = S().get(R().KEYS.HOME_LAST_VIEW, "");
      if (lastView === "writing") return;


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
              try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "writing"); } catch (e) {}
              try { UI().showOnly("writing"); } catch (e) {}
              try { UI().setExamNavStatus("Status: Writing in progress"); } catch (e) {}

              try {
                try { window.__IELTS_WRITING_INIT__ = false; } catch (e) {}
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
    let lastListen = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false");
    let lastRead = S().get(readingSubmittedKey(), "false");
    setInterval(() => {
      if (isAdminView()) return;
      const curListen = S().get((activeScopedKeys()?.listening || R().TESTS.listeningKeys).submitted, "false");
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
        if (!isAdminView()) return;
        try { stopAllAudio(); } catch (e) {}
        UI().showOnly("home");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "home"); } catch (e) {}
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
      };
    }

    if (toL) {
      toL.onclick = () => {
        if (!isAdminView()) return;
        UI().setExamStarted(true);
        resetEngineInitFlags();
        UI().showOnly("listening");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "listening"); } catch (e) {}
        UI().setExamNavStatus("Status: Viewing Listening");
        try {
          startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to start:', e));
        } catch (e) {
          console.error("Listening failed to open from nav:", e);
          try { window.alert("Listening failed to load. Please refresh once and try again."); } catch (_) {}
        }
      };
    }

    if (toR) {
      toR.onclick = () => {
        if (!isAdminView()) return;
        UI().setExamStarted(true);
        window.__IELTS_READING_INIT__ = false;
        startEngineWhenReady("Reading", "startReadingSystem").catch(e => console.error('[IELTS] Reading failed to start:', e));
        UI().clearReadingLockStyles();
        UI().showOnly("reading");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "reading"); } catch (e) {}
        UI().setExamNavStatus("Status: Viewing Reading");
      };
    }

    if (toW) {
      toW.onclick = () => {
        if (!isAdminView()) return;
        const writingStarted = S().get((R().keysFor?.(getActiveTestId())?.writing || R().TESTS.writingKeys).started, "false") === "true";
        const readingSubmitted = S().get(readingSubmittedKey(), "false") === "true";
        if (!writingStarted && !readingSubmitted) {
          Modal().showModal("Writing locked", "You must submit Reading before opening Writing.", { mode: "confirm" });
          UI().showOnly("reading");
          try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "reading"); } catch (e) {}
          UI().setExamNavStatus("Status: Viewing Reading");
          return;
        }
        UI().setExamStarted(true);
        if (!writingStarted) startEngineWhenReady("Writing", "startWritingSystem").catch(e => console.error('[IELTS] Writing failed to start:', e));
        else UI().showOnly("writing");
        try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "writing"); } catch (e) {}
        UI().setExamNavStatus("Status: Viewing Writing");
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        if (!isAdminView()) return;
        const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");
        if (!ok) return;
        UI().setExamStarted(false);
        UI().resetExamAttempt();
      };
    }

    // -----------------------------
    // Admin results dashboard
    // -----------------------------
    const adminState = { rows: [], filtered: [] };

    function num(value) {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    }

    function bandText(value) {
      if (value === null || value === undefined || String(value).trim() === "") return "—";
      const n = Number(value);
      return Number.isFinite(n) ? n.toFixed(1) : "—";
    }

    function plainText(value, fallback = "—") {
      const t = String(value ?? "").trim();
      return t || fallback;
    }

    function fmtDate(value) {
      const d = new Date(value || "");
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleString();
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    async function fetchAdminResults() {
      const endpoint = String(R()?.ADMIN_API_PATH || "/api/admin").trim();
      if (!endpoint) throw new Error("Admin endpoint is missing.");

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("action", "results");
      url.searchParams.set("t", String(Date.now()));

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) {}
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!data || data.ok !== true || !Array.isArray(data.results)) {
        throw new Error((data && data.error) || "Could not load admin results.");
      }
      return data.results;
    }

    function fillExamFilter(rows) {
      const sel = $("adminResultsExamFilter");
      if (!sel) return;
      const current = sel.value || "";
      const exams = Array.from(new Set(rows.map((r) => String(r.examId || "").trim()).filter(Boolean))).sort();
      sel.innerHTML = '<option value="">All tests</option>' + exams.map((examId) => `<option value="${escapeHtml(examId)}">${escapeHtml(examId)}</option>`).join("");
      sel.value = exams.includes(current) ? current : "";
    }

    function renderSummary(rows) {
      const count = rows.length;
      const avgListening = count ? (rows.reduce((a, r) => a + num(r.listeningBand), 0) / count) : 0;
      const avgReading = count ? (rows.reduce((a, r) => a + num(r.readingBand), 0) / count) : 0;
      const latest = rows.slice().sort((a,b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0];
      if ($("adminStatSubmissions")) $("adminStatSubmissions").textContent = String(count);
      if ($("adminStatListening")) $("adminStatListening").textContent = avgListening.toFixed(1);
      if ($("adminStatReading")) $("adminStatReading").textContent = avgReading.toFixed(1);
      if ($("adminStatLatest")) $("adminStatLatest").textContent = latest ? `${latest.studentFullName || "(No name)"} · ${fmtDate(latest.submittedAt)}` : "—";
    }

    function renderAdminTable(rows) {
      adminState.filtered = rows.slice();
      const tbody = $("adminResultsTbody");
      const empty = $("adminResultsEmpty");
      if (!tbody) return;
      if (!rows.length) {
        tbody.innerHTML = "";
        empty?.classList.remove("hidden");
        renderSummary([]);
        return;
      }
      empty?.classList.add("hidden");
      tbody.innerHTML = rows.map((row, idx) => `
        <tr>
          <td>${escapeHtml(fmtDate(row.submittedAt))}</td>
          <td><strong>${escapeHtml(row.studentFullName || "(No name)")}</strong><br><span class="small">${escapeHtml(row.reason || "")}</span></td>
          <td>${escapeHtml(row.examId || "—")}</td>
          <td>${escapeHtml(String(num(row.listeningTotal)))} / 40<br><span class="small">Band ${escapeHtml(bandText(row.listeningBand))}</span></td>
          <td>${escapeHtml(String(num(row.readingTotal)))} / 40<br><span class="small">Band ${escapeHtml(bandText(row.readingBand))}</span></td>
          <td>Band ${escapeHtml(bandText(row.finalWritingBand))}</td>
          <td>T1: ${escapeHtml(String(num(row.task1Words)))}<br>T2: ${escapeHtml(String(num(row.task2Words)))}</td>
          <td><div class="admin-row-actions"><button class="btn secondary" type="button" data-admin-view="${idx}">View</button></div></td>
        </tr>
      `).join("");
      renderSummary(rows);
    }

    function applyAdminFilters() {
      const q = String($("adminResultsSearch")?.value || "").trim().toLowerCase();
      const examFilter = String($("adminResultsExamFilter")?.value || "").trim();
      const sortValue = String($("adminResultsSort")?.value || "submittedAt_desc");
      let rows = adminState.rows.slice();

      if (q) {
        rows = rows.filter((row) => {
          const hay = [row.studentFullName, row.reason, row.examId].map((x) => String(x || "").toLowerCase()).join(" ");
          return hay.includes(q);
        });
      }
      if (examFilter) rows = rows.filter((row) => String(row.examId || "") === examFilter);

      const [field, dir] = sortValue.split("_");
      rows.sort((a, b) => {
        let av = a[field];
        let bv = b[field];
        if (field === "submittedAt") {
          av = new Date(av || 0).getTime();
          bv = new Date(bv || 0).getTime();
        } else if (["finalWritingBand", "listeningTotal", "readingTotal"].includes(field)) {
          av = num(av);
          bv = num(bv);
        } else {
          av = String(av || "").toLowerCase();
          bv = String(bv || "").toLowerCase();
        }
        if (av < bv) return dir === "desc" ? 1 : -1;
        if (av > bv) return dir === "desc" ? -1 : 1;
        return 0;
      });

      renderAdminTable(rows);
    }

    function renderAdminDetail(row) {
      const detail = $("adminResultDetail");
      if (!detail || !row) return;
      $("adminDetailTitle").textContent = row.studentFullName || "Result details";
      $("adminDetailMeta").innerHTML = `Test: <b>${escapeHtml(row.examId || "—")}</b><br>Submitted: <b>${escapeHtml(fmtDate(row.submittedAt))}</b><br>Reason: <b>${escapeHtml(row.reason || "—")}</b>`;
      $("adminDetailScores").innerHTML = `Listening: <b>${escapeHtml(String(num(row.listeningTotal)))} / 40</b> (Band ${escapeHtml(bandText(row.listeningBand))})<br>Reading: <b>${escapeHtml(String(num(row.readingTotal)))} / 40</b> (Band ${escapeHtml(bandText(row.readingBand))})<br>Overall Writing: <b>Band ${escapeHtml(bandText(row.finalWritingBand))}</b><br>Writing words: <b>${escapeHtml(String(num(row.task1Words)))} / ${escapeHtml(String(num(row.task2Words)))}</b>`;
      $("adminDetailTask1Score").innerHTML = `Band: <b>${escapeHtml(bandText(row.task1Band))}</b><br>Breakdown:<br><div class="admin-detail-text">${escapeHtml(plainText(row.task1Breakdown)).replace(/\n/g, "<br>")}</div>`;
      $("adminDetailTask1").textContent = row.writingTask1 || "";
      $("adminDetailTask1Feedback").textContent = plainText(row.task1Feedback, "");
      $("adminDetailTask2Score").innerHTML = `Band: <b>${escapeHtml(bandText(row.task2Band))}</b><br>Breakdown:<br><div class="admin-detail-text">${escapeHtml(plainText(row.task2Breakdown)).replace(/\n/g, "<br>")}</div>`;
      $("adminDetailTask2").textContent = row.writingTask2 || "";
      $("adminDetailTask2Feedback").textContent = plainText(row.task2Feedback, "");
      $("adminDetailOverallWriting").innerHTML = `Overall Writing: <b>Band ${escapeHtml(bandText(row.finalWritingBand))}</b><br><br><div class="admin-detail-text">${escapeHtml(plainText(row.overallFeedback)).replace(/\n/g, "<br>")}</div>`;
      detail.classList.remove("hidden");
    }

    async function openAdminResultsView() {
      if (!isAdminView()) return;
      UI().showOnly("adminResults");
      UI().setExamNavStatus("Status: Admin results");
      try { window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "results"); } catch (e) {}
      const tbody = $("adminResultsTbody");
      if (tbody) tbody.innerHTML = '<tr><td colspan="8">Loading results...</td></tr>';
      try {
        const rows = await fetchAdminResults();
        adminState.rows = rows;
        fillExamFilter(rows);
        applyAdminFilters();
      } catch (e) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="8">${escapeHtml(e.message || "Could not load results.")}</td></tr>`;
        renderSummary([]);
      }
    }

    function exportAdminRowsCsv() {
      if (!isAdminView() || !adminState.filtered.length) return;
      const headers = ["submittedAt","studentFullName","examId","reason","listeningTotal","listeningBand","readingTotal","readingBand","finalWritingBand","task1Words","task2Words","task1Band","task1Breakdown","task1Feedback","task2Band","task2Breakdown","task2Feedback","overallFeedback"];
      const lines = [headers.join(",")].concat(
        adminState.filtered.map((row) =>
          headers
            .map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`)
            .join(",")
        )
      );
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ielts-results.csv";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 0);
    }

    // -----------------------------
    // Hash route support (ADMIN ONLY)
    // -----------------------------
    let pendingResourceHubKind = null;
    const route = Router().parseHashRoute();
    if (route && route.testId) { try { setActiveTestId(route.testId); } catch (e) {} }
    if (isAdminView() && route && route.view) {
      if (route.view === "listening") {
        UI().setExamStarted(true);
        startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to start:', e));
        UI().showOnly("listening");
        UI().setExamNavStatus("Status: Listening in progress");
        return;
      }
      if (route.view === "reading") {
        UI().setExamStarted(true);
        window.__IELTS_READING_INIT__ = false;
        startEngineWhenReady("Reading", "startReadingSystem").catch(e => console.error('[IELTS] Reading failed to start:', e));
        UI().showOnly("reading");
        UI().setExamNavStatus("Status: Viewing Reading");
        return;
      }
      if (route.view === "writing") {
        UI().setExamStarted(true);
        window.__IELTS_WRITING_INIT__ = false;
        startEngineWhenReady("Writing", "startWritingSystem").catch(e => console.error('[IELTS] Writing failed to start:', e));
        UI().showOnly("writing");
        UI().setExamNavStatus("Status: Viewing Writing");
        return;
      }
      if (route.view === "results") {
        openAdminResultsView();
        return;
      }
      if (route.view === "dashboard") {
        window.IELTS?.Dashboard?.open?.();
        return;
      }
      if (route.view === "home") {
        UI().showOnly("home");
        UI().updateHomeStatusLine();
        UI().setExamNavStatus("Status: Home");
        return;
      }
    }

    if (route && route.view) {
      if (route.view === "fullExamHub") {
        pendingResourceHubKind = "fullExam";
      }
      if (route.view === "readingHub") {
        pendingResourceHubKind = "reading";
      }
      if (route.view === "listeningHub") {
        pendingResourceHubKind = "listening";
      }
      if (route.view === "writingHub") {
        pendingResourceHubKind = "writing";
      }
      if (route.view === "writingTask1SamplesHub") {
        pendingResourceHubKind = "writingSamplesTask1";
      }
      if (route.view === "writingTask2SamplesHub") {
        pendingResourceHubKind = "writingSamplesTask2";
      }
      if (route.view === "speakingHub") {
        pendingResourceHubKind = "speaking";
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
    const startBtnT2 = $("startIelts2Btn");
    const startBtnT2b = $("cardStartIelts2Btn");
    const startBtnT3 = $("startIelts3Btn");
    const startBtnT3b = $("cardStartIelts3Btn");
    const footerStartTest1Btn = $("footerStartTest1Btn");
    const openDashboardBtn = $("openDashboardBtn");
    const footerOpenDashboardBtn = $("footerOpenDashboardBtn");
    const footerOpenHistoryBtn = $("footerOpenHistoryBtn");
    const homeAccountDropdown = $("homeAccountDropdown");
    const menuDashboardProfileBtn = $("menuDashboardProfileBtn");
    const menuDashboardSettingsBtn = $("menuDashboardSettingsBtn");
    const menuHistoryBtn = $("menuHistoryBtn");
    const menuSpeakingBtn = $("menuSpeakingBtn");
    const adminResultsBtn = $("homeAdminResultsBtn");
    const navResultsBtn = $("navToResultsBtn");
    const adminRefreshBtn = $("adminResultsRefreshBtn");
    const adminExportBtn = $("adminExportBtn");
    const homeExploreMenus = $("homeExploreMenus");
    const resourceHubBadge = $("resourceHubBadge");
    const resourceHubTitle = $("resourceHubTitle");
    const resourceHubSubtitle = $("resourceHubSubtitle");
    const resourceHubBackBtn = $("resourceHubBackBtn");
    const resourceHubAnchorbar = $("resourceHubAnchorbar");
    const resourceHubContent = $("resourceHubContent");
    function requireSignedIn(onOk, message) {
      if (window.IELTS?.Auth?.isSignedIn?.()) {
        if (typeof onOk === "function") onOk();
        return true;
      }
      window.IELTS?.Auth?.openLoginGate?.(message || "Please log in to continue.");
      return false;
    }

    // Student password gate (does NOT affect admin view)
    function requireTestPassword(onOk) {
      if (isAdminView()) {
        onOk();
        return;
      }

      if (!requireSignedIn(null, "Please log in before starting a test.")) {
        return;
      }

      // Always ask in student view (no "remember" unlock),
      // so every click on Start Exam requires the password.
      window.IELTS?.Modal?.showModal?.(
        "Enter password",
        "This test is password-protected. Please enter the password to start.",
        {
          mode: "password",
          submitText: "Start exam",
          onConfirm: () => {
            onOk();
          },
        }
      );
    }




    function resetEngineInitFlags() {
      try { window.__IELTS_LISTENING_INIT__ = false; } catch (e) {}
      try { window.__IELTS_READING_INIT__ = false; } catch (e) {}
      try { window.__IELTS_WRITING_INIT__ = false; } catch (e) {}
    }

    function closeAccountMenu() {
      if (homeAccountDropdown) homeAccountDropdown.classList.add("hidden");
      if (openDashboardBtn) openDashboardBtn.setAttribute("aria-expanded", "false");
    }

    function toggleAccountMenu() {
      if (!homeAccountDropdown || !openDashboardBtn) {
        window.IELTS?.Dashboard?.open?.();
        return;
      }
      const nextHidden = !homeAccountDropdown.classList.contains("hidden");
      homeAccountDropdown.classList.toggle("hidden", nextHidden);
      openDashboardBtn.setAttribute("aria-expanded", nextHidden ? "false" : "true");
    }

    function openHistoryFromMenu() {
      closeAccountMenu();
      if (!requireSignedIn(null, "Please log in to open your history.")) return;
      try {
        if (typeof window.IELTS?.History?.openHistory === "function") {
          window.IELTS.History.openHistory();
          return;
        }
      } catch (e) {}
      $("openHistoryBtn")?.click?.();
    }

    function openSpeakingFromMenu() {
      closeAccountMenu();
      if (!requireSignedIn(null, "Please log in to open speaking practice.")) return;
      try {
        if (typeof window.IELTS?.Speaking?.initSpeakingExam === "function") {
          window.IELTS.Speaking.initSpeakingExam();
        }
        UI().showOnly("speaking");
        UI().setExamNavStatus("Status: Speaking practice");
        return;
      } catch (e) {}
      $("openSpeakingExamBtn")?.click?.();
    }

    // stop any playing audio used by exam flows (listening / speaking)
    function stopAllAudio() {
      try { const la = document.getElementById('listeningAudio'); if (la && !la.paused) { la.pause(); la.currentTime = 0; } } catch (e) {}
      try { const sp = document.getElementById('speakingPlayback'); if (sp && !sp.paused) { sp.pause(); sp.currentTime = 0; } } catch (e) {}
      try { const remote = document.getElementById('remoteAudio'); if (remote && !remote.paused) { remote.pause(); remote.currentTime = 0; } } catch (e) {}
    }

    function clearScopedLaunchData(scope) {
      if (!scope) return;
      try {
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(scope)) toRemove.push(key);
        }
        toRemove.forEach((key) => localStorage.removeItem(key));
      } catch (e) {}
    }

    function launchListeningOnly(testId, pageIndex) {
      setActiveTestId(testId);
      const scope = `IELTS:SECTION:${testId}:LISTENING`;
      const ctx = { mode: "section", section: "listening", testId, storageScope: scope };
      if (Number.isInteger(pageIndex)) ctx.pageIndex = pageIndex;
      R()?.setLaunchContext?.(ctx);
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("listening"); } catch (e) {}
      try { UI().setExamNavStatus(`Status: ${R()?.getTestLabel?.(testId) || testId} Listening${Number.isInteger(pageIndex) ? ` · Section ${pageIndex + 1}` : ""}`); } catch (e) {}
      try { Router().setHashRoute(testId, "listening"); } catch (e) {}
      startEngineWhenReady("Listening", "initListeningSystem").catch((e) => console.error("[IELTS] Listening-only launch failed:", e));
    }

    function launchReadingOnly(testId, partId) {
      setActiveTestId(testId);
      const scope = `IELTS:SECTION:${testId}:READING`;
      const ctx = { mode: "section", section: "reading", testId, storageScope: scope };
      if (partId) ctx.partId = partId;
      R()?.setLaunchContext?.(ctx);
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("reading"); } catch (e) {}
      try { UI().setExamNavStatus(`Status: ${R()?.getTestLabel?.(testId) || testId} Reading${partId ? ` · ${String(partId).replace("part", "Section ")}` : ""}`); } catch (e) {}
      try { Router().setHashRoute(testId, "reading"); } catch (e) {}
      startEngineWhenReady("Reading", "startReadingSystem").catch((e) => console.error("[IELTS] Reading-only launch failed:", e));
    }

    function launchWritingOnly(testId, focusTask) {
      setActiveTestId(testId);
      const scope = `IELTS:SECTION:${testId}:WRITING`;
      const ctx = { mode: "section", section: "writing", testId, storageScope: scope };
      if (focusTask) ctx.focusTask = focusTask;
      R()?.setLaunchContext?.(ctx);
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("writing"); } catch (e) {}
      try { UI().setExamNavStatus(`Status: ${R()?.getTestLabel?.(testId) || testId} Writing${focusTask ? ` · ${focusTask === "task1" ? "Task 1" : "Task 2"}` : ""}`); } catch (e) {}
      try { Router().setHashRoute(testId, "writing"); } catch (e) {}
      startEngineWhenReady("Writing", "startWritingSystem").catch((e) => console.error("[IELTS] Writing-only launch failed:", e));
    }

    function launchReadingPractice(taskType) {
      const catalog = R()?.buildHomeCatalog?.()?.practice?.reading || [];
      const match = catalog.find((entry) => entry.type === taskType);
      const testId = match?.tests?.[0] || R()?.TESTS?.defaultTestId || "ielts1";
      const scope = `IELTS:PRACTICE:READING:${taskType}`;
      setActiveTestId(testId);
      R()?.setLaunchContext?.({ mode: "practice", skill: "reading", taskType, storageScope: scope });
      clearScopedLaunchData(scope);
      resetEngineInitFlags();
      safe(() => Modal().hideModal());
      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("reading"); } catch (e) {}
      try { UI().setExamNavStatus(`Status: ${match?.label || "Reading practice"}`); } catch (e) {}
      try { Router().setHashRoute(testId, "reading"); } catch (e) {}
      startEngineWhenReady("Reading", "startReadingSystem").catch((e) => console.error("[IELTS] Reading practice launch failed:", e));
    }

    function createMetaPill(text) {
      const pill = document.createElement("span");
      pill.className = "meta-pill";
      pill.textContent = text;
      return pill;
    }

    function createCatalogCard(options) {
      const card = document.createElement("article");
      card.className = "home-catalog-card";

      const kicker = document.createElement("div");
      kicker.className = "home-catalog-kicker";
      kicker.textContent = options.kicker || "Section";
      card.appendChild(kicker);

      const title = document.createElement("h3");
      title.className = "home-catalog-title";
      title.textContent = options.title || "Practice";
      card.appendChild(title);

      const copy = document.createElement("p");
      copy.className = "home-catalog-copy";
      copy.textContent = options.copy || "";
      card.appendChild(copy);

      if (Array.isArray(options.meta) && options.meta.length) {
        const meta = document.createElement("div");
        meta.className = "home-catalog-meta";
        options.meta.forEach((item) => meta.appendChild(createMetaPill(item)));
        card.appendChild(meta);
      }

      const actions = document.createElement("div");
      actions.className = "home-catalog-actions";

      const primary = document.createElement("button");
      primary.type = "button";
      primary.className = "home-btn";
      primary.textContent = options.primaryLabel || "Open";
      primary.addEventListener("click", options.onPrimary);
      actions.appendChild(primary);

      if (options.onSecondary) {
        const secondary = document.createElement("button");
        secondary.type = "button";
        secondary.className = "home-btn ghost";
        secondary.textContent = options.secondaryLabel || "Open";
        secondary.addEventListener("click", options.onSecondary);
        actions.appendChild(secondary);
      }

      card.appendChild(actions);
      return card;
    }

    function createMultiActionCard(options) {
      const card = createCatalogCard({
        kicker: options.kicker,
        title: options.title,
        copy: options.copy,
        meta: options.meta,
        primaryLabel: options.primaryLabel || "Open",
        onPrimary: options.onPrimary || (() => {}),
      });
      const actions = card.querySelector(".home-catalog-actions");
      if (actions && Array.isArray(options.extraActions)) {
        options.extraActions.forEach((action) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = action.ghost ? "home-btn ghost" : "home-btn ghost";
          btn.textContent = action.label;
          btn.addEventListener("click", action.onClick);
          actions.appendChild(btn);
        });
      }
      return card;
    }

    function renderCatalogInto(root, items, buildCard, emptyText) {
      if (!root) return;
      root.innerHTML = "";
      if (!Array.isArray(items) || !items.length) {
        const empty = document.createElement("div");
        empty.className = "home-catalog-empty";
        empty.textContent = emptyText || "Nothing is available here yet.";
        root.appendChild(empty);
        return;
      }
      items.forEach((item) => root.appendChild(buildCard(item)));
    }

    const HUB_VIEWS = {
      fullExam: "fullExamHub",
      reading: "readingHub",
      listening: "listeningHub",
      writing: "writingHub",
      writingSamplesTask1: "writingTask1SamplesHub",
      writingSamplesTask2: "writingTask2SamplesHub",
      speaking: "speakingHub",
    };

    function createNoteCard(title, bullets, kicker) {
      const card = document.createElement("article");
      card.className = "resource-note-card";
      if (kicker) {
        const pill = document.createElement("div");
        pill.className = "sample-band-pill";
        pill.textContent = kicker;
        card.appendChild(pill);
      }
      const h3 = document.createElement("h3");
      h3.textContent = title;
      card.appendChild(h3);
      const list = document.createElement("ul");
      (bullets || []).forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      card.appendChild(list);
      return card;
    }

    function appendEssayParagraphs(root, text) {
      String(text || "")
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          const p = document.createElement("p");
          p.textContent = part;
          root.appendChild(p);
        });
    }

    function createWritingSampleResponse(entry, sample, index) {
      const response = document.createElement("div");
      response.className = "writing-sample-response";

      const head = document.createElement("div");
      head.className = "writing-sample-response-head";

      const label = document.createElement("h4");
      label.textContent = entry.samples.length > 1
        ? (sample.label || `Sample ${index + 1}`)
        : "Sample answer";

      const band = document.createElement("div");
      band.className = "sample-band-pill writing-band-pill";
      band.textContent = sample.bandScore || "Coming soon";

      head.appendChild(label);
      head.appendChild(band);
      response.appendChild(head);

      const explanationWrap = document.createElement("div");
      explanationWrap.className = "writing-sample-section";
      explanationWrap.innerHTML = `<h4>Why this score</h4><p>${sample.explanation}</p>`;
      response.appendChild(explanationWrap);

      const sampleWrap = document.createElement("div");
      sampleWrap.className = "writing-sample-section";
      sampleWrap.innerHTML = "<h4>Sample answer</h4>";
      appendEssayParagraphs(sampleWrap, sample.sampleAnswer);
      response.appendChild(sampleWrap);

      const correctedWrap = document.createElement("div");
      correctedWrap.className = "writing-sample-section";
      correctedWrap.innerHTML = "<h4>Corrected form</h4>";
      appendEssayParagraphs(correctedWrap, sample.correctedForm);
      response.appendChild(correctedWrap);

      return response;
    }

    function createWritingSampleCard(entry) {
      const card = document.createElement("article");
      card.className = "writing-sample-card";

      const top = document.createElement("div");
      top.className = "writing-sample-top";

      const kicker = document.createElement("div");
      kicker.className = "sample-band-pill";
      kicker.textContent = entry.taskLabel;

      const band = document.createElement("div");
      band.className = "sample-band-pill writing-band-pill";
      band.textContent = entry.bandScore;

      top.appendChild(kicker);
      top.appendChild(band);
      card.appendChild(top);

      const title = document.createElement("h3");
      title.textContent = entry.shortTitle || entry.title;
      card.appendChild(title);

      const source = document.createElement("div");
      source.className = "writing-sample-source";
      source.textContent = entry.sourceTitle || entry.title;
      card.appendChild(source);

      const prompt = document.createElement("div");
      prompt.className = "writing-sample-prompt";
      prompt.innerHTML = entry.promptHtml || "";
      card.appendChild(prompt);

      if (entry.imageSrc) {
        const img = document.createElement("img");
        img.className = "writing-sample-image";
        img.src = entry.imageSrc;
        img.alt = `${entry.title} prompt visual`;
        card.appendChild(img);
      }

      (entry.samples || []).forEach((sample, index) => {
        card.appendChild(createWritingSampleResponse(entry, sample, index));
      });

      return card;
    }

    function createWritingSampleAccordion(entry) {
      const item = document.createElement("details");
      item.className = "writing-sample-accordion";

      const summary = document.createElement("summary");
      summary.className = "writing-sample-summary";

      const textWrap = document.createElement("div");
      textWrap.className = "writing-sample-summary-copy";

      const title = document.createElement("div");
      title.className = "writing-sample-summary-title";
      title.textContent = entry.shortTitle || entry.title;

      const meta = document.createElement("div");
      meta.className = "writing-sample-summary-meta";
      meta.textContent = entry.sourceTitle || entry.title;

      textWrap.appendChild(title);
      textWrap.appendChild(meta);
      summary.appendChild(textWrap);

      const pillWrap = document.createElement("div");
      pillWrap.className = "writing-sample-summary-pills";

      const typePill = document.createElement("div");
      typePill.className = "sample-band-pill";
      typePill.textContent = entry.groupType || entry.taskLabel;
      pillWrap.appendChild(typePill);

      const bandPill = document.createElement("div");
      bandPill.className = "sample-band-pill writing-band-pill";
      bandPill.textContent = entry.bandScore || "Coming soon";
      pillWrap.appendChild(bandPill);

      if ((entry.sampleCount || 0) > 1) {
        const countPill = document.createElement("div");
        countPill.className = "sample-band-pill";
        countPill.textContent = `${entry.sampleCount} samples`;
        pillWrap.appendChild(countPill);
      }

      summary.appendChild(pillWrap);
      item.appendChild(summary);

      const body = document.createElement("div");
      body.className = "writing-sample-accordion-body";
      body.appendChild(createWritingSampleCard(entry));
      item.appendChild(body);

      return item;
    }

    function renderWritingSampleLibrary(taskKey) {
      const wrap = document.createElement("div");
      wrap.className = "resource-hub-list writing-sample-list";
      const items = (R()?.buildWritingSampleCatalog?.() || [])
        .filter((item) => item.taskKey === taskKey);

      if (!items.length) {
        const empty = document.createElement("div");
        empty.className = "home-catalog-empty";
        empty.textContent = "No sample answers are available for this task yet.";
        wrap.appendChild(empty);
        return wrap;
      }

      const groups = {};
      items.forEach((item) => {
        const key = item.groupType || "Other";
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      Object.keys(groups)
        .sort((a, b) => a.localeCompare(b))
        .forEach((groupLabel) => {
          const section = document.createElement("section");
          section.className = "writing-sample-group";

          const head = document.createElement("div");
          head.className = "writing-sample-group-head";
          head.innerHTML = `<h3>${groupLabel}</h3><p>${groups[groupLabel].length} prompt${groups[groupLabel].length === 1 ? "" : "s"}</p>`;
          section.appendChild(head);

          const list = document.createElement("div");
          list.className = "writing-sample-group-list";

          groups[groupLabel]
            .sort((a, b) => String(a.shortTitle || a.title).localeCompare(String(b.shortTitle || b.title)))
            .forEach((item) => list.appendChild(createWritingSampleAccordion(item)));

          section.appendChild(list);
          wrap.appendChild(section);
        });

      return wrap;
    }

    function buildHubSection(id, label, copy, nodeBuilder) {
      const section = document.createElement("section");
      section.className = "resource-hub-section";
      section.id = id;
      const head = document.createElement("div");
      head.className = "home-section-head";
      head.innerHTML = `<div class="home-card-topline">${label}</div><h2 class="home-section-title">${label}</h2><p class="home-section-copy">${copy}</p>`;
      section.appendChild(head);
      const node = nodeBuilder();
      if (node) section.appendChild(node);
      return section;
    }

    function renderStaticTips(cards) {
      const wrap = document.createElement("div");
      wrap.className = "resource-hub-grid";
      cards.forEach((card) => wrap.appendChild(card));
      return wrap;
    }

    function rememberHub(kind) {
      try { localStorage.setItem("IELTS:HOME:resourceHubKind", kind); } catch (e) {}
    }

    function openResourceHub(kind, focusId) {
      const view = HUB_VIEWS[kind] || "fullExamHub";
      rememberHub(kind);
      renderResourceHub(kind, focusId);
      UI().showOnly(view);
      try { Router().setHashRoute(getActiveTestId(), view); } catch (e) {}
      UI().setExamNavStatus(`Status: ${kind} page`);
      if (focusId) {
        setTimeout(() => document.getElementById(focusId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 40);
      }
    }

    function renderMenuGroup(menu) {
      const wrap = document.createElement("div");
      wrap.className = "home-skill-menu";

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "home-skill-trigger";
      trigger.innerHTML = `<span>${menu.label}</span><i>▾</i>`;

      const dropdown = document.createElement("div");
      dropdown.className = "home-skill-dropdown hidden";

      menu.items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "home-skill-item";
        btn.textContent = item.label;
        btn.addEventListener("click", () => {
          dropdown.classList.add("hidden");
          item.onClick();
        });
        dropdown.appendChild(btn);
      });

      trigger.addEventListener("click", () => {
        document.querySelectorAll(".home-skill-dropdown").forEach((el) => {
          if (el !== dropdown) el.classList.add("hidden");
        });
        dropdown.classList.toggle("hidden");
      });

      wrap.appendChild(trigger);
      wrap.appendChild(dropdown);
      return wrap;
    }

    function renderHomeMenus() {
      if (!homeExploreMenus) return;
      homeExploreMenus.innerHTML = "";
      const menus = [
        {
          kicker: "Core path",
          label: "Take Full Exam",
          items: [
            { label: "Open full exam page", copy: "See all uploaded complete exams in one place.", onClick: () => openResourceHub("fullExam") },
            { label: "Start IELTS Test 1", copy: "Quick start the first full mock.", onClick: () => requireTestPassword(() => { setActiveTestId("ielts1"); startFreshExam(); }) },
            { label: "Start IELTS Test 2", copy: "Quick start the second full mock.", onClick: () => requireTestPassword(() => { setActiveTestId("ielts2"); startFreshExam(); }) },
            { label: "Start IELTS Test 3", copy: "Quick start the third full mock.", onClick: () => requireTestPassword(() => { setActiveTestId("ielts3"); startFreshExam(); }) },
          ],
        },
        {
          kicker: "Skill page",
          label: "Reading",
          items: [
            { label: "Open reading page", copy: "Reading exams, sections, practice buckets, and tips.", onClick: () => openResourceHub("reading") },
            { label: "Take full reading exam", copy: "Jump straight to the reading-only exam page.", onClick: () => openResourceHub("reading", "reading-full-exams") },
            { label: "Take by section", copy: "Open reading sections 1, 2, or 3 separately.", onClick: () => openResourceHub("reading", "reading-sections") },
            { label: "Practice by question type", copy: "Go straight to TFNG, Headings, Completion, and more.", onClick: () => openResourceHub("reading", "reading-practice-types") },
            { label: "Reading tips", copy: "See the reading strategy page section.", onClick: () => openResourceHub("reading", "reading-tips") },
          ],
        },
        {
          kicker: "Skill page",
          label: "Listening",
          items: [
            { label: "Open listening page", copy: "Listening exams, sections, and tips.", onClick: () => openResourceHub("listening") },
            { label: "Take full listening exam", copy: "Go to listening-only exam cards.", onClick: () => openResourceHub("listening", "listening-full-exams") },
            { label: "Take by section", copy: "Open listening section launchers.", onClick: () => openResourceHub("listening", "listening-sections") },
            { label: "Listening tips", copy: "See listening technique guidance.", onClick: () => openResourceHub("listening", "listening-tips") },
          ],
        },
        {
          kicker: "Skill page",
          label: "Writing",
          items: [
            { label: "Open writing page", copy: "Writing task launchers, sample answers, and guidance.", onClick: () => openResourceHub("writing") },
            { label: "Writing Task 1", copy: "Open Task 1-focused writing access.", onClick: () => openResourceHub("writing", "writing-task1") },
            { label: "Writing Task 2", copy: "Open Task 2-focused writing access.", onClick: () => openResourceHub("writing", "writing-task2") },
            { label: "Task 1 sample library", copy: "Browse Task 1 sample answers in a dedicated page.", onClick: () => openResourceHub("writingSamplesTask1") },
            { label: "Task 2 sample library", copy: "Browse Task 2 sample answers in a dedicated page.", onClick: () => openResourceHub("writingSamplesTask2") },
          ],
        },
        {
          kicker: "Skill page",
          label: "Speaking",
          items: [
            { label: "Open speaking page", copy: "Speaking practice, predicted questions, tips, and sample answers.", onClick: () => openResourceHub("speaking") },
            { label: "Practice speaking", copy: "Jump straight into the speaking module.", onClick: () => openResourceHub("speaking", "speaking-practice") },
            { label: "Predicted speaking questions", copy: "See likely prompt themes and examples.", onClick: () => openResourceHub("speaking", "speaking-predicted") },
            { label: "Tips for speaking", copy: "Open speaking technique guidance.", onClick: () => openResourceHub("speaking", "speaking-tips") },
            { label: "Sample answers", copy: "Open speaking sample response guidance.", onClick: () => openResourceHub("speaking", "speaking-samples") },
          ],
        },
      ];
      menus.forEach((menu) => homeExploreMenus.appendChild(renderMenuGroup(menu)));
    }

    function renderResourceHub(kind, focusId) {
      if (!resourceHubContent || !resourceHubTitle || !resourceHubSubtitle || !resourceHubBadge || !resourceHubAnchorbar) return;

      const catalog = R()?.buildHomeCatalog?.() || { fullExams: [], sections: {}, practice: { reading: [] } };
      resourceHubContent.innerHTML = "";
      resourceHubAnchorbar.innerHTML = "";

      const addSection = (sectionId, label, copy, nodeBuilder) => {
        const section = buildHubSection(sectionId, label, copy, nodeBuilder);
        resourceHubContent.appendChild(section);
        const anchor = document.createElement("button");
        anchor.type = "button";
        anchor.className = "resource-hub-anchor";
        anchor.textContent = label;
        anchor.addEventListener("click", () => document.getElementById(sectionId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
        resourceHubAnchorbar.appendChild(anchor);
      };

      if (kind === "fullExam") {
        resourceHubBadge.textContent = "Full exam page";
        resourceHubTitle.textContent = "Take the full IELTS mock";
        resourceHubSubtitle.textContent = "Every uploaded exam still works as a complete mock first, with Listening, Reading, and Writing in sequence.";
        addSection("full-exam-list", "Available full exams", "Choose the complete mock you want to run.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          catalog.fullExams.forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Full exam",
              title: item.label,
              copy: item.description,
              meta: item.meta,
              primaryLabel: "Start full exam",
              onPrimary: () => requireTestPassword(() => { setActiveTestId(item.id); startFreshExam(); }),
            }));
          });
          return grid;
        });
        addSection("full-exam-notes", "How full exams work", "Use the full path when you want realistic sequencing and timing.", () => renderStaticTips([
          createNoteCard("Best use case", ["Take a full exam when you want stamina practice, timing, and realistic transitions."], "Strategy"),
          createNoteCard("What to expect", ["Listening starts first, then Reading, then Writing.", "Progress is saved in the same workspace."], "Flow"),
          createNoteCard("When to use section pages instead", ["Use the skill pages when you want focused repair work on one area only."], "Focus"),
        ]));
      }

      if (kind === "reading") {
        resourceHubBadge.textContent = "Reading page";
        resourceHubTitle.textContent = "Reading exams, sections, practice, and strategy";
        resourceHubSubtitle.textContent = "Choose between full reading exams, part-based launches, question-type drills, and reading strategy support.";
        addSection("reading-full-exams", "Take full reading exam", "Run the complete reading-only section from any uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.reading || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Reading exam",
              title: item.label,
              copy: item.description,
              meta: item.meta,
              primaryLabel: "Open full reading",
              onPrimary: () => requireTestPassword(() => launchReadingOnly(item.testId)),
            }));
          });
          return grid;
        });
        addSection("reading-sections", "Take by section", "Open reading section 1, 2, or 3 separately from each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.reading || []).forEach((item) => {
            grid.appendChild(createMultiActionCard({
              kicker: "Reading sections",
              title: R()?.getTestLabel?.(item.testId) || item.label,
              copy: "Launch one reading part at a time when a student wants focused repair work instead of the full reading paper.",
              meta: ["Section 1", "Section 2", "Section 3"],
              primaryLabel: "Full reading",
              onPrimary: () => requireTestPassword(() => launchReadingOnly(item.testId)),
              extraActions: [
                { label: "Section 1", onClick: () => requireTestPassword(() => launchReadingOnly(item.testId, "part1")) },
                { label: "Section 2", onClick: () => requireTestPassword(() => launchReadingOnly(item.testId, "part2")) },
                { label: "Section 3", onClick: () => requireTestPassword(() => launchReadingOnly(item.testId, "part3")) },
              ],
            }));
          });
          return grid;
        });
        addSection("reading-practice-types", "Practice by question type", "Choose the task type a student struggles with and drill only that format.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.practice.reading || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Question type",
              title: item.label,
              copy: item.summary,
              meta: [`${item.exerciseCount} drills`, `${item.questionCount} questions`],
              primaryLabel: "Start practice",
              onPrimary: () => requireTestPassword(() => launchReadingPractice(item.type)),
            }));
          });
          return grid;
        });
        addSection("reading-tips", "Reading tips", "General reading strategy and task-by-task guidance students can return to before practice.", () => renderStaticTips([
          createNoteCard("Start with the passage map", [
            "Read the title, intro, and first line of each paragraph before attacking the questions.",
            "Mark topic shifts, names, dates, and repeated keywords so the passage becomes easier to scan later.",
            "Do not try to understand every word on the first pass; build orientation first."
          ], "General"),
          createNoteCard("Manage time by section, not by panic", [
            "Keep moving if one question cluster is taking too long; come back after easier marks are secured.",
            "Leave a short buffer at the end to transfer or recheck uncertain answers.",
            "Use the earlier passages efficiently so Passage 3 still gets enough attention."
          ], "Timing"),
          createNoteCard("Hunt synonyms, not only exact words", [
            "IELTS often paraphrases the question using synonyms, opposites, or slightly different grammar.",
            "Underline the key idea in the question, then think of two or three alternative ways that idea might appear.",
            "If the exact words are missing, that does not mean the answer is missing."
          ], "General"),
          createNoteCard("True / False / Not Given", [
            "Turn the statement into a yes/no question, then check whether the passage clearly supports it, contradicts it, or stays silent.",
            "FALSE means the text says the opposite, while NOT GIVEN means the text does not give enough information.",
            "Base the answer on the passage only, never on your own knowledge."
          ], "TFNG"),
          createNoteCard("Matching Headings", [
            "Focus on the main idea of the whole paragraph, not a striking detail from one sentence.",
            "Read the heading list quickly, then summarise each paragraph in a few words before matching.",
            "If two headings both look possible, ask which one covers the paragraph as a whole."
          ], "Headings"),
          createNoteCard("Sentence / Summary Completion", [
            "Predict the missing word type first: noun, verb, adjective, number, or name.",
            "Check the word limit carefully before writing anything down.",
            "Make sure the completed sentence is grammatically correct as well as factually correct."
          ], "Completion"),
          createNoteCard("Short Answer", [
            "Find the relevant part of the text first, then lift only the exact words needed for the answer.",
            "Use the wording from the passage where possible instead of rewriting it in your own style.",
            "Keep checking the word limit because many correct ideas still become wrong answers if they are too long."
          ], "Short Answer"),
          createNoteCard("Matching Endings / Matching Information", [
            "Read the stem first and identify the core meaning before you look at the endings or options.",
            "Eliminate endings that repeat vocabulary but break the meaning when joined to the stem.",
            "For matching-information tasks, remember that the order is often not the same as the passage order."
          ], "Matching"),
          createNoteCard("Multiple Choice", [
            "Read the question stem before the options so you know what evidence you are hunting for.",
            "Expect distractors: one option may use familiar words but miss the writer's real point.",
            "Eliminate aggressively and confirm the surviving answer with exact evidence from the passage."
          ], "Multiple Choice"),
          createNoteCard("Summary Selection", [
            "Read the full summary first so you understand its overall meaning before choosing a word or option.",
            "Check grammar and meaning together; a word can look related to the passage but still not fit the sentence.",
            "If options are provided, compare them against the exact sentence in the text instead of relying on memory."
          ], "Summary"),
          createNoteCard("Final reading checklist", [
            "Check every answer against the question instructions and word limits.",
            "Revisit headings, TFNG, and multiple choice carefully because these are common trap areas.",
            "If you cannot prove an answer from the passage, it probably needs another look."
          ], "Review"),
        ]));
      }

      if (kind === "listening") {
        resourceHubBadge.textContent = "Listening page";
        resourceHubTitle.textContent = "Listening exams, sections, and listening technique";
        resourceHubSubtitle.textContent = "Use this page for full listening runs, section-by-section access, and listening reminders.";
        addSection("listening-full-exams", "Take full listening exam", "Open the listening-only version of each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.listening || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Listening exam",
              title: item.label,
              copy: item.description,
              meta: item.meta,
              primaryLabel: "Open full listening",
              onPrimary: () => requireTestPassword(() => launchListeningOnly(item.testId)),
            }));
          });
          return grid;
        });
        addSection("listening-sections", "Take by section", "Jump directly to individual listening sections for focused practice.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.listening || []).forEach((item) => {
            grid.appendChild(createMultiActionCard({
              kicker: "Listening sections",
              title: R()?.getTestLabel?.(item.testId) || item.label,
              copy: "Open one listening section at a time. This is useful for focused repetition inside the current listening workspace.",
              meta: ["Section 1", "Section 2", "Section 3", "Section 4"],
              primaryLabel: "Full listening",
              onPrimary: () => requireTestPassword(() => launchListeningOnly(item.testId)),
              extraActions: [
                { label: "Section 1", onClick: () => requireTestPassword(() => launchListeningOnly(item.testId, 0)) },
                { label: "Section 2", onClick: () => requireTestPassword(() => launchListeningOnly(item.testId, 1)) },
                { label: "Section 3", onClick: () => requireTestPassword(() => launchListeningOnly(item.testId, 2)) },
                { label: "Section 4", onClick: () => requireTestPassword(() => launchListeningOnly(item.testId, 3)) },
              ],
            }));
          });
          return grid;
        });
        addSection("listening-tips", "Listening tips", "General listening strategy plus task-specific reminders students can use before or between attempts.", () => renderStaticTips([
          createNoteCard("Know the listening flow", [
            "The recording is played once only, but the questions follow the same order as the information in the audio.",
            "Use the short pauses to move your eyes forward and predict what is coming next.",
            "If you miss one answer, keep moving so one gap does not cost you the next three."
          ], "General"),
          createNoteCard("Read ahead before the audio starts", [
            "Use the preparation time to circle keywords, names, numbers, dates, and signpost words.",
            "Predict the answer type before you listen: number, place, noun, adjective, or verb.",
            "The better your prediction, the easier it is to catch the answer when the audio arrives."
          ], "Prep"),
          createNoteCard("Track paraphrase and synonyms", [
            "The speaker may not repeat the same words from the question sheet.",
            "Train yourself to hear paraphrase, especially for common nouns, verbs, and time expressions.",
            "A wider vocabulary helps you catch answers that sound different from the printed question."
          ], "General"),
          createNoteCard("Expect distractors", [
            "Speakers often say one answer, then correct themselves or add a detail that changes it.",
            "Wait for the final confirmed information before writing your answer.",
            "This matters especially in conversations, bookings, prices, times, and directions."
          ], "Distractors"),
          createNoteCard("Form / Note / Table / Summary Completion", [
            "Read the sentence around each gap so you know what kind of word will fit.",
            "Check word limits carefully because a correct idea can still be marked wrong if it is too long.",
            "Watch spelling, plurals, and singular forms because Listening answers must be exact."
          ], "Completion"),
          createNoteCard("Multiple Choice", [
            "Read the question before the options if possible so you know what main idea you are listening for.",
            "Eliminate options that mention details from the recording but do not answer the real question.",
            "Stay alert for contrast language like 'however', 'actually', 'in fact', or 'we decided instead'."
          ], "Multiple Choice"),
          createNoteCard("Matching tasks", [
            "Understand each option first so you know what differences you are listening for.",
            "Tick off options that are already used if the task instructions allow each answer only once.",
            "In matching sections, keep your place carefully because the speakers may move through choices quickly."
          ], "Matching"),
          createNoteCard("Map / Plan / Diagram Labelling", [
            "Before the recording starts, study the layout and identify landmarks, doors, corners, and directions.",
            "Listen for movement language such as 'opposite', 'next to', 'at the end of', 'to the left of', and 'beyond'.",
            "Follow the route step by step instead of trying to imagine the whole map at once."
          ], "Map / Plan"),
          createNoteCard("Use section difficulty wisely", [
            "Section 1 is usually more everyday and concrete, while Sections 3 and 4 demand stronger concentration and note tracking.",
            "Do not relax too much after an easier opening section because later sections usually move faster and feel denser.",
            "Save mental energy for Section 4, where one speaker may give many answer points in a short stretch."
          ], "Sections"),
          createNoteCard("Stay calm after a missed answer", [
            "Do not stop listening just because one item slipped away.",
            "Make a quick guess later if needed, but protect the questions that are still coming.",
            "Calm recovery is often worth more than chasing one lost answer."
          ], "Mindset"),
          createNoteCard("Final listening checklist", [
            "Recheck spelling, capital letters if needed, numbers, and singular/plural form.",
            "Make sure every answer respects the word limit printed in the instructions.",
            "If an answer feels too easy, ask whether the speaker later changed or corrected it."
          ], "Review"),
        ]));
      }

      if (kind === "writing") {
        resourceHubBadge.textContent = "Writing page";
        resourceHubTitle.textContent = "Writing tasks, model bands, and writing support";
        resourceHubSubtitle.textContent = "Separate task entry points and sample-answer guidance live here instead of crowding the homepage.";
        addSection("writing-task1", "Writing Task 1", "Open Task 1-focused writing work from each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.writing || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Task 1",
              title: `${R()?.getTestLabel?.(item.testId) || item.label} · Task 1`,
              copy: "Launch writing and focus the student directly on Task 1.",
              meta: ["Visual / report task"],
              primaryLabel: "Open Task 1",
              onPrimary: () => requireTestPassword(() => launchWritingOnly(item.testId, "task1")),
            }));
          });
          return grid;
        });
        addSection("writing-task2", "Writing Task 2", "Open Task 2-focused writing work from each uploaded test.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          (catalog.sections.writing || []).forEach((item) => {
            grid.appendChild(createCatalogCard({
              kicker: "Task 2",
              title: `${R()?.getTestLabel?.(item.testId) || item.label} · Task 2`,
              copy: "Launch writing and focus the student directly on Task 2.",
              meta: ["Essay task"],
              primaryLabel: "Open Task 2",
              onPrimary: () => requireTestPassword(() => launchWritingOnly(item.testId, "task2")),
            }));
          });
          return grid;
        });
        addSection("writing-samples", "Sample answer libraries", "Open the dedicated sample-answer pages for Task 1 and Task 2 so the main Writing page stays lighter and easier to scan.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          grid.appendChild(createCatalogCard({
            kicker: "Sample library",
            title: "Writing Task 1 Samples",
            copy: "All available Task 1 prompts with sample answers, band explanations, and corrected forms.",
            meta: ["Past prompts", "Future prompts", "Band guidance"],
            primaryLabel: "Open Task 1 library",
            onPrimary: () => openResourceHub("writingSamplesTask1"),
          }));
          grid.appendChild(createCatalogCard({
            kicker: "Sample library",
            title: "Writing Task 2 Samples",
            copy: "All available Task 2 prompts with sample answers, band explanations, and corrected forms.",
            meta: ["Past prompts", "Future prompts", "Band guidance"],
            primaryLabel: "Open Task 2 library",
            onPrimary: () => openResourceHub("writingSamplesTask2"),
          }));
          return grid;
        });
        addSection("writing-tips", "Writing tips", "General writing guidance plus separate reminders for Task 1 and Task 2.", () => renderStaticTips([
          createNoteCard("Plan before you write", [
            "Spend a few minutes deciding your structure before you begin typing.",
            "A short plan usually saves time because your ideas come out in a cleaner order.",
            "Good planning improves Task Response and Coherence together."
          ], "General"),
          createNoteCard("Write for the task, not just the topic", [
            "Always match what the question asks: describe, compare, explain, discuss, or give an opinion.",
            "A strong answer can still lose marks if it answers the wrong task.",
            "Underline the instruction words before you start."
          ], "Task Response"),
          createNoteCard("Use clear paragraph roles", [
            "Each paragraph should have a job: overview, detail group, argument, explanation, or conclusion.",
            "Do not add paragraphs just to look academic; build them around clear ideas.",
            "Strong paragraph control makes the essay easier to follow and easier to score well."
          ], "Structure"),
          createNoteCard("Writing Task 1: overview first", [
            "In Task 1, the overview is one of the most important scoring features.",
            "After reading the visual, identify the biggest trends, highest and lowest points, or key comparisons.",
            "Save minor details for body paragraphs and keep the overview broad."
          ], "Task 1"),
          createNoteCard("Writing Task 1: group data logically", [
            "Do not describe every number one by one in random order.",
            "Group similar trends, similar categories, or time periods together.",
            "This makes the report feel analytical instead of mechanical."
          ], "Task 1"),
          createNoteCard("Writing Task 1: compare, do not list", [
            "IELTS rewards comparison language more than simple reporting.",
            "Show relationships such as higher than, lower than, similar to, doubled, or remained stable.",
            "Use figures as evidence, not as the whole paragraph."
          ], "Task 1"),
          createNoteCard("Writing Task 2: answer the exact question", [
            "If the essay asks for your opinion, make your position clear and keep it clear throughout.",
            "If it asks for both views, cover both fairly before you conclude.",
            "Never rely on a memorised essay shape without checking what the prompt really wants."
          ], "Task 2"),
          createNoteCard("Writing Task 2: develop ideas deeply", [
            "One well-explained idea is stronger than three shallow ideas.",
            "After each main point, add a reason, explanation, or realistic example.",
            "Ask yourself: why is this true, and what does it lead to?"
          ], "Task 2"),
          createNoteCard("Use examples that feel plausible", [
            "Your examples do not need to be personal or factual, but they should sound believable.",
            "Keep them short and useful; do not let one example become half the paragraph.",
            "Examples should support the main idea, not replace it."
          ], "Support"),
          createNoteCard("Control vocabulary and grammar", [
            "Do not force rare words if you cannot use them naturally.",
            "Accurate, flexible language scores better than ambitious but unstable language.",
            "Vary sentence structure, but stay readable and controlled."
          ], "Language"),
          createNoteCard("Manage time across both tasks", [
            "Task 2 normally deserves more time because it carries more weight.",
            "Leave a short final review window to catch grammar slips, missing articles, or repeated wording.",
            "Do not let Task 1 expand so much that Task 2 loses quality."
          ], "Timing"),
          createNoteCard("Final writing checklist", [
            "Check that every paragraph has a clear purpose and that your ideas answer the task directly.",
            "Look for repeated words, missing verbs, article mistakes, and punctuation slips.",
            "If your conclusion says something new, rewrite it to summarize your real position instead."
          ], "Review"),
        ]));
      }

      if (kind === "writingSamplesTask1") {
        resourceHubBadge.textContent = "Writing sample library";
        resourceHubTitle.textContent = "Writing Task 1 sample answers";
        resourceHubSubtitle.textContent = "Browse all available Task 1 prompts with a band score, explanation, sample answer, and corrected form.";
        addSection("writing-task1-sample-library", "Task 1 sample library", "Every current and future Task 1 prompt can live here when sample-answer metadata is added.", () => renderWritingSampleLibrary("task1"));
      }

      if (kind === "writingSamplesTask2") {
        resourceHubBadge.textContent = "Writing sample library";
        resourceHubTitle.textContent = "Writing Task 2 sample answers";
        resourceHubSubtitle.textContent = "Browse all available Task 2 prompts with a band score, explanation, sample answer, and corrected form.";
        addSection("writing-task2-sample-library", "Task 2 sample library", "Every current and future Task 2 prompt can live here when sample-answer metadata is added.", () => renderWritingSampleLibrary("task2"));
      }

      if (kind === "speaking") {
        resourceHubBadge.textContent = "Speaking page";
        resourceHubTitle.textContent = "Speaking practice, likely questions, tips, and sample answers";
        resourceHubSubtitle.textContent = "Keep speaking as its own dedicated page with both practice and coaching resources.";
        addSection("speaking-practice", "Practice speaking", "Open the live speaking workspace directly.", () => {
          const grid = document.createElement("div");
          grid.className = "resource-hub-grid";
          grid.appendChild(createCatalogCard({
            kicker: "Speaking module",
            title: "IELTS Speaking Practice",
            copy: "Use the current speaking module for guided response flow and recording practice.",
            meta: ["Independent practice", "Voice workflow"],
            primaryLabel: "Open speaking",
            onPrimary: () => openSpeakingFromMenu(),
          }));
          return grid;
        });
        addSection("speaking-predicted", "Predicted speaking questions", "Use likely prompt themes as warm-up or homework material.", () => renderStaticTips([
          createNoteCard("People and relationships", ["Describe someone who influenced you.", "Describe a helpful friend or teacher."], "Likely theme"),
          createNoteCard("Places and experiences", ["Describe a place you would like to revisit.", "Describe a crowded place you have been to."], "Likely theme"),
          createNoteCard("Habits and routines", ["Describe a skill you want to improve.", "Describe something you do to stay focused."], "Likely theme"),
        ]));
        addSection("speaking-tips", "Tips for speaking", "General speaking strategy plus part-specific reminders students can use before practice.", () => renderStaticTips([
          createNoteCard("Keep fluency moving", [
            "A small mistake is usually less damaging than stopping completely.",
            "If you lose a word, explain the idea another way and keep going.",
            "The examiner is listening for communication, not perfection in every second."
          ], "General"),
          createNoteCard("Expand every answer once", [
            "After your first answer, add one more layer: an example, a reason, a feeling, or a short story.",
            "This helps answers sound natural instead of too short.",
            "Think in patterns like point plus support, not just point alone."
          ], "Development"),
          createNoteCard("Use natural signposting", [
            "Simple phrases like 'for example', 'actually', 'to be honest', and 'the main reason is' help you sound organized.",
            "Use signposting to connect ideas, not to fill silence mechanically.",
            "Natural transitions usually score better than memorised templates."
          ], "Coherence"),
          createNoteCard("Part 1: stay direct and personal", [
            "Answer the question first, then add a short detail from your own experience.",
            "Do not turn Part 1 into a mini-essay; keep it conversational.",
            "Aim for 2 to 4 developed sentences rather than one-word answers."
          ], "Part 1"),
          createNoteCard("Part 2: plan the cue card fast", [
            "Use the one-minute preparation time to note keywords, not full sentences.",
            "Make a simple beginning, middle, and ending so the talk keeps moving.",
            "Cover every bullet point, but do not sound like you are reading a checklist."
          ], "Part 2"),
          createNoteCard("Part 2: keep speaking for the full time", [
            "If you finish the main story early, add details about how you felt, why it mattered, or what happened after.",
            "Extra detail is usually safer than stopping too soon.",
            "Think of who, where, when, what, why, and how to extend naturally."
          ], "Part 2"),
          createNoteCard("Part 3: think bigger than yourself", [
            "These questions often need broader opinions, comparisons, or social ideas, not just personal examples.",
            "State your view clearly, then explain why and support it.",
            "If the topic feels abstract, compare past and present or individual and society."
          ], "Part 3"),
          createNoteCard("Pronunciation is clarity first", [
            "You do not need a British or American accent to score well.",
            "Clear word stress, clear endings, and natural pacing matter more than accent imitation.",
            "Slow down slightly if clarity drops when you speak quickly."
          ], "Pronunciation"),
          createNoteCard("Lexical resource without overreaching", [
            "Use vocabulary you truly control instead of forcing rare words.",
            "Paraphrase naturally when a perfect word does not come immediately.",
            "Flexible everyday language often sounds stronger than memorised 'high-band' phrases."
          ], "Vocabulary"),
          createNoteCard("Recover smoothly when you get stuck", [
            "If you freeze, use a bridge like 'let me think for a second' or 'what I mean is'.",
            "Then restart with a simpler version of the same idea.",
            "A calm recovery usually sounds better than a long silence."
          ], "Recovery"),
          createNoteCard("Final speaking checklist", [
            "Answer the question directly, then extend once.",
            "Keep a steady pace and make sure your words stay clear.",
            "Sound natural, engaged, and willing to communicate, not memorised."
          ], "Review"),
        ]));
        addSection("speaking-samples", "Sample answers", "Use sample structures as models for pacing and development, not scripts to memorize.", () => renderStaticTips([
          createNoteCard("Short sample structure", ["Answer directly.", "Add one concrete detail.", "Finish with a feeling or conclusion."], "Part 1"),
          createNoteCard("Cue-card sample structure", ["Set the scene.", "Cover each bullet point.", "Close with why it mattered."], "Part 2"),
          createNoteCard("Discussion sample structure", ["State your view.", "Explain why.", "Give an example or contrast.", "Conclude clearly."], "Part 3"),
        ]));
      }

      if (focusId) {
        setTimeout(() => document.getElementById(focusId)?.scrollIntoView?.({ behavior: "smooth", block: "start" }), 40);
      }
    }

function startFreshExam() {
      R()?.clearLaunchContext?.();
      resetEngineInitFlags();
      clearAllStudentAttemptKeys();
      safe(() => Modal().hideModal());

      try { UI().setExamStarted(true); } catch (e) {}
      try { UI().showOnly("listening"); } catch (e) {}
      try { UI().setExamNavStatus("Status: Listening in progress"); } catch (e) {}
      try { window.IELTS?.Router?.setHashRoute?.((window.IELTS?.Registry?.getActiveTestId?.() || "ielts1"), "listening"); } catch (e) {}

      try {
        startEngineWhenReady("Listening", "initListeningSystem").catch(e => console.error('[IELTS] Listening failed to start:', e));
      } catch (e) {
        console.error("Listening failed to start:", e);
        try { window.alert("Listening failed to load. Please refresh once and try again."); } catch (_) {}
      }

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

    if (startBtn) startBtn.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); });
    if (startBtn2) startBtn2.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); });
    if (startBtnT2) startBtnT2.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts2"); startFreshExam(); });
    if (startBtnT2b) startBtnT2b.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts2"); startFreshExam(); });
    if (startBtnT3) startBtnT3.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts3"); startFreshExam(); });
    if (startBtnT3b) startBtnT3b.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts3"); startFreshExam(); });
    if (footerStartTest1Btn) footerStartTest1Btn.onclick = () => requireTestPassword(() => { window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); });
    if (openDashboardBtn) openDashboardBtn.onclick = (e) => {
      e.preventDefault();
      if (!window.IELTS?.Auth?.isSignedIn?.()) {
        window.IELTS?.Auth?.openLoginGate?.("Please log in to open your dashboard.");
        return;
      }
      toggleAccountMenu();
    };
    if (footerOpenDashboardBtn) footerOpenDashboardBtn.onclick = () => requireSignedIn(() => window.IELTS?.Dashboard?.open?.(), "Please log in to open your dashboard.");
    if (footerOpenHistoryBtn) footerOpenHistoryBtn.onclick = () => openHistoryFromMenu();
    if (menuDashboardProfileBtn) menuDashboardProfileBtn.onclick = () => { closeAccountMenu(); requireSignedIn(() => window.IELTS?.Dashboard?.openTab?.("overview"), "Please log in to open your profile."); };
    if (menuDashboardSettingsBtn) menuDashboardSettingsBtn.onclick = () => { closeAccountMenu(); requireSignedIn(() => window.IELTS?.Dashboard?.openTab?.("settings"), "Please log in to open your settings."); };
    if (menuHistoryBtn) menuHistoryBtn.onclick = () => openHistoryFromMenu();
    if (menuSpeakingBtn) menuSpeakingBtn.onclick = () => openSpeakingFromMenu();
    if (adminResultsBtn) adminResultsBtn.onclick = () => openAdminResultsView();
    if (navResultsBtn) navResultsBtn.onclick = () => openAdminResultsView();
    if (adminRefreshBtn) adminRefreshBtn.onclick = () => openAdminResultsView();
    if (adminExportBtn) adminExportBtn.onclick = () => exportAdminRowsCsv();
    renderHomeMenus();
    if (pendingResourceHubKind) {
      openResourceHub(pendingResourceHubKind);
    }
    if (resourceHubBackBtn) resourceHubBackBtn.onclick = () => {
      UI().showOnly("home");
      try { Router().setHashRoute(getActiveTestId(), "home"); } catch (e) {}
      UI().setExamNavStatus("Status: Home");
    };
    $("adminResultsSearch")?.addEventListener("input", applyAdminFilters);
    $("adminResultsExamFilter")?.addEventListener("change", applyAdminFilters);
    $("adminResultsSort")?.addEventListener("change", applyAdminFilters);
    $("adminDetailCloseBtn")?.addEventListener("click", () => $("adminResultDetail")?.classList.add("hidden"));
    $("adminResultsTbody")?.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-admin-view]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-admin-view"));
      const row = adminState.filtered[idx];
      if (row) renderAdminDetail(row);
    });

    // If student refreshes after Listening is already submitted, show gate (not auto-reading)
    if (!isAdminView()) {
      showListeningGate();
      showReadingGate();
    }

    document.addEventListener("click", (e) => {
      if (!homeAccountDropdown || !openDashboardBtn) return;
      const trigger = e.target?.closest?.("#openDashboardBtn");
      const inside = e.target?.closest?.("#homeAccountDropdown");
      if (!trigger && !inside) closeAccountMenu();
    });

    document.addEventListener("click", (e) => {
      const trigger = e.target?.closest?.(".home-skill-trigger");
      const inside = e.target?.closest?.(".home-skill-dropdown");
      if (!trigger && !inside) {
        document.querySelectorAll(".home-skill-dropdown").forEach((el) => el.classList.add("hidden"));
      }
    });

    // End of main init
  });

  // -----------------------------
  // Fallback handlers: ensure buttons work even if earlier init threw
  // -----------------------------
  (function () {
    function safeCall(fnPath, args) {
      try {
        const parts = fnPath.split('.');
        let fn = window;
        for (const p of parts) { if (!fn) { fn = undefined; break; } fn = fn[p]; }
        if (typeof fn === 'function') return fn.apply(null, args || []);
      } catch (e) {
        console.error('safeCall error', fnPath, e);
      }
    }

    function installFallback() {
      if (window.__IELTS_FALLBACK_INSTALLED__) return;
      window.__IELTS_FALLBACK_INSTALLED__ = true;

      document.addEventListener('click', function (e) {
        const b = e.target.closest && e.target.closest('button');
        if (!b) return;
        const id = b.id || (b.textContent && b.textContent.trim());
        try {
          if (id === 'startIelts1Btn' || /Start Test 1|Open Test 1/i.test(id)) {
            safeCall('IELTS.Registry.setActiveTestId', ['ielts1']);
            safeCall('IELTS.UI.setExamStarted', [true]);
            safeCall('IELTS.UI.showOnly', ['listening']);
            safeCall('IELTS.Engines.Listening.initListeningSystem');
            return;
          }
          if (id === 'startIelts2Btn' || /Start Test 2|Open Test 2/i.test(id)) {
            safeCall('IELTS.Registry.setActiveTestId', ['ielts2']);
            safeCall('IELTS.UI.setExamStarted', [true]);
            safeCall('IELTS.UI.showOnly', ['listening']);
            safeCall('IELTS.Engines.Listening.initListeningSystem');
            return;
          }
          if (id === 'startIelts3Btn' || /Start Test 3|Open Test 3/i.test(id)) {
            safeCall('IELTS.Registry.setActiveTestId', ['ielts3']);
            safeCall('IELTS.UI.setExamStarted', [true]);
            safeCall('IELTS.UI.showOnly', ['listening']);
            safeCall('IELTS.Engines.Listening.initListeningSystem');
            return;
          }
          if (id === 'openHistoryBtn' || /My History/i.test(id)) {
            safeCall('IELTS.History.openHistory');
            return;
          }
          if (id === 'footerOpenDashboardBtn') {
            safeCall('IELTS.Dashboard.open');
            return;
          }
          if (id === 'historyBackBtn') {
            safeCall('IELTS.History.closeHistory');
            safeCall('IELTS.UI.showOnly', ['home']);
            return;
          }
          if (id === 'historyDetailCloseBtn') {
            safeCall('IELTS.History.closeHistory');
            return;
          }
          if (id === 'openSpeakingExamBtn') {
            safeCall('IELTS.Speaking.initSpeakingExam');
            safeCall('IELTS.UI.showOnly', ['speaking']);
            return;
          }
          if (id === 'backFromSpeakingBtn') {
            safeCall('IELTS.UI.showOnly', ['home']);
            safeCall('IELTS.UI.setExamNavStatus', ['Status: Home']);
            return;
          }
          if (id === 'navToHomeBtn' || id === 'navToListeningBtn' || id === 'navToReadingBtn' || id === 'navToWritingBtn') {
            // best-effort: call the UI navigation helpers
            if (id === 'navToHomeBtn') {
              try { const la = document.getElementById('listeningAudio'); if (la && !la.paused) { la.pause(); la.currentTime = 0; } } catch (e) {}
              try { const sp = document.getElementById('speakingPlayback'); if (sp && !sp.paused) { sp.pause(); sp.currentTime = 0; } } catch (e) {}
              safeCall('IELTS.UI.showOnly', ['home']);
              safeCall('IELTS.UI.updateHomeStatusLine');
              return;
            }
            if (id === 'navToListeningBtn') {
              safeCall('IELTS.UI.setExamStarted', [true]);
              safeCall('IELTS.Engines.Listening.initListeningSystem');
              safeCall('IELTS.UI.showOnly', ['listening']);
              return;
            }
            if (id === 'navToReadingBtn') {
              safeCall('IELTS.UI.setExamStarted', [true]);
              safeCall('IELTS.Engines.Reading.startReadingSystem');
              safeCall('IELTS.UI.showOnly', ['reading']);
              return;
            }
            if (id === 'navToWritingBtn') {
              safeCall('IELTS.UI.setExamStarted', [true]);
              safeCall('IELTS.Engines.Writing.startWritingSystem');
              safeCall('IELTS.UI.showOnly', ['writing']);
              return;
            }
          }
          if (id === 'logoutBtn' || /Log out/i.test(id)) {
            safeCall('IELTS.Auth.logout');
            return;
          }
        } catch (err) {
          console.error('fallback handler failed', err);
        }
      }, { capture: true });

      console.log('IELTS fallback handlers installed');
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', installFallback, { once: true });
    } else {
      installFallback();
    }
  })();

})();
