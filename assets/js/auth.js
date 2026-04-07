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
const SHARED_PASSWORD_OVERRIDE_KEY = "IELTS:AUTH:sharedPasswordOverrides";
const PERSONAL_PASSWORD_MARKERS_KEY = "IELTS:AUTH:personalPasswordEmails";
const PROFILE_CACHE_BY_EMAIL_KEY = "IELTS:AUTH:profileByEmail";
const DEFAULT_SHARED_STUDENT_PASSWORD = "Leznik123";

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

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("IELTS:AUTH:user") || "null");
  } catch (e) {
    return null;
  }
}

function getSharedSession() {
  try {
    return JSON.parse(localStorage.getItem(SHARED_SESSION_KEY) || "null");
  } catch (e) {
    return null;
  }
}

function getSharedPasswordOverrides() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHARED_PASSWORD_OVERRIDE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveSharedPasswordOverrides(next) {
  try {
    localStorage.setItem(SHARED_PASSWORD_OVERRIDE_KEY, JSON.stringify(next || {}));
  } catch (e) {}
}

function getPersonalPasswordMarkers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PERSONAL_PASSWORD_MARKERS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function savePersonalPasswordMarkers(next) {
  try {
    localStorage.setItem(PERSONAL_PASSWORD_MARKERS_KEY, JSON.stringify(next || {}));
  } catch (e) {}
}

function markPersonalPasswordEnabled(email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return;
  const next = { ...getPersonalPasswordMarkers(), [key]: true };
  savePersonalPasswordMarkers(next);
}

function hasPersonalPasswordEnabled(email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return false;
  return getPersonalPasswordMarkers()[key] === true;
}

function getSharedPasswordOverride(email) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return null;
  const all = getSharedPasswordOverrides();
  return all[key] || null;
}

async function hashSharedPassword(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  const payload = new TextEncoder().encode(`${normalizedEmail}::${normalizedPassword}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function saveSharedPasswordOverride(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Missing student email.");
  if (!password) throw new Error("Please enter a new password.");

  const next = { ...getSharedPasswordOverrides() };
  next[normalizedEmail] = {
    hash: await hashSharedPassword(normalizedEmail, password),
    changedAt: new Date().toISOString(),
  };
  saveSharedPasswordOverrides(next);
}

async function verifySharedPasswordOverride(email, password) {
  const record = getSharedPasswordOverride(email);
  if (!record?.hash) return false;
  const actual = await hashSharedPassword(email, password);
  return actual === record.hash;
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
  const otpBtn = getEl("sendOtpBtn");
  if (otpBtn) otpBtn.classList.toggle("hidden", !!active);
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
    localStorage.setItem(
      "IELTS:AUTH:user",
      JSON.stringify({
        id: user?.id || "",
        identityKey: getIdentityKeyFromUserLike(user),
        email: user?.email || "",
        name: fullName,
        avatarUrl: avatar,
        provider,
        createdAt: user?.created_at || "",
        lastSignInAt: user?.last_sign_in_at || "",
        profile
      })
    );
  } catch (e) {}
}

function clearSavedUser() {
  try {
    localStorage.removeItem("IELTS:AUTH:user");
  } catch (e) {}
}

function saveSharedSession(session) {
  try {
    localStorage.setItem(SHARED_SESSION_KEY, JSON.stringify(session));
  } catch (e) {}
}

function clearSharedSession() {
  try {
    localStorage.removeItem(SHARED_SESSION_KEY);
  } catch (e) {}
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
    saveSharedPasswordOverride,
    getSharedPasswordOverride,
    sendPasswordResetEmail,
    upgradeSharedStudentPassword,
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

function sanitizeDesiredView(view) {
  const raw = String(view || "").trim();
  const normalized = raw === "results" ? "adminResults" : raw;
  const allowedViews = new Set(["home", "dashboard", "history", "listening", "reading", "writing", "speaking", "adminResults", "fullExamHub", "readingHub", "listeningHub", "writingHub", "writingTask1SamplesHub", "writingTask2SamplesHub", "speakingHub", "contactHub"]);

  if (!allowedViews.has(normalized)) return "home";
  if (normalized === "adminResults" && window.IELTS?.Access?.isAdmin?.() !== true) return "home";
  return normalized;
}

function restoreViewAfterAuth() {
  hideBlockingModals();

  const view = sanitizeDesiredView(getDesiredView());
  const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";

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
  try {
    localStorage.setItem("IELTS:HOME:lastView", "home");
    localStorage.setItem("IELTS:EXAM:started", "false");
  } catch (e) {}

  hideBlockingModals();
  forceHideAllAppSections();

  try {
    const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute(activeTestId, "home");
    } else {
      history.replaceState({}, "", `${location.pathname}#/${activeTestId}/home`);
    }
  } catch (e) {}

  try {
    window.IELTS?.UI?.showOnly?.("home");
    window.IELTS?.UI?.setExamNavStatus?.("Status: Ready");
    window.IELTS?.UI?.updateHomeStatusLine?.("Status: Signed in");
  } catch (e) {
    const home = getEl("homeSection");
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
    showProtectedApp(true);
    setMessage("");
    authReady = true;
    pingStudentSession(shared.user).catch(() => null);
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
  try {
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

async function sendOtpOrMagicLink() {
  const email = getEl("otpEmail")?.value.trim() || "";
  if (!email) {
    setMessage("Please enter your email.", { tone: "error" });
    return;
  }

  setMessage("Sending... Please wait.", { sticky: true });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: SITE_URL
    }
  });

  if (error) {
    console.error("[AUTH] OTP send error:", error);
  }
  setMessage(error ? error.message : "Check your email for the code or magic link.", { tone: error ? "error" : "success", sticky: !error });
}

async function signInWithSharedPassword() {
  const email = getEl("otpEmail")?.value.trim() || "";
  const password = getEl("sharedPasswordInput")?.value || "";

  if (!email) {
    setMessage("Please enter your email.", { tone: "error" });
    return;
  }
  if (!password) {
    setMessage("Please enter the shared password.", { tone: "error" });
    return;
  }

  const hasOverride = !!getSharedPasswordOverride(email);
  const hasPersonalPassword = hasPersonalPasswordEnabled(email);

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

  if (hasPersonalPassword) {
    setMessage("Wrong email or password. If you forgot it, use Forgot password.", { tone: "error" });
    return;
  }

  if (hasOverride) {
    const matches = await verifySharedPasswordOverride(email, password);
    if (!matches) {
      setMessage("Wrong email or password. If you forgot it, use Forgot password.", { tone: "error" });
      return;
    }
  }

  setMessage("Signing you in...", { sticky: true });
  const res = await fetch("/api/auth/shared-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: hasOverride ? DEFAULT_SHARED_STUDENT_PASSWORD : password }),
  }).catch(() => null);

  const data = res ? await res.json().catch(() => null) : null;
  if (!res || !res.ok || !data || data.ok !== true || !data.token || !data.user) {
    setMessage(data?.error || "Shared-password sign-in failed.", { tone: "error", sticky: true });
    return;
  }

  saveSharedSession({ token: data.token, user: data.user });
  saveUser(data.user);
  syncAuthExport();
  showProtectedApp(true);
  setMessage("");
  pingStudentSession(data.user).catch(() => null);
  routeHomeAfterLogin();
  notifyAuthChanged();
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

  setMessage("Password reset email sent. Open the link in your inbox to choose a new password.", { tone: "success", sticky: true });
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
  if (email) {
    markPersonalPasswordEnabled(email);
  }
  setPasswordResetMode(false, "");
  setMessage("Your password has been reset. You can now sign in with your new password.", { tone: "success", sticky: true });
  await refreshAuthUI({ forceHome: true });
}

async function upgradeSharedStudentPassword(nextPassword) {
  const email = String(getSavedUser()?.email || "").trim().toLowerCase();
  if (!email) throw new Error("We could not find the student email.");
  if (!nextPassword || nextPassword.length < 6) {
    throw new Error("Choose a password with at least 6 characters.");
  }

  // Keep the existing local bridge so current-device sign-in works even if signup returns without a session.
  await saveSharedPasswordOverride(email, nextPassword);

  const user = getSavedUser() || {};
  const metadata = {
    full_name: String(user?.name || "").trim(),
    preferred_name: String(user?.profile?.preferredName || user?.name || "").trim(),
    username: String(user?.profile?.username || "").trim(),
    profile_headline: String(user?.profile?.headline || "").trim(),
    profile_bio: String(user?.profile?.bio || "").trim(),
    profile_avatar_url: String(user?.profile?.avatarUrl || user?.avatarUrl || "").trim(),
    target_band: String(user?.profile?.targetBand || "").trim(),
    focus_skill: String(user?.profile?.focusSkill || "").trim(),
    preferred_test: String(user?.profile?.preferredTest || "").trim(),
    daily_goal: String(user?.profile?.dailyGoal || "").trim(),
    study_note: String(user?.profile?.studyNote || "").trim(),
    font_scale: String(user?.profile?.fontScale || "").trim(),
  };

  const signUpResult = await supabase.auth.signUp({
    email,
    password: nextPassword,
    options: {
      emailRedirectTo: SITE_URL,
      data: metadata,
    }
  });

  if (signUpResult.error && !/already registered|already exists|User already registered/i.test(String(signUpResult.error.message || ""))) {
    throw signUpResult.error;
  }

  const signInResult = await supabase.auth.signInWithPassword({ email, password: nextPassword });
  if (signInResult.error || !signInResult.data?.user) {
    if (signUpResult.data?.user) {
      markPersonalPasswordEnabled(email);
      return {
        needsEmailConfirmation: true,
        message: "Check your email to confirm the password change, then sign in with your new password.",
      };
    }
    throw signInResult.error || new Error("Could not activate the new password.");
  }

  clearSharedSession();
  markPersonalPasswordEnabled(email);
  await refreshAuthUI({ forceHome: true });
  return {
    needsEmailConfirmation: false,
    message: "Your student password has been updated.",
  };
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
getEl("forgotPasswordBtn")?.addEventListener("click", sendPasswordResetEmail);
getEl("sendOtpBtn")?.addEventListener("click", sendOtpOrMagicLink);
getEl("verifyOtpBtn")?.addEventListener("click", verifyOtpCode);
getEl("finishPasswordResetBtn")?.addEventListener("click", finishPasswordReset);
getEl("closeAuthGateBtn")?.addEventListener("click", closeLoginGate);
authGate?.addEventListener("click", (e) => {
  if (e.target === authGate) closeLoginGate();
});
document.addEventListener("partials:loaded", () => {
  getEl("logoutBtn")?.addEventListener("click", logout);
}, { once: true });

supabase.auth.onAuthStateChange((event, session) => {
  console.log("[AUTH] onAuthStateChange:", event);

  if (event === "PASSWORD_RECOVERY") {
    clearSharedSession();
    if (session?.user) saveUser(session.user);
    showProtectedApp(false);
    openLoginGate("Reset your password to continue.");
    setPasswordResetMode(true, "Choose a new password for your student account.");
    authReady = true;
    return;
  }

  if (event === "SIGNED_IN" && session?.user) {
    saveUser(session.user);
    showProtectedApp(true);
    setMessage("");
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
    setPasswordResetMode(false, "");
    authReady = true;
    notifyAuthChanged();
    return;
  }

  if (event === "SIGNED_OUT") {
    if (getSharedSession()?.token) {
      saveUser(getSharedSession().user);
      syncAuthExport();
      showProtectedApp(true);
      setMessage("");
      authReady = true;
      notifyAuthChanged();
      return;
    }
    hideBlockingModals();
    showProtectedApp(false);
    clearSharedSession();
    clearSavedUser();
    syncAuthExport();
    setMessage("");
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
