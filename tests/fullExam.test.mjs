import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { parseExamHtml, parseWritingHtml } from "../assets/js/converter/examParser.mjs";
import { convertToEngineContent, convertWritingToEngineContent, assembleFullExam } from "../assets/js/converter/examAdapter.mjs";
import { validateImportedExam, sanitizeImportedContent, normalizeFullAnswerKeys, hydrateImportedExams, invalidateImportedExamCache, getImportedAnswerMap, makeImportedTestId } from "../src/importedExams.mjs";

const parseHtml = (h) => new JSDOM(h).window.document;
const read = (f) => readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8");
const AUDIO = { "/wp-content/uploads/audio/185_we.mp3?_=1": "https://audio.ieltsmock.org/imported/185.mp3" };

function build() {
  const lp = parseExamHtml(read("ielts-listening-185.html"), { parseHtml, skill: "listening" });
  const rp = parseExamHtml(read("ielts-reading-test-9.html"), { parseHtml, skill: "reading" });
  const wp = parseWritingHtml(read("ielts-writing-test-100.html"), { parseHtml, filename: "ielts-writing-test-100.html" });
  return {
    lp, rp, wp,
    parts: {
      listening: { parsed: lp, out: convertToEngineContent(lp, { mediaMap: AUDIO }) },
      reading: { parsed: rp, out: convertToEngineContent(rp) },
      writing: { parsed: wp, out: convertWritingToEngineContent(wp) },
    },
  };
}

test("writing parser finds both tasks, the Task 1 image and word limits, and drops boilerplate", () => {
  const w = parseWritingHtml(read("ielts-writing-test-100.html"), { parseHtml });
  assert.equal(w.ok, true);
  assert.equal(w.task1.lines.length, 3);
  assert.match(w.task1.lines[0], /^The graph below shows the amounts of waste/);
  assert.equal(w.task1.minWords, 150);
  assert.equal(w.task2.minWords, 250);
  assert.match(w.task2.lines[0], /^Students in school and university learn far more/);
  assert.equal(w.media.length, 1);
  assert.equal(w.media[0].resolved, "https://practicepteonline.com/wp-content/uploads/2024/09/test-100-min.png");
  assert.ok(!JSON.stringify(w).includes("Cambridge IELTS Tests"));
  const w2 = parseWritingHtml(read("ielts-writing-test-101.html"), { parseHtml });
  assert.equal(w2.ok, true);
  assert.match(w2.task2.lines[0], /^Some people believe that it is best to accept a bad situation/);
});

test("writing converts to the player's format with the standard time hints", () => {
  const w = parseWritingHtml(read("ielts-writing-test-100.html"), { parseHtml });
  const { content, issues } = convertWritingToEngineContent(w);
  assert.equal(issues.length, 0);
  assert.match(content.writing.task1Html, /^You should spend about 20 minutes on this task\.<br\/>The graph below/);
  assert.match(content.writing.task2Html, /^You should spend about 40 minutes on this task\.<br\/>Students in school/);
  assert.equal(content.writing.task1Type, "Graph");
  assert.equal(content.writing.task2Type, "Opinion essay");
  assert.equal(content.writing.task1ImageSrc, "https://practicepteonline.com/wp-content/uploads/2024/09/test-100-min.png");
  assert.equal(convertWritingToEngineContent(parseWritingHtml(read("ielts-writing-test-101.html"), { parseHtml })).content.writing.task2Type, "Discussion essay");
});

test("writing without Task 2 is a blocking error and nothing is invented", () => {
  const w = parseWritingHtml(read("ielts-writing-test-100.html").split("<strong><u>Task 2:</u></strong>")[0], { parseHtml });
  assert.equal(w.ok, false);
  assert.ok(w.issues.some((i) => i.code === "task2_missing"));
});

test("a full exam combines three files into one validated exam with per-skill answer keys", () => {
  const { parts } = build();
  const full = assembleFullExam(parts, { title: "Full Exam: Demo" });
  assert.deepEqual(Object.keys(full.content).sort(), ["listening", "reading", "writing"]);
  assert.equal(Object.keys(full.answerKeys.listening).length, 40);
  assert.equal(Object.keys(full.answerKeys.reading).length, 40);
  assert.equal(full.issues.filter((i) => i.severity === "error").length, 0, JSON.stringify(full.issues.filter((i) => i.severity === "error")));
  const exam = { skill: "full", title: full.title, content: sanitizeImportedContent(full.content), answerKeys: normalizeFullAnswerKeys(full.answerKeys) };
  const v = validateImportedExam(exam);
  assert.equal(v.ok, true, v.errors.join("; "));
  assert.equal(v.answerCount, 80);
  assert.equal(makeImportedTestId("full", full.title, "abcdef1234567890"), "imp-full-full-exam-demo-abcdef12");
});

test("full exam problems are explicit: missing part, wrong skill, missing audio, missing title", () => {
  const { parts, rp } = build();
  const missing = assembleFullExam({ ...parts, writing: null }, { title: "T" });
  assert.ok(missing.issues.some((i) => i.code === "part_missing" && /Writing/.test(i.message)));
  const wrong = assembleFullExam({ ...parts, listening: { parsed: rp, out: convertToEngineContent(rp) } }, { title: "T" });
  assert.ok(wrong.issues.some((i) => i.code === "part_wrong_skill"));
  const noAudio = assembleFullExam({ ...parts, listening: { parsed: parts.listening.parsed, out: convertToEngineContent(parts.listening.parsed) } }, { title: "T" });
  assert.ok(noAudio.issues.some((i) => /Listening: /.test(i.message) && i.severity === "error"));
  assert.ok(assembleFullExam(parts, { title: " " }).issues.some((i) => i.code === "title_missing"));
  const bad = validateImportedExam({ skill: "full", title: "T", content: { listening: { audioSrc: "https://a/x.mp3", html: "x" }, reading: { parts: [] }, writing: { task1Html: "a", task2Html: "" } }, answerKeys: { listening: { 1: "a" }, reading: {} } });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => /^Reading: /.test(e)) && bad.errors.some((e) => /^Writing: /.test(e)));
});

test("a published full exam marks listening and reading from the right key sets", async () => {
  const { parts } = build();
  const full = assembleFullExam(parts, { title: "T" });
  invalidateImportedExamCache();
  await hydrateImportedExams({}, async () => ({ ok: true, data: [{ test_id: "imp-full-t-00000000", skill: "full", content: full.content, answer_keys: normalizeFullAnswerKeys(full.answerKeys) }] }));
  const l = getImportedAnswerMap("imp-full-t-00000000", "listening");
  const r = getImportedAnswerMap("imp-full-t-00000000", "reading");
  assert.equal(l[1], "Egg");
  assert.equal(r[14], "iv");
  assert.equal(Object.keys(l).length, 40);
  assert.equal(Object.keys(r).length, 40);
  assert.equal(getImportedAnswerMap("imp-full-t-00000000", "writing"), null);
});

test("writing: the typical layout (test 49) converts with diagram and opinion essay detected", () => {
  const w = parseWritingHtml(read("ielts-writing-test-49.html"), { parseHtml });
  const { content, issues } = convertWritingToEngineContent(w);
  assert.equal(w.ok, true);
  assert.equal(issues.length, 0);
  assert.equal(w.title, "IELTS Writing Test 49");
  assert.match(content.writing.task1Html, /central heating system in a house works/);
  assert.match(content.writing.task2Html, /free public transportation facilities 24\/7/);
  assert.equal(content.writing.task1Type, "Diagram");
  assert.equal(content.writing.task2Type, "Opinion essay");
  assert.equal(content.writing.task1ImageSrc, "https://practicepteonline.com/wp-content/uploads/2024/09/test-49-min.png");
});

test("writing: files that say 'Test 1:' / 'Test 2:' instead of 'Task' still parse (tests 118, 119)", () => {
  const a = parseWritingHtml(read("ielts-writing-test-118.html"), { parseHtml });
  assert.equal(a.ok, true);
  assert.match(a.task1.lines[0], /^The chart below shows the number of households in the US/);
  assert.match(a.task2.lines[0], /^Some university students want to learn about other subjects/);
  assert.equal(convertWritingToEngineContent(a).content.writing.task2Type, "Discussion essay");
  const b = parseWritingHtml(read("ielts-writing-test-119.html"), { parseHtml });
  assert.equal(b.ok, true);
  assert.equal(convertWritingToEngineContent(b).content.writing.task2Type, "Advantages and disadvantages");
  assert.equal(b.media.length, 1);
});

test("writing: with no labels at all the tasks are split by position and flagged", () => {
  const html = read("ielts-writing-test-49.html").replace(/<strong><u>Task 1: <\/u><\/strong>/, "").replace(/<strong><u>Task 2:<\/u><\/strong>/, "");
  const w = parseWritingHtml(html, { parseHtml });
  assert.equal(w.ok, true);
  assert.ok(w.issues.some((i) => i.code === "task_labels_guessed"));
  assert.match(w.task1.lines[0], /^The diagram below shows how a central heating system/);
  assert.match(w.task2.lines[0], /^The government should provide free public transportation/);
  assert.equal(w.media.length, 1);
  assert.equal(w.task2.lines.some((l) => /heating/.test(l)), false);
});
