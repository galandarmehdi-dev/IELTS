import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bgujwyknnszwborgbkxq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Me6QK361KcAjS8KdUmql1Q_yGHHn_3Z";

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

function showProtectedApp(show) {
  protectedIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", !show);
  });

  if (authGate) authGate.classList.toggle("hidden", show);
  if (logoutBtn) logoutBtn.classList.toggle("hidden", !show);
}

async function refreshAuthUI() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    authMessage.textContent = error.message;
    showProtectedApp(false);
    return;
  }

  const session = data.session;

  if (session?.user) {
    const user = session.user;

    localStorage.setItem("IELTS:AUTH:user", JSON.stringify({
      id: user.id || "",
      email: user.email || "",
      name: user.user_metadata?.full_name || user.user_metadata?.name || ""
    }));

    showProtectedApp(true);
  } else {
    localStorage.removeItem("IELTS:AUTH:user");
    showProtectedApp(false);
  }
}

document.getElementById("googleLoginBtn")?.addEventListener("click", async () => {
  authMessage.textContent = "Redirecting to Google...";
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://ieltsmock.org/"
    }
  });
});

document.getElementById("microsoftLoginBtn")?.addEventListener("click", async () => {
  authMessage.textContent = "Redirecting to Microsoft...";
  await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: "https://ieltsmock.org/",
      scopes: "email"
    }
  });
});

document.getElementById("sendOtpBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("otpEmail").value.trim();
  if (!email) {
    authMessage.textContent = "Please enter your email.";
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({ email });
  authMessage.textContent = error ? error.message : "Check your email.";
});

document.getElementById("verifyOtpBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("otpEmail").value.trim();
  const token = document.getElementById("otpCode").value.trim();

  if (!email || !token) {
    authMessage.textContent = "Enter both email and code.";
    return;
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email"
  });

  authMessage.textContent = error ? error.message : "Login successful.";
  await refreshAuthUI();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  await refreshAuthUI();
});

supabase.auth.onAuthStateChange(async () => {
  await refreshAuthUI();
});

refreshAuthUI();
