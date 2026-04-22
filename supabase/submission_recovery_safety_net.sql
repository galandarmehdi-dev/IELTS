-- Server-side recovery storage for full and practice submissions.
-- Goal: keep recoverable student responses in Supabase even when Cloudflare KV is unavailable.

create extension if not exists pgcrypto;

create table if not exists public.submission_recovery (
  id uuid primary key default gen_random_uuid(),
  submission_key text unique not null,
  organization_id text not null default 'ieltsmock',
  attempt_kind text not null default 'full',
  source text not null default 'submission-backup',
  submitted_at timestamptz not null,
  exam_id text not null,
  active_test_id text,
  practice_section text,
  practice_label text,
  student_full_name text not null,
  login_email text,
  student_email text,
  user_email text,
  sign_in_method text,
  reason text,
  student_profile_id uuid,
  student_id_code text,
  classroom_id uuid,
  classroom_name text,
  official_email text,
  sheet_sync_status text not null default 'pending',
  sheet_synced_at timestamptz,
  sheet_last_error text,
  summary jsonb not null default '{}'::jsonb,
  final_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submission_recovery_org_submitted_idx
  on public.submission_recovery (organization_id, submitted_at desc);

create index if not exists submission_recovery_attempt_kind_idx
  on public.submission_recovery (attempt_kind, submitted_at desc);

create index if not exists submission_recovery_login_email_idx
  on public.submission_recovery (login_email);

create index if not exists submission_recovery_student_profile_idx
  on public.submission_recovery (student_profile_id);

create index if not exists submission_recovery_student_id_code_idx
  on public.submission_recovery (student_id_code);

create or replace function public.set_submission_recovery_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_submission_recovery_updated_at on public.submission_recovery;
create trigger set_submission_recovery_updated_at
before update on public.submission_recovery
for each row execute function public.set_submission_recovery_updated_at();

alter table public.submission_recovery enable row level security;

-- Recovery rows are managed by the Worker service role only.
