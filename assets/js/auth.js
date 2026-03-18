import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bgujwyknnszwborgbkxq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Me6QK361KcAjS8KdUmql1Q_yGHHn_3Z";
const SITE_URL = "https://ieltsmock.org";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const authGate = document.getElementById("authGate");
const authMessage = document.getElementById("authMessage");
const logoutBtn = document.getElementById("logoutBtn");

const protectedIds = [
  "homeSection",
  "listeningSection",
  "readingControls",
  "container",
  "writingSection",
  "examNav",
  "adminResultsSection"
];

function getEl(id) {
  return document.getElementById(id);
}

function showProtectedApp(show) {
  protectedIds.forEach((id) => {
    const el = getEl(id);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  });

  if (authGate) authGate.classList.toggle("hidden", show);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !show);
}

function setMessage(text) {
  if (authMessage) authMessage.textContent = text || "";
}

function saveUser(user) {
  localStorage.setItem(
    "IELTS:AUTH:user",
    JSON.stringify({
      id: user?.id || "",
      email: user?.email || "",
      name: user?.user_metadata?.full_name || user?.user_metadata?.name || ""
    })
  );
}

function clearSavedUser() {
  localStorage.removeItem("IELTS:AUTH:user");
}

function hideBlockingModals() {
  ["modal", "listenModal"].forEach((id) => {
    const el = getEl(id);
    if (el) el.classList.add("hidden");
  });
}

function forceHomeAfterLogin() {
  try {
    localStorage.setItem("IELTS:HOME:lastView", "home");
    localStorage.setItem("IELTS:EXAM:started", "false");
  } catch {}

  hideBlockingModals();

  try {
    window.IELTS?.UI?.showOnly?.("home");
    window.IELTS?.UI?.setExamNavStatus?.("Status: Ready");
    window.IELTS?.UI?.updateHomeStatusLine?.("Status: Signed in");
  } catch {}

  try {
    const home = getEl("homeSection");
    const listening = getEl("listeningSection");
    const readingControls = getEl("readingControls");
    const container = getEl("container");
    const writing = getEl("writingSection");
    const examNav = getEl("examNav");
    const admin = getEl("adminResultsSection");

    home?.classList.remove("hidden");
    listening?.classList.add("hidden");
    readingControls?.classList.add("hidden");
    container?.classList.add("hidden");
    writing?.classList.add("hidden");
    admin?.classList.add("hidden");
    examNav?.classList.add("hidden");
  } catch {}

  try {
    const activeTestId = window.IELTS?.Registry?.getActiveTestId?.() || "ielts1";
    if (window.IELTS?.Router?.setHashRoute) {
      window.IELTS.Router.setHashRoute(activeTestId, "home");
    } else if (location.hash === "#" || !location.hash) {
      history.replaceState({}, "", `${location.pathname}#/` + activeTestId + `/home`);
    }
  } catch {}
}

function clearOAuthFragmentsIfNeeded() {
  if (location.hash === "#") {
    try {
      history.replaceState({}, "", location.pathname + location.search);
    } catch {}
  }
}

async function refreshAuthUI({ forceHome = false } = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    setMessage(error.message);
    clearSavedUser();
    showProtectedApp(false);
    return;
  }

  const session = data.session;

  if (session?.user) {
    saveUser(session.user);
    showProtectedApp(true);
    if (forceHome || location.hash === "#" || !location.hash) {
      forceHomeAfterLogin();
    }
  } else {
    clearSavedUser();
    hideBlockingModals();
    showProtectedApp(false);
    clearOAuthFragmentsIfNeeded();
  }
}

async function signInWithGoogle() {
  setMessage("Redirecting to Google...");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: SITE_URL
    }
  });
  if (error) setMessage(error.message);
}

async function signInWithMicrosoft() {
  setMessage("Redirecting to Microsoft...");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: SITE_URL,
      scopes: "email"
    }
  });
  if (error) setMessage(error.message);
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
    setMessage(error.message);
    return;
  }

  setMessage("Login successful.");
  await refreshAuthUI({ forceHome: true });
}

async function logout() {
  await supabase.auth.signOut();
  hideBlockingModals();
  showProtectedApp(false);
  clearSavedUser();
  setMessage("");
  try {
    history.replaceState({}, "", location.pathname + location.search);
  } catch {}
}

getEl("googleLoginBtn")?.addEventListener("click", signInWithGoogle);
getEl("microsoftLoginBtn")?.addEventListener("click", signInWithMicrosoft);
getEl("sendOtpBtn")?.addEventListener("click", sendOtpOrMagicLink);
getEl("verifyOtpBtn")?.addEventListener("click", verifyOtpCode);
logoutBtn?.addEventListener("click", logout);

supabase.auth.onAuthStateChange(async (event) => {
  if (event === "SIGNED_IN") {
    await refreshAuthUI({ forceHome: true });
    return;
  }
  if (event === "SIGNED_OUT") {
    await logout();
    return;
  }
  await refreshAuthUI();
});

showProtectedApp(false);
refreshAuthUI({ forceHome: location.hash === "#" || !location.hash });
