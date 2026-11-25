# Listening & Reading grading audit — 25 Nov 2026

Scope: every built-in test (IELTS 1–23), all 1,840 answer keys, and every stored Listening/Reading
response in the database (1,364 attempt-sections: 896 full mock, 468 practice; 47,917 responses, of
which 6,692 blank). Raw data was exported with the admin action `exportObjectiveResponses` and audited
offline by re-marking every response with the old rules and with the new engine.

## Root causes

| # | Problem | Kind | Where it hit |
|---|---|---|---|
| 1 | **Analytics used the key saved inside each old practice review**, not today's key. After a key changed, old and new reviews disagreed, and the "displayed key" was whichever review was read last. This produced most of the "identical answer rejected" rows (e.g. `documents` vs `DOCUMENTS`, `J` vs `J`, `NO` vs `NO`, `C / E` vs `C`). | Analytics | Question analytics |
| 2 | **Wrong answer keys copied from the AnswerKey sheet.** A sheet sync on 1 Jun 2026 and another on 25 Nov 2026 replaced website keys with sheet values. Three were provably wrong (IELTS21 R10, IELTS22 R28–29); the June sync also dropped valid alternatives (e.g. `socialise`). | Data | All marking |
| 3 | **Case-sensitive marking in the sheet rules.** The Apps Script (and the recount that copied it) accepted a different case only for single letters or ALL-CAPS answers, so `Dublin`/`Full` (phone auto-capitalisation) failed against `dublin`/`full`. | Grading | Full-mock scores |
| 4 | **Azerbaijani/Turkish keyboards.** Capital I is typed as `İ` (U+0130), so `EXPERİENCE` never equalled `experience`. | Grading | Full-mock scores |
| 5 | **Optional endings parsed with a space**: `disease(s)` expanded to `disease s`, so `diseases` was rejected. | Grading | Both engines |
| 6 | **No formatting equivalence** for dates (`fifth of July`), number words (`10 months`/`ten months`), hyphens (`eco friendly`), quotation marks (`'Animal Magic'`), decimals (`1.8`/`1.80`). | Grading | Both engines |
| 7 | **Two different matchers.** The Worker stripped all punctuation and ignored case; the sheet was case-sensitive. The same answer could be right in practice and wrong in a full mock. | Architecture | Everywhere |
| 8 | Stored totals are written once at submit time, so key fixes never reached old results unless a recount ran. | Process | Student results |

Not a cause: choose-TWO/THREE grouping already scored any order correctly (since c64b27a); the
"`C / E` rejected `C`" rows came from cause 1.

## What changed

**One marking engine — `src/grading.mjs`.** Used by every Worker path (full-mock grading, practice
marking, question analytics, recount, Fix key re-marking, answer review) and copied into the Apps Script
by `scripts/build-appsscript-grading.mjs` (the full script is now versioned as `src/appsscript.gs`;
`--check` fails if the copy is stale). The old duplicate matchers were deleted.

It forgives only deterministic formatting: case (incl. `İ`/`ı`), invisible characters, non-breaking and
repeated spaces, curly quotes/dashes, accents (`café`), hyphen = space, `&` = and, `%` = per cent, a
trailing full stop, dots in abbreviations (`a.m.`), number words (`ten`, `twentieth`, `two hundred and
fifty`), thousands separators, date order and ordinals (`2 July` = `July 2nd` = `the 2nd of July`),
am/pm times (`2 p.m.` = `2:00 PM`), `8.55` = `8:55` when the key is a time, and numeric value when the
key is a plain number (`1.8` = `1.80`, never for times).

It never uses fuzzy matching, stemming, plural conversion, synonyms, spelling correction or dropping
words. `phoneline` ≠ `phone line`, `bright` ≠ `brighter`, `orchards` ≠ `orchids`, `1,1` ≠ `1.1`.

Key syntax is unchanged: `a / b` alternatives, `(word)` optional word, `word(s)` optional ending,
consecutive identical letter keys (`C/E` on Q21–22) = choose-TWO group, any order, each letter once.

**Question analytics** (existing page, no redesign):
- marks every attempt live with the current key; practice questions never shown to the student are not
  counted as blank;
- wrong answers grouped case-insensitively and shown as written;
- answered / blank counts and a confidence label per question (1–4 insufficient, 5–9 low, 10–19
  moderate, 20–49 higher, 50+ strongest);
- flags with a suggested action on hover: critical grading anomaly (saved marks wrong under today's
  key), possible answer-key issue, possible alignment issue (word answer = neighbour's key, or a swap
  pattern for letters/TFNG), possible accepted variant (plural/article/spacing/one word — for review
  only, never auto-accepted), multiple-answer check, high blank rate, possible technical issue,
  insufficient data, genuine difficulty;
- new filters: Issue, Attempts from (full / practice), Unanswered (count / exclude), Sort by;
- questions with unresolved anomalies or < 5 answers no longer decide "hardest exam" / "most missed";
- "Mark solved" now shows a warning if the issue is still detected.

**Imports**: missing answer keys, unbalanced brackets, empty alternatives and impossible groups block
publishing; contradictory alternatives (TRUE / FALSE), lone slash-letter keys, stray tabs and
invisible characters warn.

**Regrading**: `recountObjectiveScores` now uses the engine, saves a backup of every value it overwrites
(`recount_backup:<time>` in KV, listed in `recount_log`) and can be undone with
`undoObjectiveRecount { backupKey }`. It writes absolute totals, so running it twice changes nothing.
`pushAnswerKeysToSheet` writes website keys into the AnswerKey sheet.

**Tests**: `tests/grading.test.mjs` (case, Unicode, Azerbaijani keyboard, hyphens, optional
words/endings, numbers, dates, times, strictness list, TFNG/YNNG, groups incl. C,C / C,A / A,B, manual
overrides, every verified key, validation of all 46 built-in key sets) and new import-validation tests.
`npm test`: 82/82 pass; `npm run check:syntax` and `wrangler deploy --dry-run` pass.

## Answer keys changed (all verified against the source)

| Test | Old key | New key | Evidence |
|---|---|---|---|
| IELTS21 R10 | gateways | documents | Q: "first reference to White Horse Hill appears in ___ from the 1070s." Passage: "mentioned in documents from the nearby Abbey of Abingdon". |
| IELTS22 R28 | I | J | Summary: "a challenging task for which he had to overcome [numerous problems = J]". |
| IELTS22 R29 | J | I | "a straightforward [internet purchase = I] would not be possible". |
| IELTS13 L36 | socialize | socialize / socialise | British spelling was in the original key; removed by the June sync. |
| IELTS6 R13 | beetle | (bark) beetle | Passage: "outbreaks of bark beetle"; limit TWO WORDS. |
| IELTS6 R17 | sperm whales / sperm (whales) | sperm whale(s) / sperm | Q asks "Which kind of whale…". |

The AnswerKey sheet cells were updated to match (AP10, AR28, AR29, Y36; Test 6 cells pending deploy).

## Database-wide findings

- Tests audited: 23 · keys: 1,840 · responses: 47,917 (6,692 blank)
- Responses whose mark changes: **206** across **80 questions** — 205 newly correct, 1 newly wrong
  (`1,1 billion years`, decimal comma, practice)
  - verified key corrections: 87 (3 questions)
  - letter case incl. Azerbaijani `İ` and auto-capitalisation: 68 (58 questions)
  - date formats: 25 · hyphen/space: 8 · number words: 7 · quotation marks: 6 · optional endings: 3 · decimals: 1
- Attempt-sections whose total changes: **133** (115 full mock, 18 practice); 132 up, 1 down; largest gain +16
  (one student whose whole section was capitalised).
- Key validation: no critical errors in any built-in key; 61 warnings (mostly duplicate alternatives
  like `health/Health`, harmless) and 3 lone slash-letter keys (IELTS5 R25, R32, R33).

## Historical regrade (applied 25 Nov 2026, approved by the site owner)

- Dry run first (all 23 tests, including 548 older results whose answers exist only in the sheet):
  1,206 saved Listening/Reading results checked, 159 to change, 0 decreases, 46 with no saved answers
  (left as they were).
- Largest gains checked answer by answer (e.g. 14→29, 14→27, 19→32, 15→31): first-letter capitals
  ("Kitchen" for "kitchen") rejected by the old case-sensitive sheet rules. The only other forgiven
  answers in those tests were quotation marks, optional key words and "07:30" for "7:30".
- Applied: **159 results corrected for 118 students, 0 failed updates**. Bands and overall bands
  recalculated; results caches cleared.
- Backups: one `recount_backup:<time>` KV entry per test that changed (20), listed in `recount_log`;
  `undoObjectiveRecount { backupKey }` restores them.
- Verification: a fresh dry run over all 23 tests reports 0 results out of date.
- Practice-session results are stored separately and were not rewritten; Question analytics already
  marks them with the current keys.

## Verified as correct keys (students misled by distractors — not changed)

IELTS13 R14 (ten minutes; "100 miles apart" is always true, the question is about time before time
zones), IELTS21 R36 (FALSE; students were "instructed/assigned" a viewpoint), IELTS21 R40 (TRUE; "only a
small positive relationship"), IELTS20 R28 (D) and R29 (C; "workers feed the algorithm with false data
to reach their targets"), IELTS12 R22 (grains; the gap already contains "from the seabed"), IELTS12
Listening 1–8 (current keys fit the form and match the students).

Rejected answers confirmed incorrect: IELTS13 R15 `measurements` (passage: "exact measurements of
duration"), IELTS10 L4 `Beatrice Russell` (ONE WORD limit), IELTS13 L4 `6` (no unit), IELTS19 R38
`gunshot` (passage: "gunshot wound"), IELTS18 R20 `Middle Ages` (passage: "late Middle Ages"), IELTS13
R10 `individual` (key: "the individual").

## Needs an administrator decision

Reading — two sources disagree and the passage supports both or I could not settle it:
- IELTS11 R20: C (sheet) vs D (original key). Para C "increased infertility", para D "breeding pools"; letters may repeat. 22 students chose D.
- IELTS12 R27: YES (sheet) vs NO (original). "this seemingly looming crisis". 12 YES / 11 NG / 5 NO.
- IELTS12 R36: NOT GIVEN (sheet) vs NO (original). 12 YES / 11 NG / 6 NO.
- IELTS12 R10–11: A/E (sheet) vs C/E (original).
- IELTS16 R31: F (sheet) vs A (original).
- IELTS5 R1–20, R32–33, R35–39: keys accept two different answers (e.g. `v / vi`, `behaviour / internet`), which looks like two test versions merged. Needs the source key.
- IELTS1 R13 calculus vs fluxions; IELTS7 R40 music vs rhyme; IELTS17 R19, IELTS13 R5, IELTS16 R38–39, IELTS10 R11–12 (strong TFNG distractors flagged by analytics).

Listening — the repo has no transcripts, so these need the recording:
- Keys changed by the June sync: IELTS1 L11/L13/L14 (c,a,b → a,b,c), IELTS3 L6 Maired → Mairead, IELTS11 L2 R16 GH7 → RI6 GH7, L3 07754 → 07754897432, IELTS10 L6 xmail → mail, IELTS15 L3 chastens → Chastons, IELTS8 L12 `usage` dropped, IELTS8 L17 `an umbrella` dropped.
- Possible variants (plural/comparative): IELTS20 L8 Wednesday (23 students; "Held on ___"), IELTS9 L9 movements (19), IELTS4 L31 religion, IELTS5 L30 grasses, IELTS4 L29 cost, IELTS17 L39 danger ("the ___ they face"), IELTS11 L36 large slicks, IELTS14 L36 bright, IELTS1 L21 Secret Garden.
- Alignment/key flags: IELTS5 L27–28, IELTS21 L11–12, IELTS9 L25, IELTS6 L1, IELTS5 L20, IELTS11 L6–8.

Use Question analytics → Issue filter to work through these; Fix key re-marks everyone and updates the sheet.

## Before → after per question

| Question | Key | Answers that change | Responses |
|---|---|---|---|
| ielts21 R10 | gateways → documents | documents×45 | 45 |
| ielts22 R28 | I → J | j×21 | 21 |
| ielts22 R29 | J → I | i×21 | 21 |
| ielts16 L7 | 21st July / 21 July / July 21 / July 21st | twenty first of july×11 | 11 |
| ielts16 L1 | 5th July / 5 July / July 5/ July 5th | fifth of july×7 | 7 |
| ielts11 L38 | eco-friendly | eco friendly×5 | 5 |
| ielts10 R28 | ten months | 10 months×4 | 4 |
| ielts17 L2 | 28th June / 28 June / June 28 / June 28th | june 28×4 | 4 |
| ielts9 L8 | Animal Magic | 'animal magic'×3 | 3 |
| ielts15 L3 | Chastons | chastons×3 | 3 |
| ielts13 R14 | ten minutes | 10 minutes×3 | 3 |
| ielts15 L6 | experience | experience×3 | 3 |
| ielts20 L9 | Fradstone | fradstone×2 | 2 |
| ielts21 L4 | Grandparents | grandparents×2 | 2 |
| ielts9 L4 | full | full×2 | 2 |
| ielts9 L5 | Domestic Life | 'domestic life'×2 | 2 |
| ielts2 L39 | (certain) disease(s) | diseases×2 | 2 |
| ielts17 R13 | efficiency | efficiency×2 | 2 |
| ielts15 L1 | receptionist | receptionist×2 | 2 |
| ielts15 L10 | parking | parking×2 | 2 |
| ielts23 L1 | Northern | northern | 1 |
| ielts23 L9 | Drum | drum | 1 |
| ielts23 L10 | Italian | italian | 1 |
| ielts21 R9 | Ridgeway | ridgeway | 1 |
| ielts21 L30 | evaluate | evaluate | 1 |
| ielts9 L2 | relative | relative | 1 |
| ielts9 L3 | socialise / socialize | socialize | 1 |
| ielts9 L6 | clouds | clouds | 1 |
| ielts9 L7 | timing | timing | 1 |
| ielts9 L9 | (animal) movement | movement | 1 |
| ielts9 L10 | dark | dark | 1 |
| ielts9 L31 | technical | technical | 1 |
| ielts9 L32 | cheap | cheap | 1 |
| ielts9 L33 | thousands | thousands | 1 |
| ielts9 L34 | identification | identification | 1 |
| ielts9 L37 | location | location | 1 |
| ielts9 L38 | prediction | prediction | 1 |
| ielts9 L39 | database | database | 1 |
| ielts9 R5 | architects | architects | 1 |
| ielts9 R6 | moisture | moisture | 1 |
| ielts9 R8 | speed | speed | 1 |
| ielts9 R24 | speed | speed | 1 |
| ielts9 R26 | strict | strict | 1 |
| ielts22 L2 | motorbike | motorbike | 1 |
| ielts22 L3 | hairdresser | hairdresser | 1 |
| ielts22 L4 | suit | suit | 1 |
| ielts22 L5 | laptop | laptop | 1 |
| ielts22 L7 | coffee | coffee | 1 |
| ielts22 L8 | books | books | 1 |
| ielts22 L10 | cinema | cinema | 1 |
| ielts22 L31 | routine | routine | 1 |
| ielts22 L32 | trials | trials | 1 |
| ielts22 L33 | calming | calming | 1 |
| ielts22 L34 | pillows | pillows | 1 |
| ielts22 L39 | nature | nature | 1 |
| ielts19 L1 | Flynn | flynn | 1 |
| ielts19 L5 | umbrella | umbrella | 1 |
| ielts6 R9 | super hot fires / hot fires / fires | super-hot fires | 1 |
| ielts21 L1 | frame | frame | 1 |
| ielts19 L6 | 10:30 / 10.30 | '10:30 | 1 |
| ielts15 L33 | Europe | europe | 1 |
| ielts2 L16 | 2 July/2nd July | july 2 | 1 |
| ielts1 L6 | 1.80 | 1.8 | 1 |
| ielts1 L2 | Helendale | helendale | 1 |
| ielts1 L3 | Central Street/ Central St | central street | 1 |
| ielts1 L15 | first year/1st year/ First year | first-year | 1 |
| ielts1 L21 | The Secret Garden | the secret garden | 1 |
| ielts16 L2 | Dublin | dublin | 1 |
| ielts17 L1 | Connor | connor | 1 |
| ielts16 R8 | quarters | quarters | 1 |
| ielts7 L31 | food | food | 1 |
| ielts7 R21 | communication | communication | 1 |
| ielts9 L1 | Marrowfield | marrowfield | 1 |
| ielts12 L26 | drop out | drop-out | 1 |
| ielts11 L29 | 30th of October / 30 October / 30th October / October 30 / October 30th / 30.10 | 30 of october | 1 |
| ielts15 L2 | Medical | medical | 1 |
| ielts15 L39 | children | children | 1 |
| ielts15 R8 | gardening | gardening | 1 |
| ielts10 L2 | 13th September / 13 September / September 13 / September 13th | 13 september | 1 |
| ielts17 R14 | 1.1 billion years | 1,1 billion years (now rejected) | 1 |

---

# Follow-up audit — 25 Nov 2026 (afternoon)

## What the "52 saved grading discrepancies" were
They are **practice sessions**. A practice session stores its own per-question marks and total, made with
the key that applied on the day. The morning regrade covered full mocks only. Every discrepancy comes from
a key that changed after the session was taken (June/November sheet syncs, verified corrections), not from
the matching rules.

## Changes
- **Practice recount** (`recountPracticeScores`): re-marks every saved practice review with the current key,
  reports false negatives (saved wrong, correct now) and false positives (saved correct, wrong now), keeps
  questions with a **disputed** key exactly as saved, backs up every row before writing, and has an undo.
- **TRUE/FALSE vs YES/NO** — strict by default (`TFNG_POLICY` in wrangler.jsonc; `lenient` is opt-in).
  Question types come from each block's own instructions (`scripts/build-question-types.mjs` →
  `src/questionTypes.mjs`, 189 questions in 21 tests). All 28 keys that accepted both forms
  ("TRUE / yes", "false / no", "Not given / Not Given") were on YES/NO questions; they now hold one value,
  on the website and in the AnswerKey sheet. **Historical regrades keep the lenient rule**: older test pages
  offered TRUE/FALSE/NOT GIVEN on some YES/NO questions (e.g. IELTS1 R33, where saved full mocks contain
  "TRUE"), so a strict regrade would have removed 59 marks for the page's wording.
- **Key verification registry** (`src/answerKeyVerification.mjs`): 18 verified, 15 disputed, 7 need the
  recording — each with quoted evidence. Every key changed by a sheet sync without verification is
  disputed.
- **IELTS16 R31 restored to A**: Q31 "a reference to the widespread occurrence of writer's block in
  literature" = paragraph A ("A common phenomenon in literature… Few are the writers… who can profess to
  never…"). F is Q29 (historical cases). The June sheet sync had copied Q29's F into Q31.
- **Analytics flags**
  - *Genuine academic difficulty* only for a verified key with no open issue; otherwise *Potential academic
    difficulty*.
  - *Possible answer-key issue* no longer follows from low accuracy: it needs ≥10 answers, the top wrong
    answer ≥5 times and at least as popular as the key, wrong answers concentrated well beyond chance for
    the question type (TRUE/FALSE/NG: 3 options; letters: the options seen; open answers), and no positive
    discrimination. Flags fell from 78 to 21.
  - *Discrimination*: rest-of-section score of students answering correctly minus those answering wrongly.
  - Spelling mistakes are counted separately from possible variants (labels only; marking unchanged).
  - *Disputed answer key* flag with the evidence; disputed questions are not shown as grading anomalies.
- **Grouped answers**: a correct letter already used elsewhere in its choose-TWO/THREE group is shown as
  "duplicate in group (counted once)". IELTS13 R27: the one "D" was a duplicate (Q25–27 = A/D/E).
- **Test difficulty**: computed over **all** questions of each test, with observed accuracy, reliable
  wrong rate (≥5 answers, no open issue), verified-key wrong rate, blank rate, open-issue count, attempts
  and unique students reported separately. Unresolved issues never decide the ranking.

## Suspicious keys reviewed
| Question | Result |
|---|---|
| IELTS20 L8 Wednesday/Wednesdays | Needs the recording ("Held on ___"; a weekly class suggests the plural). Unchanged. |
| IELTS9 L9 movement/movements | Needs the recording. Unchanged. |
| IELTS13 R10 individual | Verified: "making ___ responsible" needs "the individual" or "employees". |
| IELTS4 L31 religion/religions | Needs the recording. Unchanged. |
| IELTS5 L30 grass/grasses | Needs the recording. Unchanged. |
| IELTS13 R5 FALSE/NOT GIVEN | **Disputed**: passage ("shrink the amygdala… not let it affect us so much") contradicts "increase" → suggests FALSE. Key (NOT GIVEN) unchanged pending your decision. |
| IELTS17 R19 TRUE/NOT GIVEN | **Disputed**: seals' bases are on islets that "mirror" MacLeod's tables → FALSE arguable; TRUE is wrong. |
| IELTS21 R36 TRUE/FALSE | Verified FALSE (students were "instructed"/"assigned"). |
| IELTS20 R28–29 | Verified D and C; not reversed. |
| IELTS5 L27–28 | Needs the recording. |
| IELTS7 R40 music/rhyme | Verified music ("sound similar" already = rhyme; passage "music and rhyme"). |
| IELTS6 L1 white/stripes | Needs the recording. |

## Dry runs (nothing written yet)
| | Checked | Changed | Up | Down | False negatives fixed | False positives fixed | Kept as saved (disputed) |
|---|---|---|---|---|---|---|---|
| Practice sessions | 468 | 41 sessions, 35 students | 40 | 1 | 87 marks | 1 mark | 73 marks |
| Full mocks | all 23 tests | 17 results (Test 16 only) | 7 | 10 | 7 | 10 | — |

- The one practice decrease: "1,1 billion years" for "1.1 billion years" (decimal comma), previously accepted.
- The 10 full-mock decreases: students who answered F to IELTS16 R31 (the wrong sheet key), −1 mark each.
- All other tests: 0 changes; the morning regrade already matches.

## Tests
`npm test`: 86/86 pass (grading engine, TRUE/YES policy and question-type coverage, verification registry,
analytics labels, imports). Syntax check and `wrangler deploy --dry-run` pass.

---

# Administrator-approved corrections (25 Nov 2026, evening)

Live since 2026-11-25T16:47Z (version cut-off `QUESTION_REVISIONS_AT` = 16:46:30Z). Keys are in
`src/objectiveAnswerKeys.mjs` and the AnswerKey sheet; wording in `src/protectedTestContent.mjs`; versions and
historical policies in `src/questionVersions.mjs`; verification (with pinned keys) in `src/answerKeyVerification.mjs`.

| Question | Category | Original wording | Revised wording | Old key | Approved key | Historical policy (v1 attempts) |
|---|---|---|---|---|---|---|
| IELTS10 L6 | A | unchanged | — | b.russell64@mail.co.uk | b.russell64@xmail.co.uk | approved key |
| IELTS3 L6 | A | unchanged | — | Mairead (Maired before June) | Mairead | approved key |
| IELTS11 L2 | A | unchanged | — | RI6 GH7 / RI6GH7 (R16 GH7 before June) | RI6 GH7 / RI6GH7 | approved key |
| IELTS13 R5 | A | unchanged | — | NOT GIVEN | FALSE | approved key |
| IELTS11 R20 | B | Negative effect on breeding in marine organisms. | Reduced reproductive ability in marine organisms caused by chemical pollutants. | C (D before June) | C | C or D |
| IELTS17 R19 | B | Grey and common seals live on the flat-topped hills known as MacLeod's Tables. | The flat islets where grey and common seals have their bases are known as MacLeod's Tables. | NOT GIVEN | FALSE | FALSE or NOT GIVEN |
| IELTS12 R10–11 | B | options A ("first appearance in communications…") and D ('at sign') | A "earliest recorded use in written documents…", D 'at' sign | A/E (C/E before June) | C/E, any order | any two of A, C, E (each once) |
| IELTS12 R27 | B | The catastrophic effects of running out of sand are close to happening. | The author suggests that humanity may be approaching a crisis concerning the availability of sand. | YES (NO before June) | YES | **proposed** YES or NOT GIVEN |
| IELTS12 R36 | B | Expatriates feel a sense of isolation in new countries because everything is so new. | Feelings of loneliness and homesickness generally emerge during the honeymoon period rather than the subsequent negotiation period. | NOT GIVEN (NO before June) | NO | NOT GIVEN |

Protection: verified keys are pinned (a test fails if a sync changes one); the Worker compares the AnswerKey
sheet with the website keys every 6 hours (`checkSheetAnswerKeys`, needs the Apps Script `getAnswerKeySheet`
action) and records conflicts in KV and Question analytics without adopting the sheet value;
`resolveSheetConflict { keep: "website" }` writes the website key back. Adopting a sheet value requires Fix key
(and, for a verified key, a change to the verification registry).

Analytics: version-1 and version-2 attempts of revised questions are separate rows (with their own accuracy and
discrimination); version-2 rows appear once students answer the new wording.
