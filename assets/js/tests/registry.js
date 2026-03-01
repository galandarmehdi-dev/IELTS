/* assets/js/tests/registry.js */
(function () {
  "use strict";

  // Your Google Apps Script endpoint (kept)
  const ADMIN_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbymOQ_8EAh0KkEUQ5wOIf7BvONW309z8GTZizqXX98tvla5oqKNzX6Lv8HFCRFHDGS16w/exec";

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

  const TESTS = {
    defaultTestId: "ielts1",
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
  };

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = { ADMIN_ENDPOINT, EXAM, KEYS, TESTS };
})();
