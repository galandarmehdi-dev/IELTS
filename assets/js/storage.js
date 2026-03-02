/* assets/js/storage.js (patched: attempt-based state) */
(function () {
  "use strict";

  const CURRENT_ATTEMPT_KEY = "IELTS:CURRENT_ATTEMPT_ID"; // sessionStorage
  const ATTEMPT_PREFIX = "IELTS:ATTEMPT:"; // localStorage prefix for namespaced keys

  // Keys/prefixes that MUST remain global (not attempt-scoped)
  const GLOBAL_PREFIXES = [
    "IELTS:ADMIN:",          // admin session gating
    "IELTS:CURRENT_ATTEMPT", // session key prefix (safety)
    ATTEMPT_PREFIX,          // already scoped
  ];

  function isGlobalKey(key) {
    if (!key || typeof key !== "string") return true;
    if (!key.startsWith("IELTS:")) return true; // non-IELTS keys untouched
    return GLOBAL_PREFIXES.some((p) => key.startsWith(p));
  }

  function getAttemptId() {
    try {
      const v = sessionStorage.getItem(CURRENT_ATTEMPT_KEY);
      return v && String(v).trim() ? String(v) : null;
    } catch {
      return null;
    }
  }

  function setAttemptId(id) {
    try {
      sessionStorage.setItem(CURRENT_ATTEMPT_KEY, String(id));
    } catch {}
  }

  function genAttemptId() {
    try {
      if (crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch {}
    // fallback
    return "a_" + Date.now() + "_" + Math.random().toString(16).slice(2);
  }

  function ensureAttemptId() {
    let id = getAttemptId();
    if (id) return id;
    id = genAttemptId();
    setAttemptId(id);
    return id;
  }

  function scopedKey(key, opts) {
    // Only scope IELTS:* keys that are not global.
    if (!key || typeof key !== "string") return key;
    if (isGlobalKey(key)) return key;

    const attemptId = (opts && opts.createAttempt) ? ensureAttemptId() : getAttemptId();
    if (!attemptId) return key; // no attempt yet -> keep global (e.g., homepage before start)

    return `${ATTEMPT_PREFIX}${attemptId}:${key}`;
  }

  function migrateLegacyIfFound(scoped, legacy) {
    try {
      const v = localStorage.getItem(legacy);
      if (v !== null) {
        // Copy legacy into scoped (one-way)
        localStorage.setItem(scoped, v);
      }
    } catch {}
  }

  const Storage = {
    // Attempt helpers
    getAttemptId,
    ensureAttemptId,
    startNewAttempt() {
      const id = genAttemptId();
      setAttemptId(id);
      return id;
    },
    clearAttempt(attemptId) {
      if (!attemptId) return;
      const prefix = `${ATTEMPT_PREFIX}${attemptId}:`;
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) localStorage.removeItem(k);
        }
      } catch {}
    },
    clearAllAttemptsAndLegacy() {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (!k) continue;
          // remove all attempt data; keep admin session
          if (k.startsWith(ATTEMPT_PREFIX)) localStorage.removeItem(k);
          // optionally remove legacy IELTS keys (older versions)
          if (k.startsWith("IELTS:") && !k.startsWith("IELTS:ADMIN:")) localStorage.removeItem(k);
        }
      } catch {}
      try { sessionStorage.removeItem(CURRENT_ATTEMPT_KEY); } catch {}
    },

    // Core API (backward-compatible)
    get(key, fallback = null) {
      const sk = scopedKey(key, { createAttempt: false });
      try {
        const v = localStorage.getItem(sk);
        if (v !== null) return v;

        // Legacy fallback (only if scoped differs)
        if (sk !== key) {
          const legacy = localStorage.getItem(key);
          if (legacy !== null) {
            migrateLegacyIfFound(sk, key);
            return legacy;
          }
        }
        return fallback;
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      const sk = scopedKey(key, { createAttempt: true });
      try {
        localStorage.setItem(sk, String(value));
      } catch {}
    },

    remove(key) {
      const sk = scopedKey(key, { createAttempt: false });
      try { localStorage.removeItem(sk); } catch {}
      // also remove legacy
      try { if (sk !== key) localStorage.removeItem(key); } catch {}
    },

    getJSON(key, fallback = null) {
      const raw = Storage.get(key, null);
      if (!raw) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },

    setJSON(key, obj) {
      try {
        Storage.set(key, JSON.stringify(obj));
      } catch {}
    },

    removeByPrefixes(prefixes) {
      // NOTE: prefixes are treated as *IELTS keys*, and will be scoped automatically if appropriate.
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (prefixes.some((p) => k.startsWith(p))) localStorage.removeItem(k);
        }
      } catch {}
    },

    // Utility: get the fully qualified key for current attempt (for debugging)
    scopedKeyFor(key) {
      return scopedKey(key, { createAttempt: false });
    },
  };

  window.IELTS = window.IELTS || {};
  window.IELTS.Storage = Storage;
})();
