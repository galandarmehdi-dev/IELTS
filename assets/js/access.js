/* assets/js/access.js (patched: best-effort exam security without homepage mess; attempt-safe) */
(function () {
  "use strict";

  const S = () => window.IELTS.Storage;
  const R = () => window.IELTS.Registry;
  const UI = () => window.IELTS.UI;

  const KEY = "IELTS:ADMIN:session"; // MUST remain global (Storage keeps IELTS:ADMIN:* global)
  const DEFAULT_TTL_MIN = 240; // 4 hours

  function nowMs() { return Date.now(); }

  function getSession() {
    return S()?.getJSON(KEY, null);
  }
  function setSession(obj) {
    S()?.setJSON(KEY, obj);
  }
  function clearSession() {
    try { localStorage.removeItem(KEY); } catch {}
  }

  function isAdmin() {
    const s = getSession();
    if (!s || !s.enabledUntil) return false;
    return nowMs() < Number(s.enabledUntil);
  }

  function enableAdmin() {
    const ttlMin = Number(R()?.ADMIN_SESSION_TTL_MIN || DEFAULT_TTL_MIN);
    setSession({ enabledUntil: nowMs() + ttlMin * 60 * 1000 });
  }

  // You can hook your own prompt/flow; keep minimal
  function init() {
    // No auto-popups here. Admin is enabled elsewhere or by a separate UI.
    // If you want a passcode on /?admin=1 you can add it later.
    bindSecurityListeners();
  }

  function bindSecurityListeners() {
    // Students only
    if (isAdmin()) return;

    let warned = false;

    function shouldEnforce() {
      try {
        const started = S().get(R().KEYS.EXAM_STARTED, "false") === "true";
        const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
        return started && !finalDone;
      } catch {
        return false;
      }
    }

    function forceFinalSubmitModal() {
      if (!shouldEnforce()) return;

      // Try to move to writing and force final submit modal if available
      try { window.IELTS.Engines.Writing.startWritingSystem?.(); } catch {}
      try { UI().showOnly("writing"); } catch {}

      // If writing engine exposed final submission function, call it; else show a locked modal
      try {
        const submitFn = window.__IELTS_SUBMIT_FINAL__;
        if (typeof submitFn === "function") {
          submitFn({ reason: "security_blur" });
          return;
        }
      } catch {}

      try {
        window.IELTS?.Modal?.showModal?.(
          "Exam security",
          "You left the exam. To continue, you must END the exam and submit with your Name and Surname.",
          { mode: "locked" }
        );
      } catch {}
    }

    window.addEventListener("blur", () => {
      if (!shouldEnforce()) return;
      if (warned) return;
      warned = true;
      forceFinalSubmitModal();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        if (!shouldEnforce()) return;
        if (warned) return;
        warned = true;
        forceFinalSubmitModal();
      }
    });
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    enableAdmin,
    clearSession,
  };
})();
