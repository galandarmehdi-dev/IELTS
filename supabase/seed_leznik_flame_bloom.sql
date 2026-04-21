-- Seed Leznik classrooms and pre-created Student IDs.
-- Run after supabase/classroom_identity_mvp.sql.
-- Idempotent: re-running updates the same Student IDs instead of duplicating students.

with flame_room as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Flame', 'Galandar Mehdiyev', 'galandar.mehdiyev@leznik.edu.az'
  where not exists (
    select 1 from public.classrooms
    where organization_id = 'ieltsmock' and lower(name) = lower('Flame')
  )
  returning id
), flame as (
  select id from flame_room
  union all
  select id from public.classrooms where organization_id = 'ieltsmock' and lower(name) = lower('Flame')
  limit 1
), bloom_room as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Bloom', 'Sakina Rasulova', 's.rasulova@leznik.edu.az'
  where not exists (
    select 1 from public.classrooms
    where organization_id = 'ieltsmock' and lower(name) = lower('Bloom')
  )
  returning id
), bloom as (
  select id from bloom_room
  union all
  select id from public.classrooms where organization_id = 'ieltsmock' and lower(name) = lower('Bloom')
  limit 1
), seed_students (student_id_code, name, surname, classroom_id, official_email) as (
  values
    -- Flame
    ('FLM001', 'Murad', 'Bayramli', (select id from flame), null),
    ('FLM002', 'Farida', 'Bakir', (select id from flame), null),
    ('FLM003', 'Celal', 'Cahangirov', (select id from flame), null),
    ('FLM004', 'Seidali', 'Cebrayilov', (select id from flame), null),
    ('FLM005', 'Ayla', 'Ahmadzada', (select id from flame), null),
    ('FLM006', 'Amin', 'Alisafazada', (select id from flame), null),
    ('FLM007', 'Huseyn', 'Aliyev', (select id from flame), null),
    ('FLM008', 'Fidan', 'Asadli', (select id from flame), null),
    ('FLM009', 'Zarin', 'Asgarova', (select id from flame), null),
    ('FLM010', 'Farac', 'Faraczada', (select id from flame), null),
    ('FLM011', 'Ali', 'Haciyev', (select id from flame), null),
    ('FLM012', 'Ayla', 'Mirzazada', (select id from flame), null),
    ('FLM013', 'Namiq', 'Rustamov', (select id from flame), null),
    ('FLM014', 'Yasmin', 'Nurova', (select id from flame), null),
    ('FLM015', 'Cavidan', 'Gambarov', (select id from flame), null),
    ('FLM016', 'Aylin', 'Guluzada', (select id from flame), null),
    ('FLM017', 'Turqut', 'Ismayilzada', (select id from flame), null),
    ('FLM018', 'Valeriya', 'Roshenko', (select id from flame), null),
    ('FLM019', 'Aziza', 'Yolchuyeva', (select id from flame), null),
    ('FLM020', 'Sara', 'Miray', (select id from flame), null),
    ('FLM021', 'Layla', 'Muradi', (select id from flame), null),

    -- Bloom
    ('BLM001', 'Yusif', 'Tahirli', (select id from bloom), null),
    ('BLM002', 'Adel', 'Danilova', (select id from bloom), null),
    ('BLM003', 'Cemil', 'Rustamov', (select id from bloom), null),
    ('BLM004', 'Sevil', 'Afandiyeva', (select id from bloom), null),
    ('BLM005', 'Gozal', 'Alakbarzada', (select id from bloom), null),
    ('BLM006', 'Humay', 'Alizada', (select id from bloom), null),
    ('BLM007', 'Zeynab', 'Huseynova', (select id from bloom), null),
    ('BLM008', 'Leyla', 'Mammadli', (select id from bloom), null),
    ('BLM009', 'Aylin', 'Mansurova', (select id from bloom), null),
    ('BLM010', 'Madina', 'Huseynzada', (select id from bloom), null),
    ('BLM011', 'Oguz', 'Hacili', (select id from bloom), null),
    ('BLM012', 'Muhammed', 'Qarayev', (select id from bloom), null),
    ('BLM013', 'Tahir', 'Cafarov', (select id from bloom), null),
    ('BLM014', 'Uzeyir', 'Haciyev', (select id from bloom), null),
    ('BLM015', 'Xayyam', 'Yusifzada', (select id from bloom), null)
)
insert into public.student_profiles (
  organization_id,
  student_id_code,
  name,
  surname,
  classroom_id,
  official_email,
  is_active
)
select
  'ieltsmock',
  student_id_code,
  name,
  surname,
  classroom_id,
  official_email,
  true
from seed_students
on conflict (student_id_code) do update set
  organization_id = excluded.organization_id,
  name = excluded.name,
  surname = excluded.surname,
  classroom_id = excluded.classroom_id,
  official_email = excluded.official_email,
  is_active = excluded.is_active,
  updated_at = now();

select
  c.name as classroom,
  count(sp.id) as students
from public.classrooms c
left join public.student_profiles sp on sp.classroom_id = c.id
where c.organization_id = 'ieltsmock'
  and c.name in ('Flame', 'Bloom')
group by c.name
order by c.name;

select
  sp.student_id_code,
  sp.surname,
  sp.name,
  c.name as classroom,
  sp.official_email
from public.student_profiles sp
left join public.classrooms c on c.id = sp.classroom_id
where sp.student_id_code like 'FLM%'
   or sp.student_id_code like 'BLM%'
order by sp.student_id_code;
