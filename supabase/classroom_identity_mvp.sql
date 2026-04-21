-- Classroom Student ID identity layer.
-- Safe/additive: creates new classroom/profile tables and appends nullable identity columns to exam_attempts.

create extension if not exists pgcrypto;

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'ieltsmock',
  name text not null,
  teacher_name text,
  teacher_email text,
  created_at timestamptz default now()
);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null default 'ieltsmock',
  student_id_code text unique not null,
  name text not null,
  surname text,
  classroom_id uuid references public.classrooms(id) on delete set null,
  official_email text,
  personal_password_hash text,
  personal_password_salt text,
  linked_auth_user_id uuid,
  linked_auth_identity text,
  linked_auth_email text,
  linked_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.exam_attempts add column if not exists student_profile_id uuid;
alter table public.exam_attempts add column if not exists student_id_code text;
alter table public.exam_attempts add column if not exists classroom_id uuid;
alter table public.exam_attempts add column if not exists official_email text;

create index if not exists classrooms_organization_id_idx on public.classrooms(organization_id);
create index if not exists student_profiles_organization_id_idx on public.student_profiles(organization_id);
create index if not exists student_profiles_classroom_id_idx on public.student_profiles(classroom_id);
create index if not exists student_profiles_linked_auth_user_id_idx on public.student_profiles(linked_auth_user_id);
create index if not exists student_profiles_linked_auth_identity_idx on public.student_profiles(linked_auth_identity);
create index if not exists exam_attempts_student_profile_id_idx on public.exam_attempts(student_profile_id);
create index if not exists exam_attempts_student_id_code_idx on public.exam_attempts(student_id_code);
create index if not exists exam_attempts_classroom_id_idx on public.exam_attempts(classroom_id);

create unique index if not exists student_profiles_unique_linked_auth_user_id
on public.student_profiles(linked_auth_user_id)
where linked_auth_user_id is not null;

create unique index if not exists student_profiles_unique_linked_auth_identity
on public.student_profiles(linked_auth_identity)
where linked_auth_identity is not null;

create or replace function public.set_student_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_student_profiles_updated_at on public.student_profiles;
create trigger set_student_profiles_updated_at
before update on public.student_profiles
for each row execute function public.set_student_profiles_updated_at();

alter table public.classrooms enable row level security;
alter table public.student_profiles enable row level security;

-- Admin/classroom management is performed through the Worker with the service role key.
-- Students can read only their own linked profile when they are real Supabase-auth users.
-- Shared-password students use the Worker endpoint because they do not have Supabase Auth UUIDs.

drop policy if exists "Linked students read own profile" on public.student_profiles;
create policy "Linked students read own profile"
on public.student_profiles
for select
to authenticated
using (auth.uid() = linked_auth_user_id);

-- No public insert/update/delete policies are added for classrooms or student_profiles.
-- Keep content/admin mutations behind the Worker admin endpoints.
