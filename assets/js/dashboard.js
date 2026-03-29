(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  const UI = () => window.IELTS?.UI;
  const Auth = () => window.IELTS?.Auth;
  const History = () => window.IELTS?.History;
  const Router = () => window.IELTS?.Router;
  const Registry = () => window.IELTS?.Registry;

  const DEFAULT_SETTINGS = {
    preferredName: "",
    targetBand: "",
    focusSkill: "",
    preferredTest: "ielts1",
    dailyGoal: "30",
    studyNote: "",
    fontScale: "medium",
  };

  const state = {
    rows: [],
    settings: { ...DEFAULT_SETTINGS },
  };

  function getUser() {
    return Auth()?.getSavedUser?.() || null;
  }

  function getSettingsKey() {
    const user = getUser();
    return `IELTS:DASHBOARD:${user?.id || "guest"}:settings`;
  }

  function readSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(getSettingsKey()) || "null") || {};
      return { ...DEFAULT_SETTINGS, ...raw };
    } catch (e) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(next) {
    state.settings = { ...DEFAULT_SETTINGS, ...next };
    try {
      localStorage.setItem(getSettingsKey(), JSON.stringify(state.settings));
    } catch (e) {}
    renderProfile();
    renderSummary();
    const status = $("dashboardSettingsStatus");
    if (status) status.textContent = "Settings saved for this student account.";
  }

  function initialsFor(name, email) {
    const source = String(name || email || "Student").trim();
    const parts = source.split(/\s+/).filter(Boolean);
    if (!parts.length) return "S";
    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  }

  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function examLabel(row) {
    const examId = String(row?.exam_id || row?.active_test_id || "");
    const m = examId.match(/(\d+)/);
    return m ? `IELTS Test ${Number(m[1])}` : (examId || "IELTS Test");
  }

  function average(rows, key) {
    const nums = (rows || [])
      .map((row) => Number(row?.[key]))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!nums.length) return "0.0";
    return (nums.reduce((sum, value) => sum + value, 0) / nums.length).toFixed(1);
  }

  function totalWords(row) {
    return Number(row?.task1_words || 0) + Number(row?.task2_words || 0);
  }

  async function loadRows() {
    if (typeof History()?.loadRows === "function") {
      return await History().loadRows();
    }
    return [];
  }

  function renderProfile() {
    const user = getUser();
    const avatar = $("dashboardAvatar");
    const preferredName = String(state.settings.preferredName || "").trim();
    const displayName = preferredName || user?.name || user?.email?.split("@")[0] || "Student";
    const provider = String(user?.provider || "email").trim();
    const providerLabel = provider === "google"
      ? "Google account"
      : provider === "azure"
        ? "Microsoft account"
        : provider
          ? `${provider} account`
          : "Secure account";

    if ($("dashboardName")) $("dashboardName").textContent = displayName;
    if ($("dashboardEmail")) $("dashboardEmail").textContent = user?.email || "Signed-in account";
    if ($("dashboardProvider")) $("dashboardProvider").textContent = providerLabel;
    if ($("dashboardWelcomeTitle")) $("dashboardWelcomeTitle").textContent = `Welcome back, ${displayName}.`;
    if ($("dashboardWelcomeCopy")) {
      const target = state.settings.targetBand ? ` Your current target is Band ${state.settings.targetBand}.` : "";
      $("dashboardWelcomeCopy").textContent = `Use your dashboard to keep your study preferences, track progress, and jump into the right next practice mode.${target}`;
    }

    if (avatar) {
      if (user?.avatarUrl) {
        avatar.textContent = "";
        avatar.style.backgroundImage = `linear-gradient(135deg, rgba(23,50,77,.18), rgba(196,69,54,.22)), url(${JSON.stringify(user.avatarUrl).slice(1, -1)})`;
      } else {
        avatar.textContent = initialsFor(displayName, user?.email);
        avatar.style.backgroundImage = "";
      }
    }

    if ($("dashboardMemberSince")) $("dashboardMemberSince").textContent = `Member since ${formatDate(user?.createdAt)}`;
    const latestActivity = state.rows[0]?.submitted_at || user?.lastSignInAt || "";
    if ($("dashboardLastActive")) $("dashboardLastActive").textContent = `Last activity ${formatDate(latestActivity)}`;
  }

  function renderSettings() {
    const settings = state.settings;
    const pairs = [
      ["dashboardPreferredName", settings.preferredName],
      ["dashboardTargetBand", settings.targetBand],
      ["dashboardFocusSkill", settings.focusSkill],
      ["dashboardPreferredTest", settings.preferredTest],
      ["dashboardDailyGoal", settings.dailyGoal],
      ["dashboardStudyNote", settings.studyNote],
      ["dashboardFontSizeSelect", settings.fontScale],
    ];

    pairs.forEach(([id, value]) => {
      const el = $(id);
      if (!el) return;
      el.value = value == null ? "" : String(value);
    });
  }

  function renderSummary() {
    const rows = state.rows;
    const latest = rows[0];
    const setText = (id, value) => { const el = $(id); if (el) el.textContent = String(value); };
    setText("dashboardStatTests", rows.length);
    setText("dashboardStatListening", average(rows, "listening_band"));
    setText("dashboardStatReading", average(rows, "reading_band"));
    setText("dashboardStatWriting", average(rows, "final_writing_band"));

    const recommendation = $("dashboardRecommendation");
    if (!recommendation) return;
    if (!rows.length) {
      recommendation.textContent = "Recommendation: start your first mock exam to build a baseline for the dashboard.";
      return;
    }
    const focus = state.settings.focusSkill || "balanced prep";
    const nextTest = state.settings.preferredTest ? state.settings.preferredTest.replace("ielts", "IELTS Test ") : examLabel(latest);
    const latestWords = totalWords(latest);
    recommendation.textContent = `Recommendation: continue with ${nextTest}, keep your ${focus} focus active, and compare against your latest writing total of ${latestWords} words.`;
  }

  function renderActivity() {
    const list = $("dashboardActivityList");
    const empty = $("dashboardActivityEmpty");
    if (!list || !empty) return;
    const rows = state.rows.slice(0, 5);
    if (!rows.length) {
      list.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    list.innerHTML = rows.map((row) => {
      const writing = row.final_writing_band ? `Band ${row.final_writing_band}` : "Pending";
      const listening = row.listening_band ? `Band ${row.listening_band}` : "Saved";
      const reading = row.reading_band ? `Band ${row.reading_band}` : "Saved";
      return `
        <div class="dashboard-activity-item">
          <strong>${examLabel(row)} · ${formatDate(row.submitted_at)}</strong>
          <span>Listening: ${listening} · Reading: ${reading} · Writing: ${writing}</span>
          <span>${row.student_full_name || getUser()?.name || getUser()?.email || "Student"}</span>
        </div>
      `;
    }).join("");
  }

  function syncFontSelectors(value) {
    const next = value || state.settings.fontScale || "medium";
    const homeSelect = $("fontSizeSelect");
    if (homeSelect && homeSelect.value !== next) {
      homeSelect.value = next;
      homeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const dashboardSelect = $("dashboardFontSizeSelect");
    if (dashboardSelect && dashboardSelect.value !== next) {
      dashboardSelect.value = next;
    }
  }

  function bindSettings() {
    const mappings = {
      dashboardPreferredName: "preferredName",
      dashboardTargetBand: "targetBand",
      dashboardFocusSkill: "focusSkill",
      dashboardPreferredTest: "preferredTest",
      dashboardDailyGoal: "dailyGoal",
      dashboardStudyNote: "studyNote",
      dashboardFontSizeSelect: "fontScale",
    };

    Object.entries(mappings).forEach(([id, key]) => {
      const el = $(id);
      if (!el || el.dataset.bound === "1") return;
      el.dataset.bound = "1";
      const eventName = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(eventName, () => {
        const next = { ...state.settings, [key]: el.value };
        saveSettings(next);
        if (key === "fontScale") syncFontSelectors(el.value);
      });
    });
  }

  async function render() {
    state.settings = readSettings();
    renderSettings();
    syncFontSelectors(state.settings.fontScale);
    renderProfile();

    try {
      state.rows = await loadRows();
    } catch (e) {
      console.error("Dashboard load failed:", e);
      state.rows = [];
    }

    renderProfile();
    renderSummary();
    renderActivity();
  }

  async function openDashboard() {
    const user = getUser();
    if (!user?.id) return;
    UI()?.showOnly?.("dashboard");
    try {
      const testId = Registry()?.getActiveTestId?.() || Registry()?.TESTS?.defaultTestId || "ielts1";
      Router()?.setHashRoute?.(testId, "dashboard");
    } catch (e) {}
    const status = $("dashboardSettingsStatus");
    if (status) status.textContent = "Loading your student dashboard...";
    await render();
    if (status) status.textContent = "Settings save automatically for this student account.";
  }

  function closeDashboard() {
    UI()?.showOnly?.("home");
    UI()?.updateHomeStatusLine?.("Status: Signed in");
    try {
      const testId = Registry()?.getActiveTestId?.() || Registry()?.TESTS?.defaultTestId || "ielts1";
      Router()?.setHashRoute?.(testId, "home");
    } catch (e) {}
  }

  function startPreferredTest() {
    const testId = state.settings.preferredTest || "ielts1";
    try { Registry()?.setActiveTestId?.(testId); } catch (e) {}
    const btnId = testId === "ielts2"
      ? "startIelts2Btn"
      : testId === "ielts3"
        ? "startIelts3Btn"
        : "startIelts1Btn";
    $(btnId)?.click?.();
  }

  function init() {
    bindSettings();
    $("dashboardRefreshBtn")?.addEventListener("click", openDashboard);
    $("dashboardBackBtn")?.addEventListener("click", closeDashboard);
    $("dashboardOpenHistoryBtn")?.addEventListener("click", () => $("openHistoryBtn")?.click?.());
    $("dashboardOpenSpeakingBtn")?.addEventListener("click", () => $("openSpeakingExamBtn")?.click?.());
    $("dashboardStartPreferredBtn")?.addEventListener("click", startPreferredTest);

    window.addEventListener("ielts:authchanged", () => {
      if (!$("dashboardSection")?.classList.contains("hidden")) {
        openDashboard();
      }
    });
    window.addEventListener("ielts:fontscalechange", (event) => {
      const next = event?.detail?.value || "medium";
      state.settings = { ...state.settings, fontScale: next };
      try { localStorage.setItem(getSettingsKey(), JSON.stringify(state.settings)); } catch (e) {}
      renderSettings();
    });
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Dashboard = {
    open: openDashboard,
    close: closeDashboard,
    refresh: render,
  };

  document.addEventListener("partials:loaded", init, { once: true });
})();
