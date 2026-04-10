/* assets/js/access.js */
(function () {
  "use strict";

  const S = () => window.IELTS?.Storage;
  const R = () => window.IELTS?.Registry;
  const UI = () => window.IELTS?.UI;
  const Modal = () => window.IELTS?.Modal;

  const KEY = "IELTS:ADMIN:session";
  const DEFAULT_TTL_MIN = 180; // 3 hours
  const MODE_ADMIN = "admin";
  const MODE_STUDENT = "student";

  let listenersBound = false;
  let initRan = false;

  function nowMs() {
    return Date.now();
  }

  function showNotice(message, title = "Admin access") {
    if (Modal()?.showModal) {
      Modal().showModal(title, message, { mode: "confirm" });
      return;
    }
    window.alert(message);
  }

  function getSession() {
    try {
      return S()?.getJSON?.(KEY, null) ?? null;
    } catch (e) {
      return null;
    }
  }

  function setSession(obj) {
    try {
      S()?.setJSON?.(KEY, obj);
    } catch (e) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
    applyViewMode();
  }

  function hasVerifiedSession() {
    const sess = getSession();
    if (!sess || sess.enabled !== true || sess.authorized !== true) return false;
    if (!sess.expiresAtMs) return false;
    return nowMs() < Number(sess.expiresAtMs);
  }

  function getActiveMode() {
    const sess = getSession();
    if (!hasVerifiedSession()) return MODE_STUDENT;
    return sess?.activeMode === MODE_ADMIN ? MODE_ADMIN : MODE_STUDENT;
  }

  function isAdminRequestedByUrl() {
    try {
      const qs = new URLSearchParams(window.location.search || "");
      if (qs.get("admin") === "1") return true;

      const h = String(window.location.hash || "").toLowerCase();
      if (h.startsWith("#/admin")) return true;

      return false;
    } catch (e) {
      return false;
    }
  }

  function isAdmin() {
    return hasVerifiedSession() && getActiveMode() === MODE_ADMIN;
  }

  function canUseAdminToggle() {
    return hasVerifiedSession();
  }

  async function getAccessToken() {
    try {
      const session = await window.IELTS?.Auth?.supabase?.auth?.getSession?.();
      return session?.data?.session?.access_token || null;
    } catch (e) {
      return null;
    }
  }

  async function refreshAdminSession(options = {}) {
    const interactive = options && options.interactive === true;
    const requestedMode = options?.targetMode === MODE_ADMIN ? MODE_ADMIN : MODE_STUDENT;
    const ttlMin = Number(R()?.ADMIN_SESSION_TTL_MIN || DEFAULT_TTL_MIN);
    const token = await getAccessToken();
    const url = R()?.buildAdminApiUrl?.({ action: "session" });

    if (!url) {
      clearSession();
      if (interactive) showNotice("Admin access is not configured right now.");
      return false;
    }

    if (!token) {
      clearSession();
      if (interactive) showNotice("Sign in first, then try admin mode again.");
      return false;
    }

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true || data.authorized !== true) {
        clearSession();
        if (interactive) {
          showNotice((data && data.error) || "Your account is not allowed to use admin tools.");
        }
        return false;
      }

      setSession({
        enabled: true,
        authorized: true,
        email: data.email || "",
        activeMode: requestedMode,
        expiresAtMs: nowMs() + ttlMin * 60 * 1000,
      });
      applyViewMode();
      return true;
    } catch (e) {
      clearSession();
      if (interactive) showNotice("Could not verify admin access right now.");
      return false;
    }
  }

  function enterAdmin() {
    refreshAdminSession({ interactive: true, targetMode: MODE_ADMIN });
    return false;
  }

  function enterStudent() {
    const sess = getSession();
    if (!sess || !hasVerifiedSession()) {
      clearSession();
      return false;
    }
    setSession({
      ...sess,
      enabled: true,
      authorized: true,
      activeMode: MODE_STUDENT,
    });
    applyViewMode();
    return false;
  }

  function toggleAdminMode() {
    if (isAdmin()) return enterStudent();
    return enterAdmin();
  }

  async function syncAdminEligibility(options = {}) {
    const interactive = options && options.interactive === true;
    const requestedMode =
      options?.targetMode === MODE_ADMIN
        ? MODE_ADMIN
        : isAdminRequestedByUrl()
          ? MODE_ADMIN
          : getActiveMode();
    return refreshAdminSession({ interactive, targetMode: requestedMode });
  }

  function getAdminEmail() {
    const sess = getSession();
    return hasVerifiedSession() ? String(sess?.email || "") : "";
  }

  function applyNoTranslateFlags() {
    try {
      document.documentElement.setAttribute("translate", "no");
      document.documentElement.classList.add("notranslate");
      document.body?.setAttribute?.("translate", "no");
      document.body?.classList?.add?.("notranslate");
    } catch (e) {}
  }

  function applyViewMode() {
    try {
      if (!document.body) return;
      document.body.dataset.viewMode = getActiveMode();
    } catch (e) {}

    try {
      window.dispatchEvent(
        new CustomEvent("ielts:viewmodechange", {
          detail: { isAdmin: isAdmin(), canToggleAdmin: canUseAdminToggle(), activeMode: getActiveMode(), adminEmail: getAdminEmail() },
        })
      );
    } catch (e) {}
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
    if (isAdminRequestedByUrl()) {
      syncAdminEligibility({ targetMode: MODE_ADMIN });
    } else {
      syncAdminEligibility({ targetMode: getActiveMode() }).catch(() => applyViewMode());
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit, { once: true });
  } else {
    autoInit();
  }

  window.addEventListener(
    "load",
    () => {
      if (!initRan || !document.body?.dataset?.viewMode) autoInit();
      else applyViewMode();
    },
    { once: true }
  );

  window.addEventListener("hashchange", maybeEnterAdminFromUrl);
  window.addEventListener("popstate", maybeEnterAdminFromUrl);
  window.addEventListener("ielts:authchanged", () => {
    if (hasVerifiedSession() || isAdminRequestedByUrl()) {
      syncAdminEligibility();
      return;
    }
    syncAdminEligibility().catch(() => clearSession());
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    canUseAdminToggle,
    getActiveMode,
    clearSession,
    enterAdmin,
    enterStudent,
    toggleAdminMode,
    refreshAdminSession,
    syncAdminEligibility,
  };
})();
