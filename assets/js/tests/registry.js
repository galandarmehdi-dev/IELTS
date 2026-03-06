/* assets/js/tests/registry.js */
(function () {
  "use strict";

  // Your Google Apps Script endpoint (kept)
  const ADMIN_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwrspMj3Jnc2tYP89rqZEctyz_vHP9jnUxg3UAz7nKmHOVxu3Na3HXkSVqEtNX9oHYNMA/exec";
     
  // Admin-only controls (client-side gate)
  const ADMIN_PASSCODE = "SMOKEY";
  const ADMIN_SESSION_TTL_MIN = 240; // admin stays enabled for 4 hours on this browser

  // TEMP: allow students to scrub Listening audio for testing (set to false to disable)
  const TEMP_STUDENT_AUDIO_SCRUB = true;

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
    ACTIVE_TEST_ID: "IELTS:EXAM:activeTestId",
  };

  // Legacy (single-test) keys that existed before multi-test support.
  // We keep these ONLY to auto-migrate any in-progress attempts on this browser.
  const LEGACY = {
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
  };

  // Multi-test config (same functions, different content).
  // Content for ielts2 is intentionally left as placeholders for you to replace.
  const TESTS = {
    defaultTestId: "ielts1",
    byId: {
      ielts1: {
        id: "ielts1",
        readingTestId: "ielts-reading-3parts-001",
        writingTestId: "ielts-writing-001",
        content: { reading: null, writing: null, listening: null },
      },
      ielts2: {
        id: "ielts2",
        readingTestId: "ielts-reading-3parts-002",
        writingTestId: "ielts-writing-002",
        content: { reading: null, writing: null, listening: null },
      },
    },
  };

  // Helpers (safe even if Storage isn't loaded yet)
  function StorageSafe() {
    return window.IELTS && window.IELTS.Storage ? window.IELTS.Storage : null;
  }

  function getActiveTestId() {
    try {
      const S = StorageSafe();
      const id = S ? S.get(KEYS.ACTIVE_TEST_ID, "") : "";
      return id || TESTS.defaultTestId;
    } catch {
      return TESTS.defaultTestId;
    }
  }

  function setActiveTestId(testId) {
    const id = String(testId || "").trim();
    if (!id) return;
    try {
      const S = StorageSafe();
      if (S) S.set(KEYS.ACTIVE_TEST_ID, id);
    } catch {}
  }

  function getTestConfig(testId) {
    const id = String(testId || "").trim() || TESTS.defaultTestId;
    return TESTS.byId[id] || TESTS.byId[TESTS.defaultTestId];
  }

  function getActiveTestConfig() {
    return getTestConfig(getActiveTestId());
  }

  // Namespaced key helper to prevent Test 1 / Test 2 overwriting each other.
  function makeKey(testId, area, name) {
    const id = String(testId || "").trim() || TESTS.defaultTestId;
    const a = String(area || "").trim().toUpperCase();
    const n = String(name || "").trim();
    return `IELTS:${id}:${a}:${n}`;
  }

  function keysFor(testId) {
    const id = String(testId || "").trim() || TESTS.defaultTestId;
    return {
      listening: {
        submitted: makeKey(id, "LISTENING", "submitted"),
        started: makeKey(id, "LISTENING", "started"),
        answers: makeKey(id, "LISTENING", "answers"),
        lastSubmission: makeKey(id, "LISTENING", "lastSubmission"),
        pageIndex: makeKey(id, "LISTENING", "pageIndex"),
      },
      writing: {
        started: makeKey(id, "WRITING", "started"),
        submitted: makeKey(id, "WRITING", "submitted"),
        remaining: makeKey(id, "WRITING", "remainingSeconds"),
        answers: makeKey(id, "WRITING", "answers"),
        lastSubmission: makeKey(id, "WRITING", "lastSubmission"),
        studentName: makeKey(id, "WRITING", "studentFullName"),
      },
    };
  }

  function getActiveTestContent() {
    const cfg = getActiveTestConfig();
    return (cfg && cfg.content) || {};
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = {
    ADMIN_ENDPOINT,
    ADMIN_PASSCODE,
    ADMIN_SESSION_TTL_MIN,
    EXAM,
    KEYS,
    TESTS,
    LEGACY,
    TEMP_STUDENT_AUDIO_SCRUB,

    // Multi-test helpers
    getActiveTestId,
    setActiveTestId,
    getTestConfig,
    getActiveTestConfig,
    getActiveTestContent,
    makeKey,
    keysFor,
  };
})();
