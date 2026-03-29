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
  const Speaking = () => window.IELTS?.Speaking;

  const DEFAULT_SETTINGS = {
    preferredName: "",
    targetBand: "",
    focusSkill: "",
    preferredTest: "ielts1",
    dailyGoal: "30",
    studyNote: "",
    bio: "",
    fontScale: "medium",
  };

  const state = {
    rows: [],
    settings: { ...DEFAULT_SETTINGS },
    activeTab: "overview",
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

  function averageNumber(rows, key) {
    const nums = (rows || [])
      .map((row) => Number(row?.[key]))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!nums.length) return 0;
    return nums.reduce((sum, value) => sum + value, 0) / nums.length;
  }

  function computeStreak(rows) {
    const keys = Array.from(new Set((rows || [])
      .map((row) => {
        const value = row?.submitted_at;
        if (!value) return null;
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      })
      .filter(Boolean)))
      .sort((a, b) => b - a);

    if (!keys.length) return 0;
    let streak = 1;
    for (let i = 1; i < keys.length; i += 1) {
      const diffDays = Math.round((keys[i - 1] - keys[i]) / 86400000);
      if (diffDays === 1) streak += 1;
      else break;
    }
    return streak;
  }

  function examDisplayName(testId) {
    const value = String(testId || "ielts1");
    return value.replace("ielts", "IELTS Test ");
  }

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = String(value);
  }

  function setAvatar(el, displayName, email, avatarUrl) {
    if (!el) return;
    if (avatarUrl) {
      el.textContent = "";
      el.style.backgroundImage = `linear-gradient(135deg, rgba(23,50,77,.18), rgba(196,69,54,.22)), url(${JSON.stringify(avatarUrl).slice(1, -1)})`;
    } else {
      el.textContent = initialsFor(displayName, email);
      el.style.backgroundImage = "";
    }
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
    const homeAvatar = $("homeAccountAvatar");
    const preferredName = String(state.settings.preferredName || "").trim();
    const displayName = preferredName || user?.name || user?.email?.split("@")[0] || "Student";
    const focusSkill = String(state.settings.focusSkill || "").trim();
    const targetBand = String(state.settings.targetBand || "").trim();
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
    setText("homeAccountName", displayName);
    if ($("dashboardWelcomeTitle")) $("dashboardWelcomeTitle").textContent = `Welcome back, ${displayName}.`;
    if ($("dashboardIdentityName")) $("dashboardIdentityName").textContent = displayName;
    if ($("dashboardIdentityFocus")) {
      $("dashboardIdentityFocus").textContent = focusSkill
        ? focusSkill.charAt(0).toUpperCase() + focusSkill.slice(1)
        : "Balanced prep";
    }
    if ($("dashboardIdentityTarget")) {
      $("dashboardIdentityTarget").textContent = targetBand ? `Band ${targetBand}` : "Set your target";
    }
    setText("dashboardBio", state.settings.bio || "Add a short study bio so this profile feels more personal and easier to return to.");
    if ($("dashboardWelcomeCopy")) {
      const target = targetBand ? ` Your current target is Band ${targetBand}.` : "";
      $("dashboardWelcomeCopy").textContent = `Use your dashboard to keep your study preferences, track progress, and jump into the right next practice mode.${target}`;
    }

    setAvatar(avatar, displayName, user?.email, user?.avatarUrl);
    setAvatar(homeAvatar, displayName, user?.email, user?.avatarUrl);

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
      ["dashboardBioInput", settings.bio],
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

  function renderGoals() {
    const rows = state.rows;
    const latest = rows[0];
    const targetBand = Number(state.settings.targetBand || 0);
    const currentAverage = Math.max(
      averageNumber(rows, "listening_band"),
      averageNumber(rows, "reading_band"),
      averageNumber(rows, "final_writing_band")
    );
    const gap = targetBand > 0 && currentAverage > 0
      ? Math.max(0, targetBand - currentAverage).toFixed(1)
      : "";
    const focus = state.settings.focusSkill
      ? state.settings.focusSkill.charAt(0).toUpperCase() + state.settings.focusSkill.slice(1)
      : "Balanced prep";
    const dailyGoal = `${state.settings.dailyGoal || "30"} minutes`;
    const latestWords = latest ? totalWords(latest) : 0;
    const streak = computeStreak(rows);

    setText("dashboardGoalTarget", targetBand ? `Band ${targetBand.toFixed(1)}` : "Not set");
    setText("dashboardGoalGap", gap ? `${gap} band to go` : "Set a target to track progress.");
    setText("dashboardGoalStreak", `${streak} ${streak === 1 ? "day" : "days"}`);
    setText("dashboardGoalExam", examDisplayName(state.settings.preferredTest));
    setText("dashboardGoalFocus", focus);
    setText("dashboardGoalDaily", dailyGoal);
    setText("dashboardGoalDailyStatus", rows.length ? "Your rhythm is saved per student profile." : "Build a daily routine by completing your first test.");

    setText("dashboardGoalsAverage", currentAverage ? currentAverage.toFixed(1) : "0.0");
    setText("dashboardGoalsAverageDetail", currentAverage ? "Best current average across scored sections." : "Your strongest score will appear here.");
    setText("dashboardGoalsGap", gap ? `${gap} band` : "—");
    setText("dashboardGoalsGapDetail", gap ? `You are ${gap} band away from your target.` : "Choose a target band to measure progress.");
    setText("dashboardGoalsAction", rows.length ? `Push ${focus}` : "Start a new mock");
    setText("dashboardGoalsActionDetail", rows.length ? `Use ${examDisplayName(state.settings.preferredTest)} as your next benchmark.` : "The dashboard will refine this as your history grows.");
    setText("dashboardGoalsWords", `${latestWords} words`);
    setText("dashboardGoalsWordsDetail", latestWords ? "Latest completed writing total." : "Latest completed writing total.");
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
      dashboardBioInput: "bio",
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
    renderGoals();
    renderActivity();
    setActiveTab(state.activeTab || "overview");
  }

  function setActiveTab(tab) {
    state.activeTab = tab || "overview";
    Array.from(document.querySelectorAll("[data-dashboard-tab]")).forEach((button) => {
      const isActive = button.getAttribute("data-dashboard-tab") === state.activeTab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    Array.from(document.querySelectorAll("[data-dashboard-panel]")).forEach((panel) => {
      const isActive = panel.getAttribute("data-dashboard-panel") === state.activeTab;
      panel.classList.toggle("hidden", !isActive);
    });
  }

  async function openDashboard(tab) {
    const user = getUser();
    if (!user?.id) return;
    if (tab) state.activeTab = tab;
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

  function openHistoryView() {
    try {
      if (typeof History()?.openHistory === "function") {
        History().openHistory();
        return;
      }
    } catch (e) {}
    $("openHistoryBtn")?.click?.();
  }

  function openSpeakingView() {
    try {
      if (typeof Speaking()?.initSpeakingExam === "function") {
        Speaking().initSpeakingExam();
      }
      UI()?.showOnly?.("speaking");
      UI()?.setExamNavStatus?.("Status: Speaking practice");
      return;
    } catch (e) {}
    $("openSpeakingExamBtn")?.click?.();
  }

  function init() {
    bindSettings();
    Array.from(document.querySelectorAll("[data-dashboard-tab]")).forEach((button) => {
      if (button.dataset.bound === "1") return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => setActiveTab(button.getAttribute("data-dashboard-tab")));
    });
    $("dashboardRefreshBtn")?.addEventListener("click", openDashboard);
    $("dashboardBackBtn")?.addEventListener("click", closeDashboard);
    $("dashboardOpenHistoryBtn")?.addEventListener("click", openHistoryView);
    $("dashboardOpenSpeakingBtn")?.addEventListener("click", openSpeakingView);
    $("dashboardStartPreferredBtn")?.addEventListener("click", startPreferredTest);

    window.addEventListener("ielts:authchanged", () => {
      renderProfile();
      if (!$("dashboardSection")?.classList.contains("hidden")) {
        openDashboard();
      }
    });
    window.addEventListener("ielts:fontscalechange", (event) => {
      const next = event?.detail?.value || "medium";
      state.settings = { ...state.settings, fontScale: next };
      try { localStorage.setItem(getSettingsKey(), JSON.stringify(state.settings)); } catch (e) {}
      renderSettings();
      renderProfile();
    });
    renderProfile();
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Dashboard = {
    open: openDashboard,
    openTab: openDashboard,
    close: closeDashboard,
    refresh: render,
  };

  document.addEventListener("partials:loaded", init, { once: true });
})();
