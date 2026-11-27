// Tests for the 27 Nov 2026 Writing recalibration: descriptor fidelity, independent assessors, band
// arithmetic edge cases, the official ≤20-word rule, chart-figure grounding and feedback consistency.
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWritingRequest, buildWritingSchema, validateWritingAssessment, mergeGroupAssessments, computeWritingBands,
  roundHalfBand, toStoredResult, ownWordCount, referenceFactsFor, WRITING_DESCRIPTOR_GUIDE, WRITING_SYSTEM_PROMPT,
  CRITERIA_GROUPS,
} from "../src/writingAssessment.mjs";

const T1Q = "The chart below shows the amount of leisure time enjoyed by men and women of different employment status.";
const T1E = "The bar chart compares weekly leisure time by sex and employment status in 1998-99. Overall, unemployed and retired people had by far the most free time, and men had more than women wherever both are shown. Unemployed men had about 85 hours, compared with 78 for women, while full-time employed men had about 44 hours and women 37. Housewives had 50 hours.";
const T2Q = "It is important for people to take risks, both in their professional lives and their personal lives. Do you think the advantages of taking risks outweigh the disadvantages?";
const T2E = "Taking risks can bring problems, such as losing money or a job, but I believe the advantages outweigh the disadvantages when the risk is calculated. People who change careers often find more satisfying work, and those who try new things build confidence that helps them in later life.";

const crit = (band, extra = {}) => ({ positive_evidence: [], negative_evidence: [], descriptor_match: "fits the band", provisional_band: band, why_not_higher: "the next band's positive features are not all present here", why_not_lower: "the band's positive features are met", band, confidence: "high", uncertainty: "", limiting_feature: "", feedback: "Specific feedback.", ...extra });
const common = { injection_attempt: false, verification: {}, main_issues: [], band7_advice: [], band8_advice: [], assessment_limitations: [] };
const t1Content = (TA, CC, extra = {}) => ({ task1: { assessable: true, task_type: "bar_chart", visual_access: "image_and_facts", key_features: ["unemployed and retired highest"], requirements: [], overview: { present: true, quote: "", assessment: "" }, graph_accuracy: "verified", inaccuracy_level: "none", data_issues: [], criteria: { TA: crit(TA), CC: crit(CC) }, strengths: ["c1"], weaknesses: ["c2"], ...extra }, ...common });
const t1Language = (LR, GRA) => ({ task1: { assessable: true, criteria: { LR: crit(LR), GRA: crit(GRA) }, strengths: ["l1"], weaknesses: ["l2"] }, ...common, error_analysis: [] });
const t2Content = (TR, CC) => ({ task2: { assessable: true, question_type: "outweigh", relevance: "on_topic", requirements: [], position: { required: true, type: "qualified", stated: "advantages outweigh when calculated", consistent: true }, criteria: { TR: crit(TR), CC: crit(CC) }, strengths: [], weaknesses: [] }, ...common });
const t2Language = (LR, GRA) => ({ task2: { assessable: true, criteria: { LR: crit(LR), GRA: crit(GRA) }, strengths: [], weaknesses: [] }, ...common, error_analysis: [] });

function gradeSplit(input, content, language) {
  const rc = buildWritingRequest({ ...input, group: "content" });
  const rl = buildWritingRequest({ ...input, group: "language" });
  const vc = validateWritingAssessment(content, rc.meta);
  const vl = validateWritingAssessment(language, rl.meta);
  assert.equal(vc.ok, true, vc.fatal.join("; "));
  assert.equal(vl.ok, true, vl.fatal.join("; "));
  const merged = mergeGroupAssessments(vc, vl);
  return { merged, metas: [rc.meta, rl.meta] };
}

test("descriptor guide follows the May 2023 descriptors where the old paraphrase did not", () => {
  // Official reading rule: fully fit the positive features; "may" weaknesses are compatible; bold = limiting.
  assert.match(WRITING_DESCRIPTOR_GUIDE, /fully fits the POSITIVE features/);
  assert.match(WRITING_DESCRIPTOR_GUIDE, /STILL COMPATIBLE with that band/);
  assert.match(WRITING_DESCRIPTOR_GUIDE, /\[LIMIT\]/);
  assert.match(WRITING_DESCRIPTOR_GUIDE, /20 words or fewer are Band 1/);
  // Task 1 CC: paragraphing only at 8–9.
  assert.match(WRITING_DESCRIPTOR_GUIDE, /Task 1: no paragraphing requirement at this band/);
  // TR 6–7: main parts, not all parts; TR 6 tolerates unclear conclusions.
  assert.match(WRITING_DESCRIPTOR_GUIDE, /7: the MAIN parts of the prompt appropriately addressed/);
  assert.match(WRITING_DESCRIPTOR_GUIDE, /conclusions drawn may be unclear, unjustified or repetitive/);
  // TA: detail vs key areas; TA 5 does not require "no clear overview" (that was the pre-2023 wording).
  assert.match(WRITING_DESCRIPTOR_GUIDE, /IN AREAS OF DETAIL/);
  assert.match(WRITING_DESCRIPTOR_GUIDE, /IN KEY AREAS detracts/);
  assert.doesNotMatch(WRITING_DESCRIPTOR_GUIDE, /no clear overview, or an unclear one/);
  assert.match(WRITING_DESCRIPTOR_GUIDE, /data, diagram or situation was misunderstood/);
});

test("prompt removes one-sided guidance and states both directions of calibration", () => {
  assert.doesNotMatch(WRITING_SYSTEM_PROMPT, /do not by themselves earn CC 6 or 7/);
  assert.doesNotMatch(WRITING_SYSTEM_PROMPT, /covering every part does not by itself justify TR 6/);
  assert.match(WRITING_SYSTEM_PROMPT, /Band 6 is the starting point even when linking is mechanical/);
  assert.match(WRITING_SYSTEM_PROMPT, /qualified or conditional position/);
  assert.match(WRITING_SYSTEM_PROMPT, /"as they planned" is acceptable/);
  assert.match(WRITING_SYSTEM_PROMPT, /missing data treated as zero/);
  assert.match(WRITING_SYSTEM_PROMPT, /correct errors in both directions/);
  assert.match(WRITING_SYSTEM_PROMPT, /Never calculate a task band or an overall band/);
});

test("assessor groups: each schema contains only its own criteria and stays closed", () => {
  const walk = (s, path) => {
    if (s.type === "object") {
      assert.equal(s.additionalProperties, false, path);
      assert.deepEqual(s.required.slice().sort(), Object.keys(s.properties).sort(), path);
      Object.entries(s.properties).forEach(([k, v]) => walk(v, `${path}.${k}`));
    } else if (s.type === "array") walk(s.items, `${path}[]`);
  };
  ["all", "content", "language"].forEach((group) => {
    const s = buildWritingSchema({ task1: true, task2: true, group });
    walk(s, group);
    assert.deepEqual(Object.keys(s.properties.task1.properties.criteria.properties), CRITERIA_GROUPS[group].task1);
    assert.deepEqual(Object.keys(s.properties.task2.properties.criteria.properties), CRITERIA_GROUPS[group].task2);
  });
  const lang = buildWritingSchema({ task1: true, task2: true, group: "language" });
  assert.ok(!lang.properties.task1.properties.key_features && !lang.properties.task2.properties.position, "no task-content fields for the language assessor");
  const content = buildWritingSchema({ task1: true, group: "content" });
  assert.ok(!content.properties.error_analysis, "no error list for the content assessor");
  const req = buildWritingRequest({ task1Prompt: T1Q, task1Essay: T1E, imageAttached: true, verifiedTask1Facts: "facts", group: "language" });
  assert.equal(req.meta.imageAttached, false, "the language assessor never gets the chart");
  assert.equal(req.meta.hasFacts, false);
});

test("extreme criterion profiles survive merging and arithmetic (no caps, no gap limits)", () => {
  const input = { task1Prompt: T1Q, task1Essay: T1E, task2Prompt: T2Q, task2Essay: T2E, imageAttached: true };
  const content = { ...t1Content(9, 7), task2: t2Content(3, 8).task2 };
  const language = { ...t1Language(5, 5), task2: t2Language(8, 8).task2 };
  const { merged, metas } = gradeSplit(input, content, language);
  assert.equal(merged.ok, true);
  const t1 = merged.result.tasks.task1.criteria;
  const t2 = merged.result.tasks.task2.criteria;
  assert.deepEqual([t1.TA.band, t1.CC.band, t1.LR.band, t1.GRA.band], [9, 7, 5, 5]);
  assert.deepEqual([t2.TR.band, t2.CC.band, t2.LR.band, t2.GRA.band], [3, 8, 8, 8]);
  const stored = toStoredResult(merged, metas);
  assert.equal(stored.task1.overall, 6.5); // 26/4 = 6.5
  assert.equal(stored.task2.overall, 7); // 27/4 = 6.75 → 7
  // (6.5 + 2 × 6.75) / 3 = 6.667 → 6.5
  assert.equal(stored.final_writing_band, 6.5);
  assert.ok(Math.abs(stored.grading.writing_raw - 20 / 3) < 1e-9);
  assert.equal(stored.grading.assessors, "content+language");
});

test("band arithmetic: whole, half and boundary values, unrounded weighting, Band 0 and Band 9", () => {
  const t = (b) => ({ submitted: true, assessable: true, criteria: { TA: { band: b[0] }, TR: { band: b[0] }, CC: { band: b[1] }, LR: { band: b[2] }, GRA: { band: b[3] } } });
  assert.equal(computeWritingBands({ task1: t([6, 6, 6, 6]), task2: t([6, 6, 6, 6]) }).final, 6);
  assert.equal(computeWritingBands({ task1: t([7, 6, 6, 7]), task2: t([7, 6, 6, 7]) }).final, 6.5);
  assert.equal(roundHalfBand(6.25), 6.5);
  assert.equal(roundHalfBand(6.2499), 6);
  assert.equal(roundHalfBand(6.75), 7);
  assert.equal(roundHalfBand(6.7499), 6.5);
  // Task 1 mean 6.25 (shown 6.5), Task 2 mean 5.75 (shown 6): unrounded (6.25 + 11.5)/3 = 5.9167 → 6;
  // from rounded task bands it would be (6.5 + 12)/3 = 6.1667 → 6 as well, but raw keeps the precision.
  const r = computeWritingBands({ task1: t([7, 6, 6, 6]), task2: t([6, 6, 6, 5]) });
  assert.equal(r.task1.band, 6.5);
  assert.equal(r.task2.band, 6);
  assert.ok(Math.abs(r.raw - 17.75 / 3) < 1e-9);
  assert.equal(r.final, 6);
  // A case where double rounding would differ: means 5.25 (→5.5) and 5.75 (→6): raw (5.25+11.5)/3 = 5.583 → 5.5;
  // rounded-task policy (5.5+12)/3 = 5.833 → 6.
  const d = { task1: t([6, 5, 5, 5]), task2: t([6, 6, 6, 5]) };
  assert.equal(computeWritingBands(d).final, 5.5);
  assert.equal(computeWritingBands(d, { policy: "task_bands" }).final, 6);
  assert.equal(computeWritingBands({ task1: t([9, 9, 9, 9]), task2: t([9, 9, 9, 9]) }).final, 9);
  const zero = { submitted: true, assessable: false, criteria: {} };
  assert.equal(computeWritingBands({ task1: zero, task2: zero }).final, 0);
  assert.equal(computeWritingBands({ task1: zero, task2: t([9, 9, 9, 9]) }).final, 6); // (0 + 18)/3
});

test("missing tasks and missing or invalid criteria never become a band", () => {
  const t = (b) => ({ submitted: true, assessable: true, criteria: { TR: { band: b }, TA: { band: b }, CC: { band: b }, LR: { band: b }, GRA: { band: b } } });
  assert.equal(computeWritingBands({ task1: t(7) }).final, 7, "only Task 1 → its own band (platform policy)");
  assert.equal(computeWritingBands({ task2: t(5) }).final, 5, "only Task 2 → its own band (platform policy)");
  assert.equal(computeWritingBands({}).final, null);
  const broken = { submitted: true, assessable: true, criteria: { TR: { band: 6 }, CC: { band: 6 }, LR: { band: 6 } } };
  assert.equal(computeWritingBands({ task2: broken }).final, null, "a missing criterion gives no band");
  const req = buildWritingRequest({ task2Prompt: T2Q, task2Essay: T2E, group: "content" });
  const noCC = t2Content(6, 6);
  delete noCC.task2.criteria.CC;
  assert.equal(validateWritingAssessment(noCC, req.meta).ok, false);
  const fraction = t2Content(6, 6);
  fraction.task2.criteria.TR.band = 5.5;
  assert.equal(validateWritingAssessment(fraction, req.meta).ok, false);
  assert.equal(validateWritingAssessment("not json", req.meta).ok, false);
  const reqL = buildWritingRequest({ task2Prompt: T2Q, task2Essay: T2E, group: "language" });
  const vc = validateWritingAssessment(t2Content(6, 6), req.meta);
  const vl = validateWritingAssessment({ ...t2Language(6, 6), task2: { ...t2Language(6, 6).task2, assessable: false, criteria: { LR: crit(0), GRA: crit(0) } } }, reqL.meta);
  assert.equal(mergeGroupAssessments(vc, vl).ok, false, "assessors disagreeing on assessability is not stored");
});

test("official ≤20-word rule discounts words copied from the question", () => {
  assert.equal(ownWordCount("Risks are good.", T2Q), 3);
  const copied = "It is important for people to take risks, both in their professional lives and their personal lives. I agree.";
  assert.equal(ownWordCount(copied, T2Q), 2);
  const req = buildWritingRequest({ task2Prompt: T2Q, task2Essay: copied, group: "content" });
  const v = validateWritingAssessment(t2Content(4, 4), req.meta);
  assert.deepEqual(Object.values(v.result.tasks.task2.criteria).map((c) => c.band), [1, 1]);
});

test("Task 1 reference data: lookup by exam id, figures in feedback are checked against it", () => {
  assert.match(referenceFactsFor("ielts-full-025"), /NO DATA for men/);
  assert.match(referenceFactsFor("ielts25"), /Leisure time/);
  assert.match(referenceFactsFor("ielts-full-024"), /axis starts at 20%/);
  assert.equal(referenceFactsFor("imp-full-full-exam-ielts-writing-test-105-a51e4ce4"), "", "imported ids do not match by trailing digits");
  assert.equal(referenceFactsFor(""), "");
  const req = buildWritingRequest({ task1Prompt: T1Q, task1Essay: T1E, imageAttached: true, verifiedTask1Facts: referenceFactsFor("ielts-full-025"), group: "content" });
  assert.match(req.userText, /task1_reference_data/);
  const ok = t1Content(7, 7);
  ok.task1.criteria.TA.feedback = "Men had about 85 hours and women about 78; full-time women had about 37.";
  assert.ok(!validateWritingAssessment(ok, req.meta).warnings.some((w) => /cites figure/.test(w)));
  const bad = t1Content(7, 7);
  bad.task1.criteria.TA.feedback = "Retired women had 23 hours.";
  assert.ok(validateWritingAssessment(bad, req.meta).warnings.some((w) => /cites figure.*23/.test(w)));
});

test("feedback that describes Band 6+ features under a Band 5 is flagged; a fundamental misreading with TA 5+ is flagged", () => {
  const req = buildWritingRequest({ task1Prompt: T1Q, task1Essay: T1E, imageAttached: true, group: "content" });
  const data = t1Content(5, 5);
  data.task1.criteria.CC = crit(5, { feedback: "The report is generally coherent with a clear overall progression.", why_not_higher: "linking" });
  const v = validateWritingAssessment(data, req.meta);
  assert.ok(v.warnings.some((w) => /CC: feedback describes Band 6\+ features/.test(w)));
  const stored = toStoredResult(v, req.meta);
  assert.ok(stored.grading.review_flags.includes("feedback consistency warning"));
  const mis = t1Content(5, 6, { inaccuracy_level: "fundamental" });
  assert.ok(validateWritingAssessment(mis, req.meta).warnings.some((w) => /fundamental misreading/.test(w)));
  const missingReason = t1Content(6, 6);
  missingReason.task1.criteria.TA = crit(6, { why_not_higher: "" });
  const v2 = validateWritingAssessment(missingReason, req.meta);
  assert.ok(v2.warnings.some((w) => /no reason given why Band 7/.test(w)));
  assert.equal(v2.result.tasks.task1.criteria.TA.confidence, "medium");
});

test("candidate names are never part of the request", () => {
  const req = buildWritingRequest({ task2Prompt: T2Q, task2Essay: T2E, group: "content", studentName: "Some Student" });
  assert.doesNotMatch(req.userText, /Some Student/);
});
