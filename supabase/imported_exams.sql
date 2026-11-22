-- Imported exams (HTML Exam Converter). Additive and safe to rerun.
-- Service-role only: RLS is enabled with no policies, so browsers can never read drafts.

create table if not exists public.imported_exams (
  id uuid primary key default gen_random_uuid(),
  test_id text not null unique,
  organization_id text not null default 'ieltsmock',
  title text not null,
  skill text not null check (skill in ('reading', 'listening')),
  module text not null default 'academic' check (module in ('academic', 'general')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  content jsonb not null default '{}'::jsonb,
  answer_keys jsonb not null default '{}'::jsonb,
  media jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,
  source_name text not null default '',
  source_hash text not null,
  rights_confirmed boolean not null default false,
  created_by text not null default '',
  published_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create unique index if not exists imported_exams_org_hash_idx
  on public.imported_exams (organization_id, source_hash);
create index if not exists imported_exams_status_idx
  on public.imported_exams (organization_id, status, skill);

alter table public.imported_exams enable row level security;

-- Public bucket for imported-exam audio and images (uploads happen only through the admin API).
insert into storage.buckets (id, name, public)
values ('exam-media', 'exam-media', true)
on conflict (id) do nothing;

-- Full exams (one Listening + Reading + Writing exam stored as a single row).
alter table public.imported_exams drop constraint if exists imported_exams_skill_check;
alter table public.imported_exams
  add constraint imported_exams_skill_check check (skill in ('reading', 'listening', 'full'));

-- Verify
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'imported_exams' order by ordinal_position;
