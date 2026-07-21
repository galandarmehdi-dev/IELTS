-- Paid subscriptions (Paddle) — ieltsmock.org only
--
-- user_subscriptions: one row per email, updated on each Paddle webhook event.
-- exam_credits: one row per email for single-pass purchases (credits_remaining
--   is decremented each time the user starts a full mock test).
--
-- Both tables are keyed by email (lower-cased) so they work for both Supabase
-- auth users and any future auth method.

create table if not exists public.user_subscriptions (
  id                     uuid        primary key default gen_random_uuid(),
  email                  text        not null,
  paddle_customer_id     text,
  paddle_transaction_id  text,
  plan                   text        not null default 'free',
  -- 'free' | 'three_month'
  status                 text        not null default 'inactive',
  -- 'active' | 'inactive' | 'cancelled'
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint user_subscriptions_email_unique unique (email),
  constraint user_subscriptions_plan_check check (plan in ('free', 'three_month')),
  constraint user_subscriptions_status_check check (status in ('active', 'inactive', 'cancelled'))
);

create table if not exists public.exam_credits (
  id                 uuid        primary key default gen_random_uuid(),
  email              text        not null,
  credits_remaining  int         not null default 0,
  paddle_transaction_id text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint exam_credits_email_unique unique (email),
  constraint exam_credits_non_negative check (credits_remaining >= 0)
);

-- RLS: users can read their own row; service role (worker webhook) can write.
alter table public.user_subscriptions enable row level security;
alter table public.exam_credits       enable row level security;

-- Authenticated users may read their own subscription row.
create policy "user_subscriptions_select_own"
  on public.user_subscriptions for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Authenticated users may read their own exam_credits row.
create policy "exam_credits_select_own"
  on public.exam_credits for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

-- Service role (used by the worker via SUPABASE_SERVICE_KEY) bypasses RLS
-- automatically, so no policy is needed for insert/update from the worker.

-- Verification
select table_name, row_security
from information_schema.tables
where table_schema = 'public'
  and table_name in ('user_subscriptions', 'exam_credits');
