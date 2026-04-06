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
    username: "",
    preferredName: "",
    headline: "",
    avatarUrl: "",
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
    syncTimer: null,
  };

  function getUser() {
    return Auth()?.getSavedUser?.() || null;
  }

  function getSettingsKey() {
    const user = getUser();
    const identityKey = Auth()?.getIdentityKey?.() || user?.identityKey || user?.email || user?.id || "guest";
    return `IELTS:DASHBOARD:${String(identityKey).trim().toLowerCase()}:settings`;
  }

  function getRemoteSettings() {
    const user = getUser();
    return { ...DEFAULT_SETTINGS, ...(user?.profile || {}) };
  }

  function readSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(getSettingsKey()) || "null") || {};
      return { ...DEFAULT_SETTINGS, ...raw, ...getRemoteSettings() };
    } catch (e) {
      return getRemoteSettings();
    }
  }

  function setStatus(text) {
    const status = $("dashboardSettingsStatus");
    if (status) status.textContent = text || "";
  }

  function toMetadataPatch(settings) {
    return {
      username: String(settings.username || "").trim(),
      preferred_name: String(settings.preferredName || "").trim(),
      profile_headline: String(settings.headline || "").trim(),
      profile_bio: String(settings.bio || "").trim(),
      profile_avatar_url: String(settings.avatarUrl || "").trim(),
      target_band: String(settings.targetBand || "").trim(),
      focus_skill: String(settings.focusSkill || "").trim(),
      preferred_test: String(settings.preferredTest || "").trim(),
      daily_goal: String(settings.dailyGoal || "").trim(),
      study_note: String(settings.studyNote || "").trim(),
      font_scale: String(settings.fontScale || "").trim(),
    };
  }

  async function syncSettingsToProfile(nextSettings) {
    if (typeof Auth()?.updateProfileMetadata !== "function") return;
    try {
      setStatus("Saving to your student profile...");
      await Auth().updateProfileMetadata(toMetadataPatch(nextSettings));
      setStatus("Saved to your student profile across devices.");
    } catch (e) {
      console.error("Dashboard profile sync failed:", e);
      setStatus("Saved on this device, but profile sync did not finish.");
    }
  }

  function queueProfileSync(nextSettings) {
    if (state.syncTimer) clearTimeout(state.syncTimer);
    state.syncTimer = setTimeout(() => {
      syncSettingsToProfile(nextSettings);
    }, 450);
  }

  function saveSettings(next, options) {
    const shouldSync = options?.sync !== false;
    state.settings = { ...DEFAULT_SETTINGS, ...next };
    try {
      localStorage.setItem(getSettingsKey(), JSON.stringify(state.settings));
    } catch (e) {}
    renderProfile();
    renderSummary();
    renderAnalytics();
    renderGoals();
    if (shouldSync) {
      setStatus("Saving to your student profile...");
      queueProfileSync(state.settings);
    } else {
      setStatus("Settings loaded from your student profile.");
    }
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

  function round1(value) {
    return Math.round(Number(value || 0) * 10) / 10;
  }

  function scoreSeries(rows, key) {
    return (rows || [])
      .slice()
      .reverse()
      .map((row, index) => ({
        x: index,
        label: examLabel(row),
        value: round1(row?.[key]),
      }))
      .filter((point) => Number.isFinite(point.value) && point.value > 0);
  }

  function skillAverages(rows) {
    return [
      { label: "Listening", value: averageNumber(rows, "listening_band") },
      { label: "Reading", value: averageNumber(rows, "reading_band") },
      { label: "Writing", value: averageNumber(rows, "final_writing_band") },
    ].filter((item) => item.value > 0);
  }

  function buildLinePath(points, width, height, minY, maxY, padding) {
    if (!points.length) return "";
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;
    const denomX = Math.max(1, points.length - 1);
    const denomY = Math.max(0.1, maxY - minY);

    return points.map((point, index) => {
      const x = padding.left + (usableWidth * (index / denomX));
      const y = padding.top + usableHeight - (((point.value - minY) / denomY) * usableHeight);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }

  function latestNonZero(rows, key) {
    for (let i = 0; i < (rows || []).length; i += 1) {
      const value = Number(rows[i]?.[key]);
      if (Number.isFinite(value) && value > 0) return value;
    }
    return 0;
  }

  function buildRecommendation(rows) {
    if (!rows.length) {
      return {
        summary: "Recommendation: start your first mock exam to build a baseline for the dashboard.",
        action: "Start a new mock",
        detail: "The dashboard will refine this as your history grows.",
      };
    }

    const preferredExam = examDisplayName(state.settings.preferredTest);
    const targetBand = Number(state.settings.targetBand || 0);
    const averages = skillAverages(rows).sort((a, b) => a.value - b.value);
    const weakest = averages[0] || null;
    const strongest = averages[averages.length - 1] || null;
    const latestListening = latestNonZero(rows, "listening_band");
    const latestReading = latestNonZero(rows, "reading_band");
    const latestWriting = latestNonZero(rows, "final_writing_band");
    const latestBest = Math.max(latestListening, latestReading, latestWriting);
    const gap = targetBand > 0 && latestBest > 0 ? round1(targetBand - latestBest) : 0;
    const latest = rows[0];
    const latestWords = latest ? totalWords(latest) : 0;

    if (gap > 0.7 && weakest) {
      return {
        summary: `Recommendation: prioritize ${weakest.label.toLowerCase()} this week, then use ${preferredExam} as your next benchmark.`,
        action: `Lift ${weakest.label}`,
        detail: `You are about ${gap.toFixed(1)} band away from your target. Bring ${weakest.label.toLowerCase()} closer to your strongest section before your next full mock.`,
      };
    }

    if (weakest && strongest && strongest.value - weakest.value >= 1) {
      return {
        summary: `Recommendation: rebalance your scores by drilling ${weakest.label.toLowerCase()} before taking another full exam.`,
        action: `Rebalance ${weakest.label}`,
        detail: `${weakest.label} is trailing ${strongest.label} by ${round1(strongest.value - weakest.value).toFixed(1)} band. A focused review there should have the biggest payoff.`,
      };
    }

    if (latestWords > 0 && latestWords < 420) {
      return {
        summary: `Recommendation: keep writing practice active and push your response volume before the next scored attempt.`,
        action: "Expand writing output",
        detail: `Your latest writing total was ${latestWords} words. Aim for a fuller Task 2 response, then check the impact in ${preferredExam}.`,
      };
    }

    return {
      summary: `Recommendation: take another full mock in ${preferredExam} and keep your strongest momentum moving.`,
      action: "Run a full benchmark",
      detail: `Your recent scores are stable enough for another timed benchmark. The next completed mock will sharpen your trend line and target progress.`,
    };
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

  function updateAvatarControls() {
    const hasAvatar = !!String(state.settings.avatarUrl || "").trim();
    $("dashboardRemoveAvatarBtn")?.classList.toggle("hidden", !hasAvatar);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load that image."));
      img.src = src;
    });
  }

  async function toAvatarDataUrl(file) {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await loadImage(objectUrl);
      const size = 192;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Avatar processing is not available in this browser.");

      const sourceSize = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
      const sx = Math.max(0, ((img.naturalWidth || img.width) - sourceSize) / 2);
      const sy = Math.max(0, ((img.naturalHeight || img.height) - sourceSize) / 2);

      ctx.drawImage(
        img,
        sx,
        sy,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size
      );

      let dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      if (dataUrl.length > 140000) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.68);
      }
      return dataUrl;
    } finally {
      URL.revokeObjectURL(objectUrl);
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
    const username = String(state.settings.username || "").trim().replace(/^@+/, "");
    const preferredName = String(state.settings.preferredName || "").trim();
    const headline = String(state.settings.headline || "").trim();
    const signedIn = !!(user && user.id);
    const displayName = preferredName || user?.name || user?.email?.split("@")[0] || "Student";
    const focusSkill = String(state.settings.focusSkill || "").trim();
    const targetBand = String(state.settings.targetBand || "").trim();
    const provider = String(user?.provider || "email").trim();
    const avatarUrl = String(state.settings.avatarUrl || user?.avatarUrl || "").trim();
    const providerLabel = provider === "google"
      ? "Google account"
      : provider === "azure"
        ? "Microsoft account"
        : provider === "shared-password"
          ? "Student account"
        : provider
          ? `${provider} account`
          : "Secure account";

    if ($("dashboardName")) $("dashboardName").textContent = displayName;
    setText("dashboardUsernameDisplay", username ? `@${username}` : `@${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "student"}`);
    if ($("dashboardEmail")) $("dashboardEmail").textContent = user?.email || "Signed-in account";
    if ($("dashboardProvider")) $("dashboardProvider").textContent = providerLabel;
    setText("dashboardHeadline", headline || "Focused on steady IELTS progress.");
    setText("homeAccountName", signedIn ? displayName : "Log In");
    setText("homeAccountLabel", signedIn ? (username ? `@${username}` : "Student access") : "Student access");
    $("homeAccountLabel")?.classList?.toggle("is-username", signedIn && !!username);
    $("openDashboardBtn")?.classList?.toggle("is-login", !signedIn);
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

    setAvatar(avatar, displayName, user?.email, avatarUrl);
    setAvatar(homeAvatar, signedIn ? displayName : "Log In", user?.email, avatarUrl);
    setAvatar($("dashboardAvatarSettingsPreview"), displayName, user?.email, avatarUrl);
    updateAvatarControls();

    if ($("dashboardMemberSince")) $("dashboardMemberSince").textContent = `Member since ${formatDate(user?.createdAt)}`;
    const latestActivity = state.rows[0]?.submitted_at || user?.lastSignInAt || "";
    if ($("dashboardLastActive")) $("dashboardLastActive").textContent = `Last activity ${formatDate(latestActivity)}`;
  }

  function renderSettings() {
    const settings = state.settings;
    renderPreferredTestOptions();
    const pairs = [
      ["dashboardUsernameInput", settings.username],
      ["dashboardPreferredName", settings.preferredName],
      ["dashboardHeadlineInput", settings.headline],
      ["dashboardAvatarUrl", settings.avatarUrl],
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
    const passwordCard = $("dashboardPasswordCard");
    if (passwordCard) {
      passwordCard.classList.toggle("hidden", Auth()?.isSharedPasswordUser?.() !== true);
    }
    updateAvatarControls();
  }

  function renderPreferredTestOptions() {
    const select = $("dashboardPreferredTest");
    if (!select) return;
    const tests = Object.values(Registry()?.TESTS?.byId || {});
    if (!tests.length) return;
    const current = state.settings.preferredTest || select.value || "ielts1";
    select.innerHTML = "";
    tests.forEach((cfg) => {
      const option = document.createElement("option");
      option.value = cfg.id;
      option.textContent = Registry()?.getTestLabel?.(cfg.id) || cfg.id;
      select.appendChild(option);
    });
    select.value = tests.some((cfg) => cfg.id === current) ? current : tests[0].id;
  }

  function renderSummary() {
    const rows = state.rows;
    setText("dashboardStatTests", rows.length);
    setText("dashboardStatListening", average(rows, "listening_band"));
    setText("dashboardStatReading", average(rows, "reading_band"));
    setText("dashboardStatWriting", average(rows, "final_writing_band"));

    const recommendation = $("dashboardRecommendation");
    if (!recommendation) return;
    recommendation.textContent = buildRecommendation(rows).summary;
  }

  function renderAnalytics() {
    const rows = state.rows;
    const listening = scoreSeries(rows, "listening_band");
    const reading = scoreSeries(rows, "reading_band");
    const writing = scoreSeries(rows, "final_writing_band");
    const hasTrend = [listening, reading, writing].some((series) => series.length >= 2);
    const width = 520;
    const height = 240;
    const padding = { top: 20, right: 18, bottom: 32, left: 28 };
    const grid = $("dashboardTrendGrid");
    const axis = $("dashboardTrendAxis");
    const pointsRoot = $("dashboardTrendPoints");
    const empty = $("dashboardTrendEmpty");
    const averages = skillAverages(rows).sort((a, b) => b.value - a.value);
    const strongest = averages[0] || null;
    const weakest = averages[averages.length - 1] || null;
    const maxAverage = strongest?.value || 0;
    const minAverage = weakest?.value || 0;
    const spread = maxAverage && minAverage ? round1(maxAverage - minAverage) : 0;
    const listeningLatest = listening[listening.length - 1]?.value || 0;
    const readingLatest = reading[reading.length - 1]?.value || 0;
    const writingLatest = writing[writing.length - 1]?.value || 0;
    const currentBest = Math.max(listeningLatest, readingLatest, writingLatest);
    const targetBand = Number(state.settings.targetBand || 0);
    const targetGap = targetBand > 0 && currentBest > 0 ? round1(targetBand - currentBest) : 0;

    setText("dashboardInsightStrongest", strongest ? `${strongest.label} · Band ${strongest.value.toFixed(1)}` : "Build your baseline");
    setText(
      "dashboardInsightStrongestDetail",
      strongest ? `${strongest.label} is currently your strongest scoring section.` : "Finish a scored mock to see your strongest section here."
    );
    setText("dashboardInsightWeakest", weakest ? `${weakest.label} · Band ${weakest.value.toFixed(1)}` : "No gaps yet");
    setText(
      "dashboardInsightWeakestDetail",
      weakest ? `Focus extra review on ${weakest.label.toLowerCase()} to lift your overall balance.` : "Your dashboard will surface the section that needs the most attention."
    );
    setText("dashboardInsightConsistency", spread ? `${spread.toFixed(1)} band spread` : "Steady practice starts here");
    setText(
      "dashboardInsightConsistencyDetail",
      spread ? `The gap between your strongest and weakest sections is ${spread.toFixed(1)} band.` : "Your score spread will narrow as you practice more consistently."
    );
    setText("dashboardInsightMomentum", targetGap > 0 ? `${targetGap.toFixed(1)} band to target` : rows.length ? "Keep the momentum going" : "Start your next mock");
    setText(
      "dashboardInsightMomentumDetail",
      targetGap > 0 ? `Your highest recent section is ${currentBest.toFixed(1)}. Another focused attempt can close the gap.` : rows.length ? "Your dashboard has enough data now to guide your next study decision." : "The next completed test will sharpen your progress signal."
    );

    const title = $("dashboardTrendTitle");
    const meta = $("dashboardTrendMeta");
    if (title) {
      title.textContent = hasTrend
        ? "Your latest progress is starting to take shape."
        : "Your progress line will appear after more completed mocks.";
    }
    if (meta) {
      meta.textContent = hasTrend
        ? `Recent scored mocks are now drawing a live trend across Listening, Reading, and Writing.`
        : "Listening, Reading, and Writing trends update as your history grows.";
    }

    if (!grid || !axis || !pointsRoot || !empty) return;

    if (!hasTrend) {
      empty.classList.remove("hidden");
      grid.innerHTML = "";
      axis.innerHTML = "";
      pointsRoot.innerHTML = "";
      $("dashboardTrendListening").setAttribute("d", "");
      $("dashboardTrendReading").setAttribute("d", "");
      $("dashboardTrendWriting").setAttribute("d", "");
      return;
    }

    empty.classList.add("hidden");

    const allPoints = listening.concat(reading, writing);
    const minY = Math.max(0, Math.floor((Math.min.apply(null, allPoints.map((point) => point.value)) - 0.5) * 2) / 2);
    const maxY = Math.min(9, Math.ceil((Math.max.apply(null, allPoints.map((point) => point.value)) + 0.5) * 2) / 2);
    const chartLevels = [minY, minY + ((maxY - minY) / 2), maxY].map((value) => round1(value));
    const usableHeight = height - padding.top - padding.bottom;
    const usableWidth = width - padding.left - padding.right;

    grid.innerHTML = chartLevels.map((value) => {
      const y = padding.top + usableHeight - (((value - minY) / Math.max(0.1, maxY - minY)) * usableHeight);
      return `<line class="dashboard-chart-grid-line" x1="${padding.left}" y1="${y.toFixed(2)}" x2="${width - padding.right}" y2="${y.toFixed(2)}"></line>`;
    }).join("");

    const referenceSeries = [listening, reading, writing].sort((a, b) => b.length - a.length)[0];
    axis.innerHTML = chartLevels.map((value) => {
      const y = padding.top + usableHeight - (((value - minY) / Math.max(0.1, maxY - minY)) * usableHeight);
      return `<text class="dashboard-chart-axis-label" x="2" y="${(y + 4).toFixed(2)}">${value.toFixed(1)}</text>`;
    }).join("") + referenceSeries.map((point, index) => {
      const x = padding.left + (usableWidth * (index / Math.max(1, referenceSeries.length - 1)));
      return `<text class="dashboard-chart-axis-label" x="${x.toFixed(2)}" y="${height - 6}" text-anchor="${index === 0 ? "start" : index === referenceSeries.length - 1 ? "end" : "middle"}">${index + 1}</text>`;
    }).join("");

    $("dashboardTrendListening").setAttribute("d", buildLinePath(listening, width, height, minY, maxY, padding));
    $("dashboardTrendReading").setAttribute("d", buildLinePath(reading, width, height, minY, maxY, padding));
    $("dashboardTrendWriting").setAttribute("d", buildLinePath(writing, width, height, minY, maxY, padding));

    const pointMarkup = [
      ["is-listening", listening],
      ["is-reading", reading],
      ["is-writing", writing],
    ].map(([klass, series]) => {
      const denomX = Math.max(1, series.length - 1);
      const denomY = Math.max(0.1, maxY - minY);
      return series.map((point, index) => {
        const x = padding.left + (usableWidth * (index / denomX));
        const y = padding.top + usableHeight - (((point.value - minY) / denomY) * usableHeight);
        return `<circle class="dashboard-chart-point ${klass}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="5"></circle>`;
      }).join("");
    }).join("");
    pointsRoot.innerHTML = pointMarkup;
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
    const recommendation = buildRecommendation(rows);

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
    setText("dashboardGoalsAction", recommendation.action);
    setText("dashboardGoalsActionDetail", recommendation.detail);
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
      dashboardUsernameInput: "username",
      dashboardPreferredName: "preferredName",
      dashboardHeadlineInput: "headline",
      dashboardAvatarUrl: "avatarUrl",
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

    const avatarInput = $("dashboardAvatarFileInput");
    const uploadBtn = $("dashboardUploadAvatarBtn");
    const removeBtn = $("dashboardRemoveAvatarBtn");

    if (uploadBtn && uploadBtn.dataset.bound !== "1") {
      uploadBtn.dataset.bound = "1";
      uploadBtn.addEventListener("click", () => avatarInput?.click?.());
    }

    if (avatarInput && avatarInput.dataset.bound !== "1") {
      avatarInput.dataset.bound = "1";
      avatarInput.addEventListener("change", async () => {
        const file = avatarInput.files && avatarInput.files[0];
        avatarInput.value = "";
        if (!file) return;
        if (!/^image\//i.test(file.type || "")) {
          setStatus("Please choose an image file for your profile picture.");
          return;
        }
        if (file.size > 6 * 1024 * 1024) {
          setStatus("Please choose an image smaller than 6 MB.");
          return;
        }
        try {
          setStatus("Preparing your profile picture...");
          const dataUrl = await toAvatarDataUrl(file);
          const next = { ...state.settings, avatarUrl: dataUrl };
          saveSettings(next);
        } catch (e) {
          console.error("Avatar upload failed:", e);
          setStatus(e?.message || "Could not process that image.");
        }
      });
    }

    if (removeBtn && removeBtn.dataset.bound !== "1") {
      removeBtn.dataset.bound = "1";
      removeBtn.addEventListener("click", () => {
        const next = { ...state.settings, avatarUrl: "" };
        saveSettings(next);
      });
    }

    const savePasswordBtn = $("dashboardSavePasswordBtn");
    if (savePasswordBtn && savePasswordBtn.dataset.bound !== "1") {
      savePasswordBtn.dataset.bound = "1";
      savePasswordBtn.addEventListener("click", async () => {
        const status = $("dashboardPasswordStatus");
        const email = String(getUser()?.email || "").trim().toLowerCase();
        const nextPassword = $("dashboardNewPassword")?.value || "";
        const confirmPassword = $("dashboardConfirmPassword")?.value || "";

        if (status) status.textContent = "";

        if (Auth()?.isSharedPasswordUser?.() !== true) {
          if (status) status.textContent = "Password changes here are available for shared-password student sign-ins.";
          return;
        }
        if (!email) {
          if (status) status.textContent = "We could not find the signed-in student email.";
          return;
        }
        if (!nextPassword || nextPassword.length < 6) {
          if (status) status.textContent = "Choose a password with at least 6 characters.";
          return;
        }
        if (nextPassword !== confirmPassword) {
          if (status) status.textContent = "The password confirmation does not match.";
          return;
        }

        try {
          if (status) status.textContent = "Saving your student password...";
          const result = await Auth()?.upgradeSharedStudentPassword?.(nextPassword);
          if ($("dashboardNewPassword")) $("dashboardNewPassword").value = "";
          if ($("dashboardConfirmPassword")) $("dashboardConfirmPassword").value = "";
          if (status) {
            status.textContent = result?.message || "Saved. Use your new password for this email.";
          }
        } catch (e) {
          console.error("Could not save student password override:", e);
          if (status) status.textContent = e?.message || "Could not save your new student password.";
        }
      });
    }
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
    renderAnalytics();
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
    if (status) status.textContent = "Settings sync with your student profile automatically.";
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
    try {
      window.IELTS?.Access?.requireTestPassword?.(() => {
        try { Registry()?.clearLaunchContext?.(); } catch (err) {}
        try { UI()?.setExamStarted?.(true); } catch (err) {}
        try { UI()?.showOnly?.("listening"); } catch (err) {}
        try { UI()?.setExamNavStatus?.("Status: Listening in progress"); } catch (err) {}
        try { Router()?.setHashRoute?.(testId, "listening"); } catch (err) {}
        try { window.IELTS?.Engines?.Listening?.initListeningSystem?.(); } catch (err) {
          console.error("Could not start preferred test:", err);
        }
      });
      return;
    } catch (e) {}
    const btnId = testId === "ielts7"
      ? "startIelts7Btn"
      : testId === "ielts6"
      ? "startIelts6Btn"
      : testId === "ielts5"
      ? "startIelts5Btn"
      : testId === "ielts4"
        ? "startIelts4Btn"
        : testId === "ielts3"
          ? "startIelts3Btn"
          : testId === "ielts2"
            ? "startIelts2Btn"
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
      queueProfileSync(state.settings);
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
