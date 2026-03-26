/* assets/js/access.js */
(function () {
  "use strict";

  const S = () => window.IELTS?.Storage;
  const R = () => window.IELTS?.Registry;
  const UI = () => window.IELTS?.UI;

  const KEY = "IELTS:ADMIN:session";
  const DEFAULT_TTL_MIN = 180; // 3 hours

  let listenersBound = false;
  let initRan = false;

  function nowMs() {
    return Date.now();
  }

  function getSession() {
    try {
      return S()?.getJSON?.(KEY, null) ?? null;
    } catch {
      return null;
    }
  }

  function setSession(obj) {
    try {
      S()?.setJSON?.(KEY, obj);
    } catch {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    applyViewMode();
  }

  function hasValidSession() {
    const sess = getSession();
    if (!sess || sess.enabled !== true) return false;
    if (!sess.expiresAtMs) return false;
    return nowMs() < Number(sess.expiresAtMs);
  }

  function isAdminRequestedByUrl() {
    try {
      const qs = new URLSearchParams(window.location.search || "");
      if (qs.get("admin") === "1") return true;

      const h = String(window.location.hash || "").toLowerCase();
      if (h.startsWith("#/admin")) return true;

      return false;
    } catch {
      return false;
    }
  }

  function isAdmin() {
    return hasValidSession();
  }

  function enterAdmin() {
    const pass = window.prompt("Admin passcode:");
    if (!pass) {
      applyViewMode();
      return false;
    }

    const correct = String(R()?.ADMIN_PASSCODE || "");
    if (!correct || pass !== correct) {
      window.alert("Wrong passcode.");
      applyViewMode();
      return false;
    }

    const ttlMin = Number(R()?.ADMIN_SESSION_TTL_MIN || DEFAULT_TTL_MIN);
    setSession({
      enabled: true,
      expiresAtMs: nowMs() + ttlMin * 60 * 1000,
    });

    applyViewMode();
    return true;
  }

  function applyNoTranslateFlags() {
    try {
      document.documentElement.setAttribute("translate", "no");
      document.documentElement.classList.add("notranslate");
      document.body?.setAttribute?.("translate", "no");
      document.body?.classList?.add?.("notranslate");
    } catch {}
  }

  function applyViewMode() {
    try {
      if (!document.body) return;
      document.body.dataset.viewMode = isAdmin() ? "admin" : "student";
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent("ielts:viewmodechange", {
          detail: { isAdmin: isAdmin() },
        })
      );
    } catch {}
  }

  function bindStudentLockdownListeners() {
    if (listenersBound) return;
    listenersBound = true;

    document.addEventListener(
      "contextmenu",
      (e) => {
        if (isAdmin()) return;
        const t = e.target;
        const allowed =
          t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable === true);
        if (!allowed) e.preventDefault();
      },
      true
    );

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
  }

  function maybeEnterAdminFromUrl() {
    if (isAdminRequestedByUrl() && !hasValidSession()) {
      enterAdmin();
    } else {
      applyViewMode();
    }
  }

  function init() {
    initRan = true;
    applyNoTranslateFlags();
    bindStudentLockdownListeners();
    maybeEnterAdminFromUrl();
    return isAdmin();
  }

  function autoInit() {
    try {
      init();
    } catch (e) {
      console.error("[IELTS] Access init failed", e);
    }
  }

  // Run immediately if possible.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit, { once: true });
  } else {
    autoInit();
  }

  // Also retry once on full page load in case other namespaces were late.
  window.addEventListener(
    "load",
    () => {
      if (!initRan || !document.body?.dataset?.viewMode) autoInit();
      else applyViewMode();
    },
    { once: true }
  );

  // If the route changes to an admin route later, handle that too.
  window.addEventListener("hashchange", maybeEnterAdminFromUrl);
  window.addEventListener("popstate", maybeEnterAdminFromUrl);

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    clearSession,
    enterAdmin,
  };
})();
