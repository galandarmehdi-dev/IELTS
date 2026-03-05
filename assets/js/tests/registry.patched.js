/* assets/js/tests/registry.js */
(function () {
  "use strict";

  // Your Google Apps Script endpoint (kept)
  const ADMIN_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbymOQ_8EAh0KkEUQ5wOIf7BvONW309z8GTZizqXX98tvla5oqKNzX6Lv8HFCRFHDGS16w/exec";

  // Admin-only controls (client-side gate)
  const ADMIN_PASSCODE = "SMOKEY";
  const ADMIN_SESSION_TTL_MIN = 240; // admin stays enabled for 4 hours on this browser

  const EXAM = {
    id: "ielts-full-001",
    keys: {
      finalSubmission: "IELTS:EXAM:finalSubmission",
      finalSubmitted: "IELTS:EXAM:finalSubmitted",
    },
  };

  const KEYS = {
    HOME_LAST_VIEW: "IELTS:HOME:lastView",
    EXAM_STARTED: "IELTS:EXAM:started",
  };

  // Multi-test registry:
  // - ielts1 preserves your CURRENT storage keys exactly (no breaking changes).
  // - ielts2 uses namespaced keys to avoid collisions with ielts1.
  const TESTS = {
    defaultTestId: "ielts1",
    byId: {
      ielts1: {
        id: "ielts1",
        readingTestId: "ielts-reading-3parts-001",
        writingTestId: "ielts-writing-001",
        listeningKeys: {
          submitted: "IELTS:LISTENING:submitted",
          started: "IELTS:LISTENING:started",
          answers: "IELTS:LISTENING:answers",
          lastSubmission: "IELTS:LISTENING:lastSubmission",
          pageIndex: "IELTS:LISTENING:pageIndex",
        },
        writingKeys: {
          started: "IELTS:WRITING:started",
          submitted: "IELTS:WRITING:submitted",
          remaining: "IELTS:WRITING:remainingSeconds",
          answers: "IELTS:WRITING:answers",
          lastSubmission: "IELTS:WRITING:lastSubmission",
          studentName: "IELTS:WRITING:studentFullName",
        },
      },

      // Prepared for Test 2 (content-only changes on top).
      // You can change the readingTestId / writingTestId strings if you want,
      // but keep them unique per test.
      ielts2: {
        id: "ielts2",
        readingTestId: "ielts-reading-3parts-002",
        writingTestId: "ielts-writing-002",
        listeningKeys: {
          submitted: "IELTS:LISTENING:ielts2:submitted",
          started: "IELTS:LISTENING:ielts2:started",
          answers: "IELTS:LISTENING:ielts2:answers",
          lastSubmission: "IELTS:LISTENING:ielts2:lastSubmission",
          pageIndex: "IELTS:LISTENING:ielts2:pageIndex",
        },
        writingKeys: {
          started: "IELTS:WRITING:ielts2:started",
          submitted: "IELTS:WRITING:ielts2:submitted",
          remaining: "IELTS:WRITING:ielts2:remainingSeconds",
          answers: "IELTS:WRITING:ielts2:answers",
          lastSubmission: "IELTS:WRITING:ielts2:lastSubmission",
          studentName: "IELTS:WRITING:ielts2:studentFullName",
        },
      },
    },

    get(testId) {
      const id = String(testId || "");
      return this.byId[id] || this.byId[this.defaultTestId];
    },
  };

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = window.IELTS.Registry || {};
  window.IELTS.Registry = Object.assign(window.IELTS.Registry, {
    ADMIN_ENDPOINT,
    ADMIN_PASSCODE,
    ADMIN_SESSION_TTL_MIN,
    EXAM,
    KEYS,
    TESTS,
  });
})();
