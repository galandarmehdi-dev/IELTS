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
    ('LZ-UY6KT8G2', 'Murad', 'Bayramli', (select id from flame), 'm.bayramli.bayram@leznik.edu.az'),
    ('LZ-B35SRV8J', 'Farida', 'Bakir', (select id from flame), 'farida.bakir@leznik.edu.az'),
    ('LZ-GWULCAG3', 'Jalal', 'Jahangirov', (select id from flame), 'jalal.jahangirov@leznik.edu.az'),
    ('LZ-SLM6P7D8', 'Saidali', 'Jabrayilov', (select id from flame), 'jabrayilov.saidali@leznik.edu.az'),
    ('LZ-PTH4HHKC', 'Ayla', 'Ahmadzada', (select id from flame), 'ayla.ahmadzada@leznik.edu.az'),
    ('LZ-8NPGW438', 'Amin', 'Alisafazade', (select id from flame), 'amin.alisafazade@leznik.edu.az'),
    ('LZ-HE3Z9Z3Q', 'Huseyn', 'Aliyev', (select id from flame), 'huseyn.aliyev@leznik.edu.az'),
    ('LZ-7MA7SRFT', 'Fidan', 'Asadli', (select id from flame), 'fidan.asadli@leznik.edu.az'),
    ('LZ-ND3LXDAH', 'Zarin', 'Asgarova', (select id from flame), 'asgarova.zarin@leznik.edu.az'),
    ('LZ-7HZ8CJFH', 'Faraj', 'Farajzada', (select id from flame), 'faraj.farajzada@leznik.edu.az'),
    ('LZ-TC6ZY72Q', 'Ali', 'Hajiyev', (select id from flame), 'ali.hajiyev@leznik.edu.az'),
    ('LZ-JY4Y5R9T', 'Ayla', 'Mirzazada', (select id from flame), 'ayla.mirzazada@leznik.edu.az'),
    ('LZ-65V8YJKP', 'Namiq', 'Rustamov', (select id from flame), 'n.rustamov@leznik.edu.az'),
    ('LZ-ZZJJB5E7', 'Yasmin', 'Nurova', (select id from flame), 'yasmin.nurova@leznik.edu.az'),
    ('LZ-B2PKS4SG', 'Javidan', 'Qambarov', (select id from flame), 'javidan.qambarov@leznik.edu.az'),
    ('LZ-73VCWKV6', 'Aylin', 'Quluzada', (select id from flame), 'aylin.quluzada@leznik.edu.az'),
    ('LZ-796DDKUT', 'Turqut', 'Ismayilzada', (select id from flame), 'turqut.ismayilzada@leznik.edu.az'),
    ('LZ-5QXA3ZKU', 'Valeriya', 'Roshenko', (select id from flame), 'valeriya.roshenko@leznik.edu.az'),
    ('LZ-TFTTGUKD', 'Aziza', 'Yolchuyeva', (select id from flame), 'aziza.yolchuyeva@leznik.edu.az'),
    ('LZ-HPAXDRML', 'Sara', 'Miray', (select id from flame), 'sara.miray@leznik.edu.az'),
    ('LZ-GG2T738R', 'Layla', 'Muradi', (select id from flame), 'layla.muradi@leznik.edu.az'),

    -- Bloom
    ('LZ-K6EZD9BN', 'Yusif', 'Tahirli', (select id from bloom), 'yusif.tahirli@leznik.edu.az'),
    ('LZ-ERJGLQWD', 'Adel', 'Danilova', (select id from bloom), 'adel.irina@leznik.edu.az'),
    ('LZ-9V7EWD6F', 'Jamil', 'Rustamov', (select id from bloom), 'jamil.rustamov@leznik.edu.az'),
    ('LZ-W3RYBWTH', 'Sevil', 'Afandiyeva', (select id from bloom), 'sevil.afandiyeva@leznik.edu.az'),
    ('LZ-97EK2U9P', 'Gozel', 'Alekberzade', (select id from bloom), 'gozel.alekberzade@leznik.edu.az'),
    ('LZ-H2XJTQM8', 'Humay', 'Alizade', (select id from bloom), 'humay.elizade@leznik.edu.az'),
    ('LZ-U7D3XHFS', 'Zeynab', 'Huseynova', (select id from bloom), 'zeynab.huseynova@leznik.edu.az'),
    ('LZ-VKTYET87', 'Leyla', 'Mammadli', (select id from bloom), 'leyla.mammadli@leznik.edu.az'),
    ('LZ-DDBK7VMZ', 'Aylin', 'Mansurova', (select id from bloom), 'aylin.mansurova@leznik.edu.az'),
    ('LZ-PSTHMR6X', 'Medina', 'Huseynzade', (select id from bloom), 'medina.huseynzade@leznik.edu.az'),
    ('LZ-W5VH3H6C', 'Oguz', 'Hacili', (select id from bloom), 'oguz.hacili@leznik.edu.az'),
    ('LZ-RLGXCD6H', 'Muhammed', 'Qarayev', (select id from bloom), 'muhammed.qarayev@leznik.edu.az'),
    ('LZ-CW2Y6MUJ', 'Tahir', 'Jafarov', (select id from bloom), 'tahir.jafarov@leznik.edu.az'),
    ('LZ-WBNV6SL3', 'Uzeyir', 'Hajiyev', (select id from bloom), 'uzeyir.hajiyev@leznik.edu.az'),
    ('LZ-585UDNEN', 'Khayyam', 'Yusufzade', (select id from bloom), 'khayyam.yusufzade@leznik.edu.az')
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
where sp.student_id_code like 'LZ-%'
order by sp.student_id_code;
