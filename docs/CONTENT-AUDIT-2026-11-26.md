# Content and answer-key audit — 26 Nov 2026

Scope: all 25 full tests (built-in 1–23, imported 24 and 25), Listening and Reading. Every question was rendered
and checked by `scripts/content-audit/run.mjs` (imported exams: the same checker run in the admin page), every
image/audio link was fetched, and every saved score was recounted against the live keys (dry run, per test, with
answers from the database or the sheet).

## Fixed today (no score change)

- **Test 24 Reading Q28–29 were missing from the page.** The source writes "28.an optimistic…" / "29.a description…"
  with no space after the number and the importer skipped both lines. Restored from the source text; keys unchanged
  (G, B). Importer fixed (`examParser.mjs` NUMBERED_RE / stripLead) with a test on the 313 fixture.

## Clean

- All 58 image/audio links load.
- No question without text, no options without text, no key outside its options, no TRUE/FALSE vs YES/NO mismatch,
  no word-limit breach (after allowing number words and hyphenated words).
- Flags that are correct as they are: map-labelling dropdowns (letters are on the image: T11 L11–14, T12 L11–14,
  T14 L16–20), T22 L6 and T23 L21–24 (context in the heading/box above), T1 R9–13 (notes built by the engine),
  T6 R9 "super-hot fires" (hyphenated = one word).
- Saved scores: 1,203 of 1,268 attempt-sections match the keys; 46 have no saved answers; 15 are below the key count
  (see below); the rest only need their two stored copies synced (same score).

## Needs the administrator's decision

### 1. Saved scores below the key count (all raises)
13 × Test 4 Listening (+1 each, April and June 2026 — the stored "religion" key fix had not been applied to them),
Mehin A. Test 20 Listening 10 → 17 and Mishel M. Test 21 Listening 32 → 33 (23 Nov; capital-letter answers).

### 2. Choose-TWO questions with separate keys (scores can only go up)
The page saves the two letters in A–Z order (checkboxes) or in the order typed, but each question has its own
letter, so a correct letter in the "wrong" box scores 0 (T5 L35–36: ticking B + C scores 0, though C is right).
Shared keys like "C / E" mark each correct letter once, in any order.

| Test | Questions | Now | Proposed |
|---|---|---|---|
| 4 | R37–38, R39–40 | B · E, A · E | B / E, A / E |
| 5 | L35–36, L37–38, L39–40 | C · E, A · D, A · C | C / E, A / D, A / C |
| 7 | L11–12, L13–14 | B · E, B · C | B / E, B / C |
| 8 | L31–32 | B · C | B / C |
| 8 | R20–21, R22–23, R33–34, R35–36 | B · E, D · E, A · B, B · C | B / E, D / E, A / B, B / C |
| 24 | L11–12, L13–14 | B · C, A · C | B / C, A / C |
| 25 | R20–21, R22–23 | C · E, B · D | C / E, B / D |

### 3. Wrong keys in Test 5 Reading (some scores would go down)
- Headings Q1, 2, 4, 5, 14–20 each accept two headings; the second is the right one, the first is wrong
  (e.g. Q1 Paragraph A "v / vi": the paragraph is about the boy Besart → vi).
- **Q17 (paragraph D, kefir's texture/taste/fizz/aroma) does not accept the correct heading i "A unique sensory
  experience"** — the key is "iii / iv".
- Q25–26 "Which TWO products are NOT mentioned as things kefir can replace": key "B / C" + "E"; the passage says kefir
  is a buttermilk substitute (B), so the answer is C and E (as in Test 2, same passage).
- Q32 "D / C" → C; Q33 "E / D" → D (passage: focused attention blocks associations; companies give time out).

Proposed keys: Q1 vi, Q2 vii, Q4 iv, Q5 viii, Q14 viii, Q15 iii, Q16 vii, Q17 i, Q18 vi, Q19 ix, Q20 ii,
Q25–26 C / E, Q32 C, Q33 D. Options: regrade everyone, or keep past credit for the wrongly accepted letters
(question-version style) and apply the strict keys to new attempts.

### 4. Test 24 Reading Q28–29 for earlier takers
Nobody could answer them until today. Same choice as Test 25 Listening Q27–30: credit them for all earlier attempts?

## Applied (administrator: "fix all", 26 Nov 2026)

- **Keys**: all choose-TWO groups in section 2 now share one key (built-in in `objectiveAnswerKeys.mjs`, imported via
  importedExamUpdate); Test 5 Reading keys corrected as in section 3. Built-in changes pushed to the AnswerKey sheet
  (39 cells) and pinned in `answerKeyVerification.mjs`.
- **Test 5 Reading before 8 Apr 2026**: the dry run showed drops of 9–14 marks for attempts from 6 Apr. Test 5 Reading
  was replaced on 8 Apr (commit cc779ed: new headings lists, options and questions); the double keys had been accepting
  the old heading numbers. Attempts submitted before 2026-04-08T08:05Z (one attempt at 07:59 still used the old page)
  keep the keys they were marked with, through `questionVersions.mjs` (TEST5_READING_REPLACED_AT); later attempts use
  the corrected keys.
- **Test 24 Reading Q28–29** credited to all 13 earlier attempts (admin corrections, +2 each; the four manual Listening
  Q24 marks kept).
- **Regrade** (per test, answers from database/sheet, 0 failed updates):

| Test | Change |
|---|---|
| 4 Listening | 13 up (+1, stored "religion" fix) |
| 4 Reading | 15 up (Q37–40 shared keys) |
| 5 Listening | 12 up (Q35–40 shared keys) |
| 5 Reading | 10 up, 17 down (attempts after 8 Apr: wrongly credited old heading numbers removed, Q17 i accepted, Q25–26/32/33) |
| 7 Listening | 3 up |
| 8 Reading | 5 up |
| 20 Listening | Mehin A. 10 → 17 |
| 21 Listening | Mishel M. 32 → 33 |
| 24 Listening | 4 up (Q11–14 shared keys) |
| 24 Reading | 13 × +2 (Q28–29 credited) |
| 25 Reading | 7 up (Q20–23 shared keys) |

Backups: `recount_backup:2026-11-26T17:45:28.626Z` … `17:46:36.089Z` (one per test) and the Test 24 Q28–29
corrections in `answer_overrides:` records. Ali Hamidzada's Test 25 Listening stays at the key count (31).
