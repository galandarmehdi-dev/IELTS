# Grading changes — 26 Nov 2026

## Admin corrections disappearing after reload
Submission times reach the worker as "…Z" (sheet) and "…+00:00" (Supabase, trailing zeros trimmed). Corrections
were saved under one spelling and read under the other (admin page after reload, student page, recounts).
Fix: one canonical key `answer_overrides:<ISO time>::<name>::<exam>::<reason>`; older corrections are still read
from `score:` records under any spelling. Commits b6c2852, 8228cc7 (the first version picked the wrong
spelling as canonical; 4 records written in between were moved to the right key).

## Test 24 (imported, test id imp-full-full-exam-ielts-writing-test-105-a51e4ce4) Listening Q21–24
Administrator: Q21–22 = C/E, Q23–24 = A/C (choose TWO). Keys changed from C, E, A, C to "C / E", "C / E",
"A / C", "A / C" so each pair is marked as a group. AnswerKey sheet updated by the save.

Regrade applied with approval (backup `recount_backup:2026-11-26T07:16:49.917Z`, 0 failures; verification dry run 0).
Between the dry run and the apply the administrator manually marked Q24 correct for Zeynab Gambarli (answer E),
Kazim Shirinli (B), Farhad Sadiq (D) and Fatima Huseynzada (blank). Final Listening totals, including those manual marks:
Zeynab 22, Kazim 26, Farhad 24, Fatima 34, Aydan Maharramova 34, Galandar Mehdiyev 1.
Without the manual Q24 marks: Zeynab 21, Kazim 25, Farhad 23, Fatima 33.

## Test 25 / "Test 203" (imp-full-full-exam-ielts-reading-test-312-be9ff084) Listening Q27–30 content
The imported card had only the A–F box and four unlabelled dropdowns: the instruction and the show names
(Ruy Blas, Man of La Mancha, The Tragedy of Jane Shore, The Sailors' Festival) were lost on import. Added them
in the existing markup style (same as Q17–20); answer keys unchanged (F, E, B, D). Verified live via /api/test-content.
No other unlabelled dropdowns in either imported exam.

## Test 25 Reading not scored on submission (Turan Jafarli)

- Cause: imported exams save their own id (`imp-full-…`) as the section test id. The worker normalized it to an empty id, so Reading had no key and was saved blank. The other Test 25 students got Reading from the sheet; Turan's row never reached it.
- Fix: commit 1f8c337 keeps imported ids and falls back to the exam number. Committed and pushed. **Not deployed yet**: Cloudflare authentication is failing for the account (dashboard included).
- Score: with the administrator's approval, Turan Jafarli's Test 25 Reading was set to 25/40 (Band 6.0) from his saved answers. Backup `recount_backup:2026-11-26T15:54:26.149Z`. The other 15 Test 25 Reading results already matched.
