import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bgujwyknnszwborgbkxq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Me6QK361KcAjS8KdUmql1Q_yGHHn_3Z";
const SITE_URL = "https://ieltsmock.org/";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    storageKey: "ieltsmock-auth"
  }
});

window.IELTS = window.IELTS || {};

const authGate = document.getElementById("authGate");
const authMessage = document.getElementById("authMessage");
const SHARED_SESSION_KEY = "IELTS:AUTH:sharedSession";
const PROFILE_CACHE_BY_EMAIL_KEY = "IELTS:AUTH:profileByEmail";
const AUTH_USER_KEY = "IELTS:AUTH:user";

let authReady = false;
let loggingOut = false;
let hasHandledInitialLoginRedirect = false;
let loginGateOpen = false;
let authMessageTimer = null;

function getEl(id) {
  return document.getElementById(id);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function readSessionJsonWithLegacyFallback(key) {
  try {
    const sessionRaw = sessionStorage.getItem(key);
    if (sessionRaw) return JSON.parse(sessionRaw || "null");
  } catch (e) {}
  try {
    const legacyRaw = localStorage.getItem(key);
    if (!legacyRaw) return null;
    const parsed = JSON.parse(legacyRaw || "null");
    try {
      sessionStorage.setItem(key, JSON.stringify(parsed));
      localStorage.removeItem(key);
    } catch (e) {}
    return parsed;
  } catch (e) {
    return null;
  }
}

function writeSessionJson(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

function clearSensitiveSessionKey(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {}
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

function getSavedUser() {
  return readSessionJsonWithLegacyFallback(AUTH_USER_KEY);
}

function getSharedSession() {
  return readSessionJsonWithLegacyFallback(SHARED_SESSION_KEY);
}

function isSharedPasswordUser() {
  const user = getSavedUser();
  return String(user?.provider || "").trim().toLowerCase() === "shared-password";
}

function setPasswordResetMode(active, text) {
  const recoveryBox = getEl("passwordResetBox");
  if (recoveryBox) recoveryBox.classList.toggle("hidden", !active);
  const resetHelp = getEl("passwordResetHelp");
  if (resetHelp) resetHelp.textContent = text || "Choose a new password for your student account.";
  const sharedBtn = getEl("sharedPasswordLoginBtn");
  if (sharedBtn) sharedBtn.classList.toggle("hidden", !!active);
  const signUpBtn = getEl("openSignUpBtn");
  if (signUpBtn) signUpBtn.classList.toggle("hidden", !!active);
}

function setBypassRecoveryMode(active, text) {
  const options = getEl("recoveryOptionsBox");
  if (options) options.classList.remove("hidden");
  const box = getEl("bypassResetBox");
  if (box) box.classList.toggle("hidden", !active);
  const help = getEl("bypassResetHelp");
  if (help) help.textContent = text || "Enter the admin bypass password to reset this student password.";
}

function setSharedSetupMode(active, text) {
  const box = getEl("sharedSetupBox");
  if (box) box.classList.toggle("hidden", !active);
  const help = getEl("sharedSetupHelp");
  if (help) help.textContent = text || "Complete the student name and choose a personal password.";

  const sharedBtn = getEl("sharedPasswordLoginBtn");
  if (sharedBtn) sharedBtn.classList.toggle("hidden", !!active);
  const forgotBtn = getEl("forgotPasswordBtn");
  if (forgotBtn) forgotBtn.classList.toggle("hidden", !!active);
  const signUpBtn = getEl("openSignUpBtn");
  if (signUpBtn) signUpBtn.classList.toggle("hidden", !!active);
  const passwordField = getEl("sharedPasswordInput")?.closest(".auth-field-group");
  if (passwordField) passwordField.classList.toggle("hidden", !!active);
  const emailShell = getEl("otpEmail")?.closest(".auth-email-shell");
  if (emailShell) emailShell.classList.toggle("hidden", !!active);
  const recoveryOptions = getEl("recoveryOptionsBox");
  if (recoveryOptions) recoveryOptions.classList.toggle("hidden", !!active);
}

function clearAuthFlowModes() {
  setPasswordResetMode(false, "");
  setBypassRecoveryMode(false, "");
  setSharedSetupMode(false, "");
  const recoveryOptions = getEl("recoveryOptionsBox");
  if (recoveryOptions) recoveryOptions.classList.add("hidden");
  const signUpBox = getEl("signUpBox");
  if (signUpBox) signUpBox.classList.add("hidden");
  const emailShell = getEl("otpEmail")?.closest(".auth-email-shell");
  if (emailShell) emailShell.classList.remove("hidden");
}

function openSignUpBox() {
  const email = getEl("otpEmail")?.value.trim() || "";
  if (!email) {
    setMessage("Please enter the email address first.", { tone: "error" });
    return;
  }
  clearAuthFlowModes();
  const box = getEl("signUpBox");
  if (box) box.classList.remove("hidden");
  const emailShell = getEl("otpEmail")?.closest(".auth-email-shell");
  if (emailShell) emailShell.classList.add("hidden");
  setMessage("Complete the sign up details for this student email.", { tone: "success", sticky: true });
}

function showRecoveryOptions() {
  const email = getEl("otpEmail")?.value.trim() || "";
  if (!email) {
    setMessage("Please enter the student email first.", { tone: "error" });
    return;
  }
  clearAuthFlowModes();
  const recoveryOptions = getEl("recoveryOptionsBox");
  if (recoveryOptions) recoveryOptions.classList.remove("hidden");
  const help = getEl("recoveryOptionsHelp");
  if (help) help.textContent = "Choose whether to reset through email or use the admin bypass password.";
  setMessage("Choose the recovery method for this student account.", { tone: "success", sticky: true });
}

function parseNameParts(fullName) {
  const pieces = String(fullName || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return {
    firstName: pieces[0] || "",
    lastName: pieces.slice(1).join(" ") || "",
  };
}

function prefillSharedSetupFields(userLike) {
  const fullName = String(
    userLike?.user_metadata?.full_name ||
    userLike?.name ||
    getSavedUser()?.name ||
    ""
  ).trim();
  const parts = parseNameParts(fullName);
  const first = getEl("sharedSetupFirstName");
  const last = getEl("sharedSetupLastName");
  if (first && !first.value.trim()) first.value = parts.firstName;
  if (last && !last.value.trim()) last.value = parts.lastName;
}

function getIdentityKeyFromUserLike(user) {
  return normalizeEmail(user?.email) || String(user?.id || "").trim() || "guest";
}

function readEmailScopedDashboardSettings(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(`IELTS:DASHBOARD:${normalizedEmail}:settings`) || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (e) {
    return null;
  }
}

function getProfileCacheByEmail() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_CACHE_BY_EMAIL_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveProfileCacheByEmail(next) {
  try {
    localStorage.setItem(PROFILE_CACHE_BY_EMAIL_KEY, JSON.stringify(next || {}));
  } catch (e) {}
}

function buildProfileFromMetadata(metadata) {
  return {
    username: String(metadata.username || "").trim(),
    preferredName: String(metadata.preferred_name || "").trim(),
    headline: String(metadata.profile_headline || "").trim(),
    bio: String(metadata.profile_bio || "").trim(),
    targetBand: String(metadata.target_band || "").trim(),
    focusSkill: String(metadata.focus_skill || "").trim(),
    preferredTest: String(metadata.preferred_test || "").trim(),
    dailyGoal: String(metadata.daily_goal || "").trim(),
    studyNote: String(metadata.study_note || "").trim(),
    fontScale: String(metadata.font_scale || "").trim(),
    avatarUrl: String(metadata.profile_avatar_url || "").trim(),
  };
}

function setMessage(text, options) {
  if (!authMessage) return;
  const nextText = String(text || "").trim();
  authMessage.textContent = nextText;
  authMessage.classList.toggle("is-visible", !!nextText);
  authMessage.classList.toggle("is-error", !!nextText && options?.tone === "error");
  authMessage.classList.toggle("is-success", !!nextText && options?.tone === "success");
  clearTimeout(authMessageTimer);
  if (nextText && options?.sticky !== true) {
    authMessageTimer = setTimeout(() => {
      authMessage.textContent = "";
      authMessage.classList.remove("is-visible", "is-error", "is-success");
    }, Math.max(2400, Number(options?.durationMs) || 4200));
  }
}

function saveUser(user) {
  const metadata = user?.user_metadata || {};
  const appMetadata = user?.app_metadata || {};
  const emailScoped = readEmailScopedDashboardSettings(user?.email) || {};
  const cachedByEmail = getProfileCacheByEmail()[normalizeEmail(user?.email)] || {};
  const profile = { ...buildProfileFromMetadata(metadata), ...(cachedByEmail.profile || {}), ...emailScoped };
  const avatar =
    profile.avatarUrl ||
    cachedByEmail.avatarUrl ||
    metadata.avatar_url ||
    metadata.picture ||
    metadata.photo_url ||
    "";
  const fullName =
    profile.preferredName ||
    cachedByEmail.name ||
    metadata.full_name ||
    metadata.name ||
    "";
  const provider = appMetadata?.provider || cachedByEmail.provider || "";
  try {
    const email = normalizeEmail(user?.email);
    if (email) {
      saveProfileCacheByEmail({
        ...getProfileCacheByEmail(),
        [email]: {
          name: fullName,
          avatarUrl: avatar,
          provider,
          createdAt: user?.created_at || cachedByEmail.createdAt || "",
          lastSignInAt: user?.last_sign_in_at || cachedByEmail.lastSignInAt || "",
          profile,
        },
      });
    }
    writeSessionJson(AUTH_USER_KEY, {
      id: user?.id || "",
      identityKey: getIdentityKeyFromUserLike(user),
      email: user?.email || "",
      name: fullName,
      avatarUrl: avatar,
      provider,
      createdAt: user?.created_at || "",
      lastSignInAt: user?.last_sign_in_at || "",
      profile
    });
  } catch (e) {}
}

function clearSavedUser() {
  clearSensitiveSessionKey(AUTH_USER_KEY);
}

function saveSharedSession(session) {
  writeSessionJson(SHARED_SESSION_KEY, session);
}

function clearSharedSession() {
  clearSensitiveSessionKey(SHARED_SESSION_KEY);
}

function syncAuthExport() {
  window.IELTS = window.IELTS || {};
  window.IELTS.Auth = {
    supabase,
    getSavedUser,
    getSharedSession,
    getIdentityKey,
    isSignedIn,
    isSharedPasswordUser,
    getAccessToken,
    updateProfileMetadata,
    sendPasswordResetEmail,
    upgradeSharedStudentPassword,
    completeSharedStudentSetup,
    showProtectedApp,
    openLoginGate,
    closeLoginGate,
    refreshAuthUI,
    logout
  };
}

function isSignedIn() {
  const user = getSavedUser();
  return !!(user && user.id);
}

function getIdentityKey() {
  return getIdentityKeyFromUserLike(getSavedUser());
}

async function getAccessToken() {
  const shared = getSharedSession();
  if (shared?.token) return shared.token;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (e) {
    return null;
  }
}

async function updateProfileMetadata(patch) {
  const nextPatch = patch && typeof patch === "object" ? patch : {};
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const user = data?.user || null;
  if (!user) throw new Error("You need to be signed in to update your profile.");

  const metadata = { ...(user.user_metadata || {}) };
  Object.entries(nextPatch).forEach(([key, value]) => {
    if (value == null || value === "") delete metadata[key];
    else metadata[key] = value;
  });

  const response = await supabase.auth.updateUser({ data: metadata });
  if (response.error) throw response.error;

  if (response.data?.user) {
    saveUser(response.data.user);
    syncAuthExport();
    notifyAuthChanged();
  }

  return response.data?.user || null;
}

function notifyAuthChanged() {
  try {
    window.dispatchEvent(new CustomEvent("ielts:authchanged"));
  } catch (e) {}
}

async function pingStudentSession(userLike) {
  const email = normalizeEmail(userLike?.email || getSavedUser()?.email || "");
  if (!email) return;
  const url = window.IELTS?.Registry?.buildAdminApiUrl?.({ action: "studentSessionPing" });
  if (!url) return;

  const provider =
    String(userLike?.app_metadata?.provider || userLike?.provider || getSavedUser()?.provider || "email").trim().toLowerCase() || "email";
  const fullName =
    String(
      userLike?.user_metadata?.preferred_name ||
      userLike?.user_metadata?.name ||
      userLike?.name ||
      getSavedUser()?.name ||
      ""
    ).trim();

  const token = await getAccessToken().catch(() => null);
  if (!token) return;

  try {
    await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        provider,
        fullName,
      }),
    });
  } catch (e) {}
}

function hideBlockingModals() {
  const mainModal = getEl("modal");
  if (mainModal) mainModal.classList.add("hidden");

  const listenModal = getEl("listenModal");
  if (listenModal) {
    listenModal.classList.add("hidden");
    listenModal.style.display = "none";
  }
}

function forceHideAllAppSections() {
  [
    "homeSection",
    "historySection",
    "listeningSection",
    "readingControls",
    "container",
    "writingSection",
    "resourceHubSection",
    "dashboardSection",
    "speakingSection",
    "examNav",
    "adminResultsSection"
  ].forEach((id) => {
    const el = getEl(id);
    if (el) el.classList.add("hidden");
  });
}

function closeLoginGate() {
  loginGateOpen = false;
  if (authGate) authGate.classList.add("hidden");
  clearAuthFlowModes();
  setMessage("");
}

function openLoginGate(message) {
  loginGateOpen = true;
  if (authGate) authGate.classList.remove("hidden");
  if (message) setMessage(message);
}

function showProtectedApp(show) {
  const logoutBtn = getEl("logoutBtn");
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !show);

  if (!show) {
    forceHideAllAppSections();
    getEl("homeSection")?.classList.remove("hidden");
    closeLoginGate();
    return;
  }

  closeLoginGate();
}

function hasOAuthCallbackParams() {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("code")) return true;
    if (params.get("access_token")) return true;
    if (params.get("refresh_token")) return true;
    if (params.get("token_hash")) return true;

    const hash = String(location.hash || "");
    return (
      hash.includes("access_token=") ||
      hash.includes("refresh_token=") ||
      hash.includes("type=recovery") ||
      hash.includes("type=signup")
    );
  } catch (e) {
    return false;
  }
}

function clearAuthCallbackArtifacts() {
  try {
    const url = new URL(location.href);
    url.searchParams.delete("code");
    url.searchParams.delete("type");
    url.searchParams.delete("access_token");
    url.searchParams.delete("refresh_token");
    url.searchParams.delete("expires_at");
    url.searchParams.delete("expires_in");
    url.searchParams.delete("token_type");
    url.searchParams.delete("provider_token");
    url.searchParams.delete("provider_refresh_token");

    if (
      String(url.hash || "").includes("access_token=") ||
      String(url.hash || "").includes("refresh_token=") ||
      url.hash === "#"
    ) {
      url.hash = "";
    }

    history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch (e) {}
}

function getDesiredView() {
  try {
    const hashRoute = window.IELTS?.Router?.parseHashRoute?.();
    if (hashRoute?.view) return String(hashRoute.view);
  } catch (e) {}

  try {
    const saved = localStorage.getItem("IELTS:HOME:lastView");
    if (saved && String(saved).trim()) return String(saved).trim();
  } catch (e) {}

  return "home";
}

function hasResumableStoredAttempt(activeTestId) {
  try {
    const registry = window.IELTS?.Registry || {};
    const launchContext = registry.getLaunchContext?.() || null;
    const isFullExamFlow = !launchContext || launchContext.mode === "full";
    const scoped = registry.getScopedKeys?.(activeTestId) || registry.keysFor?.(activeTestId) || {};
    const listeningKeys = scoped.listening || {};
    const writingKeys = scoped.writing || {};
    const readingTestId =
      registry.getScopedReadingTestId?.(activeTestId) ||
      registry.getTestConfig?.(activeTestId)?.readingTestId ||
      "ielts-reading-3parts-001";
    const finalSubmittedKey = registry?.EXAM?.keys?.finalSubmitted || "IELTS:EXAM:finalSubmitted";

    const hasNonEmptyObject = (value) =>
      !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;

    const getJSON = (key) => {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    };

    if (localStorage.getItem(finalSubmittedKey) === "true") return false;

    const listeningSubmitted = localStorage.getItem(listeningKeys.submitted || "") === "true";
    const listeningStarted = localStorage.getItem(listeningKeys.started || "") === "true";
    const writingSubmitted = localStorage.getItem(writingKeys.submitted || "") === "true";
    const writingStarted = localStorage.getItem(writingKeys.started || "") === "true";
    const readingSubmitted = localStorage.getItem(`${readingTestId}:submitted`) === "true";
    const listeningAnswers = getJSON(listeningKeys.answers || "");
    const readingAnswers = getJSON(`${readingTestId}:answers`);
    const writingAnswers = getJSON(writingKeys.answers || "");

    return (
      (listeningStarted && !listeningSubmitted) ||
      (!listeningSubmitted && hasNonEmptyObject(listeningAnswers)) ||
      (isFullExamFlow && listeningSubmitted && !readingSubmitted) ||
      (!readingSubmitted && hasNonEmptyObject(readingAnswers)) ||
      (isFullExamFlow && readingSubmitted && !writingSubmitted) ||
      (writingStarted && !writingSubmitted) ||
      (!writingSubmitted && hasNonEmptyObject(writingAnswers))
    );
  } catch (e) {
    return false;
  }
}

function sanitizeDesiredView(view, activeTestId) {
  const raw = String(view || "").trim();
  const normalized = raw === "results" ? "adminResults" : raw;
  const allowedViews = new Set(["home", "dashboard", "history", "listening", "reading", "writing", "speaking", "adminResults", "fullExamHub", "readingHub", "listeningHub", "writingHub", "writingTask1SamplesHub", "writingTask2SamplesHub", "speakingHub", "contactHub"]);
  const launchContext = window.IELTS?.Registry?.getLaunchContext?.() || null;

  if (!allowedViews.has(normalized)) return "home";
  if (normalized === "adminResults" && window.IELTS?.Access?.isAdmin?.() !== true) return "home";
  if (["listening", "reading", "writing"].includes(normalized)) {
    if (window.IELTS?.Access?.isAdmin?.() === true) return normalized;
    if (launchContext?.mode === "section" && launchContext?.section === normalized) return normalized;
    if (launchContext?.mode === "practice" && launchContext?.skill === normalized) return normalized;
    if (!hasResumableStoredAttempt(activeTestId)) return "home";
  }
  return normalized;
}

function restoreViewAfterAuth() {
  hideBlockingModals();

  const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
  const view = sanitizeDesiredView(getDesiredView(), activeTestId);

  try {
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute(activeTestId, view);
    } else if (!location.hash || location.hash === "#") {
      history.replaceState({}, "", `${location.pathname}#/${activeTestId}/${view}`);
    }
  } catch (e) {}

  try {
    window.IELTS?.UI?.showOnly?.(view);
    if (view === "home") {
      window.IELTS?.UI?.setExamNavStatus?.("Status: Ready");
      window.IELTS?.UI?.updateHomeStatusLine?.("Status: Signed in");
    }
    return;
  } catch (e) {}

  const fallbackIdMap = {
    home: "homeSection",
    fullExamHub: "resourceHubSection",
    readingHub: "resourceHubSection",
    listeningHub: "resourceHubSection",
    writingHub: "resourceHubSection",
    writingTask1SamplesHub: "resourceHubSection",
    writingTask2SamplesHub: "resourceHubSection",
    speakingHub: "resourceHubSection",
    contactHub: "resourceHubSection",
    dashboard: "dashboardSection",
    listening: "listeningSection",
    reading: "readingControls",
    writing: "writingSection",
    speaking: "speakingSection",
    adminResults: "adminResultsSection",
    history: "historySection"
  };

  forceHideAllAppSections();
  const fallbackId = fallbackIdMap[view] || "homeSection";
  const el = getEl(fallbackId);
  if (el) el.classList.remove("hidden");
}

function routeHomeAfterLogin() {
  const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
  const registry = window.IELTS?.Registry || {};
  const scoped = registry.getScopedKeys?.(activeTestId) || registry.keysFor?.(activeTestId) || {};
  const listeningKeys = scoped.listening || {};
  const writingKeys = scoped.writing || {};
  const readingTestId =
    registry.getScopedReadingTestId?.(activeTestId) ||
    registry.getTestConfig?.(activeTestId)?.readingTestId ||
    "ielts-reading-3parts-001";
  const finalSubmittedKey = registry?.EXAM?.keys?.finalSubmitted || "IELTS:EXAM:finalSubmitted";

  const hasNonEmptyObject = (value) =>
    !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;

  const getJSON = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const getResumeView = () => {
    try {
      if (localStorage.getItem(finalSubmittedKey) === "true") return "";
      const listeningSubmitted = localStorage.getItem(listeningKeys.submitted || "") === "true";
      const listeningStarted = localStorage.getItem(listeningKeys.started || "") === "true";
      const writingSubmitted = localStorage.getItem(writingKeys.submitted || "") === "true";
      const writingStarted = localStorage.getItem(writingKeys.started || "") === "true";
      const readingSubmitted = localStorage.getItem(`${readingTestId}:submitted`) === "true";
      const listeningAnswers = getJSON(listeningKeys.answers || "");
      const readingAnswers = getJSON(`${readingTestId}:answers`);
      const writingAnswers = getJSON(writingKeys.answers || "");

      if ((writingStarted && !writingSubmitted) || (!writingSubmitted && hasNonEmptyObject(writingAnswers))) return "writing";
      if (readingSubmitted && !writingSubmitted) return "writing";
      if (!readingSubmitted && hasNonEmptyObject(readingAnswers)) return "reading";
      if (listeningSubmitted && !readingSubmitted) return "reading";
      if ((listeningStarted && !listeningSubmitted) || (!listeningSubmitted && hasNonEmptyObject(listeningAnswers))) return "listening";
    } catch (e) {}
    return "";
  };

  const resumeView = getResumeView();
  try {
    localStorage.setItem("IELTS:HOME:lastView", resumeView || "home");
    localStorage.setItem("IELTS:EXAM:started", resumeView ? "true" : "false");
  } catch (e) {}

  hideBlockingModals();
  forceHideAllAppSections();

  try {
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute(activeTestId, resumeView || "home");
    } else {
      history.replaceState({}, "", `${location.pathname}#/${activeTestId}/${resumeView || "home"}`);
    }
  } catch (e) {}

  try {
    if (resumeView === "listening") {
      window.__IELTS_LISTENING_INIT__ = false;
      window.IELTS?.UI?.showOnly?.("listening");
      window.IELTS?.UI?.setExamNavStatus?.("Status: Resuming Listening");
      window.IELTS?.UI?.setExamStarted?.(true);
      window.IELTS?.Engines?.Listening?.initListeningSystem?.();
      return;
    }
    if (resumeView === "reading") {
      window.__IELTS_READING_INIT__ = false;
      window.IELTS?.UI?.showOnly?.("reading");
      window.IELTS?.UI?.setExamNavStatus?.("Status: Resuming Reading");
      window.IELTS?.UI?.setExamStarted?.(true);
      window.IELTS?.Engines?.Reading?.startReadingSystem?.();
      return;
    }
    if (resumeView === "writing") {
      window.__IELTS_WRITING_INIT__ = false;
      window.IELTS?.UI?.showOnly?.("writing");
      window.IELTS?.UI?.setExamNavStatus?.("Status: Resuming Writing");
      window.IELTS?.UI?.setExamStarted?.(true);
      window.IELTS?.Engines?.Writing?.startWritingSystem?.();
      return;
    }

    window.IELTS?.UI?.showOnly?.("home");
    window.IELTS?.UI?.setExamNavStatus?.("Status: Ready");
    window.IELTS?.UI?.updateHomeStatusLine?.("Status: Signed in");
  } catch (e) {
    const fallbackIdMap = {
      home: "homeSection",
      listening: "listeningSection",
      reading: "readingControls",
      writing: "writingSection",
    };
    const home = getEl(fallbackIdMap[resumeView || "home"] || "homeSection");
    if (home) home.classList.remove("hidden");
  }
}

async function refreshAuthUI({ forceHome = false } = {}) {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("[AUTH] getSession error:", error);
    setMessage(error.message || "Authentication error.", { tone: "error", sticky: true });
    clearSavedUser();
    syncAuthExport();
    hideBlockingModals();
    showProtectedApp(false);
    authReady = true;
    return false;
  }

  const session = data?.session || null;
  const user = session?.user || null;

  if (user) {
    clearSharedSession();
    saveUser(user);
    syncAuthExport();
    showProtectedApp(true);
    setMessage("");
    authReady = true;
    pingStudentSession(user).catch(() => null);

    if (forceHome) {
      routeHomeAfterLogin();
      clearAuthCallbackArtifacts();
      hasHandledInitialLoginRedirect = true;
      notifyAuthChanged();
      return true;
    }

    restoreViewAfterAuth();
    notifyAuthChanged();

    if (hasOAuthCallbackParams()) {
      clearAuthCallbackArtifacts();
      hasHandledInitialLoginRedirect = true;
    }

    return true;
  }

  const shared = getSharedSession();
  if (shared?.token && shared?.user?.email) {
    saveUser(shared.user);
    syncAuthExport();
    setMessage("");
    authReady = true;
    pingStudentSession(shared.user).catch(() => null);
    if (shared.requiresPasswordSetup === true) {
      showProtectedApp(false);
      openLoginGate(
        shared.recoveryMode === "bypass"
          ? "Bypass accepted. Set a new password before continuing."
          : "Complete your name and student password before continuing."
      );
      clearAuthFlowModes();
      setSharedSetupMode(
        true,
        shared.recoveryMode === "bypass"
          ? "Reset this student's password and confirm the name before entering the platform."
          : "This is the student's first sign-in. Save the name and choose a personal password now."
      );
      prefillSharedSetupFields(shared.user);
      notifyAuthChanged();
      return true;
    }
    showProtectedApp(true);
    if (forceHome) {
      routeHomeAfterLogin();
    } else {
      restoreViewAfterAuth();
    }
    notifyAuthChanged();
    return true;
  }

  clearSharedSession();
  clearSavedUser();
  syncAuthExport();
  hideBlockingModals();
  showProtectedApp(false);
  authReady = true;
  clearAuthFlowModes();
  try {
    const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute(activeTestId, "home");
    }
    localStorage.setItem("IELTS:HOME:lastView", "home");
    localStorage.setItem("IELTS:EXAM:started", "false");
    window.IELTS?.UI?.showOnly?.("home");
    window.IELTS?.UI?.setExamNavStatus?.("Status: Ready");
    window.IELTS?.UI?.updateHomeStatusLine?.("Status: Browse the platform or log in to start a test");
  } catch (e) {}
  notifyAuthChanged();
  return false;
}

async function signInWithGoogle() {
  setMessage("Redirecting to Google...", { sticky: true });
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: SITE_URL,
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error("[AUTH] Google sign-in error:", error);
    setMessage(error.message || "Google sign-in failed.", { tone: "error" });
  }
}

async function signInWithMicrosoft() {
  setMessage("Redirecting to Microsoft...", { sticky: true });
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: SITE_URL,
      scopes: "email",
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error("[AUTH] Microsoft sign-in error:", error);
    setMessage(error.message || "Microsoft sign-in failed.", { tone: "error" });
  }
}

async function createStudentAccount() {
  const email = getEl("otpEmail")?.value.trim() || "";
  const firstName = getEl("signUpFirstName")?.value.trim() || "";
  const lastName = getEl("signUpLastName")?.value.trim() || "";
  const password = getEl("signUpPassword")?.value || "";
  const confirm = getEl("signUpConfirm")?.value || "";

  if (!email) {
    setMessage("Please enter the email address first.", { tone: "error" });
    return;
  }
  if (!firstName || !lastName) {
    setMessage("Please enter the student's name and surname.", { tone: "error" });
    return;
  }
  if (!password || password.length < 6) {
    setMessage("Choose a password with at least 6 characters.", { tone: "error" });
    return;
  }
  if (password !== confirm) {
    setMessage("The password confirmation does not match.", { tone: "error" });
    return;
  }

  setMessage("Creating account...", { sticky: true });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: SITE_URL,
      data: {
        full_name: `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    console.error("[AUTH] sign up error:", error);
    setMessage(error.message || "Could not create the account.", { tone: "error", sticky: true });
    return;
  }

  if (data?.user) {
    setMessage("Account created. Check the email inbox to confirm the account if confirmation is required.", { tone: "success", sticky: true });
  } else {
    setMessage("Account created. You can now sign in with the new password.", { tone: "success", sticky: true });
  }
  clearAuthFlowModes();
}

async function signInWithSharedPassword() {
  const email = getEl("otpEmail")?.value.trim() || "";
  const password = getEl("sharedPasswordInput")?.value || "";

  if (!email) {
    setMessage("Please enter your email.", { tone: "error" });
    return;
  }
  if (!password) {
    setMessage("Please enter your password.", { tone: "error" });
    return;
  }

  try {
    const passwordLogin = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!passwordLogin.error && passwordLogin.data?.user) {
      clearSharedSession();
      await refreshAuthUI({ forceHome: true });
      return;
    }
  } catch (e) {}

  setMessage("Signing you in...", { sticky: true });
  const res = await fetch("/api/auth/shared-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);

  const data = res ? await res.json().catch(() => null) : null;
  if (!res || !res.ok || !data || data.ok !== true || !data.token || !data.user) {
    setMessage(data?.error || "Shared-password sign-in failed.", { tone: "error", sticky: true });
    return;
  }

  saveSharedSession({
    token: data.token,
    user: data.user,
    requiresPasswordSetup: data.requiresSetup === true,
    recoveryMode: data.recoveryMode || "",
  });
  saveUser(data.user);
  syncAuthExport();
  pingStudentSession(data.user).catch(() => null);
  await refreshAuthUI({ forceHome: data.requiresSetup !== true });
}

async function sendPasswordResetEmail() {
  const email = getEl("otpEmail")?.value.trim() || "";
  if (!email) {
    setMessage("Please enter your email first.", { tone: "error" });
    return;
  }

  setMessage("Sending password reset email...", { sticky: true });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: SITE_URL,
  });
  if (error) {
    console.error("[AUTH] reset password error:", error);
    setMessage(error.message || "Could not send a reset email.", { tone: "error", sticky: true });
    return;
  }

  setMessage("Password reset email sent. Open the link in the student's inbox to choose a new password.", { tone: "success", sticky: true });
}

async function finishPasswordReset() {
  const password = getEl("resetPasswordInput")?.value || "";
  const confirm = getEl("resetPasswordConfirmInput")?.value || "";

  if (!password || password.length < 6) {
    setMessage("Choose a new password with at least 6 characters.", { tone: "error" });
    return;
  }
  if (password !== confirm) {
    setMessage("The password confirmation does not match.", { tone: "error" });
    return;
  }

  setMessage("Updating your password...", { sticky: true });
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    console.error("[AUTH] finish reset error:", error);
    setMessage(error.message || "Could not update your password.", { tone: "error", sticky: true });
    return;
  }

  const email = String(data?.user?.email || getSavedUser()?.email || "").trim().toLowerCase();
  setPasswordResetMode(false, "");
  setMessage("Your password has been reset. You can now sign in with your new password.", { tone: "success", sticky: true });
  await refreshAuthUI({ forceHome: true });
}

async function upgradeSharedStudentPassword(nextPassword, profile = {}) {
  const email = String(getSavedUser()?.email || "").trim().toLowerCase();
  if (!email) throw new Error("We could not find the student email.");
  if (!nextPassword || nextPassword.length < 6) {
    throw new Error("Choose a password with at least 6 characters.");
  }
  const currentName = parseNameParts(getSavedUser()?.name || "");
  const firstName = String(profile?.firstName || currentName.firstName || "").trim();
  const lastName = String(profile?.lastName || currentName.lastName || "").trim();
  if (!firstName || !lastName) {
    throw new Error("First name and surname are required.");
  }

  const token = await getAccessToken().catch(() => null);
  if (!token) throw new Error("Your session expired. Please sign in again.");

  const res = await fetch("/api/auth/shared-setup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName,
      lastName,
      password: nextPassword,
    }),
  }).catch(() => null);
  const data = res ? await res.json().catch(() => null) : null;
  if (!res || !res.ok || !data || data.ok !== true || !data.token || !data.user) {
    throw new Error(data?.error || "Could not save the student password.");
  }
  saveSharedSession({
    token: data.token,
    user: data.user,
    requiresPasswordSetup: false,
    recoveryMode: "",
  });
  saveUser(data.user);
  syncAuthExport();
  markPersonalPasswordEnabled(email);
  clearAuthFlowModes();
  await refreshAuthUI({ forceHome: true });
  return {
    needsEmailConfirmation: false,
    message: data?.message || "Your student password has been updated.",
  };
}

async function completeSharedStudentSetup() {
  const firstName = getEl("sharedSetupFirstName")?.value.trim() || "";
  const lastName = getEl("sharedSetupLastName")?.value.trim() || "";
  const password = getEl("sharedSetupPasswordInput")?.value || "";
  const confirm = getEl("sharedSetupConfirmInput")?.value || "";

  if (!firstName || !lastName) {
    setMessage("Please enter the student's first name and surname.", { tone: "error" });
    return;
  }
  if (!password || password.length < 6) {
    setMessage("Choose a password with at least 6 characters.", { tone: "error" });
    return;
  }
  if (password !== confirm) {
    setMessage("The password confirmation does not match.", { tone: "error" });
    return;
  }

  try {
    setMessage("Saving student setup...", { sticky: true });
    const result = await upgradeSharedStudentPassword(password, { firstName, lastName });
    if (getEl("sharedSetupPasswordInput")) getEl("sharedSetupPasswordInput").value = "";
    if (getEl("sharedSetupConfirmInput")) getEl("sharedSetupConfirmInput").value = "";
    setMessage(result?.message || "Student setup complete.", { tone: "success", sticky: true });
  } catch (e) {
    console.error("[AUTH] shared setup error:", e);
    setMessage(e?.message || "Could not complete student setup.", { tone: "error", sticky: true });
  }
}

async function signInWithBypass() {
  const email = getEl("otpEmail")?.value.trim() || "";
  const bypassPassword = getEl("bypassPasswordInput")?.value || "";

  if (!email) {
    setMessage("Please enter the student email first.", { tone: "error" });
    return;
  }
  if (!bypassPassword) {
    setMessage("Please enter the bypass password.", { tone: "error" });
    return;
  }

  setMessage("Verifying bypass...", { sticky: true });
  const res = await fetch("/api/auth/shared-bypass", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, bypassPassword }),
  }).catch(() => null);
  const data = res ? await res.json().catch(() => null) : null;
  if (!res || !res.ok || !data || data.ok !== true || !data.token || !data.user) {
    setMessage(data?.error || "Bypass recovery failed.", { tone: "error", sticky: true });
    return;
  }

  saveSharedSession({
    token: data.token,
    user: data.user,
    requiresPasswordSetup: true,
    recoveryMode: "bypass",
  });
  saveUser(data.user);
  syncAuthExport();
  await refreshAuthUI();
}

async function verifyOtpCode() {
  const email = getEl("otpEmail")?.value.trim() || "";
  const token = getEl("otpCode")?.value.trim() || "";

  if (!email || !token) {
    setMessage("Enter both email and code.", { tone: "error" });
    return;
  }

  setMessage("Verifying code...", { sticky: true });
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email"
  });

  if (error) {
    console.error("[AUTH] OTP verify error:", error);
    setMessage(error.message, { tone: "error", sticky: true });
    return;
  }

  await refreshAuthUI({ forceHome: true });
}

async function logout() {
  if (loggingOut) return;
  loggingOut = true;

  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("[AUTH] Logout error:", e);
  }

  hideBlockingModals();
  showProtectedApp(false);
  clearSharedSession();
  clearSavedUser();
  syncAuthExport();
  setMessage("");
  notifyAuthChanged();

  try {
    const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
    history.replaceState({}, "", `${location.pathname}#/${activeTestId}/home`);
  } catch (e) {}

  loggingOut = false;
}

getEl("googleLoginBtn")?.addEventListener("click", signInWithGoogle);
getEl("microsoftLoginBtn")?.addEventListener("click", signInWithMicrosoft);
getEl("sharedPasswordLoginBtn")?.addEventListener("click", signInWithSharedPassword);
getEl("forgotPasswordBtn")?.addEventListener("click", showRecoveryOptions);
getEl("emailRecoveryBtn")?.addEventListener("click", sendPasswordResetEmail);
getEl("showBypassRecoveryBtn")?.addEventListener("click", () => {
  setBypassRecoveryMode(true, "Enter the bypass password to recover this student account.");
  setMessage("Enter the bypass password to reset this student's password.", { tone: "success", sticky: true });
});
getEl("useBypassBtn")?.addEventListener("click", signInWithBypass);
getEl("openSignUpBtn")?.addEventListener("click", openSignUpBox);
getEl("createAccountBtn")?.addEventListener("click", createStudentAccount);
getEl("sendOtpBtn")?.addEventListener("click", sendOtpOrMagicLink);
getEl("verifyOtpBtn")?.addEventListener("click", verifyOtpCode);
getEl("finishPasswordResetBtn")?.addEventListener("click", finishPasswordReset);
getEl("finishSharedSetupBtn")?.addEventListener("click", completeSharedStudentSetup);
getEl("closeAuthGateBtn")?.addEventListener("click", closeLoginGate);
authGate?.addEventListener("click", (e) => {
  if (e.target === authGate) closeLoginGate();
});
document.addEventListener("partials:loaded", () => {
  getEl("logoutBtn")?.addEventListener("click", logout);
}, { once: true });

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    clearSharedSession();
    if (session?.user) saveUser(session.user);
    showProtectedApp(false);
    openLoginGate("Reset your password to continue.");
    clearAuthFlowModes();
    setPasswordResetMode(true, "Choose a new password for your student account.");
    authReady = true;
    return;
  }

  if (event === "SIGNED_IN" && session?.user) {
    saveUser(session.user);
    showProtectedApp(true);
    setMessage("");
    clearAuthFlowModes();
    setPasswordResetMode(false, "");
    authReady = true;
    notifyAuthChanged();

    const shouldForceHome = hasOAuthCallbackParams() && !hasHandledInitialLoginRedirect;
    if (shouldForceHome) {
      routeHomeAfterLogin();
      clearAuthCallbackArtifacts();
      hasHandledInitialLoginRedirect = true;
    } else {
      restoreViewAfterAuth();
    }
    return;
  }

  if (event === "TOKEN_REFRESHED" && session?.user) {
    saveUser(session.user);
    showProtectedApp(true);
    setMessage("");
    clearAuthFlowModes();
    setPasswordResetMode(false, "");
    authReady = true;
    notifyAuthChanged();
    return;
  }

  if (event === "SIGNED_OUT") {
    if (getSharedSession()?.token) {
      saveUser(getSharedSession().user);
      syncAuthExport();
      setMessage("");
      authReady = true;
      refreshAuthUI().catch(() => null);
      return;
    }
    hideBlockingModals();
    showProtectedApp(false);
    clearSharedSession();
    clearSavedUser();
    syncAuthExport();
    setMessage("");
    clearAuthFlowModes();
    setPasswordResetMode(false, "");
    authReady = true;
    hasHandledInitialLoginRedirect = false;
    notifyAuthChanged();
    return;
  }
});

async function bootAuth() {
  syncAuthExport();
  showProtectedApp(false);

  try {
    const cameFromOAuth = hasOAuthCallbackParams();
    if (cameFromOAuth) {
      setMessage("Signing you in...", { sticky: true });
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    const ok = await refreshAuthUI({ forceHome: cameFromOAuth });

    if (!ok && !authReady) {
      showProtectedApp(false);
    }
  } catch (e) {
    console.error("[AUTH] Boot error:", e);
    showProtectedApp(false);
    setMessage("Could not restore your session.", { tone: "error", sticky: true });
  }
}

bootAuth();
