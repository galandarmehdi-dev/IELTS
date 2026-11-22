-- Add columns that the worker inserts/updates but were missing from the original table.
-- All statements use ADD COLUMN IF NOT EXISTS — safe to run on a table that already has some of them.

-- test-id traceability (which test content was used per section)
alter table public.exam_attempts add column if not exists active_test_id   text;
alter table public.exam_attempts add column if not exists listening_test_id text;
alter table public.exam_attempts add column if not exists reading_test_id   text;
alter table public.exam_attempts add column if not exists writing_test_id   text;

-- question-count metadata (for scoring accuracy display)
alter table public.exam_attempts add column if not exists listening_total_questions integer;
alter table public.exam_attempts add column if not exists reading_total_questions   integer;

-- per-task writing bands and feedback (written by AI grading pipeline)
alter table public.exam_attempts add column if not exists task1_band       numeric(3,1);
alter table public.exam_attempts add column if not exists task2_band       numeric(3,1);
alter table public.exam_attempts add column if not exists task1_breakdown  jsonb;
alter table public.exam_attempts add column if not exists task2_breakdown  jsonb;
alter table public.exam_attempts add column if not exists task1_feedback   text;
alter table public.exam_attempts add column if not exists task2_feedback   text;
alter table public.exam_attempts add column if not exists overall_feedback text;

-- Remove duplicate rows before adding the unique constraint.
-- Keeps the newest row (highest id) for each (submitted_at, student_full_name, exam_id) group.
-- Safe to run multiple times — rows already unique will not be touched.
with dupes as (
  select id,
         row_number() over (
           partition by submitted_at, student_full_name, exam_id
           order by id desc
         ) as rn
  from public.exam_attempts
)
delete from public.exam_attempts
where id in (select id from dupes where rn > 1);

-- unique constraint required by the on_conflict upsert in mirrorFullExamSubmissionToSupabase
-- (only creates it if it doesn't already exist — wrapped in DO block to be idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.exam_attempts'::regclass
      and contype = 'u'
      and conname = 'exam_attempts_submitted_at_student_name_exam_id_key'
  ) then
    alter table public.exam_attempts
      add constraint exam_attempts_submitted_at_student_name_exam_id_key
      unique (submitted_at, student_full_name, exam_id);
  end if;
end
$$;

-- Indexes for the new columns
create index if not exists exam_attempts_active_test_id_idx on public.exam_attempts (active_test_id);
