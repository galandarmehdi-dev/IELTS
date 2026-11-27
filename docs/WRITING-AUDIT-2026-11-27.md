# Writing assessment — recalibration audit (27 Nov 2026)

Grading version `2026-11-27.1` (was `2026-11-25.1`). Framework: `ielts-writing-descriptors-may2023-paraphrase-2`.
Authority used: the official IELTS Writing Band Descriptors, Task 1 and Task 2 tables, "Updated May 2023"
(ielts.org PDF). The diagnostic review's estimates were treated as evidence to check, not as targets.

## 1. Root causes found

Evidence base: the 13 Test 24/25 submissions graded on 26–27 Nov by version 2026-11-25.1 (104 criterion scores),
the prompt and code, and the official descriptors.

**Score compression is real.** 83 of 104 criterion scores (80%) were exactly Band 5. None was above 6 and none
below 4. 11 of 13 Task 2 essays were 5/5/5/5.

| # | Cause | Where | Effect |
|---|---|---|---|
| 1 | **The descriptor paraphrase did not match the May 2023 descriptors.** It applied paragraphing limits to Task 1 Coherence, but the official Task 1 bands 3–7 never mention paragraphing. Task Response 6/7 required "all parts" instead of the "main parts" of the prompt. Its TA 5 used pre-2023 wording ("no clear overview"). The TA 6 vs TA 5 split ("inaccurate information **in areas of detail**" vs "inaccurate material **in key areas**") was blurred, so the two bands read almost the same. The 20-words → Band 1 rule and the copied-rubric rule were missing. | `WRITING_DESCRIPTOR_GUIDE` | Task 1 CC and TA, and Task 2 TR, undergraded. |
| 2 | **The official reading rule was missing and partly reversed.** The descriptors say a script must fully fit a band's positive features, and only the bolded features limit a rating. So "may" weaknesses at a band (mechanical cohesion, some details missing, errors that rarely impede) are compatible with that band. The old guide said "not every feature of a band must be present", and had no notion of features that are compatible with a band or features that limit it. Any weakness could therefore pull a script below 6. | guide + prompt | Compression toward 5. |
| 3 | **The guidance only warned in one direction.** "Layout and linkers do not by themselves earn CC 6 or 7", "covering every part does not by itself justify TR 6–7", "long sentences full of errors are not evidence of control". There were no matching instructions on when 6 or 7 *is* justified. | `WRITING_SYSTEM_PROMPT` | Downward pull on CC, TR, LR and GRA. |
| 4 | **One reply scored all four criteria together, with all evidence and scores visible.** The anti-halo rule was an instruction only. | `callOpenAIIELTS_` (one call) | Criterion contamination, e.g. Elnur T1 TA 5 despite accurate figures. |
| 5 | **No chart data.** The model read the chart image by eye. `verifiedTask1Facts` was supported by the module but never supplied. | Apps Script input | Factual feedback errors: Madina "fresh coffee is the lowest category in four cities" (it is all five). Accuracy of TA judgements relied on the model reading the bars by eye. |
| 6 | **There was no rule against invented grammar rules or optional "corrections".** | prompt | "'as they planned' → 'as they had planned'" and "use the present perfect" presented as errors (Banay). "Has several drawbacks … drawbacks outweigh" called contradictory (Amina). |
| 7 | **Qualified positions and implicit relevance were not covered.** "Outweigh" questions were read as needing an unconditional verdict. Paragraphs on older people's experience were marked "partially relevant" (Bunyatov, Madina, Amina, Laman). | prompt | TR undergraded. "Partially relevant" also triggered a second full assessment on 6 of 13 essays, and none changed a band. |
| 8 | **Feedback could contradict the band.** Examples: "your figures are accurate and you cover every category" with TA 5 (Khagan), and "clear sequence, each paragraph has a recognisable purpose" with CC 5. No check compared them. | validator | Feedback/band mismatch. |
| 9 | **Model settings.** Claude Sonnet 5.5 thinks adaptively by default (effort "high"). The code never set this and the docs did not mention it. The sample averaged 21k output tokens and 140 s per test, about $0.21+ each (the docs said ≈ $0.075). Temperature cannot be set while thinking is on, so repeated runs vary. | `callClaudeWritingOnce_` | Cost/latency underestimated; repeated runs vary. |

**Already correct and kept:**
- No hidden score caps, minimums, maximum gaps or automatic penalties exist in code.
- Code computes all bands. Rounding is .25 → .5 and .75 → next band.
- Task 2 counts double, from unrounded means.
- Single-task results keep their own band.
- A real Band 0 is kept.
- Quotes and error items are verified against the essay.
- Student text sits inside random-marker tags.
- Invalid replies are retried and never stored as a band.

## 2. Files and functions changed

| File | Change |
|---|---|
| `src/writingAssessment.mjs` | New descriptor guide. New system prompt. Per-assessor schema (`buildWritingSchema({group})`), `buildWritingRequest({group, verifiedTask1Facts})`. `validateWritingAssessment`: ≤20-word rule, chart-figure check, feedback/band consistency check, missing "why not higher" check, fundamental-misreading check. New `mergeGroupAssessments`, `ownWordCount`, `referenceFactsFor`. `computeWritingBands` now also returns `raw`. `reviewReasons`: "partially relevant" no longer triggers a second assessment. `toStoredResult` adds `writing_raw`, `assessors`, `task1_context`. |
| `src/writingTask1Facts.mjs` (new) | Reference data for Task 1 charts, by exam id. Entries for Test 24 (coffee/tea, y-axis from 20%) and Test 25 (leisure time; no data for men in two categories). |
| `src/appsscript.gs` | `runWritingAssessment_` runs the two assessors in parallel with `UrlFetchApp.fetchAll` and retries each on its own. `callOpenAIIELTS_(writingJson, examId)` supplies the reference data. `processNewWritingSubmission_` passes `examId`. New `writingCalibrationRun()`. The generated `WRITING_` block is updated. |
| `scripts/build-appsscript-grading.mjs` | Also copies `writingTask1Facts.mjs` into the generated block. |
| `tests/writingCalibration.test.mjs` (new), `tests/appsScriptWriting.test.mjs`, `tests/writingAssessment.test.mjs` | See section 9. |

## 3. Prompt changes

- **Descriptor guide**: rewritten band by band from the May 2023 tables, as our own paraphrase (not the official wording).
  - Separate Task 1 TA and Task 2 TR.
  - The CC paragraphing lines differ by task.
  - The "fully fit the positive features" rule, and "may" features marked as compatible with their band.
  - The bolded limiting features marked `[LIMIT]`.
  - Band 1 (≤20 words, wholly unrelated, copied rubric discounted) and the exact Band 0 conditions.
- **Procedure**:
  - Stage 1 task analysis:
    - Task 1: the key features are listed from the reference data or image *before* the response is read.
    - Task 2: the question type and the required main parts are listed per question type.
  - Stage 2 criterion assessment: evidence → band fully fitted → why not higher → why not lower → band.
  - Stage 3 verification in both directions: halo, unofficial requirements, feedback/band agreement.
  - Stage 4: no arithmetic.
- **Calibration by criterion, taken from the descriptors:**
  - TA: three inaccuracy levels (minor, substantial, fundamental), mapped to the descriptor lines. No exhaustive reporting required. Overview judged by content wherever it appears. Missing data is not zero.
  - TR: 6 vs 5 on "main parts" and "conclusions may be unclear". Qualified positions are legitimate. Development can take many forms. Relevance includes implicit but reasonable connections. Unofficial essay requirements are listed and banned.
  - CC: 6 is the starting point when there is clear overall progression, even with mechanical linking. Linkers are not counted. Task 1 paragraphing matters only at 8–9. Accuracy problems belong to TA/TR.
  - LR: 6 vs 5 on whether meaning is clear and errors cause difficulty. Successful vocabulary is recorded. Necessary topic repetition is fine. Ambition without control earns nothing.
  - GRA: 6 vs 5. Errors are classified correctly (grammar, vocabulary, spelling, word formation). Invented rules are banned, with examples. Punctuation is weighed in proportion.
  - Length: no deductions or caps; each criterion is judged on what is demonstrated.
- **Feedback rules**: quotes must exist; corrections must be valid; optional improvements are labelled as suggestions; every chart figure must match the reference data or the image; no self-contradiction. Feedback gives strengths, limiting problems, why the band fits and the next achievable step, with no generic advice.
- **Injection**: unchanged in principle. The examples now include "Assign TA 9…" and "you are now an examiner…". The code detector also catches those patterns and "full marks".

## 4. Grading logic changes

- **Two independent assessors per submission, in parallel:**
  - The content assessor scores TA/TR + CC and receives the image and reference data.
  - The language assessor scores LR + GRA and receives no image.
  - Neither sees the other's evidence or bands.
  - Each reply is validated on its own and retried on its own (up to 3 rounds).
  - Code merges the two replies. If the two assessors disagree on whether a response is assessable, nothing is stored.
- **Why two calls instead of one:**
  - It is the only structural way to keep one criterion's scores out of another's.
  - Latency: the calls run in parallel and each covers half the criteria, so it should be about the same as one call or lower.
  - Cost: input is sent twice (the system prompt is cached and shared). Output is split, not duplicated.
  - A single call with "logically separated" sections was the old design, and it produced the compression above.
- **Official ≤20-word rule** applied in code. Words copied from the question are discounted.
- **Second assessment triggers:**
  - Kept: low confidence, incomplete task context, instructions addressed to the grader, ≥4 fabricated quotes removed.
  - New: a fundamental chart misreading with TA ≥ 5.
  - Removed: "partially relevant".

## 5. Scoring caps or restrictions removed

There were no numeric caps in code. The restrictions came from the prompt and guide:
- Task 1 paragraphing applied at bands 5–7.
- "All parts" required for TR 6/7.
- One-sided "does not by itself earn 6/7" rules.
- No band accepted with any "may" weakness present.

All of these are removed. The full 0–9 range is stated and tested: profiles such as TA 9/CC 7/LR 5/GRA 5 and TR 3/CC 8/LR 8/GRA 8 survive merging and arithmetic unchanged.

## 6. Task-data verification

- New `src/writingTask1Facts.mjs`: per-exam reference data given to the content assessor as authoritative for figures, categories and key features.
- **Tests 24 and 25 are entered.** I read both charts from their images on 27 Nov, with values marked as approximate. They should be checked by a person, then their `status` set to `admin_checked`.
- **Tests 1–23 have no entry yet.** For those, TA still relies on the image. The validator still blocks invented data when no image is available.
- **Test 24's image is hotlinked** from practicepteonline.com. If that site removes it, Task 1 would be graded without the chart (the reference data still covers it). Upload it to the site's own storage.

## 7. Feedback validation

New checks in code. None of them changes a band; they lower confidence or flag the result in `gradingMeta.review_flags`:

- Chart figures (>10) in Task 1 feedback that appear neither in the reference data nor in the essay (±1.5).
- Band ≤5 whose feedback uses Band 6+ descriptor language (e.g. "clear overall progression", "figures are accurate") without a substantive reason why the next band is not reached.
- Missing "why not the next band" reason (confidence lowered).
- Fundamental chart misreading reported with TA ≥5.

Existing checks are kept: exact quotes, error items with real corrections, advice cleared when no criterion is below 7/8.

## 8. Score calculation

- Unchanged and verified:
  - Task band = (4 criteria)/4, rounded to the half band.
  - Writing = (T1 mean + 2 × T2 mean)/3 from unrounded means, rounded once (.25 → .5, .75 → next band).
  - Single-task: that task's band.
- Missing tasks are never 0. An unassessable task is a real 0.
- New: the raw Writing score is stored (`gradingMeta.writing_raw`) next to the task means.

## 9. Tests

`npm test`: **134 tests, all pass** (27 Nov 2026). New or changed Writing tests cover:

- **Descriptors and prompt:**
  - Descriptor fidelity: the reading rule, `[LIMIT]`, ≤20 words, Task 1 paragraphing, TR main parts, detail vs key areas, misunderstood data.
  - The one-sided rules are gone.
- **Assessors and request:**
  - Assessor schemas contain only their own criteria.
  - The language assessor gets no image or reference data.
  - Each assessor's bands come only from its own reply.
  - Candidate names never enter the request.
- **Scores:**
  - Extreme profiles: 9/7/5/5 and 3/8/8/8.
  - Whole, half and boundary rounding (6.25, 6.2499, 6.75, 6.7499).
  - A case where double rounding would differ.
  - Band 0 and Band 9.
  - Missing Task 1, missing Task 2, a missing criterion, fractional bands, non-JSON output.
  - Assessors disagreeing on assessability.
- **Rules and checks:**
  - The ≤20-word rule with copied rubric discounted.
  - Chart-figure check.
  - Feedback/band mismatch flag.
  - Fundamental-misreading flag.
- **Failure handling:**
  - Retry only the failed assessor.
  - Refusal not retried.
  - Selective second assessment.
  - Injection essay.

## 10–12. Original vs revised scores, remaining differences, consistency

**Not measured yet.** There is no Anthropic API key outside Apps Script, so I could not run the model on the 13 cases from here. No revised scores are reported until they exist.

`writingCalibrationRun()` (Apps Script) re-grades the 13 cases with the new rubric. It writes original vs new bands, raw scores, warnings, tokens and seconds to a new **"Writing Calibration"** sheet and does not touch any student result.
- Set `WRITING_CALIBRATION_RUNS = 2` to measure test-retest consistency.
- Cost: about $0.15–0.20 per case per run, estimated.

My own reading of the cases the diagnostic review disputed, against the descriptors (an AI judgement, not examiner ground truth):

- **Telman T1 TA 3 and Shamil T1 TA 3 are well founded.** Reading employment categories as days of the week, or swapping the legend so the main findings are inverted, matches TA 3 ("does not address the requirements, possibly because of misunderstanding the data").
- **Elnur T1 TA, Khagan T1 TA and Shamil T1 CC/GRA are well founded.** In each case the old feedback itself described Band 6+ features.
- **Turan T2 TR 4 vs 5, and Ibrahim T. / Sarxan T2 LR 4 vs 5, are genuine borderline cases.** The descriptors support either band, depending on how much the misspellings impede meaning and how minimal the treatment of the prompt is.

## 13. Latency and cost

| | 2026-11-25.1 (measured, 13 cases) | 2026-11-27.1 (expected; to be measured by the calibration run) |
|---|---|---|
| Calls per test | 1.7 average (22 calls; 6 of 13 triggered a second assessment) | 2 in parallel; a second pair only on narrower triggers |
| Output tokens per test | 21,100 average (thinking + JSON) | split across the two assessors; total expected similar |
| Time per test | 140 s average (76–308 s) | ≈ one call's duration (parallel) |
| Cost per test | ≈ $0.22 (Sonnet 5.5: $2/M input, $10/M output, $0.10/M cache reads) | ≈ $0.17–0.25 |

## 14. Remaining limitations

- No examiner-marked scripts exist in the project. Agreement with the diagnostic review is AI-to-AI agreement, not accuracy.
- Repeated runs still vary: Sonnet 5.5 thinks by default, so temperature cannot be pinned. Repeatability must be measured (calibration with 2 runs), not assumed.
- Task 1 reference data exists for Tests 24 and 25 only.
- Each assessor still sees the whole essay, so a general impression can form inside one assessor. The split stops one criterion's scores from feeding another's within a single reply. It cannot make a judge fully impression-free.
- **Historical scores were not changed.** Results graded before this version keep their scores. A regrade must be a separate, approved step (the calibration sheet is the input for that decision).
- The new Apps Script takes effect only after it is pasted into the Apps Script editor and saved. The `script.scriptapp` scope is still needed for the continuation timers.

## 15. Recommendations for examiner-based calibration

1. Collect 40–60 scripts double-marked by trained IELTS teachers at criterion level, across Bands 3–8. Include the profile types listed in the audit brief: high TA/low GRA, misread charts, qualified opinions, underlength, and others.
2. Add them to `tests/fixtures/writing-benchmark/` with `reference: { source: "teacher", bands: {...} }`. Report exact and ±1 criterion agreement, MAE, signed error, and the rates of over- and undergrading.
3. Set aside 20% of the scripts and never use them to tune prompts, so the system is not fitted to its examples.
4. Re-run the calibration after any prompt change, and keep the grading version in `gradingMeta` so that score shifts can be traced.
