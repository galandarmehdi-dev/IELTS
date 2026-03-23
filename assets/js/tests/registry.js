/* assets/js/tests/registry.js */
(function () {
  "use strict";

  const ADMIN_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwtL1AnMuTKcs7RpESRYCqOMqUyOktGryDis_sydeEb8T7oU1UbxOTub1omtOvkIhsb/exec";

  const SPEAKING_UPLOAD_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwtL1AnMuTKcs7RpESRYCqOMqUyOktGryDis_sydeEb8T7oU1UbxOTub1omtOvkIhsb/exec";

  const REALTIME_SESSION_ENDPOINT =
    "https://ielts-speaking-realtime.galandar-mehdi.workers.dev/realtime/session";

  const ADMIN_PASSCODE = "SMOKEY";
  const ADMIN_SESSION_TTL_MIN = 240;
  const TEST_PASSWORD = "ILEZT123";
  const TEMP_STUDENT_AUDIO_SCRUB = true;
  const HISTORY_TABLE = "exam_attempts";

  const TIMEOUTS = {
    submissionPostMs: 45000,
    resultFetchMs: 45000,
    historySyncMs: 45000,
    historyInsertMs: 12000,
    historyUpdateMs: 12000,
  };

  const POLLING = {
    markedResultIntervalMs: 10000,
    markedResultMaxAttempts: 18,
    historyRefreshPendingLimit: 8,
  };

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

  const TESTS = {
    defaultTestId: "ielts1",
    byId: {
      ielts1: { id: "ielts1", readingTestId: "ielts-reading-3parts-001", writingTestId: "ielts-writing-001", content: { reading: null, writing: null, listening: null } },
      ielts2: { id: "ielts2", readingTestId: "ielts-reading-3parts-002", writingTestId: "ielts-writing-002", content: { reading: null, writing: null, listening: null } },
      ielts3: { id: "ielts3", readingTestId: "ielts-reading-3parts-003", writingTestId: "ielts-writing-003", content: { reading: null, writing: null, listening: null } },
    },
  };

  function getActiveTestId() {
    try {
      return localStorage.getItem(KEYS.ACTIVE_TEST_ID) || TESTS.defaultTestId;
    } catch {
      return TESTS.defaultTestId;
    }
  }

  function setActiveTestId(id) {
    const next = TESTS.byId[id] ? id : TESTS.defaultTestId;
    try { localStorage.setItem(KEYS.ACTIVE_TEST_ID, next); } catch {}
    return next;
  }

  function getTestConfig(testId) {
    return TESTS.byId[testId] || TESTS.byId[TESTS.defaultTestId];
  }

  function keysFor(testId) {
    const cfg = getTestConfig(testId);
    return {
      listening: {
        submitted: `IELTS:${cfg.id}:LISTENING:submitted`,
        started: `IELTS:${cfg.id}:LISTENING:started`,
        answers: `IELTS:${cfg.id}:LISTENING:answers`,
        lastSubmission: `IELTS:${cfg.id}:LISTENING:lastSubmission`,
        pageIndex: `IELTS:${cfg.id}:LISTENING:pageIndex`,
      },
      writing: {
        started: `IELTS:${cfg.id}:WRITING:started`,
        submitted: `IELTS:${cfg.id}:WRITING:submitted`,
        remaining: `IELTS:${cfg.id}:WRITING:remainingSeconds`,
        answers: `IELTS:${cfg.id}:WRITING:answers`,
        lastSubmission: `IELTS:${cfg.id}:WRITING:lastSubmission`,
        studentName: `IELTS:${cfg.id}:WRITING:studentFullName`,
      },
    };
  }

  function getActiveTestContent() {
    const active = getActiveTestId();
    return getTestConfig(active)?.content || {};
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = {
    ADMIN_ENDPOINT,
    SPEAKING_UPLOAD_ENDPOINT,
    REALTIME_SESSION_ENDPOINT,
    ADMIN_PASSCODE,
    ADMIN_SESSION_TTL_MIN,
    TEST_PASSWORD,
    TEMP_STUDENT_AUDIO_SCRUB,
    HISTORY_TABLE,
    TIMEOUTS,
    POLLING,
    EXAM,
    KEYS,
    LEGACY,
    TESTS,
    getActiveTestId,
    setActiveTestId,
    getTestConfig,
    keysFor,
    getActiveTestContent,
  };
})();
