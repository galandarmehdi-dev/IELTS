// Both spellings of a submission time (sheet "…Z", Supabase "…+00:00" with trimmed zeros) must reach
// the same admin-correction key, and the legacy variants must cover both spellings.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/worker.mjs", import.meta.url), "utf8");
const slice = (from, to) => src.slice(src.indexOf(from), src.indexOf(to));
const oneLine = (v) => String(v ?? "").trim();
const normalizeMatchString = (v) => String(v || "").replace(/\s+/g, " ").trim().toLowerCase();
const fns = new Function("oneLine", "normalizeMatchString",
  slice("function buildSubmissionMetaKey(", "function buildSubmissionMetaKeyWithOrganization") +
  slice("function submittedAtKeyVariants", "function legacyScoreMetaKeys") +
  "return { submittedAtKeyVariants, buildAnswerOverridesKey };")(oneLine, normalizeMatchString);

test("both timestamp spellings share one correction key", () => {
  const base = { studentFullName: "Zeynab Gambarli", examId: "ielts-full-024", reason: "Student ended the exam." };
  const a = fns.buildAnswerOverridesKey({ ...base, submittedAt: "2026-11-25T11:24:50.6+00:00" });
  const b = fns.buildAnswerOverridesKey({ ...base, submittedAt: "2026-11-25T11:24:50.600Z" });
  assert.equal(a, b);
  assert.match(a, /^answer_overrides:2026-11-25t11:24:50\.600z::zeynab gambarli::/);
});

test("legacy variants cover both spellings", () => {
  const v = fns.submittedAtKeyVariants("2026-03-11T07:48:06.340Z");
  assert.ok(v.includes("2026-03-11T07:48:06.34+00:00"));
  assert.ok(fns.submittedAtKeyVariants("2026-03-11T07:48:06.34+00:00").includes("2026-03-11T07:48:06.340Z"));
});
