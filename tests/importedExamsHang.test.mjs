import test from "node:test";
import assert from "node:assert/strict";
import { getImportedAnswerMap, hydrateImportedExams, invalidateImportedExamCache } from "../src/importedExams.mjs";

const row = { test_id: "imp-reading-h-12345678", skill: "reading", content: {}, answer_keys: { 1: "A" } };
const never = () => new Promise(() => {});

test("a hanging Supabase does not block a request once exams have loaded", async () => {
  invalidateImportedExamCache();
  await hydrateImportedExams({}, async () => ({ ok: true, data: [row] }));
  invalidateImportedExamCache(); // cache now stale
  const background = [];
  const started = Date.now();
  await hydrateImportedExams({}, never, { waitUntil: (p) => background.push(p) });
  assert.ok(Date.now() - started < 200, "stale cache must be served without waiting");
  assert.equal(background.length, 1, "refresh is handed to waitUntil");
  assert.deepEqual(getImportedAnswerMap("imp-reading-h-12345678", "reading"), { 1: "A" });
});

test("the first load gives up after the timeout instead of hanging", { timeout: 10000 }, async () => {
  const fresh = await import(`../src/importedExams.mjs?cold=${Date.now()}`);
  const started = Date.now();
  await fresh.hydrateImportedExams({}, never);
  const took = Date.now() - started;
  assert.ok(took >= 3900 && took < 6000, `took ${took}ms`);
});
