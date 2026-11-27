# Writing assessment — audit and implementation (25 Nov 2026)

> **Superseded in part by [WRITING-AUDIT-2026-11-27.md](WRITING-AUDIT-2026-11-27.md)** (version 2026-11-27.1):
> descriptor guide rewritten from the May 2023 tables, two independent assessors (content: TA/TR + CC;
> language: LR + GRA) run in parallel, Task 1 reference data (`src/writingTask1Facts.mjs`), feedback checks,
> the official ≤20-word rule and `writingCalibrationRun()`. The sections below describe the 25 Nov version.

## How it works now

Submission → Apps Script `tryGradeSubmissionNow_` → `processNewWritingSubmission_` → `callOpenAIIELTS_`
(name kept for callers) → `runWritingAssessment_` → Claude (`claude-sonnet-5-5`, unchanged) → validation →
band calculation in code → Writing sheet → existing Supabase sync.

The assessment logic lives in **`src/writingAssessment.mjs`** and is copied into the Apps Script by
`node scripts/build-appsscript-grading.mjs` (`--check` fails if the copy is stale). Configuration at the
top of the writing section in `src/appsscript.gs`:

| Setting | Default | Meaning |
|---|---|---|
| `OPENAI_MODELS_FOR_WRITING[0]` | `claude-sonnet-5-5` | grading model (unchanged) |
| `WRITING_VERIFY_MODE` | `selective` | `off` / `selective` (second independent assessment only when needed) / `always` |
| `WRITING_BAND_POLICY` | `criteria_weighted` | `criteria_weighted` (no intermediate rounding) or `task_bands` (previous) |
| `WRITING_MAX_TOKENS` | 16000 | output + thinking budget per call |

## A. Audit of the previous system

| Area | Finding |
|---|---|
| Output validation | **Defect.** A full validator (`parseAndValidateAssessment_`: band ranges, exact-quote checks, advice/band consistency, no "verified" chart accuracy without the chart) existed but was never called. Model output went straight to `normalizeWritingResult_`, which rounded whatever number it got. |
| Overall band | **Defect.** If the model returned `overall` or `final_writing_band`, that value was used instead of the calculation. Writing band was computed from already-rounded task bands (double rounding). |
| Zero vs missing | **Defect.** Bands were written as `value || ""`, so a legitimate Band 0 was stored as blank, looked ungraded and was regraded repeatedly. |
| Task 1 visual | **Defect.** On any failure with the image, the script retried without it; the "visual not available" limitation was then discarded, so a chart-blind TA looked like a normal grade. |
| Duplicates (case G) | **Defect.** 46 essays have more than one block in the Writing sheet; 22 of these have one blank and one graded block. Blank blocks came from runs whose output could not be mapped to bands; the "already graded" check saw no band and graded again. No guard prevented the submit-time attempt and the background queue from grading the same essay simultaneously. |
| Adjacent bands | **Weakness.** "Award the higher of two adjacent bands only when the script shows the key features… Being 'close' is not enough" — an asymmetric rule that leans downward, not best fit. |
| Evidence | Partial. Evidence quotes were requested but not verified; no explicit "why not higher / why not lower", no confidence. |
| Descriptors | No descriptor text was supplied; the model relied on memory. |
| Structured output | Tool call with an open schema (`additionalProperties: true`); malformed JSON caused failures on 25 Nov morning. |
| Cost | No prompt caching (≈3.9k-token system prompt re-sent at full price every time). |
| Version history | None: no model, prompt version, confidence or status stored. |
| Already correct | Random-marker tags around student text; injection warning; task-type guidance incl. processes/maps/letters; no word-count deductions; single-task Writing band policy; Task 2 double weight; deterministic word count. |
| Not applicable | General Training: the site has no GT writing tasks (none in the content). GT letter assessment remains in the prompt and schema and is selected when a submission carries `testType: "general"`. |

## B. Changes

**Prompt** (`WRITING_SYSTEM_PROMPT`): per-criterion procedure — evidence → descriptor match → provisional band →
why not higher / why not lower → final band → confidence; explicit anti-halo rule; best-fit (symmetric)
adjacent-band rule; criterion attribution table with "second criterion only if independently damaged";
LR guidance on frequency/variety/severity, repeated vs systematic misspellings, no credit for misused
advanced/idiomatic language; CC judged on progression, not layout or linker counts; TR against the exact
question, mention vs develop vs support, outweigh questions, factual slips only as they weaken arguments,
off-topic TR can be very low with language assessed separately; Task 1 error severity scale, internal
contradictions recognised even without the chart, overview judged by content not the word "Overall";
processes/maps without numbers; letters without chart rules; length without fixed deductions; never call a
response AI-generated; no manufactured strengths/weaknesses; a final verification section (halo, double
penalties, band level, quotes, feedback) that must fix problems, not rubber-stamp. A paraphrased descriptor
guide covering Bands 0–9 for TA (Academic and GT), TR, CC, LR and GRA is appended (own wording; not the
official text).

**Structured output**: the JSON Schema (built per request with only the submitted tasks; every object
closed, every field required) is sent as text in the user message, and every reply is checked by
`validateWritingAssessment` and retried if it does not fit. It is not sent as `output_config.format`: the API
rejects a strict grammar this large ("The compiled grammar is too large", 400), which failed every essay on
26 Nov 2026. Evidence and adjacent-band fields precede the
band in the schema.

**Validation** (`validateWritingAssessment`): missing task/criterion, non-integer or out-of-range bands and
band 0 on an assessable task are fatal → retry (max 2 per variant), then a recorded failure — never a band.
Non-exact quotes, error-analysis items and data issues are removed; without the chart only internal
contradictions survive and `graph_accuracy` is forced to "unverified"; advice is cleared when no criterion
is below 7/8; a ≥2-band move during the adjacent check or a criterion with no verifiable evidence lowers its
confidence.

**Bands** (`computeWritingBands`): task band = mean of 4 criteria rounded to the half band (.25→.5,
.75→next); Writing band = (Task 1 mean + 2 × Task 2 mean) / 3 from unrounded means, rounded once (platform
policy; the internal IELTS procedure is not public). Single completed task → that task's band (unchanged
policy). Missing/failed tasks contribute nothing; an unassessable task (Band 0 conditions) is a real 0.

**Verification tier**: a second independent assessment (fresh request, no access to the first) runs only
when the first has a low-confidence criterion, incomplete task context (no question / no visual), a
partially relevant Task 2, instructions addressed to the grader, or several removed fabrications. A
≥2-band criterion gap or ≥1 task-band gap sets status `requires_review`; the primary result is kept and the
comparison stored.

**Storage**: real 0 kept; a new 8th column `gradingMeta` on the Overall row holds JSON with status
(`graded`, `graded_provisional`, `requires_review`, `invalid_submission`), grading/framework version, model,
verification strategy and result, band policy, unrounded task means, per-criterion band + confidence,
review flags, limitations, validation warnings, injection flag and token usage. Existing 7 columns and their
formats are unchanged, so every reader keeps working. Old blocks are never overwritten.

**Duplicate protection**: a 15-minute in-progress marker per essay (CacheService) prevents concurrent
grading; blocks are written only for validated results.

**Security**: student text only in the user turn inside random-marker tags; injection phrases are detected
in code (flag + second opinion) and the model must report attempts; outputs are validated independently of
the model, and the overall band is never taken from the model.

**Cost**: the system prompt is sent with `cache_control` (identical for every essay).

## C. Files

| File | Why |
|---|---|
| `src/writingAssessment.mjs` | new: prompt, descriptor guide, schema, request builder, observations, validator, band calculation, comparison, storage mapping |
| `src/appsscript.gs` | old prompt/builder/normaliser removed; new call/retry/verification flow; zero-safe storage, `gradingMeta` column, in-progress marker; generated `WRITING_` block |
| `scripts/build-appsscript-grading.mjs` | also generates the `WRITING_` block |
| `scripts/writing-benchmark.mjs` | new: benchmark, repeatability, old-vs-new comparison, cost |
| `scripts/benchmark/legacyWritingGrader.cjs` | previous production grader, for comparison only |
| `tests/writingAssessment.test.mjs` | new: 14 unit tests |
| `tests/appsScriptWriting.test.mjs` | new: 6 end-to-end tests of the real Apps Script with a fake model |
| `tests/fixtures/writing-benchmark/synthetic-cases.json` | new: 10 synthetic functional cases (A–F, injection, short, strong, non-English) |

## D–E. Testing and accuracy

- Automated: `npm test` — all suites pass (see the commit). Unit and sandbox tests prove the technical
  properties above (validation, retries, no fake bands, zero vs missing, single-task policy, rounding
  boundaries, injection separation, schema rules, verification trigger and disagreement handling).
- **Not yet run: model benchmark and repeatability.** They need an Anthropic API key and cost money
  (≈ $0.075 per call; old-vs-new × 10 cases × 3 runs ≈ $4.50):
  `ANTHROPIC_API_KEY=… node scripts/writing-benchmark.mjs --grader both --runs 3`
- **No human-marked benchmark exists in the project.** The synthetic cases test behaviour, not accuracy.
  Any agreement measured with them is AI-to-AI agreement and is not examiner accuracy. To measure accuracy,
  add teacher-marked scripts to a case file with `reference: { source: "teacher", bands: { "task2.TR": 6, … } }`;
  the benchmark then reports exact / ±0.5 / ±1 agreement, MAE, RMSE and signed error per criterion.
- Claimed improvements in grading accuracy are therefore hypotheses until that comparison is run.

## F. Cost and performance (estimates; real figures are logged in `gradingMeta.usage`)

| | Previous | Now |
|---|---|---|
| Calls per essay | 1 (+1 retry without image on failure) | 1; a 2nd only for flagged results (expected 10–25%) |
| System prompt | ≈3.9k tokens, uncached | ≈4.7k tokens + schema, cached (≈90% cheaper on cache hits) |
| Output | ≈2–3k tokens + thinking | ≈3–4k tokens + thinking (evidence and adjacent-band fields) |
| Cost per full Writing test | ≈ $0.06–0.07 | ≈ $0.07–0.08, plus ≈ $0.01–0.02 average for verification |
| Monthly at 100 / 500 / 2,000 tests | ≈ $7 / $33 / $130 | ≈ $9 / $45 / $180 |
| Time | one call, typically 40–90 s | same; flagged essays roughly double |

## G. Remaining work

- Run the benchmark (old vs new) and the repeatability test with the production key.
- Collect 30–50 teacher-marked scripts (criterion-level where available) to measure real accuracy.
- Admin visibility of `requires_review` (currently in `gradingMeta` and the System Logs).
- Decide whether to tune `WRITING_VERIFY_MODE` after seeing real verification rates and costs.
