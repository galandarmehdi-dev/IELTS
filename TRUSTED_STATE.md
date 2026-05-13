# Trusted Recovery State

**Date:** 2026-05-11
**Tag:** `stable-2026-05-11-assignments-routing-working`
**Main commit:** `70c7c0e` — Merge pull request #312 (Add Resend assignment notifications and scroll hint)
**Active Worker version:** `ef157eb2-df89-418b-be4c-f5b59d8ac152` (deployed 2026-05-11T10:12:07Z)

---

## Confirmed working at this state

- **Homepage / design** — loads correctly, no regressions
- **Clean routing** — `/dashboard/`, `/history/`, `/assignments/`, `/admin/`, `/admin/results/`, `/admin/classes/`, `/admin/assignments/`, `/admin/questions/`, `/placement-test/`, `/vocabulary/`, `/recent-questions/` all serve the SPA shell correctly
- **Mock tests** — listening, reading, writing, speaking routes and submission unaffected
- **Admin assignments panel** — lists real Supabase assignments (W, L, R, Writing, IELTS 14/15 practice, etc.) ordered by `created_at DESC`
- **Assignment CRUD** — create, update (including publish), delete all write to Supabase directly from the Worker; no Apps Script involvement
- **Student assignment panel** — enrolled students see their published assignments on the homepage hero panel; `testId` camelCase field present for Start button; completed/attempted state rendered
- **Assignment emails through Resend** — when students are added (assignmentStudentsBulk) or an assignment is published (updateAssignment), emails are sent via `RESEND_API_KEY` (Cloudflare Worker secret); from: `IELTS Mock <no-reply@ieltsmock.org>`; `emailSummary` returned to frontend
- **Assignment panel scroll hint** — visible thin scrollbar and bottom fade gradient on the hero assignment list

---

## Architecture — critical notes

### Assignment storage and CRUD
- **All assignment CRUD goes through the Worker → Supabase directly.**
- Tables used: `assignments`, `assignment_students`, `student_profiles`
- The Worker calls `/rest/v1/assignments` and `/rest/v1/assignment_students` using the Supabase service role key (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` secrets).
- **Apps Script is NOT used for assignment CRUD.** Do not restore or add Apps Script assignment handlers.

### Assignment emails
- **Emails are sent from the Cloudflare Worker using Resend (`RESEND_API_KEY` secret).**
- Sender address: `IELTS Mock <no-reply@ieltsmock.org>`
- Do NOT use Apps Script `MailApp` for assignment notifications.
- Do NOT use `CONTACT_EMAIL` binding for assignment notifications unless explicitly re-approved.

### What Apps Script is still used for
- Exam submission processing (grading, writing AI scoring, objective scoring)
- Admin results fetching (`results`, `studentResult`, `studentObjectiveDetail`)
- Speaking upload (`uploadSpeaking`)
- Apps Script is proxied via `ADMIN_BACKEND_URL` with HMAC signing — this path is intact and untouched by the assignment recovery work.

---

## Recovery warnings

- **Do not restore from Worker rollback tag `ae3f95f3` alone.** That version was deployed from an uncommitted working tree and does not contain the full final assignment implementation. It is useful only as a reference point for live behavior, not as a full source restore.
- **Do not use the old `dev` branch** — it contains experimental state that diverged from production.
- **Do not revert to Apps Script assignment CRUD** — the deployed Apps Script does not have `createAssignment`, `updateAssignment`, `deleteAssignment`, or student-side assignment handlers. Only `listAssignments` existed there; it has been superseded by the Worker-direct implementation.

---

## Pending (not yet implemented — requires separate approval)

- **Issue 2 — Lock assignments after student starts:** Requires Supabase schema change:
  ```sql
  ALTER TABLE assignment_students
    ADD COLUMN started_at TIMESTAMPTZ DEFAULT NULL;
  ```
  Once approved: `markAssignmentStarted` sets `started_at`; `assignmentAccess` and `studentAssignments` return `attempted: started_at IS NOT NULL`; frontend shows "Already attempted" and hides Start button on refresh.
