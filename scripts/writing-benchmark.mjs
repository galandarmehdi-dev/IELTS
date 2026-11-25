#!/usr/bin/env node
// Writing grader benchmark and repeatability test.
//
//   ANTHROPIC_API_KEY=... node scripts/writing-benchmark.mjs [--grader new|legacy|both] [--runs 3]
//        [--cases tests/fixtures/writing-benchmark/synthetic-cases.json] [--only id1,id2] [--concurrency 3]
//        [--model claude-sonnet-5-5] [--out benchmark-results] [--dry]
//
// Uses the same request the site sends (src/writingAssessment.mjs) for "new", and the previous production
// grader (scripts/benchmark/legacyWritingGrader.cjs) for "legacy". Every run is billed by the API: check
// --dry first, which prints the plan and an estimated cost without calling the API.
//
// Case files: { source: "synthetic" | "teacher-marked" | ..., cases: [{ id, task1Prompt?, task1Essay?,
// verifiedTask1Facts?, task2Prompt?, task2Essay?, checks?: [...], reference?: { source, bands: { "task2.TR": 6, ... } } }] }
// Only cases with an independent human reference produce accuracy metrics; synthetic checks test behaviour.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWritingRequest, validateWritingAssessment, computeWritingBands, WRITING_GRADING_VERSION } from "../src/writingAssessment.mjs";

const require = createRequire(import.meta.url);
const legacy = require("./benchmark/legacyWritingGrader.cjs");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true] : null).filter(Boolean));
const graderArg = String(args.grader || "new");
const graders = graderArg === "both" ? ["legacy", "new"] : [graderArg];
const runs = Math.max(1, Number(args.runs || 3));
const model = String(args.model || "claude-sonnet-5-5");
const casesPath = path.resolve(root, String(args.cases || "tests/fixtures/writing-benchmark/synthetic-cases.json"));
const outDir = path.resolve(root, String(args.out || "benchmark-results"));
const concurrency = Math.max(1, Number(args.concurrency || 3));
// USD per million tokens (Claude Sonnet 5.5 list prices; update if the model or prices change).
const PRICE = { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.1 };

const caseFile = JSON.parse(readFileSync(casesPath, "utf8"));
let cases = caseFile.cases || [];
if (args.only) { const ids = String(args.only).split(","); cases = cases.filter((c) => ids.includes(c.id)); }

const apiKey = process.env.ANTHROPIC_API_KEY || "";
const authToken = process.env.ANTHROPIC_AUTH_TOKEN || "";

async function callApi(body) {
  const headers = { "content-type": "application/json", "anthropic-version": "2023-06-01" };
  if (apiKey) headers["x-api-key"] = apiKey;
  else if (authToken) { headers.authorization = `Bearer ${authToken}`; headers["anthropic-beta"] = "oauth-2025-04-20"; }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const started = Date.now();
    const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers, body: JSON.stringify(body) });
    const text = await res.text();
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 4000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`API ${res.status}: ${text.slice(0, 300)}`);
    return { json: JSON.parse(text), ms: Date.now() - started };
  }
  throw new Error("API kept failing (rate limit or overload).");
}

async function gradeNew(c) {
  const req = buildWritingRequest({ ...c, imageAttached: false });
  const { json, ms } = await callApi({
    model, max_tokens: 16000,
    system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: [{ type: "text", text: req.userText }] }],
    output_config: { format: { type: "json_schema", schema: req.schema } },
  });
  if (json.stop_reason !== "end_turn") return { ok: false, error: `stop_reason ${json.stop_reason}`, usage: json.usage, ms };
  const data = JSON.parse(json.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
  const v = validateWritingAssessment(data, req.meta);
  if (!v.ok) return { ok: false, error: v.fatal.join("; "), usage: json.usage, ms };
  const bands = computeWritingBands(v.result.tasks);
  const flat = {};
  Object.entries(v.result.tasks).forEach(([t, task]) => {
    Object.entries(task.criteria).forEach(([k, cr]) => { flat[`${t}.${k}`] = cr.band; });
    if (task.relevance) flat[`${t}.relevance`] = task.relevance;
    if (bands[t]) flat[`${t}.band`] = bands[t].band;
  });
  flat.final = bands.final;
  flat.injection_attempt = v.result.tasks && v.result.injection_attempt;
  const dataIssues = v.result.tasks.task1 ? v.result.tasks.task1.data_issues : [];
  return { ok: true, flat, dataIssues, warnings: v.warnings, usage: json.usage, ms };
}

async function gradeLegacy(c) {
  const req = legacy.buildWritingAssessmentRequest_(
    { task1Prompt: c.task1Prompt, task1Essay: c.task1Essay, task2Prompt: c.task2Prompt, task2Essay: c.task2Essay },
    { verifiedTask1Facts: c.verifiedTask1Facts || "" },
  );
  const { json, ms } = await callApi({
    model, max_tokens: legacy.MAX_TOKENS,
    system: req.messages[0].content,
    messages: [{ role: "user", content: [{ type: "text", text: req.messages[1].content }, { type: "text", text: `Give your complete assessment by calling the ${legacy.RESULT_TOOL.name} tool once, with exactly the JSON object described in the instructions as its input. Do not reply with plain text.` }] }],
    tools: [legacy.RESULT_TOOL], tool_choice: { type: "auto" },
  });
  const tool = (json.content || []).find((b) => b.type === "tool_use");
  let raw;
  try { raw = tool ? tool.input : legacy.extractFirstJsonObject_(legacy.extractResponseText_(json)); } catch (e) { return { ok: false, error: String(e).slice(0, 200), usage: json.usage, ms }; }
  const n = legacy.normalizeWritingResult_(raw);
  const flat = {};
  if (c.task1Essay) ["TA", "CC", "LR", "GRA"].forEach((k) => { flat[`task1.${k}`] = n.task1[k]; });
  if (c.task2Essay) ["TR", "CC", "LR", "GRA"].forEach((k) => { flat[`task2.${k}`] = n.task2[k]; });
  if (c.task1Essay) flat["task1.band"] = n.task1.overall;
  if (c.task2Essay) flat["task2.band"] = n.task2.overall;
  flat.final = n.final_writing_band;
  const dataIssues = raw?.task1?.data_issues || [];
  const invalid = Object.entries(flat).some(([k, v]) => /\.(TA|TR|CC|LR|GRA)$/.test(k) && !(Number.isInteger(v) && v >= 0 && v <= 9));
  return { ok: !invalid, error: invalid ? "invalid band in legacy output" : "", flat, dataIssues, usage: json.usage, ms };
}

function get(flat, p) { return flat ? flat[p] : undefined; }
function checkResult(check, r) {
  if (!r.ok) return { pass: false, why: "grading failed" };
  const f = r.flat;
  switch (check.type) {
    case "range": { const v = get(f, check.path); return v === undefined ? { pass: null, why: "n/a" } : { pass: v >= check.min && v <= check.max, why: `${check.path}=${v}` }; }
    case "equals": { const v = get(f, check.path); return v === undefined ? { pass: null, why: "n/a for this grader" } : { pass: v === check.value, why: `${check.path}=${v}` }; }
    case "relation": { const a = get(f, check.a); const b = get(f, check.b); return { pass: check.op === ">=" ? a >= b : check.op === "<=" ? a <= b : a > b, why: `${check.a}=${a} ${check.op} ${check.b}=${b}` }; }
    case "maxAllCriteria": { const vals = Object.entries(f).filter(([k]) => /\.(TA|TR|CC|LR|GRA)$/.test(k)).map(([, v]) => v); return { pass: vals.every((v) => v <= check.value), why: `max=${Math.max(...vals)}` }; }
    case "dataIssue": { const hit = (r.dataIssues || []).some((d) => check.anyOf.includes(d.type) && String(d.quote || "").includes(check.quoteIncludes)); return { pass: hit, why: `${(r.dataIssues || []).map((d) => d.type).join(",") || "none"}` }; }
    default: return { pass: null, why: "unknown check" };
  }
}

function repeatability(runsForCase) {
  const ok = runsForCase.filter((r) => r.ok);
  const keys = ok.length ? Object.keys(ok[0].flat).filter((k) => /\.(TA|TR|CC|LR|GRA)$/.test(k)) : [];
  let pairs = 0; let same = 0; let maxGap = 0;
  keys.forEach((k) => {
    for (let i = 0; i < ok.length; i += 1) for (let j = i + 1; j < ok.length; j += 1) {
      pairs += 1; const gap = Math.abs(ok[i].flat[k] - ok[j].flat[k]); if (!gap) same += 1; maxGap = Math.max(maxGap, gap);
    }
  });
  const taskKeys = ok.length ? Object.keys(ok[0].flat).filter((k) => /\.band$/.test(k)) : [];
  let tPairs = 0; let tHalf = 0; let tOnePlus = 0; let tMax = 0;
  taskKeys.forEach((k) => {
    for (let i = 0; i < ok.length; i += 1) for (let j = i + 1; j < ok.length; j += 1) {
      tPairs += 1; const gap = Math.abs(ok[i].flat[k] - ok[j].flat[k]); if (gap === 0.5) tHalf += 1; if (gap >= 1) tOnePlus += 1; tMax = Math.max(tMax, gap);
    }
  });
  return { criterionExactAgreement: pairs ? same / pairs : null, maxCriterionGap: maxGap, taskBandHalfChanges: tPairs ? tHalf / tPairs : null, taskBandOnePlusChanges: tPairs ? tOnePlus / tPairs : null, maxTaskBandGap: tMax };
}

function accuracy(rows) {
  // rows: [{ predicted, reference }]
  if (!rows.length) return null;
  const errs = rows.map((r) => r.predicted - r.reference);
  const abs = errs.map(Math.abs);
  return {
    n: rows.length,
    exact: abs.filter((e) => e === 0).length / rows.length,
    within05: abs.filter((e) => e <= 0.5).length / rows.length,
    within1: abs.filter((e) => e <= 1).length / rows.length,
    mae: abs.reduce((a, b) => a + b, 0) / rows.length,
    rmse: Math.sqrt(errs.reduce((a, b) => a + b * b, 0) / rows.length),
    signed: errs.reduce((a, b) => a + b, 0) / rows.length,
    major: abs.filter((e) => e >= 1.5).length,
  };
}

function cost(u) {
  if (!u) return 0;
  return (Number(u.input_tokens || 0) * PRICE.input + Number(u.output_tokens || 0) * PRICE.output
    + Number(u.cache_creation_input_tokens || 0) * PRICE.cacheWrite + Number(u.cache_read_input_tokens || 0) * PRICE.cacheRead) / 1e6;
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}

async function main() {
  const jobs = [];
  graders.forEach((g) => cases.forEach((c) => { for (let r = 0; r < runs; r += 1) jobs.push({ g, c, r }); }));
  const estimate = jobs.length * 0.075;
  console.log(`Plan: ${cases.length} cases × ${runs} runs × ${graders.join("+")} = ${jobs.length} API calls on ${model}. Rough cost ≈ $${estimate.toFixed(2)} (≈ $0.075 per call).`);
  if (args.dry) return;
  if (!apiKey && !authToken) { console.error("Set ANTHROPIC_API_KEY (or ANTHROPIC_AUTH_TOKEN) to run the benchmark."); process.exit(1); }
  const results = await pool(jobs, concurrency, async (job) => {
    try { return { ...job, res: await (job.g === "new" ? gradeNew(job.c) : gradeLegacy(job.c)) }; }
    catch (e) { return { ...job, res: { ok: false, error: String(e).slice(0, 300) } }; }
  });
  const report = { generatedAt: new Date().toISOString(), model, gradingVersion: WRITING_GRADING_VERSION, caseSource: caseFile.source, runs, graders: {} };
  graders.forEach((g) => {
    const mine = results.filter((x) => x.g === g);
    const perCase = cases.map((c) => {
      const rs = mine.filter((x) => x.c.id === c.id).map((x) => x.res);
      const checks = (c.checks || []).map((ch) => {
        const outcomes = rs.map((r) => checkResult(ch, r));
        const scored = outcomes.filter((o) => o.pass !== null);
        return { check: ch, passRate: scored.length ? scored.filter((o) => o.pass).length / scored.length : null, detail: outcomes.map((o) => o.why) };
      });
      return { id: c.id, pattern: c.pattern, runs: rs.map((r) => (r.ok ? r.flat : { error: r.error })), repeatability: repeatability(rs), checks };
    });
    const refRows = {};
    cases.filter((c) => c.reference && c.reference.bands).forEach((c) => {
      mine.filter((x) => x.c.id === c.id && x.res.ok).forEach((x) => {
        Object.entries(c.reference.bands).forEach(([k, ref]) => {
          const p = x.res.flat[k];
          if (Number.isFinite(p)) (refRows[k.split(".").pop()] = refRows[k.split(".").pop()] || []).push({ predicted: p, reference: ref });
        });
      });
    });
    const calls = mine.map((x) => x.res);
    const okCalls = calls.filter((r) => r.ok);
    const usage = calls.filter((r) => r.usage).map((r) => r.usage);
    const allChecks = perCase.flatMap((p) => p.checks).filter((c) => c.passRate !== null);
    report.graders[g] = {
      calls: calls.length,
      failedOrInvalid: calls.length - okCalls.length,
      checksPassRate: allChecks.length ? allChecks.reduce((a, c) => a + c.passRate, 0) / allChecks.length : null,
      repeatability: {
        criterionExactAgreement: avg(perCase.map((p) => p.repeatability.criterionExactAgreement)),
        maxCriterionGap: Math.max(0, ...perCase.map((p) => p.repeatability.maxCriterionGap)),
        taskBandHalfChanges: avg(perCase.map((p) => p.repeatability.taskBandHalfChanges)),
        taskBandOnePlusChanges: avg(perCase.map((p) => p.repeatability.taskBandOnePlusChanges)),
      },
      accuracyVsHumanReference: Object.fromEntries(Object.entries(refRows).map(([k, rows]) => [k, accuracy(rows)])),
      averageInputTokens: avg(usage.map((u) => Number(u.input_tokens || 0) + Number(u.cache_read_input_tokens || 0) + Number(u.cache_creation_input_tokens || 0))),
      averageOutputTokens: avg(usage.map((u) => Number(u.output_tokens || 0))),
      averageCostUSD: avg(usage.map(cost)),
      averageSeconds: avg(calls.filter((r) => r.ms).map((r) => r.ms / 1000)),
      perCase,
    };
  });
  mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `writing-benchmark-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2));
  graders.forEach((g) => {
    const s = report.graders[g];
    console.log(`\n[${g}] calls ${s.calls}, failed/invalid ${s.failedOrInvalid}, checks pass ${pct(s.checksPassRate)}, criterion repeat agreement ${pct(s.repeatability.criterionExactAgreement)}, max criterion gap ${s.repeatability.maxCriterionGap}, task band ±0.5 ${pct(s.repeatability.taskBandHalfChanges)}, ±1+ ${pct(s.repeatability.taskBandOnePlusChanges)}, avg in ${Math.round(s.averageInputTokens)} / out ${Math.round(s.averageOutputTokens)} tokens, avg $${(s.averageCostUSD || 0).toFixed(4)}, avg ${(s.averageSeconds || 0).toFixed(1)}s`);
    s.perCase.forEach((p) => console.log(`  ${p.id}: ${p.checks.map((c) => `${c.check.type}:${pct(c.passRate)}`).join(" ")} | runs ${p.runs.map((r) => r.error ? "ERR" : Object.entries(r).filter(([k]) => /\.(TA|TR|CC|LR|GRA)$/.test(k)).map(([, v]) => v).join("/")).join("  ")}`));
  });
  console.log(`\nFull report: ${file}`);
}
function avg(xs) { const v = xs.filter((x) => x !== null && x !== undefined && Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
function pct(x) { return x === null || x === undefined ? "n/a" : `${Math.round(x * 100)}%`; }

main().catch((e) => { console.error(e); process.exit(1); });
