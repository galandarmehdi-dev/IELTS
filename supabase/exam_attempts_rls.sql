-- RLS for exam_attempts
-- Context:
--   - The Worker uses the service_role key for all admin/backfill operations
--     (service_role bypasses RLS automatically — no changes needed there).
--   - The browser client uses the anon key + a Supabase Auth session
--     (Google OAuth / magic-link users). Shared-password students have no
--     Supabase session and never query this table directly (history.js
--     returns local-only rows for them).
--   - user_email stores the student's login email, lower-cased at write time.
--   - organization_id scopes the row to a school; enforced at the app layer
--     (JS filter + worker scoping) but not yet at the DB layer.

-- 1. Enable RLS (idempotent)
alter table public.exam_attempts enable row level security;

-- 2. SELECT: authenticated users can only read their own rows.
drop policy if exists "Students read own exam attempts" on public.exam_attempts;
create policy "Students read own exam attempts"
  on public.exam_attempts
  for select
  to authenticated
  using (
    lower(user_email) = lower(auth.jwt() ->> 'email')
  );

-- 3. INSERT: authenticated users can only insert rows stamped with their email.
drop policy if exists "Students insert own exam attempts" on public.exam_attempts;
create policy "Students insert own exam attempts"
  on public.exam_attempts
  for insert
  to authenticated
  with check (
    lower(user_email) = lower(auth.jwt() ->> 'email')
  );

-- 4. UPDATE: authenticated users can only update their own rows.
drop policy if exists "Students update own exam attempts" on public.exam_attempts;
create policy "Students update own exam attempts"
  on public.exam_attempts
  for update
  to authenticated
  using (
    lower(user_email) = lower(auth.jwt() ->> 'email')
  )
  with check (
    lower(user_email) = lower(auth.jwt() ->> 'email')
  );

-- 5. No anon access at all — anon users have no business querying this table.
--    (Shared-password students use local history only, as designed.)
drop policy if exists "No anon access to exam attempts" on public.exam_attempts;
-- (No policy needed — absence of a policy for anon = deny by default under RLS)

-- Index to make the user_email RLS check fast
create index if not exists exam_attempts_user_email_lower_idx
  on public.exam_attempts (lower(user_email));
