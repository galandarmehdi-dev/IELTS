-- Seed Leznik classroom: Metaphor
-- Teacher: Humay Rajabova (humay.rejebova@leznik.edu.az)
-- Safe to rerun:
-- 1) Classroom is upserted by organization/name.
-- 2) Students are matched by official_email (case-insensitive) and updated in place.
-- 3) New student_id_code values are enforced for this class roster.

begin;

with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Metaphor', 'Humay Rajabova', 'humay.rejebova@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Metaphor')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Metaphor')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Humay Rajabova',
      teacher_email = 'humay.rejebova@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
), metaphor_students(student_id_code, name, surname, official_email) as (
  values
    ('LZ-M7Q2R9TX', 'Jasmin', 'Tarverdiyeva', 'jasmin.tarverdieva@leznik.edu.az'),
    ('LZ-M3K8V4NP', 'Aydan', 'Nafizada', 'aydan.nefizade@leznik.edu.az'),
    ('LZ-M9R5D1XQ', 'Amina', 'Abbasova', 'emina.abbasova@leznik.edu.az'),
    ('LZ-M2H7L6WC', 'Fatima', 'Huseynzada', 'fatime.huseynzade@leznik.edu.az'),
    ('LZ-M4P1W8NB', 'Fatima', 'Malikova', 'fatima.malikova@leznik.edu.az'),
    ('LZ-M8N3F5YK', 'Jasmin', 'Amirova', 'jasmin.amirova@leznik.edu.az'),
    ('LZ-M1D9X4TS', 'Leyla', 'Amirova', 'leyla.amirovaemin@leznik.edu.az'),
    ('LZ-M6B2R7WL', 'Nurlana', 'Jabiyeva', 'nurlana.jabiyeva@leznik.edu.az'),
    ('LZ-M5C8J3QF', 'Rada', 'Zeynalova', 'rade.zeynalova@leznik.edu.az'),
    ('LZ-M7T4K1VN', 'Rauf', 'Hasanli', 'rauf.hasanli@leznik.edu.az'),
    ('LZ-M9W6M2HP', 'Said', 'Huseynov', 'said.huseynov@leznik.edu.az'),
    ('LZ-M3X5N8RD', 'Sona', 'Shirinova', 'sona.shirinova@leznik.edu.az'),
    ('LZ-M2Q7L4YB', 'Timur', 'Raskhojev', 'timur.raskhojev@leznik.edu.az'),
    ('LZ-M8V1C6TK', 'Turqut', 'Asgarzada', 'turqut.asgerzade@leznik.edu.az'),
    ('LZ-M4R9P2XM', 'Khagan', 'Polukhov', 'khagan.polukhov@leznik.edu.az'),
    ('LZ-M6F3W7QH', 'Kamilla', 'Ismayilova', 'kamilla.ismayilova@leznik.edu.az'),
    ('LZ-M1N8D5VC', 'Madina', 'Aliyeva', 'medina.aliyeva@leznik.edu.az'),
    ('LZ-M5Y2K9PR', 'Turan', 'Jafarli', 'turan.jafarli@leznik.edu.az'),
    ('LZ-M8L4Q6XD', 'Inji', 'Rzayeva', 'inci.rzayeva@leznik.edu.az')
), updated_existing as (
  update public.student_profiles sp
  set student_id_code = ms.student_id_code,
      name = ms.name,
      surname = ms.surname,
      classroom_id = cls.id,
      official_email = ms.official_email,
      organization_id = 'ieltsmock',
      is_active = true,
      updated_at = now()
  from metaphor_students ms
  cross join classroom cls
  where lower(coalesce(sp.official_email, '')) = lower(ms.official_email)
  returning lower(sp.official_email) as email
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
  ms.student_id_code,
  ms.name,
  ms.surname,
  cls.id,
  ms.official_email,
  true
from metaphor_students ms
cross join classroom cls
left join updated_existing ue on ue.email = lower(ms.official_email)
where ue.email is null
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true,
    updated_at = now();

commit;
