{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 /* assets/js/app.js (v5: reliable gates + always-new attempt for students) */\
(function () \{\
  "use strict";\
\
  console.log("JS is running (split build)");\
\
  const UI = () => window.IELTS.UI;\
  const S = () => window.IELTS.Storage;\
  const R = () => window.IELTS.Registry;\
  \
  // Student test password (front-end gate)\
  window.IELTS = window.IELTS || \{\};\
  window.IELTS.Registry = window.IELTS.Registry || \{\};\
  window.IELTS.Registry.TEST_PASSWORD = "ILEZT123";\
const Router = () => window.IELTS.Router;\
  const Modal = () => window.IELTS.Modal;\
\
  function isAdminView() \{\
    try \{\
      return window.IELTS?.Access?.isAdmin?.() === true;\
    \} catch \{\
      return false;\
    \}\
  \}\
\
  function safe(fn) \{\
    try \{\
      return fn();\
    \} catch \{\
      return undefined;\
    \}\
  \}\
  // Active test helpers (multi-test safe defaults)\
  function getActiveTestId() \{\
    return (R()?.getActiveTestId?.() || R()?.TESTS?.defaultTestId || "ielts1");\
  \}\
  function setActiveTestId(id) \{\
    try \{ R()?.setActiveTestId?.(id); \} catch \{\}\
  \}\
\
\
\
  // Start engine method when split bundles load out-of-order.\
  // Retries for a short period, and logs failures instead of silently swallowing them.\
  function startEngineWhenReady(engineName, methodName, \{ maxMs = 3500, intervalMs = 100 \} = \{\}) \{\
    const startAt = Date.now();\
    return new Promise((resolve, reject) => \{\
      const tick = () => \{\
        const fn = window.IELTS?.Engines?.[engineName]?.[methodName];\
        if (typeof fn === "function") \{\
          try \{\
            fn();\
            resolve(true);\
          \} catch (e) \{\
            console.error(`[IELTS] Failed to start $\{engineName\}.$\{methodName\}`, e);\
            reject(e);\
          \}\
          return;\
        \}\
        if (Date.now() - startAt >= maxMs) \{\
          const err = new Error(`Engine not ready: $\{engineName\}.$\{methodName\}`);\
          console.error("[IELTS]", err);\
          reject(err);\
          return;\
        \}\
        setTimeout(tick, intervalMs);\
      \};\
      tick();\
    \});\
  \}\
\
  document.addEventListener("DOMContentLoaded", () => \{\
    // Bind modal buttons once\
    if (window.IELTS?.Modal && typeof window.IELTS.Modal.bindModalOnce === "function") \{\
      window.IELTS.Modal.bindModalOnce();\
      // Boot safety: never show modal on first load\
      safe(() => Modal().hideModal());\
      const m = document.getElementById("modal");\
      if (m) m.classList.add("hidden");\
    \}\
\
    // Init admin/session gate + apply UI lockdown for students\
    safe(() => window.IELTS?.Access?.init?.());\
    safe(() => UI()?.applyStudentLockdownUI?.());\
\
    const isAdmin = isAdminView();\
    const $ = UI().$;\
    \
    const PREF_KEYS = \{\
      fontScale: "IELTSPREF:fontScale",\
    \};\
\
    function applyFontScale(value) \{\
      const allowed = new Set(["small", "medium", "large"]);\
      const next = allowed.has(value) ? value : "medium";\
      try \{ document.body.setAttribute("data-font-scale", next); \} catch \{\}\
      return next;\
    \}\
\
    function initFontPreference() \{\
      const select = $("fontSizeSelect");\
      const saved = (localStorage.getItem(PREF_KEYS.fontScale) || "medium").trim();\
      const active = applyFontScale(saved);\
      if (select) \{\
        select.value = active;\
        select.addEventListener("change", () => \{\
          const next = applyFontScale(select.value);\
          try \{ localStorage.setItem(PREF_KEYS.fontScale, next); \} catch \{\}\
        \});\
      \}\
    \}\
\
    initFontPreference();\
\
\
    // Key helpers\
    const readingSubmittedKey = () => \{ const tid = getActiveTestId(); const cfg = R()?.getTestConfig?.(tid) || R()?.TESTS?.byId?.[tid] || \{\}; const rid = cfg.readingTestId || R()?.TESTS?.readingTestId || "ielts-reading-3parts-001"; return `$\{rid\}:submitted`; \};\
\
    // -----------------------------\
    // Always-new attempt behavior\
    // -----------------------------\
    function clearAllStudentAttemptKeys() \{\
      // Keep admin session, wipe everything else that belongs to attempts.\
      try \{\
        const keep = new Set(["IELTS:ADMIN:session","IELTS:EXAM:activeTestId"]);\
        const prefixes = ["IELTS:", "ielts-reading-", "ielts-writing-", "ielts-full-"];\
        const toRemove = [];\
        for (let i = 0; i < localStorage.length; i++) \{\
          const k = localStorage.key(i);\
          if (!k) continue;\
          if (keep.has(k)) continue;\
          if (prefixes.some((p) => k.startsWith(p))) toRemove.push(k);\
        \}\
        toRemove.forEach((k) => localStorage.removeItem(k));\
      \} catch \{\}\
    \}\
\
    // If student lands on "submitted" overlay, do NOT trap them forever.\
    // They should be able to start a new attempt.\
    const maybePayload = S().getJSON(R().EXAM.keys.finalSubmission, null);\
    if (S().get(R().EXAM.keys.finalSubmitted, "false") === "true" && !maybePayload) \{\
      S().set(R().EXAM.keys.finalSubmitted, "false");\
    \}\
\
    const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";\
    if (finalDone && !isAdmin) \{\
      // Student: auto-clear so Start Exam always works\
      clearAllStudentAttemptKeys();\
    \}\
\
    // -----------------------------\
    // Reliable gates (Listening\uc0\u8594 Reading, Reading\u8594 Writing)\
    // -----------------------------\
    let showingGate = false;\
\
    function showListeningGate() \{\
      if (isAdmin || showingGate) return;\
      const listeningDone = S().get((R().keysFor?.(getActiveTestId())?.listening || R().TESTS.listeningKeys).submitted, "false") === "true";\
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";\
      if (!listeningDone || readingDone) return;\
      // If the user has already moved on to Reading/Writing, do not pull them back to Listening.\
      const lastView = S().get(R().KEYS.HOME_LAST_VIEW, "");\
      if (lastView === "reading" || lastView === "writing") return;\
\
\
      showingGate = true;\
      safe(() => UI().showOnly("listening"));\
      safe(() => UI().setExamNavStatus("Status: Listening finished"));\
\
      safe(() =>\
        Modal().showModal(\
          "Listening finished",\
          "Your Listening has been submitted. Click Start Reading to continue.",\
          \{\
            mode: "gate",\
                        submitText: "Start Reading",\
            onConfirm: async () => \{\
              // Mark that the user has moved on immediately to prevent any \'93gate loop\'94 pulling them back.\
              try \{ S().set(R().KEYS.HOME_LAST_VIEW, "reading"); \} catch (e) \{\}\
\
              // Keep the gate locked until we have attempted to start Reading.\
              // (If listening:submitted fires again for any reason, showListeningGate will ignore it.)\
              // Move to Reading view first, then start the engine (more reliable).\
              try \{ UI().setExamStarted(true); \} catch (e) \{\}\
              try \{ UI().showOnly("reading"); \} catch (e) \{\}\
              try \{ UI().setExamNavStatus("Status: Reading in progress"); \} catch (e) \{\}\
\
              try \{\
                try \{ window.__IELTS_READING_INIT__ = false; \} catch (e) \{\}\
                await startEngineWhenReady("Reading", "startReadingSystem");\
              \} catch (e) \{\
                // Visible fallback: keep user on Reading screen even if engine failed.\
                try \{\
                  window.alert("Reading failed to start. Please refresh the page and try again.");\
                \} catch (_) \{\}\
              \} finally \{\
                showingGate = false;\
              \}\
            \},\
          \}\
        )\
      );\
    \}\
\
    function showReadingGate() \{\
      if (isAdmin || showingGate) return;\
      const listeningDone = S().get((R().keysFor?.(getActiveTestId())?.listening || R().TESTS.listeningKeys).submitted, "false") === "true";\
      const readingDone = S().get(readingSubmittedKey(), "false") === "true";\
      const writingStarted = S().get((R().keysFor?.(getActiveTestId())?.writing || R().TESTS.writingKeys).started, "false") === "true";\
      if (!listeningDone || !readingDone || writingStarted) return;\
      // If the user already moved to Writing, do not pull them back to Reading.\
      const lastView = S().get(R().KEYS.HOME_LAST_VIEW, "");\
      if (lastView === "writing") return;\
\
\
      showingGate = true;\
      safe(() => UI().showOnly("reading"));\
      safe(() => UI().setExamNavStatus("Status: Reading finished"));\
\
      safe(() =>\
        Modal().showModal(\
          "Reading finished",\
          "Your Reading has been submitted. Click Start Writing to continue.",\
          \{\
            mode: "gate",\
                        submitText: "Start Writing",\
            onConfirm: async () => \{\
              showingGate = false;\
\
              try \{ UI().setExamStarted(true); \} catch (e) \{\}\
              try \{ window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "writing"); \} catch (e) \{\}\
              try \{ UI().showOnly("writing"); \} catch (e) \{\}\
              try \{ UI().setExamNavStatus("Status: Writing in progress"); \} catch (e) \{\}\
\
              try \{\
                try \{ window.__IELTS_WRITING_INIT__ = false; \} catch (e) \{\}\
                await startEngineWhenReady("Writing", "startWritingSystem");\
              \} catch (e) \{\
                try \{ window.alert("Writing failed to start. Please refresh the page and try again."); \} catch (_) \{\}\
              \}\
            \},\
          \}\
        )\
      );\
    \}\
\
    // Event-based (preferred)\
    document.addEventListener("listening:submitted", showListeningGate);\
    document.addEventListener("reading:submitted", showReadingGate);\
\
    // Storage-based fallback polling (in case an event is missed)\
    let lastListen = S().get((R().keysFor?.(getActiveTestId())?.listening || R().TESTS.listeningKeys).submitted, "false");\
    let lastRead = S().get(readingSubmittedKey(), "false");\
    setInterval(() => \{\
      if (isAdmin) return;\
      const curListen = S().get((R().keysFor?.(getActiveTestId())?.listening || R().TESTS.listeningKeys).submitted, "false");\
      const curRead = S().get(readingSubmittedKey(), "false");\
\
      // If changed to true, run gates\
      if (curListen !== lastListen) \{\
        lastListen = curListen;\
        if (curListen === "true") showListeningGate();\
      \}\
      if (curRead !== lastRead) \{\
        lastRead = curRead;\
        if (curRead === "true") showReadingGate();\
      \}\
\
      // Also keep checking in case state was already true (refresh)\
      showListeningGate();\
      showReadingGate();\
    \}, 800);\
\
    // Attach a direct audio ended fallback for listening\
    const aud = document.getElementById("listeningAudio");\
    if (aud && !aud.dataset.gateBound) \{\
      aud.dataset.gateBound = "1";\
      aud.addEventListener("ended", () => \{\
        // Give engine time to set submitted key\
        setTimeout(showListeningGate, 400);\
        setTimeout(showListeningGate, 1200);\
      \});\
    \}\
\
    // -----------------------------\
    // Admin nav buttons (unchanged)\
    // -----------------------------\
    const toHome = $("navToHomeBtn");\
    const toL = $("navToListeningBtn");\
    const toR = $("navToReadingBtn");\
    const toW = $("navToWritingBtn");\
    const resetBtn = $("resetExamBtn");\
\
    if (toHome) \{\
      toHome.onclick = () => \{\
        if (!isAdmin) return;\
        UI().showOnly("home");\
        UI().updateHomeStatusLine();\
        UI().setExamNavStatus("Status: Home");\
      \};\
    \}\
\
    if (toL) \{\
      toL.onclick = () => \{\
        if (!isAdmin) return;\
        UI().setExamStarted(true);\
        resetEngineInitFlags();\
        window.IELTS.Engines.Listening.initListeningSystem();\
        UI().showOnly("listening");\
        UI().setExamNavStatus("Status: Viewing Listening");\
      \};\
    \}\
\
    if (toR) \{\
      toR.onclick = () => \{\
        if (!isAdmin) return;\
        UI().setExamStarted(true);\
        window.__IELTS_READING_INIT__ = false;\
        window.IELTS.Engines.Reading.startReadingSystem();\
        UI().clearReadingLockStyles();\
        UI().showOnly("reading");\
        UI().setExamNavStatus("Status: Viewing Reading");\
      \};\
    \}\
\
    if (toW) \{\
      toW.onclick = () => \{\
        if (!isAdmin) return;\
        const writingStarted = S().get((R().keysFor?.(getActiveTestId())?.writing || R().TESTS.writingKeys).started, "false") === "true";\
        const readingSubmitted = S().get(readingSubmittedKey(), "false") === "true";\
        if (!writingStarted && !readingSubmitted) \{\
          Modal().showModal("Writing locked", "You must submit Reading before opening Writing.", \{ mode: "confirm" \});\
          UI().showOnly("reading");\
          UI().setExamNavStatus("Status: Viewing Reading");\
          return;\
        \}\
        UI().setExamStarted(true);\
        if (!writingStarted) window.IELTS.Engines.Writing.startWritingSystem();\
        else UI().showOnly("writing");\
        UI().setExamNavStatus("Status: Viewing Writing");\
      \};\
    \}\
\
    if (resetBtn) \{\
      resetBtn.onclick = () => \{\
        if (!isAdmin) return;\
        const ok = confirm("Start a new attempt? This will clear saved answers on this browser.");\
        if (!ok) return;\
        UI().setExamStarted(false);\
        UI().resetExamAttempt();\
      \};\
    \}\
\
    // -----------------------------\
    // Admin results dashboard\
    // -----------------------------\
    const adminState = \{ rows: [], filtered: [] \};\
\
    function num(value) \{\
      const n = Number(value);\
      return Number.isFinite(n) ? n : 0;\
    \}\
\
    function fmtDate(value) \{\
      const d = new Date(value || "");\
      if (Number.isNaN(d.getTime())) return "\'97";\
      return d.toLocaleString();\
    \}\
\
    function escapeHtml(value) \{\
      return String(value ?? "")\
        .replace(/&/g, "&amp;")\
        .replace(/</g, "&lt;")\
        .replace(/>/g, "&gt;")\
        .replace(/"/g, "&quot;")\
        .replace(/'/g, "&#39;");\
    \}\
\
    async function fetchAdminResults() \{\
      const endpoint = String(R()?.ADMIN_ENDPOINT || "").trim();\
      if (!endpoint) throw new Error("Admin endpoint is missing.");\
\
      const url = new URL(endpoint);\
      url.searchParams.set("action", "results");\
      url.searchParams.set("adminPasscode", String(R()?.ADMIN_PASSCODE || ""));\
      url.searchParams.set("t", String(Date.now()));\
\
      const res = await fetch(url.toString(), \{ method: "GET" \});\
      const text = await res.text();\
      let data = null;\
      try \{ data = JSON.parse(text); \} catch \{\}\
      if (!res.ok) throw new Error(`HTTP $\{res.status\}`);\
      if (!data || data.ok !== true || !Array.isArray(data.results)) \{\
        throw new Error((data && data.error) || "Could not load admin results.");\
      \}\
      return data.results;\
    \}\
\
    function fillExamFilter(rows) \{\
      const sel = $("adminResultsExamFilter");\
      if (!sel) return;\
      const current = sel.value || "";\
      const exams = Array.from(new Set(rows.map((r) => String(r.examId || "").trim()).filter(Boolean))).sort();\
      sel.innerHTML = '<option value="">All tests</option>' + exams.map((examId) => `<option value="$\{escapeHtml(examId)\}">$\{escapeHtml(examId)\}</option>`).join("");\
      sel.value = exams.includes(current) ? current : "";\
    \}\
\
    function renderSummary(rows) \{\
      const count = rows.length;\
      const avgListening = count ? (rows.reduce((a, r) => a + num(r.listeningBand), 0) / count) : 0;\
      const avgReading = count ? (rows.reduce((a, r) => a + num(r.readingBand), 0) / count) : 0;\
      const latest = rows.slice().sort((a,b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))[0];\
      if ($("adminStatSubmissions")) $("adminStatSubmissions").textContent = String(count);\
      if ($("adminStatListening")) $("adminStatListening").textContent = avgListening.toFixed(1);\
      if ($("adminStatReading")) $("adminStatReading").textContent = avgReading.toFixed(1);\
      if ($("adminStatLatest")) $("adminStatLatest").textContent = latest ? `$\{latest.studentFullName || "(No name)"\} \'b7 $\{fmtDate(latest.submittedAt)\}` : "\'97";\
    \}\
\
    function renderAdminTable(rows) \{\
      adminState.filtered = rows.slice();\
      const tbody = $("adminResultsTbody");\
      const empty = $("adminResultsEmpty");\
      if (!tbody) return;\
      if (!rows.length) \{\
        tbody.innerHTML = "";\
        empty?.classList.remove("hidden");\
        renderSummary([]);\
        return;\
      \}\
      empty?.classList.add("hidden");\
      tbody.innerHTML = rows.map((row, idx) => `\
        <tr>\
          <td>$\{escapeHtml(fmtDate(row.submittedAt))\}</td>\
          <td><strong>$\{escapeHtml(row.studentFullName || "(No name)")\}</strong><br><span class="small">$\{escapeHtml(row.reason || "")\}</span></td>\
          <td>$\{escapeHtml(row.examId || "\'97")\}</td>\
          <td>$\{escapeHtml(String(num(row.listeningTotal)))\} / 40<br><span class="small">Band $\{escapeHtml(String(num(row.listeningBand).toFixed(1)))\}</span></td>\
          <td>$\{escapeHtml(String(num(row.readingTotal)))\} / 40<br><span class="small">Band $\{escapeHtml(String(num(row.readingBand).toFixed(1)))\}</span></td>\
          <td>\
  <td>\
  Writing <br><span class="small">Band $\{escapeHtml(String(row.finalWritingBand || "\'97"))\}</span>\
</td>\
<td>\
  T1: $\{escapeHtml(String(num(row.task1Words)))\}\
  <br>T2: $\{escapeHtml(String(num(row.task2Words)))\}\
</td>\
          <td><div class="admin-row-actions"><button class="btn secondary" type="button" data-admin-view="$\{idx\}">View</button></div></td>\
        </tr>\
      `).join("");\
      renderSummary(rows);\
    \}\
\
    function applyAdminFilters() \{\
      const q = String($("adminResultsSearch")?.value || "").trim().toLowerCase();\
      const examFilter = String($("adminResultsExamFilter")?.value || "").trim();\
      const sortValue = String($("adminResultsSort")?.value || "submittedAt_desc");\
      let rows = adminState.rows.slice();\
\
      if (q) \{\
        rows = rows.filter((row) => \{\
          const hay = [row.studentFullName, row.reason, row.examId].map((x) => String(x || "").toLowerCase()).join(" ");\
          return hay.includes(q);\
        \});\
      \}\
      if (examFilter) rows = rows.filter((row) => String(row.examId || "") === examFilter);\
\
      const [field, dir] = sortValue.split("_");\
      rows.sort((a, b) => \{\
        let av = a[field];\
        let bv = b[field];\
        if (field === "submittedAt") \{\
          av = new Date(av || 0).getTime();\
          bv = new Date(bv || 0).getTime();\
        \} else if (["listeningTotal", "readingTotal"].includes(field)) \{\
          av = num(av);\
          bv = num(bv);\
        \} else \{\
          av = String(av || "").toLowerCase();\
          bv = String(bv || "").toLowerCase();\
        \}\
        if (av < bv) return dir === "desc" ? 1 : -1;\
        if (av > bv) return dir === "desc" ? -1 : 1;\
        return 0;\
      \});\
\
      renderAdminTable(rows);\
    \}\
\
    function renderAdminDetail(row) \{\
  const detail = $("adminResultDetail");\
  if (!detail || !row) return;\
\
  $("adminDetailTitle").textContent = row.studentFullName || "Result details";\
\
  $("adminDetailMeta").innerHTML =\
    `Test: <b>$\{escapeHtml(row.examId || "\'97")\}</b><br>` +\
    `Submitted: <b>$\{escapeHtml(fmtDate(row.submittedAt))\}</b><br>` +\
    `Reason: <b>$\{escapeHtml(row.reason || "\'97")\}</b>`;\
\
  $("adminDetailScores").innerHTML =\
  `Listening: <b>$\{escapeHtml(String(num(row.listeningTotal)))\} / 40</b> ` +\
  `(Band $\{escapeHtml(String(num(row.listeningBand).toFixed(1)))\})<br>` +\
  `Reading: <b>$\{escapeHtml(String(num(row.readingTotal)))\} / 40</b> ` +\
  `(Band $\{escapeHtml(String(num(row.readingBand).toFixed(1)))\})<br>` +\
  `Writing words: <b>$\{escapeHtml(String(num(row.task1Words)))\}</b> / <b>$\{escapeHtml(String(num(row.task2Words)))\}</b><br>` +\
  `Task 1 band: <b>$\{escapeHtml(String(row.task1Band || "\'97"))\}</b><br>` +\
  `Task 2 band: <b>$\{escapeHtml(String(row.task2Band || "\'97"))\}</b><br>` +\
  `Overall writing band: <b>$\{escapeHtml(String(row.finalWritingBand || "\'97"))\}</b>`;\
      \
  const task1EssayEl = $("adminDetailTask1");\
  const task2EssayEl = $("adminDetailTask2");\
\
  if (task1EssayEl) \{\
    task1EssayEl.innerHTML =\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Task 1 Essay</div>` +\
        `<pre>$\{escapeHtml(row.writingTask1 || "")\}</pre>` +\
      `</div>` +\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Task 1 Score Breakdown</div>` +\
        `<pre>$\{escapeHtml(row.task1Breakdown || "\'97")\}</pre>` +\
      `</div>` +\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Task 1 Feedback</div>` +\
        `<pre>$\{escapeHtml(row.task1Feedback || "\'97")\}</pre>` +\
      `</div>`;\
  \}\
\
  if (task2EssayEl) \{\
    task2EssayEl.innerHTML =\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Task 2 Essay</div>` +\
        `<pre>$\{escapeHtml(row.writingTask2 || "")\}</pre>` +\
      `</div>` +\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Task 2 Score Breakdown</div>` +\
        `<pre>$\{escapeHtml(row.task2Breakdown || "\'97")\}</pre>` +\
      `</div>` +\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Task 2 Feedback</div>` +\
        `<pre>$\{escapeHtml(row.task2Feedback || "\'97")\}</pre>` +\
      `</div>` +\
      `<div class="admin-detail-block">` +\
        `<div class="admin-detail-label">Overall Writing Feedback</div>` +\
        `<pre>$\{escapeHtml(row.overallFeedback || "\'97")\}</pre>` +\
      `</div>`;\
  \}\
\
  detail.classList.remove("hidden");\
\}\
    \
\
    async function openAdminResultsView() \{\
      if (!isAdmin) return;\
      UI().showOnly("adminResults");\
      UI().setExamNavStatus("Status: Admin results");\
      try \{ window.IELTS?.Router?.setHashRoute?.(getActiveTestId(), "results"); \} catch (e) \{\}\
      const tbody = $("adminResultsTbody");\
      if (tbody) tbody.innerHTML = '<tr><td colspan="8">Loading results...</td></tr>';\
      try \{\
        const rows = await fetchAdminResults();\
        adminState.rows = rows;\
        fillExamFilter(rows);\
        applyAdminFilters();\
      \} catch (e) \{\
        if (tbody) tbody.innerHTML = `<tr><td colspan="8">$\{escapeHtml(e.message || "Could not load results.")\}</td></tr>`;\
        renderSummary([]);\
      \}\
    \}\
\
    function exportAdminRowsCsv() \{\
      if (!isAdmin || !adminState.filtered.length) return;\
      const headers = ["submittedAt","studentFullName","examId","reason","listeningTotal","listeningBand","readingTotal","readingBand","task1Words","task2Words"];\
      const lines = [headers.join(",")].concat(\
        adminState.filtered.map((row) =>\
          headers\
            .map((key) => `"$\{String(row[key] ?? "").replace(/"/g, '""')\}"`)\
            .join(",")\
        )\
      );\
      const blob = new Blob([lines.join("\\n")], \{ type: "text/csv;charset=utf-8" \});\
      const a = document.createElement("a");\
      a.href = URL.createObjectURL(blob);\
      a.download = "ielts-results.csv";\
      document.body.appendChild(a);\
      a.click();\
      setTimeout(() => \{\
        URL.revokeObjectURL(a.href);\
        a.remove();\
      \}, 0);\
    \}\
\
    // -----------------------------\
    // Hash route support (ADMIN ONLY)\
    // -----------------------------\
    const route = Router().parseHashRoute();\
    if (route && route.testId) \{ try \{ setActiveTestId(route.testId); \} catch (e) \{\} \}\
    if (isAdmin && route && route.view) \{\
      if (route.view === "listening") \{\
        UI().setExamStarted(true);\
        window.IELTS.Engines.Listening.initListeningSystem();\
        UI().showOnly("listening");\
        UI().setExamNavStatus("Status: Listening in progress");\
        return;\
      \}\
      if (route.view === "reading") \{\
        UI().setExamStarted(true);\
        window.__IELTS_READING_INIT__ = false;\
        window.IELTS.Engines.Reading.startReadingSystem();\
        UI().showOnly("reading");\
        UI().setExamNavStatus("Status: Viewing Reading");\
        return;\
      \}\
      if (route.view === "writing") \{\
        UI().setExamStarted(true);\
        window.__IELTS_WRITING_INIT__ = false;\
        window.IELTS.Engines.Writing.startWritingSystem();\
        UI().showOnly("writing");\
        UI().setExamNavStatus("Status: Viewing Writing");\
        return;\
      \}\
      if (route.view === "results") \{\
        openAdminResultsView();\
        return;\
      \}\
      if (route.view === "home") \{\
        UI().showOnly("home");\
        UI().updateHomeStatusLine();\
        UI().setExamNavStatus("Status: Home");\
        return;\
      \}\
    \}\
\
    // -----------------------------\
    // Default to home\
    // -----------------------------\
    UI().showOnly("home");\
    UI().updateHomeStatusLine();\
\
    // -----------------------------\
    // Home buttons: START ALWAYS = NEW ATTEMPT\
    // -----------------------------\
    const startBtn = $("startIelts1Btn");\
    const startBtn2 = $("cardStartIelts1Btn");\
    const startBtnT2 = $("startIelts2Btn");\
    const startBtnT2b = $("cardStartIelts2Btn");\
    const contBtn = $("homeContinueBtn");\
    const adminResultsBtn = $("homeAdminResultsBtn");\
    const navResultsBtn = $("navToResultsBtn");\
    const adminRefreshBtn = $("adminResultsRefreshBtn");\
    const adminExportBtn = $("adminResultsExportBtn");\
\
    \
    // -----------------------------\
    // -----------------------------\
// Student password gate (does NOT affect admin view)\
// -----------------------------\
function requireTestPassword(onOk) \{\
  if (isAdmin) \{ onOk(); return; \}\
\
  // Always ask in student view (no "remember" unlock),\
  // so every click on Start Exam requires the password.\
  window.IELTS?.Modal?.showModal?.(\
    "Enter password",\
    "This test is password-protected. Please enter the password to start.",\
    \{\
      mode: "password",\
      submitText: "Start exam",\
      onConfirm: () => \{\
        onOk();\
      \},\
    \}\
  );\
\}\
\
\
\
\
    function resetEngineInitFlags() \{\
      try \{ window.__IELTS_LISTENING_INIT__ = false; \} catch \{\}\
      try \{ window.__IELTS_READING_INIT__ = false; \} catch \{\}\
      try \{ window.__IELTS_WRITING_INIT__ = false; \} catch \{\}\
    \}\
\
function startFreshExam() \{\
      resetEngineInitFlags();\
      clearAllStudentAttemptKeys();\
      safe(() => Modal().hideModal());\
\
      safe(() => UI().setExamStarted(true));\
      safe(() => window.IELTS.Engines.Listening.initListeningSystem());\
      safe(() => UI().showOnly("listening"));\
      safe(() => UI().setExamNavStatus("Status: Listening in progress"));\
      safe(() => window.IELTS?.Router?.setHashRoute?.((window.IELTS?.Registry?.getActiveTestId?.() || "ielts1"), "listening"));\
\
      // if audio already bound, ensure fallback ended listener exists\
      const a = document.getElementById("listeningAudio");\
      if (a && !a.dataset.gateBound) \{\
        a.dataset.gateBound = "1";\
        a.addEventListener("ended", () => \{\
          setTimeout(showListeningGate, 400);\
          setTimeout(showListeningGate, 1200);\
        \});\
      \}\
    \}\
\
    if (startBtn) startBtn.onclick = () => requireTestPassword(() => \{ window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); \});\
    if (startBtn2) startBtn2.onclick = () => requireTestPassword(() => \{ window.IELTS.Registry.setActiveTestId("ielts1"); startFreshExam(); \});\
    if (startBtnT2) startBtnT2.onclick = () => requireTestPassword(() => \{ window.IELTS.Registry.setActiveTestId("ielts2"); startFreshExam(); \});\
    if (startBtnT2b) startBtnT2b.onclick = () => requireTestPassword(() => \{ window.IELTS.Registry.setActiveTestId("ielts2"); startFreshExam(); \});\
    if (contBtn) contBtn.onclick = () => requireTestPassword(startFreshExam);\
    if (adminResultsBtn) adminResultsBtn.onclick = () => openAdminResultsView();\
    if (navResultsBtn) navResultsBtn.onclick = () => openAdminResultsView();\
    if (adminRefreshBtn) adminRefreshBtn.onclick = () => openAdminResultsView();\
    if (adminExportBtn) adminExportBtn.onclick = () => exportAdminRowsCsv();\
    $("adminResultsSearch")?.addEventListener("input", applyAdminFilters);\
    $("adminResultsExamFilter")?.addEventListener("change", applyAdminFilters);\
    $("adminResultsSort")?.addEventListener("change", applyAdminFilters);\
    $("adminDetailCloseBtn")?.addEventListener("click", () => $("adminResultDetail")?.classList.add("hidden"));\
    $("adminResultsTbody")?.addEventListener("click", (e) => \{\
      const btn = e.target?.closest?.("[data-admin-view]");\
      if (!btn) return;\
      const idx = Number(btn.getAttribute("data-admin-view"));\
      const row = adminState.filtered[idx];\
      if (row) renderAdminDetail(row);\
    \});\
\
    // If student refreshes after Listening is already submitted, show gate (not auto-reading)\
    if (!isAdmin) \{\
      showListeningGate();\
      showReadingGate();\
    \}\
  \});\
\})();\
}
