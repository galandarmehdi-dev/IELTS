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
  // STUDENT SECURITY (best-effort; cannot be perfect in a browser)
  // =========================
  function applyExamSecurityLockdown() {
    // Admins should not be restricted
    if (isAdmin()) return;

    // 1) Disable right-click (allow in inputs / textareas / editable, and allow normal copy when text is selected)
    document.addEventListener(
      "contextmenu",
      (e) => {
        const t = e.target;
        const isEditable =
          t &&
          (t.closest?.("input, textarea, [contenteditable='true']") ||
            t.isContentEditable);

        const sel = (window.getSelection?.().toString?.() || "").trim();
        const hasSelection = sel.length > 0;

        // Allow right-click inside text fields, or when user has selected text (copy)
        if (isEditable || hasSelection) return;

        e.preventDefault();
      },
      true
    );

    // 2) Block Find-on-page and some common "escape" shortcuts (keep copy/paste allowed)
    document.addEventListener(
      "keydown",
      (e) => {
        const k = String(e.key || "").toLowerCase();
        const ctrl = e.ctrlKey || e.metaKey;

        // Block Ctrl/Cmd+F (Find), Ctrl/Cmd+P (Print), Ctrl/Cmd+S (Save), Ctrl/Cmd+U (View source)
        if (ctrl && (k === "f" || k === "p" || k === "s" || k === "u")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        // Block DevTools shortcuts
        if (k === "f12" || (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c"))) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      },
      true
    );

    // 3) Tab switch / minimize / window blur detection (cannot truly block; show a forced gate)
    let warned = false;
    const warn = (reason) => {
      if (warned) return;
      warned = true;

      const msg =
        "We detected you leaving the exam (" +
        reason +
        "). To close the window / switch tabs, you must END the exam and submit with your Name and Surname first.";

      // If already submitted, do nothing.
      const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
      if (finalDone) return;

      // Force the student into the final-submit modal (no "Back to exam" gate).
      // Browsers can't truly block tab switching/closing; the best reliable flow is to require submission.
      const forceFinal = () => {
        try {
          window.IELTS?.Engines?.Writing?.startWritingSystem?.();
        } catch {}
        try {
          UI()?.showOnly?.("writing");
          UI()?.setExamNavStatus?.("Status: Writing in progress");
        } catch {}

        // Writing engine defines __IELTS_SUBMIT_FINAL__. Show the final modal as soon as it's available.
        const showFinalModal = () => {
          if (typeof window.__IELTS_SUBMIT_FINAL__ === "function" && window.IELTS?.Modal?.showModal) {
            window.IELTS.Modal.showModal("Exam security", msg, { mode: "final" });
            return true;
          }
          return false;
        };

        if (showFinalModal()) return;

        // small retry in case writing engine registers the submit function async
        setTimeout(() => {
          showFinalModal();
        }, 0);
      };

      forceFinal();
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) warn("tab hidden");
    });

    window.addEventListener("blur", () => warn("window blur"));

    // 4) Leaving the page (close/reload) — browsers may ignore custom text
    window.addEventListener("beforeunload", (e) => {
      const finalDone = S().get(R().EXAM.keys.finalSubmitted, "false") === "true";
      if (!finalDone) {
        e.preventDefault();
        e.returnValue = "";
      }
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
    } catch {}

    // Apply student security restrictions (best-effort)
    try { applyExamSecurityLockdown(); } catch {}
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Access = {
    init,
    isAdmin,
    clearSession,
  };
})();
