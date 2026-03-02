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

  // =========================
// STUDENT PROCTORING GUARDS
// =========================
let NEED_ADMIN_UNLOCK = false;

function requireAdminUnlock(reason) {
  if (isAdmin()) return; // admins are never blocked
  if (NEED_ADMIN_UNLOCK) return;
  NEED_ADMIN_UNLOCK = true;

  const Modal = () => window.IELTS.Modal;

  try {
    Modal()?.showModal?.(
      "Admin code required",
      (reason ? reason + "\n\n" : "") + "An admin must enter the passcode to continue.",
      {
        mode: "lockedAction",
        submitText: "Enter admin code",
        onConfirm: () => {
          const pass = prompt("Admin passcode:");
          const correct = (R()?.ADMIN_PASSCODE || "");
          if (pass && correct && pass === correct) {
            NEED_ADMIN_UNLOCK = false;
            try { Modal()?.forceHideModal?.(); } catch {}
          } else {
            // keep locked; refresh message
            try {
              Modal()?.showModal?.(
                "Admin code required",
                "Wrong passcode. Please try again.",
                {
                  mode: "lockedAction",
                  submitText: "Enter admin code",
                  onConfirm: () => {
                    // re-run
                    NEED_ADMIN_UNLOCK = false;
                    requireAdminUnlock(reason);
                  },
                }
              );
            } catch {}
          }
        },
      }
    );
  } catch {}
}

function bindStudentGuardsOnce() {
  if (window.__IELTS_STUDENT_GUARDS_BOUND__) return;
  window.__IELTS_STUDENT_GUARDS_BOUND__ = true;

  // If student switches tabs/minimizes (visibility), require admin unlock on return.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") return;
    // Visible again
    requireAdminUnlock("Tab/window change detected.");
  });

  // If student leaves the window (Alt-Tab), require unlock on focus return.
  window.addEventListener("focus", () => {
    requireAdminUnlock("Window focus change detected.");
  });
}

function init() {
    // If URL asks for admin, request passcode (unless session already valid)
    if (isAdminRequestedByUrl() && !hasValidSession()) {
      enterAdmin();
    }

    // Put a flag on <body> for CSS / UI usage
    try {
      document.body.dataset.viewMode = isAdmin() ? "admin" : "student";
      if (!isAdmin()) bindStudentGuardsOnce();
    } catch {}
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    clearSession,
  };
})();
