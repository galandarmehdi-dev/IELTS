/* assets/js/access.js */
(function () {
  "use strict";

  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const UI = () => window.IELTS.UI;

  const KEY = "IELTS:ADMIN:session";
  const DEFAULT_TTL_MIN = 180; // 3 hours

  function nowMs() {
    return Date.now();
  }

  function getSession() {
    return S()?.getJSON(KEY, null);
  }

  function setSession(obj) {
    S()?.setJSON(KEY, obj);
  }

  function clearSession() {
    try { localStorage.removeItem(KEY); } catch {}
  }

  function hasValidSession() {
    const sess = getSession();
    if (!sess || sess.enabled !== true) return false;
    if (!sess.expiresAtMs) return false;
    return nowMs() < Number(sess.expiresAtMs);
  }

  function isAdminRequestedByUrl() {
    // admin entry triggers (choose one):
    // 1) ?admin=1
    // 2) #/admin
    const qs = new URLSearchParams(location.search);
    if (qs.get("admin") === "1") return true;

    const h = (location.hash || "").toLowerCase();
    if (h.startsWith("#/admin")) return true;

    return false;
  }

  function isAdmin() {
    return hasValidSession();
  }

  function enterAdmin() {
    const pass = prompt("Admin passcode:");
    if (!pass) return false;

    const correct = (R()?.ADMIN_PASSCODE || "");
    if (!correct || pass !== correct) {
      alert("Wrong passcode.");
      return false;
    }

    const ttlMin = Number(R()?.ADMIN_SESSION_TTL_MIN || DEFAULT_TTL_MIN);
    setSession({ enabled: true, expiresAtMs: nowMs() + ttlMin * 60 * 1000 });
    return true;
  }

  function init() {
    // If URL asks for admin, request passcode (unless session already valid)
    if (isAdminRequestedByUrl() && !hasValidSession()) {
      enterAdmin();
    }

    // Extra safety: discourage browser/Google translate overlays inside the test UI.
    // (Not bulletproof, but helps with Chrome auto-translate + extensions.)
    try {
      document.documentElement.setAttribute("translate", "no");
      document.documentElement.classList.add("notranslate");
      document.body?.setAttribute?.("translate", "no");
      document.body?.classList?.add?.("notranslate");
    } catch {}

    // Student lockdown: block right click except in inputs/textareas (allows copy/paste there)
    document.addEventListener(
      "contextmenu",
      (e) => {
        if (isAdmin()) return;
        const t = e.target;
        const allowed =
          t &&
          (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable === true);
        if (!allowed) e.preventDefault();
      },
      true
    );

    // Student lockdown: block Find (Ctrl/Cmd+F), Next/Prev Find (Ctrl/Cmd+G), and F3
    document.addEventListener(
      "keydown",
      (e) => {
        if (isAdmin()) return;
        const key = String(e.key || "").toLowerCase();
        const ctrlOrCmd = e.ctrlKey || e.metaKey;
        if ((ctrlOrCmd && (key === "f" || key === "g")) || key === "f3") {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      },
      true
    );

    // Put a flag on <body> for CSS / UI usage
    try {
      document.body.dataset.viewMode = isAdmin() ? "admin" : "student";
    } catch {}
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    clearSession,
  };
})();
