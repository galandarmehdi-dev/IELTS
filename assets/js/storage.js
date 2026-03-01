/* assets/js/storage.js */
(function () {
  "use strict";

  const Storage = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : v;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, String(value));
      } catch {}
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
    getJSON(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    setJSON(key, obj) {
      try {
        localStorage.setItem(key, JSON.stringify(obj));
      } catch {}
    },
    removeByPrefixes(prefixes) {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (prefixes.some((p) => k.startsWith(p))) localStorage.removeItem(k);
        }
      } catch {}
    },
  };

  window.IELTS = window.IELTS || {};
  window.IELTS.Storage = Storage;
})();
