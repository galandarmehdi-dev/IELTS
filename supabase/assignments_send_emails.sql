-- "Publish as exam": assignments with send_emails = false never email students.
-- Safe/additive: existing assignments default to true (emails behave as before). Safe to rerun.

alter table public.assignments
  add column if not exists send_emails boolean not null default true;

-- Verify
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'assignments' and column_name = 'send_emails';
