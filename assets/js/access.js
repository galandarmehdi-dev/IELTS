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
  let tenantBootstrap = null;

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
    console.warn(`[${title}] ${message}`);
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

  function getTenant() {
    const sess = getSession();
    if (sess?.tenant && typeof sess.tenant === "object") return sess.tenant;
    return tenantBootstrap;
  }

  function getOrganizationId() {
    const sess = getSession();
    const explicit = String(sess?.organizationId || getTenant()?.organizationId || "").trim().toLowerCase();
    if (explicit) return explicit;
    const hostname = String(window.location.hostname || "").trim().toLowerCase();
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".workers.dev") || hostname === "ieltsmock.org" || hostname === "www.ieltsmock.org") {
      return "ieltsmock";
    }
    return "";
  }

  function getAdminRole() {
    const sess = getSession();
    return hasVerifiedSession() ? String(sess?.role || "") : "";
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
        role: data.role || "",
        organizationId: data.organizationId || "",
        tenant: data.tenant || tenantBootstrap || null,
        isSuperAdmin: data.isSuperAdmin === true,
        activeMode: requestedMode,
        expiresAtMs: nowMs() + ttlMin * 60 * 1000,
      });
      if (data.tenant) tenantBootstrap = data.tenant;
      applyTenantBranding();
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

  function applyTenantBranding() {
    const tenant = getTenant();
    if (!tenant) return;
    const tenantName = String(tenant.name || tenant.organizationId || "IELTS Mock Practice Portal").trim() || "IELTS Mock Practice Portal";
    try {
      document.title = `${tenantName} · IELTS Mock Tests & Practice Portal`;
    } catch (e) {}

    const titleEl = document.querySelector(".home-wordmark-title");
    if (titleEl) titleEl.textContent = tenantName;
    const kickerEl = document.querySelector(".home-wordmark-kicker");
    if (kickerEl) kickerEl.textContent = tenant.isPrimaryTenant ? "Mock test platform" : "Tenant workspace";
    const footerBrand = document.querySelector(".footer-brand");
    if (footerBrand) footerBrand.textContent = tenantName;

    const host = document.querySelector(".home-brand");
    if (host) {
      let logo = host.querySelector("[data-tenant-logo='1']");
      if (tenant.logoUrl) {
        if (!logo) {
          logo = document.createElement("img");
          logo.setAttribute("data-tenant-logo", "1");
          logo.alt = `${tenantName} logo`;
          logo.style.width = "40px";
          logo.style.height = "40px";
          logo.style.objectFit = "contain";
          logo.style.borderRadius = "10px";
          logo.style.marginRight = "12px";
          host.insertBefore(logo, host.firstChild);
        }
        logo.src = tenant.logoUrl;
      } else if (logo) {
        logo.remove();
      }
    }
  }

  async function loadTenantBootstrap() {
    const hostname = String(window.location.hostname || "").trim().toLowerCase();
    if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
      return null;
    }
    const url = R()?.buildAdminApiUrl?.({ action: "tenantBootstrap" });
    if (!url) return null;
    try {
      const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
      if (res.status === 404) return null;
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true || !data.tenant) return null;
      tenantBootstrap = data.tenant;
      applyTenantBranding();
      return tenantBootstrap;
    } catch (e) {
      return null;
    }
  }

  function applyViewMode() {
    try {
      if (!document.body) return;
      document.body.dataset.viewMode = getActiveMode();
    } catch (e) {}

    try {
      window.dispatchEvent(
        new CustomEvent("ielts:viewmodechange", {
          detail: {
            isAdmin: isAdmin(),
            canToggleAdmin: canUseAdminToggle(),
            activeMode: getActiveMode(),
            adminEmail: getAdminEmail(),
            role: getAdminRole(),
            organizationId: getOrganizationId(),
            tenant: getTenant(),
          },
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
    loadTenantBootstrap().catch(() => null);
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
    getTenant,
    getOrganizationId,
    getAdminRole,
  };
})();
