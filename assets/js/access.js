/* assets/js/access.js */
(function () {
  "use strict";

  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;

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
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }

  function hasValidSession() {
    const sess = getSession();
    if (!sess || sess.enabled !== true) return false;
    if (!sess.expiresAtMs) return false;
    return nowMs() < Number(sess.expiresAtMs);
  }

  function isAdminRequestedByUrl() {
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
    if (isAdminRequestedByUrl() && !hasValidSession()) {
      enterAdmin();
    }

    // Unified UI: keep student lockdown styles for everyone.
    // Admin difference is ONLY navigation/testing ability.
    try {
      document.body.dataset.viewMode = "student";
      document.body.dataset.admin = isAdmin() ? "1" : "0";
    } catch {}
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    clearSession,
  };
})();
