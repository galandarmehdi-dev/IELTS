import test from "node:test";
import assert from "node:assert/strict";
import {
  getImportedAnswerMap, hydrateImportedExams, makeImportedTestId, normalizeAnswerKeys,
  sanitizeImportedContent, validateImportedExam, isImportedTestId,
} from "../src/importedExams.mjs";

const keys40 = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [String(i + 1), "x"]));

test("sanitizer strips scripts, handlers and javascript: urls", () => {
  const out = sanitizeImportedContent({ a: '<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src=x onerror=alert(1)>' });
  assert.ok(!/script|onclick|onerror|javascript:/i.test(out.a));
  assert.ok(out.a.includes("Hi"));
});

test("answer keys are normalised and bounded", () => {
  assert.deepEqual(normalizeAnswerKeys({ 1: " a ", 2: "", 0: "z", 99: "z", x: "z" }), { 1: "a" });
});

test("ids are prefixed so they never collide with built-in tests", () => {
  const id = makeImportedTestId("reading", "Cambridge 15 / Test 1!", "abcdef1234567890");
  assert.equal(id, "imp-reading-cambridge-15-test-1-abcdef12");
  assert.ok(isImportedTestId(id) && !isImportedTestId("ielts5"));
});

test("reading exam with 3 passages and 40 answers is publishable", () => {
  const v = validateImportedExam({ skill: "reading", title: "T", content: { reading: { parts: [{}, {}, {}] } }, answerKeys: keys40 });
  assert.equal(v.ok, true);
  assert.equal(v.warnings.length, 0);
});

test("never fabricates: missing answers warn, no answers blocks", () => {
  const partial = { ...keys40 }; delete partial["7"];
  const v = validateImportedExam({ skill: "reading", title: "T", content: { reading: { parts: [{}, {}, {}] } }, answerKeys: partial });
  assert.equal(v.ok, true);
  assert.ok(v.warnings.some((w) => w.includes("Question 7")));
  assert.equal(validateImportedExam({ skill: "reading", title: "T", content: { reading: {} }, answerKeys: {} }).ok, false);
});

test("listening without audio is blocked", () => {
  const v = validateImportedExam({ skill: "listening", title: "T", content: { listening: { html: "<p/>" } }, answerKeys: keys40 });
  assert.equal(v.ok, false);
  assert.ok(v.errors[0].includes("audio"));
});

test("only published exams feed the answer map", async () => {
  const rows = [{ test_id: "imp-reading-a-12345678", skill: "reading", content: {}, answer_keys: { 1: "TRUE" } }];
  await hydrateImportedExams({}, async () => ({ ok: true, data: rows }));
  assert.deepEqual(getImportedAnswerMap("imp-reading-a-12345678", "reading"), { 1: "TRUE" });
  assert.equal(getImportedAnswerMap("imp-reading-a-12345678", "listening"), null);
  assert.equal(getImportedAnswerMap("imp-reading-draft-00000000", "reading"), null);
});
