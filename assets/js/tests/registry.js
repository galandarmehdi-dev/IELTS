/* assets/js/tests/registry.js */
(function () {
  "use strict";

  const ADMIN_API_PATH = "/api/admin";

  const SPEAKING_UPLOAD_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbwtL1AnMuTKcs7RpESRYCqOMqUyOktGryDis_sydeEb8T7oU1UbxOTub1omtOvkIhsb/exec";

  const REALTIME_SESSION_ENDPOINT =
    "https://ielts-speaking-realtime.galandar-mehdi.workers.dev/realtime/session";

  const ADMIN_SESSION_TTL_MIN = 240;
  const TEST_PASSWORD = "ILEZT123";
  const TEMP_STUDENT_AUDIO_SCRUB = true;
  const HISTORY_TABLE = "exam_attempts";

  const TIMEOUTS = {
    submissionPostMs: 45000,
    resultFetchMs: 45000,
    historySyncMs: 45000,
    historyLoadMs: 20000,
    historyInsertMs: 25000,
    historyUpdateMs: 15000,
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
    LAUNCH_CONTEXT: "IELTS:EXAM:launchContext",
  };

  const SECTION_META = {
    full: { key: "full", label: "Full Exam", summary: "Full Listening, Reading, and Writing flow" },
    listening: { key: "listening", label: "Listening", summary: "Take only the listening section" },
    reading: { key: "reading", label: "Reading", summary: "Take only the reading section" },
    writing: { key: "writing", label: "Writing", summary: "Take only the writing section" },
    speaking: { key: "speaking", label: "Speaking", summary: "Open speaking practice directly" },
  };

  const READING_TASK_TYPES = {
    tfng: {
      type: "tfng",
      label: "True / False / Not Given",
      shortLabel: "TFNG",
      summary: "Practice accuracy on evidence-based statement questions.",
    },
    headings: {
      type: "headings",
      label: "Matching Headings",
      shortLabel: "Headings",
      summary: "Match paragraph purpose and main idea faster.",
    },
    sentenceGaps: {
      type: "sentenceGaps",
      label: "Sentence / Summary Completion",
      shortLabel: "Completion",
      summary: "Build precision on gap-fill style reading tasks.",
    },
    shortAnswer: {
      type: "shortAnswer",
      label: "Short Answer",
      shortLabel: "Short Answer",
      summary: "Practice extracting exact words from the passage.",
    },
    endingsMatch: {
      type: "endingsMatch",
      label: "Matching Endings / Information",
      shortLabel: "Matching",
      summary: "Train pattern recognition across sentence endings and paragraph match tasks.",
    },
    multiTextChoices: {
      type: "multiTextChoices",
      label: "Multiple Choice",
      shortLabel: "MCQ",
      summary: "Sharpen option elimination and evidence checking.",
    },
    summarySelect: {
      type: "summarySelect",
      label: "Summary Selection",
      shortLabel: "Summary Select",
      summary: "Practice choosing the best word or option for summary completion.",
    },
    mcq: {
      type: "mcq",
      label: "Multiple Choice",
      shortLabel: "MCQ",
      summary: "Sharpen option elimination and evidence checking.",
    },
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
    } catch (e) {
      return TESTS.defaultTestId;
    }
  }

  function setActiveTestId(id) {
    const next = TESTS.byId[id] ? id : TESTS.defaultTestId;
    try { localStorage.setItem(KEYS.ACTIVE_TEST_ID, next); } catch (e) {}
    return next;
  }

  function getTestConfig(testId) {
    return TESTS.byId[testId] || TESTS.byId[TESTS.defaultTestId];
  }

  function getTestLabel(testId) {
    const cfg = getTestConfig(testId);
    if (!cfg) return "IELTS Test";
    const digits = String(cfg.id || testId || "").match(/(\d+)$/);
    return digits ? `IELTS Test ${digits[1]}` : String(cfg.id || "IELTS Test");
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
    const ctx = getLaunchContext();
    if (ctx && ctx.mode === "practice" && ctx.skill === "reading") {
      return buildReadingPracticeContent(ctx.taskType);
    }
    return getTestConfig(active)?.content || {};
  }

  function setLaunchContext(context) {
    const next = context && typeof context === "object" ? { ...context } : null;
    try {
      if (!next) {
        localStorage.removeItem(KEYS.LAUNCH_CONTEXT);
      } else {
        localStorage.setItem(KEYS.LAUNCH_CONTEXT, JSON.stringify(next));
      }
    } catch (e) {}
    return next;
  }

  function getLaunchContext() {
    try {
      const raw = localStorage.getItem(KEYS.LAUNCH_CONTEXT);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function clearLaunchContext() {
    return setLaunchContext(null);
  }

  function getScopedKeys(testId) {
    const base = keysFor(testId);
    const ctx = getLaunchContext();
    if (!ctx || !ctx.storageScope) return base;
    const scope = String(ctx.storageScope || "").trim();
    if (!scope) return base;
    return {
      listening: {
        submitted: `${scope}:LISTENING:submitted`,
        started: `${scope}:LISTENING:started`,
        answers: `${scope}:LISTENING:answers`,
        lastSubmission: `${scope}:LISTENING:lastSubmission`,
        pageIndex: `${scope}:LISTENING:pageIndex`,
      },
      writing: {
        started: `${scope}:WRITING:started`,
        submitted: `${scope}:WRITING:submitted`,
        remaining: `${scope}:WRITING:remainingSeconds`,
        answers: `${scope}:WRITING:answers`,
        lastSubmission: `${scope}:WRITING:lastSubmission`,
        studentName: `${scope}:WRITING:studentFullName`,
      },
    };
  }

  function getScopedReadingTestId(testId) {
    const ctx = getLaunchContext();
    if (ctx && ctx.storageScope) return `${ctx.storageScope}:READING`;
    return getTestConfig(testId)?.readingTestId || getTestConfig(TESTS.defaultTestId)?.readingTestId || "ielts-reading-3parts-001";
  }

  function getQuestionCountFromBlock(block) {
    if (!block || typeof block !== "object") return 0;
    if (Array.isArray(block.items)) return block.items.length;
    if (Array.isArray(block.questions)) return block.questions.length;
    if (Array.isArray(block.summaryLines)) return block.summaryLines.filter((line) => line && line.blankQ).length;
    return 0;
  }

  function cloneJsonSafe(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e) {
      return value;
    }
  }

  function stripHtmlToText(html) {
    try {
      const div = document.createElement("div");
      div.innerHTML = String(html || "");
      return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
    } catch (e) {
      return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
  }

  function getStructuredReadingParts(testId) {
    const reading = getTestConfig(testId)?.content?.reading;
    return Array.isArray(reading?.parts) ? reading.parts : [];
  }

  function buildFullExamCatalog() {
    return Object.values(TESTS.byId).map((cfg) => {
      const content = cfg.content || {};
      return {
        id: cfg.id,
        label: getTestLabel(cfg.id),
        description: "Complete Listening, Reading, and Writing in the exam sequence.",
        meta: [
          content.listening ? "Listening" : null,
          content.reading ? "Reading" : null,
          content.writing ? "Writing" : null,
        ].filter(Boolean),
      };
    });
  }

  function buildSectionCatalog(section) {
    if (!section || section === "speaking") {
      return [{
        id: "speaking-practice",
        label: "Speaking Practice",
        description: "Open the speaking module without starting a full exam.",
        meta: ["Independent practice", "Recorded flow"],
      }];
    }
    return Object.values(TESTS.byId)
      .filter((cfg) => cfg?.content?.[section])
      .map((cfg) => ({
        id: cfg.id,
        testId: cfg.id,
        section,
        label: `${getTestLabel(cfg.id)} ${SECTION_META[section]?.label || section}`,
        description: `Open only the ${SECTION_META[section]?.label?.toLowerCase() || section} part from ${getTestLabel(cfg.id)}.`,
        meta: [
          section === "listening" ? "Audio section only" : null,
          section === "reading" ? "Reading section only" : null,
          section === "writing" ? "Writing section only" : null,
        ].filter(Boolean),
      }));
  }

  function buildReadingPracticeCatalog() {
    const buckets = {};
    Object.values(READING_TASK_TYPES).forEach((task) => {
      buckets[task.type] = {
        ...task,
        exerciseCount: 0,
        questionCount: 0,
        tests: new Set(),
      };
    });

    Object.values(TESTS.byId).forEach((cfg) => {
      const parts = getStructuredReadingParts(cfg.id);
      parts.forEach((part, partIndex) => {
        const blocks = Array.isArray(part?.blocks) ? part.blocks : [];
        blocks.forEach((block, blockIndex) => {
          const type = String(block?.type || "").trim();
          if (!buckets[type]) return;
          buckets[type].exerciseCount += 1;
          buckets[type].questionCount += getQuestionCountFromBlock(block);
          buckets[type].tests.add(cfg.id);
        });
      });
    });

    return Object.values(buckets)
      .filter((entry) => entry.exerciseCount > 0)
      .map((entry) => ({
        ...entry,
        tests: Array.from(entry.tests),
      }))
      .sort((a, b) => b.exerciseCount - a.exerciseCount || a.label.localeCompare(b.label));
  }

  function buildReadingPracticeContent(taskType) {
    const task = READING_TASK_TYPES[taskType];
    if (!task) return { reading: { parts: [] } };

    const parts = [];
    Object.values(TESTS.byId).forEach((cfg) => {
      const sourceParts = getStructuredReadingParts(cfg.id);
      sourceParts.forEach((sourcePart, partIndex) => {
        const blocks = Array.isArray(sourcePart?.blocks) ? sourcePart.blocks : [];
        blocks.forEach((block, blockIndex) => {
          if (String(block?.type || "") !== taskType) return;
          parts.push({
            id: `practice-${cfg.id}-${partIndex + 1}-${blockIndex + 1}`,
            title: `${task.label} · ${getTestLabel(cfg.id)}`,
            shortLabel: `${getTestLabel(cfg.id)} · ${sourcePart.title || `Part ${partIndex + 1}`}`,
            passageText: sourcePart.passageText || "",
            blocks: [cloneJsonSafe(block)],
            sourceTestId: cfg.id,
            sourcePartId: sourcePart.id || `part${partIndex + 1}`,
          });
        });
      });
    });

    return {
      reading: {
        title: `${task.label} Practice`,
        practiceType: taskType,
        parts,
      },
    };
  }

  function buildWritingSampleCatalog() {
    return Object.values(TESTS.byId)
      .filter((cfg) => cfg?.content?.writing)
      .flatMap((cfg) => {
        const writing = cfg.content.writing || {};
        const samples = writing.sampleAnswers || {};
        return ["task1", "task2"].map((taskKey) => {
          const taskLabel = taskKey === "task1" ? "Task 1" : "Task 2";
          const promptHtml = writing[`${taskKey}Html`] || "";
          const sample = samples[taskKey] || {};
          return {
            id: `${cfg.id}-${taskKey}`,
            testId: cfg.id,
            taskKey,
            taskLabel,
            title: `${getTestLabel(cfg.id)} · ${taskLabel}`,
            promptHtml,
            promptText: stripHtmlToText(promptHtml),
            imageSrc: taskKey === "task1" ? (writing.task1ImageSrc || "") : "",
            bandScore: String(sample.bandScore || "Coming soon"),
            explanation: String(sample.explanation || "A model answer, band score explanation, and corrected form can be added for this prompt when the test is uploaded."),
            sampleAnswer: String(sample.sampleAnswer || "Sample answer coming soon."),
            correctedForm: String(sample.correctedForm || "Corrected form coming soon."),
            hasSample: Boolean(sample.sampleAnswer && sample.correctedForm && sample.bandScore),
          };
        });
      });
  }

  function buildHomeCatalog() {
    return {
      fullExams: buildFullExamCatalog(),
      sections: {
        listening: buildSectionCatalog("listening"),
        reading: buildSectionCatalog("reading"),
        writing: buildSectionCatalog("writing"),
        speaking: buildSectionCatalog("speaking"),
      },
      practice: {
        reading: buildReadingPracticeCatalog(),
      },
      writingSamples: buildWritingSampleCatalog(),
    };
  }

  function buildAdminApiUrl(params = {}) {
    const endpoint = String(ADMIN_API_PATH || "").trim();
    if (!endpoint) return null;
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
    return url;
  }

  window.IELTS = window.IELTS || {};
  window.IELTS.Registry = {
    ADMIN_API_PATH,
    SPEAKING_UPLOAD_ENDPOINT,
    REALTIME_SESSION_ENDPOINT,
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
    getTestLabel,
    keysFor,
    getScopedKeys,
    getScopedReadingTestId,
    getActiveTestContent,
    setLaunchContext,
    getLaunchContext,
    clearLaunchContext,
    SECTION_META,
    READING_TASK_TYPES,
    buildHomeCatalog,
    buildWritingSampleCatalog,
    buildReadingPracticeContent,
    buildAdminApiUrl,
  };
})();
