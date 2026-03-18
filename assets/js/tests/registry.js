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
  const TEMP_STUDENT_AUDIO_SCRUB = true;
  const HISTORY_TABLE = "exam_attempts";

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

  function StorageSafe() { return window.IELTS && window.IELTS.Storage ? window.IELTS.Storage : null; }
  function getActiveTestId() { try { const S = StorageSafe(); const id = S ? S.get(KEYS.ACTIVE_TEST_ID, "") : ""; return id || TESTS.defaultTestId; } catch { return TESTS.defaultTestId; } }
  function setActiveTestId(testId) { const id = String(testId || "").trim(); if (!id) return; try { const S = StorageSafe(); if (S) S.set(KEYS.ACTIVE_TEST_ID, id); } catch {} }
  function getTestConfig(testId) { const id = String(testId || "").trim() || TESTS.defaultTestId; return TESTS.byId[id] || TESTS.byId[TESTS.defaultTestId]; }
  function getActiveTestConfig() { return getTestConfig(getActiveTestId()); }
  function getTestContent(testId) { const cfg = getTestConfig(testId); return cfg && cfg.content ? cfg.content : { listening: null, reading: null, writing: null }; }
  function getActiveTestContent() { return getTestContent(getActiveTestId()); }
  function makeKey(testId, area, name) { const id = String(testId || "").trim() || TESTS.defaultTestId; const a = String(area || "").trim().toUpperCase(); const n = String(name || "").trim(); return `IELTS:${id}:${a}:${n}`; }
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

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = {
    ADMIN_ENDPOINT,
    SPEAKING_UPLOAD_ENDPOINT,
    REALTIME_SESSION_ENDPOINT,
    ADMIN_PASSCODE,
    ADMIN_SESSION_TTL_MIN,
    TEMP_STUDENT_AUDIO_SCRUB,
    HISTORY_TABLE,
    EXAM,
    KEYS,
    LEGACY,
    TESTS,
    getActiveTestId,
    setActiveTestId,
    getTestConfig,
    getActiveTestConfig,
    getTestContent,
    getActiveTestContent,
    makeKey,
    keysFor,
  };
})();
