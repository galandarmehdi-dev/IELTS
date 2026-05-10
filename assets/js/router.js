/* assets/js/router.js */
(function () {
  "use strict";

  function setHashRoute(testId, view) {
    const safeTest = encodeURIComponent(testId || (window.IELTS?.Registry?.getActiveTestId?.() || window.IELTS?.Registry?.TESTS?.defaultTestId || "ielts1"));
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

  const PATH_TO_VIEW = {
    "/mock-tests/": () => {
      try {
        if (typeof window.IELTS?.App?.openResourceHub === "function") {
          window.IELTS.App.openResourceHub("fullExam");
        } else {
          window.IELTS?.UI?.showOnly?.("fullExamHub");
        }
      } catch (e) {}
    },
    "/listening/": () => {
      try {
        if (typeof window.IELTS?.App?.openResourceHub === "function") {
          window.IELTS.App.openResourceHub("listening");
        } else {
          window.IELTS?.UI?.showOnly?.("listeningHub");
        }
      } catch (e) {}
    },
    "/reading/": () => {
      try {
        if (typeof window.IELTS?.App?.openResourceHub === "function") {
          window.IELTS.App.openResourceHub("reading");
        } else {
          window.IELTS?.UI?.showOnly?.("readingHub");
        }
      } catch (e) {}
    },
    "/writing/": () => {
      try {
        if (typeof window.IELTS?.App?.openResourceHub === "function") {
          window.IELTS.App.openResourceHub("writing");
        } else {
          window.IELTS?.UI?.showOnly?.("writingHub");
        }
      } catch (e) {}
    },
    "/speaking/": () => {
      try {
        if (typeof window.IELTS?.App?.openResourceHub === "function") {
          window.IELTS.App.openResourceHub("speaking");
        } else {
          window.IELTS?.UI?.showOnly?.("speakingHub");
        }
      } catch (e) {}
    },
    "/dashboard/": () => { try { window.IELTS?.UI?.showOnly?.("dashboard"); } catch (e) {} },
    "/history/": () => { try { window.IELTS?.UI?.showOnly?.("history"); } catch (e) {} },
    "/assignments/": () => { setTimeout(() => { window.IELTS?.Assignments?.openAssignmentsPage?.(); }, 200); },
    "/admin/": () => { try { window.IELTS?.UI?.showOnly?.("adminResults"); } catch (e) {} },
    "/admin/results/": () => { try { window.IELTS?.UI?.showOnly?.("adminResults"); } catch (e) {} },
    "/admin/classes/": () => { try { window.IELTS?.UI?.showOnly?.("adminResults"); } catch (e) {} setTimeout(() => { document.getElementById("adminPageClassroomsBtn")?.click(); }, 200); },
    "/admin/assignments/": () => { try { window.IELTS?.UI?.showOnly?.("adminResults"); } catch (e) {} setTimeout(() => { document.getElementById("adminPageAssignmentsBtn")?.click(); }, 200); },
    "/admin/questions/": () => { try { window.IELTS?.UI?.showOnly?.("adminResults"); } catch (e) {} setTimeout(() => { document.getElementById("adminPageQuestionsBtn")?.click(); }, 200); },
    "/placement-test/": () => { try { window.IELTS?.UI?.showOnly?.("placementTest"); } catch (e) {} },
    "/vocabulary/": () => {
      try {
        if (window.IELTS?.Auth?.isSignedIn?.()) window.IELTS?.Vocabulary?.open?.("dashboard");
        else window.IELTS?.UI?.showOnly?.("vocabulary");
      } catch (e) {}
    },
    "/recent-questions/": () => {
      try {
        window.IELTS?.UI?.showOnly?.("recentQuestions");
        window.IELTS?.RecentQuestions?.render?.();
      } catch (e) {}
    },
  };

  function initFromPath() {
    const path = window.location.pathname;
    if (String(window.location.hash || "").length > 2) return;
    const handler = PATH_TO_VIEW[path];
    if (handler) handler();
  }

  window.addEventListener("popstate", function () {
    const path = window.location.pathname;
    const handler = PATH_TO_VIEW[path];
    if (handler) handler();
    else if (path === "/") { try { window.IELTS?.UI?.showOnly?.("home"); } catch (e) {} }
  });

  window.IELTS = window.IELTS || {};
  window.IELTS.Router = { setHashRoute, parseHashRoute, initFromPath };
})();
