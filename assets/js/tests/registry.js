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

  const REMOTE_TEST_CONTENT = new Set(["ielts1", "ielts2", "ielts3", "ielts4", "ielts5", "ielts6", "ielts7"]);
  const remoteTestContentPromises = new Map();

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
      ielts4: { id: "ielts4", readingTestId: "ielts-reading-3parts-004", writingTestId: "ielts-writing-004", content: { reading: null, writing: null, listening: null } },
      ielts5: { id: "ielts5", readingTestId: "ielts-reading-3parts-005", writingTestId: "ielts-writing-005", content: { reading: null, writing: null, listening: null } },
      ielts6: { id: "ielts6", readingTestId: "ielts-reading-3parts-006", writingTestId: "ielts-writing-006", content: { reading: null, writing: null, listening: null } },
      ielts7: { id: "ielts7", readingTestId: "ielts-reading-3parts-007", writingTestId: "ielts-writing-007", content: { reading: null, writing: null, listening: null } },
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

  function hasLoadedTestContent(content) {
    return !!(
      content &&
      typeof content === "object" &&
      (content.listening || content.reading || content.writing)
    );
  }

  async function ensureTestContent(testId) {
    const cfg = getTestConfig(testId);
    const id = String(cfg?.id || testId || "").trim().toLowerCase();
    if (!cfg || !id || !REMOTE_TEST_CONTENT.has(id) || hasLoadedTestContent(cfg.content)) {
      return cfg?.content || {};
    }

    if (remoteTestContentPromises.has(id)) {
      return remoteTestContentPromises.get(id);
    }

    const task = (async () => {
      const url = new URL("/api/test-content", window.location.origin);
      url.searchParams.set("testId", id);
      const res = await fetch(url.toString(), { method: "GET", credentials: "same-origin" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.ok !== true || !data.content) {
        throw new Error((data && data.error) || `Could not load protected content for ${id}.`);
      }
      cfg.content = data.content;
      return cfg.content;
    })()
      .finally(() => {
        remoteTestContentPromises.delete(id);
      });

    remoteTestContentPromises.set(id, task);
    return task;
  }

  function ensureActiveTestContent() {
    return ensureTestContent(getActiveTestId());
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizePromptKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/task\s*[12]\s*/g, " ")
      .replace(/you should spend about \d+ minutes on this task\.?/g, " ")
      .replace(/write at least \d+ words\.?/g, " ")
      .replace(/graph url:\s*\S+/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toHeadlineCase(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\b\w/g, (match) => match.toUpperCase())
      .trim();
  }

  function normalizeWritingTopic(value, fallback) {
    const cleaned = String(value || "")
      .replace(/^the\s+/i, "")
      .replace(/\s+/g, " ")
      .replace(/[.]+$/g, "")
      .trim();
    return cleaned ? toHeadlineCase(cleaned) : fallback;
  }

  function inferTask1ChartType(promptText, imageSrc, configuredType) {
    if (String(configuredType || "").trim()) return String(configuredType).trim();
    const raw = String(promptText || "").toLowerCase();
    const image = String(imageSrc || "").toLowerCase();
    const hits = [];
    if (/\bbar charts?\b|\bbar graphs?\b/.test(raw) || /bar[-_ ]graph|bar[-_ ]chart/.test(image)) hits.push("Bar chart");
    if (/\bpie charts?\b/.test(raw) || /pie[-_ ]chart/.test(image)) hits.push("Pie chart");
    if (/\bline graphs?\b|\bline charts?\b/.test(raw) || /line[-_ ]graph|line[-_ ]chart/.test(image)) hits.push("Line graph");
    if (/\btables?\b/.test(raw) || /table/.test(image)) hits.push("Table");
    if (/\bmaps?\b/.test(raw) || /map/.test(image)) hits.push("Map");
    if (/\bprocess\b|\bflow charts?\b|\bdiagram\b/.test(raw) || /process|diagram|flow[-_ ]chart/.test(image)) hits.push("Process diagram");
    if (hits.length > 1) return "Mixed chart";
    if (hits.length === 1) return hits[0];
    if (/\bgraphs?\b|\bcharts?\b/.test(raw)) return "Chart";
    return "Task 1 report";
  }

  function inferTask1Topic(promptText) {
    const text = String(promptText || "")
      .replace(/^you should spend about \d+ minutes on this task\.?\s*/i, "")
      .replace(/write at least \d+ words\.?/ig, "")
      .replace(/\s+/g, " ")
      .trim();
    const patterns = [
      /(?:give information|provides information|show|shows|compare|compares|illustrate|illustrates)\s+about\s+(.+?)(?:,|\s+between\b|\s+for\b|\.)/i,
      /(?:give information|provides information|show|shows|compare|compares|illustrate|illustrates)\s+the\s+(.+?)(?:,|\s+between\b|\s+for\b|\.)/i,
      /(?:distribution|proportion)\s+of\s+(.+?)(?:,|\s+between\b|\s+for\b|\.)/i,
    ];
    for (let i = 0; i < patterns.length; i += 1) {
      const match = text.match(patterns[i]);
      if (match && match[1]) return normalizeWritingTopic(match[1], "Writing Task 1 prompt");
    }
    const firstSentence = text.split(/[.?!]/)[0] || "";
    return normalizeWritingTopic(firstSentence, "Writing Task 1 prompt");
  }

  function inferTask2EssayType(promptText, configuredType) {
    if (String(configuredType || "").trim()) return String(configuredType).trim();
    const raw = String(promptText || "").toLowerCase();
    if (/discuss both views/i.test(raw)) return "Discussion essay";
    if (/agree or disagree|to what extent/i.test(raw)) return "Opinion essay";
    if (/advantages.*disadvantages|outweigh/i.test(raw)) return "Advantages and disadvantages";
    if (/positive or negative development/i.test(raw)) return "Positive or negative development";
    if (/problem[s]?.*solution|cause[s]?.*solution/i.test(raw)) return "Problem and solution";
    const questionMarks = (raw.match(/\?/g) || []).length;
    if (questionMarks > 1) return "Two-part question";
    return "Essay";
  }

  function inferTask2Topic(promptText) {
    const text = String(promptText || "")
      .replace(/^you should spend about \d+ minutes on this task\.?\s*/i, "")
      .replace(/write at least \d+ words\.?/ig, "")
      .replace(/\s+/g, " ")
      .trim();
    const firstSentence = text.split(/[.?!]/)[0] || "";
    const lowered = firstSentence.toLowerCase();
    const judgedMatch = firstSentence.match(/judged according to\s+(.+)$/i);
    if (judgedMatch && judgedMatch[1]) return normalizeWritingTopic(judgedMatch[1], "Writing Task 2 topic");
    if (/private information/.test(lowered)) return "Private information online";
    if (/children'?s behavior/.test(lowered)) return "Children's behavior";
    const cleaned = firstSentence
      .replace(/^some\s+(people|parents|teachers)\s+(think|believe)\s+that\s+/i, "")
      .replace(/^today\s+/i, "")
      .replace(/^nowadays\s+/i, "")
      .replace(/^more people\s+/i, "")
      .trim();
    return normalizeWritingTopic(cleaned, "Writing Task 2 topic");
  }

  function normalizeWritingSamples(sampleValue, taskLabel) {
    const rawItems = Array.isArray(sampleValue)
      ? sampleValue
      : (sampleValue && typeof sampleValue === "object" ? [sampleValue] : []);
    const items = rawItems.length ? rawItems : [{}];
    return items.map((sample, index) => {
      const band = String(sample.bandScore || "Coming soon");
      return {
        id: `${taskLabel.toLowerCase().replace(/\s+/g, "-")}-sample-${index + 1}`,
        label: String(sample.label || `${band} sample ${index + 1}`),
        bandScore: band,
        explanation: String(sample.explanation || "A model answer, band score explanation, and corrected form can be added for this prompt when the test is uploaded."),
        sampleAnswer: String(sample.sampleAnswer || "Sample answer coming soon."),
        correctedForm: String(sample.correctedForm || "Corrected form coming soon."),
        hasSample: Boolean(sample.sampleAnswer && sample.correctedForm && sample.bandScore),
      };
    });
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

  function buildWritingSampleCatalog(extraSamplesByPrompt) {
    const extraMap = extraSamplesByPrompt && typeof extraSamplesByPrompt === "object"
      ? extraSamplesByPrompt
      : {};
    const items = [];
    const seenPromptKeys = new Set();

    Object.values(TESTS.byId)
      .filter((cfg) => cfg?.content?.writing)
      .forEach((cfg) => {
        const writing = cfg.content.writing || {};
        const samples = writing.sampleAnswers || {};

        ["task1", "task2"].forEach((taskKey) => {
          const taskLabel = taskKey === "task1" ? "Task 1" : "Task 2";
          const promptHtml = writing[`${taskKey}Html`] || "";
          const promptText = stripHtmlToText(promptHtml);
          const promptKey = normalizePromptKey(promptText);
          const extraBucket = extraMap[promptKey];
          const groupType = taskKey === "task1"
            ? inferTask1ChartType(promptText, writing.task1ImageSrc, writing.task1Type)
            : inferTask2EssayType(promptText, writing.task2Type);
          const topic = taskKey === "task1"
            ? inferTask1Topic(promptText)
            : inferTask2Topic(promptText);
          const promptId = `${cfg.id}-${taskKey}`;
          const sampleItems = normalizeWritingSamples(samples[taskKey], taskLabel)
            .concat(normalizeWritingSamples(extraBucket?.samples || extraBucket, `${taskLabel} student`));

          items.push({
            id: promptId,
            testId: cfg.id,
            taskKey,
            taskLabel,
            title: `${groupType} - ${topic}`,
            shortTitle: `${groupType} - ${topic}`,
            sourceTitle: `${getTestLabel(cfg.id)} · ${taskLabel}`,
            promptKey,
            groupType,
            topic,
            promptHtml,
            promptText,
            imageSrc: taskKey === "task1" ? (writing.task1ImageSrc || "") : "",
            sampleCount: sampleItems.length,
            samples: sampleItems,
            bandScore: sampleItems[0]?.bandScore || "Coming soon",
            explanation: sampleItems[0]?.explanation || "A model answer, band score explanation, and corrected form can be added for this prompt when the test is uploaded.",
            sampleAnswer: sampleItems[0]?.sampleAnswer || "Sample answer coming soon.",
            correctedForm: sampleItems[0]?.correctedForm || "Corrected form coming soon.",
            hasSample: sampleItems.some((item) => item.hasSample),
          });

          if (promptKey) seenPromptKeys.add(promptKey);
        });
      });

    Object.keys(extraMap).forEach((promptKey) => {
      if (!promptKey || seenPromptKeys.has(promptKey)) return;
      const bucket = extraMap[promptKey] || {};
      const taskKey = String(bucket.taskKey || "").trim() === "task1" ? "task1" : "task2";
      const taskLabel = taskKey === "task1" ? "Task 1" : "Task 2";
      const promptText = String(bucket.promptText || "").trim();
      if (!promptText) return;

      const groupType = taskKey === "task1"
        ? inferTask1ChartType(promptText, "", "")
        : inferTask2EssayType(promptText, "");
      const topic = taskKey === "task1"
        ? inferTask1Topic(promptText)
        : inferTask2Topic(promptText);
      const sampleItems = normalizeWritingSamples(bucket.samples || bucket, `${taskLabel} student`);

      items.push({
        id: `sheet-${taskKey}-${promptKey}`,
        testId: "",
        taskKey,
        taskLabel,
        title: `${groupType} - ${topic}`,
        shortTitle: `${groupType} - ${topic}`,
        sourceTitle: `Writing sheet · ${taskLabel}`,
        promptKey,
        groupType,
        topic,
        promptHtml: `<p>${escapeHtml(promptText)}</p>`,
        promptText,
        imageSrc: "",
        sampleCount: sampleItems.length,
        samples: sampleItems,
        bandScore: sampleItems[0]?.bandScore || "Student sample",
        explanation: sampleItems[0]?.explanation || "Stored student essays are available for this prompt from the writing sheet.",
        sampleAnswer: sampleItems[0]?.sampleAnswer || "Sample answer coming soon.",
        correctedForm: sampleItems[0]?.correctedForm || "No stored corrected rewrite is available for this essay yet.",
        hasSample: sampleItems.some((item) => item.hasSample),
      });
    });

    return items;
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
    ensureTestContent,
    ensureActiveTestContent,
    setLaunchContext,
    getLaunchContext,
    clearLaunchContext,
    SECTION_META,
    READING_TASK_TYPES,
    buildHomeCatalog,
    buildWritingSampleCatalog,
    normalizePromptKey,
    buildReadingPracticeContent,
    buildAdminApiUrl,
  };
})();
