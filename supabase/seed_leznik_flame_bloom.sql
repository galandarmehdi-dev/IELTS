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
    ('FLM001', 'Murad', 'Bayramli', (select id from flame), 'm.bayramli.bayram@leznik.edu.az'),
    ('FLM002', 'Farida', 'Bakir', (select id from flame), 'farida.bakir@leznik.edu.az'),
    ('FLM003', 'Jalal', 'Jahangirov', (select id from flame), 'jalal.jahangirov@leznik.edu.az'),
    ('FLM004', 'Saidali', 'Jabrayilov', (select id from flame), 'jabrayilov.saidali@leznik.edu.az'),
    ('FLM005', 'Ayla', 'Ahmadzada', (select id from flame), 'ayla.ahmadzada@leznik.edu.az'),
    ('FLM006', 'Amin', 'Alisafazade', (select id from flame), 'amin.alisafazade@leznik.edu.az'),
    ('FLM007', 'Huseyn', 'Aliyev', (select id from flame), 'huseyn.aliyev@leznik.edu.az'),
    ('FLM008', 'Fidan', 'Asadli', (select id from flame), 'fidan.asadli@leznik.edu.az'),
    ('FLM009', 'Zarin', 'Asgarova', (select id from flame), 'asgarova.zarin@leznik.edu.az'),
    ('FLM010', 'Faraj', 'Farajzada', (select id from flame), 'faraj.farajzada@leznik.edu.az'),
    ('FLM011', 'Ali', 'Hajiyev', (select id from flame), 'ali.hajiyev@leznik.edu.az'),
    ('FLM012', 'Ayla', 'Mirzazada', (select id from flame), 'ayla.mirzazada@leznik.edu.az'),
    ('FLM013', 'Namiq', 'Rustamov', (select id from flame), 'n.rustamov@leznik.edu.az'),
    ('FLM014', 'Yasmin', 'Nurova', (select id from flame), 'yasmin.nurova@leznik.edu.az'),
    ('FLM015', 'Javidan', 'Qambarov', (select id from flame), 'javidan.qambarov@leznik.edu.az'),
    ('FLM016', 'Aylin', 'Quluzada', (select id from flame), 'aylin.quluzada@leznik.edu.az'),
    ('FLM017', 'Turqut', 'Ismayilzada', (select id from flame), 'turqut.ismayilzada@leznik.edu.az'),
    ('FLM018', 'Valeriya', 'Roshenko', (select id from flame), 'valeriya.roshenko@leznik.edu.az'),
    ('FLM019', 'Aziza', 'Yolchuyeva', (select id from flame), 'aziza.yolchuyeva@leznik.edu.az'),
    ('FLM020', 'Sara', 'Miray', (select id from flame), 'sara.miray@leznik.edu.az'),
    ('FLM021', 'Layla', 'Muradi', (select id from flame), 'layla.muradi@leznik.edu.az'),

    -- Bloom
    ('BLM001', 'Yusif', 'Tahirli', (select id from bloom), 'yusif.tahirli@leznik.edu.az'),
    ('BLM002', 'Adel', 'Danilova', (select id from bloom), 'adel.irina@leznik.edu.az'),
    ('BLM003', 'Jamil', 'Rustamov', (select id from bloom), 'jamil.rustamov@leznik.edu.az'),
    ('BLM004', 'Sevil', 'Afandiyeva', (select id from bloom), 'sevil.afandiyeva@leznik.edu.az'),
    ('BLM005', 'Gozel', 'Alekberzade', (select id from bloom), 'gozel.alekberzade@leznik.edu.az'),
    ('BLM006', 'Humay', 'Alizade', (select id from bloom), 'humay.elizade@leznik.edu.az'),
    ('BLM007', 'Zeynab', 'Huseynova', (select id from bloom), 'zeynab.huseynova@leznik.edu.az'),
    ('BLM008', 'Leyla', 'Mammadli', (select id from bloom), 'leyla.mammadli@leznik.edu.az'),
    ('BLM009', 'Aylin', 'Mansurova', (select id from bloom), 'aylin.mansurova@leznik.edu.az'),
    ('BLM010', 'Medina', 'Huseynzade', (select id from bloom), 'medina.huseynzade@leznik.edu.az'),
    ('BLM011', 'Oguz', 'Hacili', (select id from bloom), 'oguz.hacili@leznik.edu.az'),
    ('BLM012', 'Muhammed', 'Qarayev', (select id from bloom), 'muhammed.qarayev@leznik.edu.az'),
    ('BLM013', 'Tahir', 'Jafarov', (select id from bloom), 'tahir.jafarov@leznik.edu.az'),
    ('BLM014', 'Uzeyir', 'Hajiyev', (select id from bloom), 'uzeyir.hajiyev@leznik.edu.az'),
    ('BLM015', 'Khayyam', 'Yusufzade', (select id from bloom), 'khayyam.yusufzade@leznik.edu.az')
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
