/* assets/js/router.js */
(function () {
  "use strict";

  function setHashRoute(testId, view) {
    const safeTest = encodeURIComponent(testId || "ielts1");
    const safeView = encodeURIComponent(view || "home");
    const newHash = `#/` + safeTest + `/` + safeView;
    if (location.hash !== newHash) location.hash = newHash;
  }

  function parseHashRoute() {
    const h = (location.hash || "").replace(/^#/, "");
    const parts = h.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const testId = parts[0];
    const view = parts[1];
    return { testId, view };
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Router = { setHashRoute, parseHashRoute };
})();
