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

let authReady = false;
let loggingOut = false;
let hasHandledInitialLoginRedirect = false;

function getEl(id) {
  return document.getElementById(id);
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("IELTS:AUTH:user") || "null");
  } catch (e) {
    return null;
  }
}

function setMessage(text) {
  if (authMessage) authMessage.textContent = text || "";
}

function saveUser(user) {
  try {
    localStorage.setItem(
      "IELTS:AUTH:user",
      JSON.stringify({
        id: user?.id || "",
        email: user?.email || "",
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || ""
      })
    );
  } catch (e) {}
}

function clearSavedUser() {
  try {
    localStorage.removeItem("IELTS:AUTH:user");
  } catch (e) {}
}

function syncAuthExport() {
  window.IELTS = window.IELTS || {};
  window.IELTS.Auth = {
    supabase,
    getSavedUser,
    getAccessToken,
    showProtectedApp,
    refreshAuthUI,
    logout
  };
}

async function getAccessToken() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch (e) {
    return null;
  }
}

function notifyAuthChanged() {
  try {
    window.dispatchEvent(new CustomEvent("ielts:authchanged"));
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
    "examNav",
    "adminResultsSection"
  ].forEach((id) => {
    const el = getEl(id);
    if (el) el.classList.add("hidden");
  });
}

function showProtectedApp(show) {
  const logoutBtn = getEl("logoutBtn");
  if (authGate) authGate.classList.toggle("hidden", show);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !show);

  if (!show) {
    forceHideAllAppSections();
    return;
  }
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

function restoreViewAfterAuth() {
  hideBlockingModals();

  const view = getDesiredView();
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
    listening: "listeningSection",
    reading: "readingControls",
    writing: "writingSection",
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
    setMessage(error.message || "Authentication error.");
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
    saveUser(user);
    syncAuthExport();
    showProtectedApp(true);
    setMessage("");
    authReady = true;

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

  clearSavedUser();
  syncAuthExport();
  hideBlockingModals();
  showProtectedApp(false);
  authReady = true;
  notifyAuthChanged();
  return false;
}

async function signInWithGoogle() {
  setMessage("Redirecting to Google...");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: SITE_URL,
      skipBrowserRedirect: false
    }
  });
  if (error) {
    console.error("[AUTH] Google sign-in error:", error);
    setMessage(error.message || "Google sign-in failed.");
  }
}

async function signInWithMicrosoft() {
  setMessage("Redirecting to Microsoft...");
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
    setMessage(error.message || "Microsoft sign-in failed.");
  }
}

async function sendOtpOrMagicLink() {
  const email = getEl("otpEmail")?.value.trim() || "";
  if (!email) {
    setMessage("Please enter your email.");
    return;
  }

  setMessage("Sending... Please wait.");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: SITE_URL
    }
  });

  if (error) {
    console.error("[AUTH] OTP send error:", error);
  }
  setMessage(error ? error.message : "Check your email for the code or magic link.");
}

async function verifyOtpCode() {
  const email = getEl("otpEmail")?.value.trim() || "";
  const token = getEl("otpCode")?.value.trim() || "";

  if (!email || !token) {
    setMessage("Enter both email and code.");
    return;
  }

  setMessage("Verifying code...");
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email"
  });

  if (error) {
    console.error("[AUTH] OTP verify error:", error);
    setMessage(error.message);
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
getEl("sendOtpBtn")?.addEventListener("click", sendOtpOrMagicLink);
getEl("verifyOtpBtn")?.addEventListener("click", verifyOtpCode);
document.addEventListener("partials:loaded", () => {
  getEl("logoutBtn")?.addEventListener("click", logout);
}, { once: true });

supabase.auth.onAuthStateChange((event, session) => {
  console.log("[AUTH] onAuthStateChange:", event);

  if (event === "SIGNED_IN" && session?.user) {
    saveUser(session.user);
    showProtectedApp(true);
    setMessage("");
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
    authReady = true;
    notifyAuthChanged();
    return;
  }

  if (event === "SIGNED_OUT") {
    hideBlockingModals();
    showProtectedApp(false);
    clearSavedUser();
    syncAuthExport();
    setMessage("");
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
      setMessage("Signing you in...");
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    const ok = await refreshAuthUI({ forceHome: cameFromOAuth });

    if (!ok && !authReady) {
      showProtectedApp(false);
    }
  } catch (e) {
    console.error("[AUTH] Boot error:", e);
    showProtectedApp(false);
    setMessage("Could not restore your session.");
  }
}

bootAuth();
