-- Durable final-submission inbox for ieltsmock.org.
-- Apply this before making /api/submissions/finalize the only production final-submit path.

create extension if not exists pgcrypto;

create table if not exists public.submission_inbox (
  id uuid primary key default gen_random_uuid(),
  submission_id text not null unique,
  idempotency_key text not null unique,
  logical_idempotency_key text not null,
  organization_id text not null default 'ieltsmock',
  student_id text,
  student_name text,
  official_email text,
  login_email text,
  test_id text not null,
  section text not null default 'full mock',
  submitted_at_client timestamptz not null,
  received_at_server timestamptz not null default now(),
  payload_hash text not null,
  raw_payload jsonb not null,
  processing_status text not null default 'received'
    check (processing_status in (
      'received',
      'processing',
      'processed',
      'backup_written',
      'failed_processing',
      'failed_backup',
      'duplicate',
      'duplicate_conflict',
      'invalid_payload',
      'reviewed'
    )),
  backup_status text not null default 'pending'
    check (backup_status in ('pending', 'written', 'failed', 'skipped')),
  attempt_count integer not null default 0,
  backup_attempt_count integer not null default 0,
  last_error text,
  backup_last_error text,
  last_processed_at timestamptz,
  last_backup_at timestamptz,
  reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists submission_inbox_org_status_idx
  on public.submission_inbox (organization_id, processing_status, received_at_server desc);

create index if not exists submission_inbox_logical_idx
  on public.submission_inbox (logical_idempotency_key);

create index if not exists submission_inbox_test_idx
  on public.submission_inbox (organization_id, test_id, submitted_at_client desc);

create index if not exists submission_inbox_student_idx
  on public.submission_inbox (organization_id, student_id, login_email);

create or replace function public.set_submission_inbox_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_submission_inbox_updated_at on public.submission_inbox;
create trigger set_submission_inbox_updated_at
before update on public.submission_inbox
for each row execute function public.set_submission_inbox_updated_at();

alter table public.submission_inbox enable row level security;

drop policy if exists "submission_inbox_service_role_all" on public.submission_inbox;
create policy "submission_inbox_service_role_all"
on public.submission_inbox
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
