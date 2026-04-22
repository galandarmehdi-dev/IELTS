-- Seed Leznik classrooms: Spark, Harmony, Hope, Shine, Blok, Pearl, Dream, Spirit
-- Safe to rerun: classrooms are upserted by organization/name, students by student_id_code.
begin;

-- Spark
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Spark', 'Sama Guliyeva', 'guliyeva.sema@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Spark')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Spark')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sama Guliyeva',
      teacher_email = 'guliyeva.sema@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-X9F2KQ7M', 'Khadija', 'Hajiyeva', 'khadije.hajiyeva@leznik.edu.az'),
  ('LZ-R4D8PZ6L', 'Elin', 'Agayev', 'elin.agayev@leznik.edu.az'),
  ('LZ-M7T3VQ2X', 'Aylin', 'Ibrahimova', 'aylin.ibrahimovaelnur@leznik.edu.az'),
  ('LZ-H5K9C8WA', 'Jamal', 'Teymurov', 'camal.teymurov@leznik.edu.az'),
  ('LZ-Q2L7YB3N', 'Amir', 'Jafarov', 'amir.jafarov@leznik.edu.az'),
  ('LZ-W8E4R6TU', 'Zeyd', 'Asadullayev', 'zeyd.asadullayev@leznik.edu.az'),
  ('LZ-K3N9D5GS', 'Farid', 'Azizov', 'farid.azizov@leznik.edu.az'),
  ('LZ-V6X2M1QP', 'Said', 'Heydarli', 'said.heydarli@leznik.edu.az'),
  ('LZ-T9B7F4LC', 'Aga', 'Huseynov', 'agha.huseynov@leznik.edu.az'),
  ('LZ-P5R3W8KD', 'Farah', 'Ibrahimova', 'farah.ibrahimova@leznik.edu.az'),
  ('LZ-Y2H6N9VX', 'Tamerlan', 'Musali', 'tamerlan.musali@leznik.edu.az'),
  ('LZ-D8S4J7MQ', 'Alim', 'Nagiyev', 'alim.naghiyev@leznik.edu.az'),
  ('LZ-Z4Q1X6RP', 'Leyla', 'Najafova', 'leyla.najafova@leznik.edu.az'),
  ('LZ-C7V9T2ML', 'Leyla', 'Nuriyeva', 'leyla.nuriyeva@leznik.edu.az'),
  ('LZ-U3W5K8FN', 'Nurlan', 'Bayramli', 'nurlan.bayramli@leznik.edu.az'),
  ('LZ-A6M2E9XB', 'Ayan', 'Garashzade', 'ayan.qarashzada@leznik.edu.az'),
  ('LZ-L8P4R7YT', 'Abduljamal', 'Gurbanov', 'abduljamal.qurbanov@leznik.edu.az'),
  ('LZ-E5D3C1QK', 'Mirshamil', 'Seyidzade', 'mirshamil.seyidzada@leznik.edu.az'),
  ('LZ-J2T6H9VS', 'Shahmar', 'Usubov', 'shahmar.usubov@leznik.edu.az'),
  ('LZ-N7X4B3LP', 'Murad', 'Rzayev', 'murad.rzayev@leznik.edu.az'),
  ('LZ-S9K5W2ED', 'Gozel', 'Alekberzade', 'gozel.alekberzade@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Harmony
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Harmony', 'Sama Guliyeva', 'guliyeva.sema@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Harmony')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Harmony')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sama Guliyeva',
      teacher_email = 'guliyeva.sema@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-F3Q8N7ZM', 'Agamaali', 'Agamalizade', 'agameli.agamalizade@leznik.edu.az'),
  ('LZ-G6T2P4XK', 'Anar', 'Azizli', 'anar.azizli@leznik.edu.az'),
  ('LZ-H9R5C3VL', 'Alihuseyn', 'Nabilli', 'elihuseyn.nebili@leznik.edu.az'),
  ('LZ-J4M7D2QS', 'Ilkim', 'Suleymanli', 'ilkim.suleymanli@leznik.edu.az'),
  ('LZ-K8B1Y6TP', 'Maksud', 'Khalafov', 'maksud.khelefov@leznik.edu.az'),
  ('LZ-L5X9R4CW', 'Nijat', 'Mammadov', 'nicat.memmedov@leznik.edu.az'),
  ('LZ-M2V7H8QA', 'Nigar', 'Abbasova', 'nigar.abbasova@leznik.edu.az'),
  ('LZ-N6P3K5EF', 'Kamal', 'Sadreddinov', 'k.sadraddinov@leznik.edu.az'),
  ('LZ-O9T4W2RB', 'Samra', 'Mammadli', 'samra.mammadli@leznik.edu.az'),
  ('LZ-P7C6D1XM', 'Bagir', 'Aliyev', 'aliev.bagir@leznik.edu.az'),
  ('LZ-Q8Y5S3NJ', 'Ulvi', 'Huseynli', 'ulvi.huseynli@leznik.edu.az'),
  ('LZ-R1M9L4VK', 'Ziya', 'Asgarli', 'ziya.asgerli@leznik.edu.az'),
  ('LZ-S6H2T8QP', 'Amir', 'Amirzade', 'amir.amirzade@leznik.edu.az'),
  ('LZ-T3D7X5BW', 'Aliheyder', 'Huseynov', 'aliheydar.huseynov@leznik.edu.az'),
  ('LZ-U9K1R6EZ', 'Ibrahim', 'Machanov', 'ibrahim.macanov@leznik.edu.az'),
  ('LZ-V4P8C2LM', 'Zeynab', 'Mustafayeva', 'zeynab.mustafayeva@leznik.edu.az'),
  ('LZ-W7N3Y5QS', 'Muhammed', 'Atazade', 'muhammad.atazada@leznik.edu.az'),
  ('LZ-X2F6H9KD', 'Umud', 'Balacayev', 'umid.balajayev@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Hope
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Hope', 'Sama Guliyeva', 'guliyeva.sema@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Hope')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Hope')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sama Guliyeva',
      teacher_email = 'guliyeva.sema@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-Y7K2Q4WP', 'Faiz', 'Mammadov', 'faiz.mammadov@leznik.edu.az'),
  ('LZ-Z3N8T5LX', 'Mirhashim', 'Abdullayev', 'mirhashim.abdullayev@leznik.edu.az'),
  ('LZ-A9R6V2KD', 'Aqshin', 'Agamalili', 'aqsin.agamali@leznik.edu.az'),
  ('LZ-B4M7X1QS', 'Jannat', 'Ahmadova', 'jannat.ahmadova@leznik.edu.az'),
  ('LZ-C8P5L9WE', 'Huseyn', 'Hasanli', 'h.hasanli@leznik.edu.az'),
  ('LZ-D2T6F3RV', 'Muhammedhuseyn', 'Mahammadzade', 'm.memmedzade@leznik.edu.az'),
  ('LZ-E7K1H8ZX', 'Nahid', 'Muradli', 'nahid.muradi@leznik.edu.az'),
  ('LZ-F5Q9D4LM', 'Nargiz', 'Gocayeva', 'n.gojayeva@leznik.edu.az'),
  ('LZ-G3W8P2TY', 'Kenan', 'Gurbanatzade', 'kanan.qurbatzada@leznik.edu.az'),
  ('LZ-H6X4C7NB', 'Muhammadali', 'Rustamov', 'mahammadali.rustamov@leznik.edu.az'),
  ('LZ-I9V1K5RS', 'Sadiq', 'Allahverdiyev', 'sadiq.allahverdiyev@leznik.edu.az'),
  ('LZ-J2T8Y6QP', 'Ulduz', 'Mammadli', 'ulduz.mammadli@leznik.edu.az'),
  ('LZ-K7L3N4XD', 'Zahra', 'Rustamova', 'zehra.rustamova@leznik.edu.az'),
  ('LZ-L5R9B2CW', 'Ali', 'Agazade', 'ali.aghazada@leznik.edu.az'),
  ('LZ-M1D7H8VK', 'Khazar', 'Soltanov', 'khazar.soltanov@leznik.edu.az'),
  ('LZ-N8F4Q3TL', 'Inji', 'Amirli', 'inci.emirli@leznik.edu.az'),
  ('LZ-O6P2X9RM', 'Ali', 'Nurahmadov', 'ali.nurahmedov@leznik.edu.az'),
  ('LZ-P3S7W5KD', 'Ali', 'Allahverdiyev', 'ali.allahverdiyev@leznik.edu.az'),
  ('LZ-Q9H1C6XT', 'Emiliya', 'Bizeva', 'emiliya.bizeva@leznik.edu.az'),
  ('LZ-R4K8M2YP', 'Umid', 'Quluzade', 'umid.quluzade@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Shine
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Shine', 'Sakina Rasulova', 's.rasulova@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Shine')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Shine')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sakina Rasulova',
      teacher_email = 's.rasulova@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-S8Q3W7NP', 'Alsu', 'Garayeva', 'alsu.qarayeva@leznik.edu.az'),
  ('LZ-T5L2X9KD', 'Rauf', 'Akhundov', 'rauf.akhundov@leznik.edu.az'),
  ('LZ-U1M8R4CV', 'Deniz', 'Huseynova', 'deniz.huseynova@leznik.edu.az'),
  ('LZ-V6P7H2BX', 'Oruc', 'Aliyev', 'oruj.aliyev@leznik.edu.az'),
  ('LZ-W3D9K5TL', 'Amina', 'Pirverdiyeva', 'emine.pirverdiyeva@leznik.edu.az'),
  ('LZ-X7F4N1QM', 'Anvar', 'Najafov', 'enver.najafov@leznik.edu.az'),
  ('LZ-Y2R8C6SP', 'Fakhri', 'Babayev', 'fexri.babayev@leznik.edu.az'),
  ('LZ-Z9H5V3KW', 'Leyla', 'Samadzade', 'leyla.semedzade@leznik.edu.az'),
  ('LZ-A4T7P2XN', 'Maryam', 'Abdullayeva', 'meryem.abdullayeva@leznik.edu.az'),
  ('LZ-B8Q1L6RD', 'Huseyn', 'Mustafayev', 'huseyn.mustafayev@leznik.edu.az'),
  ('LZ-C5M9X3KF', 'Naile', 'Ibrahimova', 'naile.ibrahimova@leznik.edu.az'),
  ('LZ-D7V2W8HP', 'Deniz', 'Niftaliyeva', 'daniz.niftaliyeva@leznik.edu.az'),
  ('LZ-E3K6R1TJ', 'Niyazi', 'Balakishiyev', 'niyazi.balakishiyev@leznik.edu.az'),
  ('LZ-F9P4C7LX', 'Nuray', 'Adigozalova', 'nuray.adigozelova@leznik.edu.az'),
  ('LZ-G2H8M5QN', 'Yeshil', 'Eda', 'yesil.eda@leznik.edu.az'),
  ('LZ-H6T1D9RK', 'Yunis', 'Hajiyev', 'yunis.hajiyev@leznik.edu.az'),
  ('LZ-I4W7B3XP', 'Rashad', 'Asgarov', 'rashad.asgarov@leznik.edu.az'),
  ('LZ-J9C2L8MF', 'Khanhuseyn', 'Ramazan', 'xanhuseyn.ramazan@leznik.edu.az'),
  ('LZ-K1X6Q5VD', 'Altay', 'Aliyev', 'altay.aliyev@leznik.edu.az'),
  ('LZ-L7R3H9KT', 'Shamsi', 'Nuri', 'nuri.shemsi@leznik.edu.az'),
  ('LZ-M8P2F4XN', 'Magsud', 'Ibadzade', 'maqsud.ibadzade@leznik.edu.az'),
  ('LZ-N5Q7C1WL', 'Heydar', 'Rustamov', 'heydar.rustamov@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Blok
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Blok', 'Sakina Rasulova', 's.rasulova@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Blok')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Blok')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sakina Rasulova',
      teacher_email = 's.rasulova@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-O8K3V2WP', 'Gulperi', 'Guliyeva', 'gulpari.guliyeva@leznik.edu.az'),
  ('LZ-P4T9X6RD', 'Nuray', 'Hasanzade', 'nuray.hasanzade@leznik.edu.az'),
  ('LZ-Q7M1H5CX', 'Nuray', 'Ilyasli', 'nuray.ilyasli@leznik.edu.az'),
  ('LZ-R2D8L3VN', 'Fatima', 'Zamanli', 'fatime.zamanli@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Pearl
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Pearl', 'Sakina Rasulova', 's.rasulova@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Pearl')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Pearl')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sakina Rasulova',
      teacher_email = 's.rasulova@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-S6P4Q9KT', 'Aliya', 'Jabbarli', 'aliye.jabbarli@leznik.edu.az'),
  ('LZ-T1X7C8WM', 'Ayxan', 'Sharifov', 'aykhan.sharifov@leznik.edu.az'),
  ('LZ-U5H2R6DP', 'Jamal', 'Abdullazade', 'camal.abdullazade@leznik.edu.az'),
  ('LZ-V9K3N4LX', 'Emiliya', 'Abdullayeva', 'emiliya.abdullayeva@leznik.edu.az'),
  ('LZ-W4Q8M1TZ', 'Aziz', 'Sultanov', 'aziz.sultanov@leznik.edu.az'),
  ('LZ-X2R7P5KC', 'Fatima', 'Mammadkarimova', 'fatime.mammadkerimova@leznik.edu.az'),
  ('LZ-Y8D1V9QL', 'Fatima', 'Novruzova', 'fatime.novruzova@leznik.edu.az'),
  ('LZ-Z3H6T2XN', 'Maryam', 'Ismayilova', 'maryam.ismayilova@leznik.edu.az'),
  ('LZ-A7M5W4KP', 'Lukas', 'Maksimilian', 'lukas.maksimilian@leznik.edu.az'),
  ('LZ-B1Q9C8VL', 'Arcun', 'Mammadov', 'arjun.mammadov@leznik.edu.az'),
  ('LZ-C6R2H3TX', 'Maryam', 'Aliyeva', 'meryam.aliyeva@leznik.edu.az'),
  ('LZ-D8P7K5MN', 'Orxan', 'Yusifzade', 'orkhan.yusifzade@leznik.edu.az'),
  ('LZ-E4X1Q9WR', 'Suel', 'Rasulzade', 'suel.rasulzade@leznik.edu.az'),
  ('LZ-F9L6D2KP', 'Tahir', 'Agamammadov', 'tahir.agamammadov@leznik.edu.az'),
  ('LZ-G5T3V8CX', 'Tahir', 'Agazade', 'tahir.agazade@leznik.edu.az'),
  ('LZ-H2M7P4QL', 'Khadija', 'Rzazade', 'khadije.rzazade@leznik.edu.az'),
  ('LZ-I8K1R6WN', 'Faiq', 'Karimov', 'faiq.karimov@leznik.edu.az'),
  ('LZ-J3D9X2VP', 'Yegana', 'Fattahova', 'yegane.fettahova@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Dream
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Dream', 'Sakina Rasulova', 's.rasulova@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Dream')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Dream')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Sakina Rasulova',
      teacher_email = 's.rasulova@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-K7P5H1QC', 'Abdullah', 'Umud', 'abdullah.umud@leznik.edu.az'),
  ('LZ-L4T8M6XN', 'Jalal', 'Agayev', 'jalal.aghayev@leznik.edu.az'),
  ('LZ-M2R9V3KP', 'Aylin', 'Allahverdiyeva', 'aylin.allahverdiyeva@leznik.edu.az'),
  ('LZ-N6X1Q7WL', 'Duru', 'Asiliskender', 'duru.asiliskender@leznik.edu.az'),
  ('LZ-O9C4D8MT', 'Said', 'Ahmadov', 'said.ahmadov@leznik.edu.az'),
  ('LZ-P3K7H5RX', 'Ulker', 'Amiraslanova', 'ulkar.amiraslanova@leznik.edu.az'),
  ('LZ-Q6V2L1WN', 'Fatima', 'Pashayeva', 'fatime.pashayev@leznik.edu.az'),
  ('LZ-R1M8T4KP', 'Gunel', 'Nagiyeva', 'gunel.nagiyeva@leznik.edu.az'),
  ('LZ-S5Q3X9VL', 'Irem', 'Baysinop', 'irem.baysinop@leznik.edu.az'),
  ('LZ-T8D6R2MW', 'Nuray', 'Azimzade', 'nuray.azimzade@leznik.edu.az'),
  ('LZ-U2P7K1HX', 'Imran', 'Garayev', 'imran.qarayev@leznik.edu.az'),
  ('LZ-V7L4N8QC', 'Aga', 'Ramazanli', 'agha.ramazanli@leznik.edu.az'),
  ('LZ-W3H9T5XP', 'Sabiq', 'Imanli', 'sabiq.imanli@leznik.edu.az'),
  ('LZ-X6M1Q4KR', 'Farid', 'Sevindikov', 'farid.sevindikov@leznik.edu.az'),
  ('LZ-Y9K2D7VL', 'Zahra', 'Yusifzade', 'zehra.yusifzade@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Spirit
with classroom_upsert as (
  insert into public.classrooms (organization_id, name, teacher_name, teacher_email)
  select 'ieltsmock', 'Spirit', 'Galandar Mehdiyev', 'galandar.mehdiyev@leznik.edu.az'
  where not exists (
    select 1
    from public.classrooms
    where organization_id = 'ieltsmock'
      and lower(name) = lower('Spirit')
  )
  returning id
), classroom as (
  select id from classroom_upsert
  union all
  select id
  from public.classrooms
  where organization_id = 'ieltsmock'
    and lower(name) = lower('Spirit')
  limit 1
), teacher_update as (
  update public.classrooms c
  set teacher_name = 'Galandar Mehdiyev',
      teacher_email = 'galandar.mehdiyev@leznik.edu.az'
  from classroom cls
  where c.id = cls.id
  returning c.id
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
  v.student_id_code,
  v.name,
  v.surname,
  cls.id,
  v.official_email,
  true
from classroom cls
cross join (values
  ('LZ-Z5P8H3QN', 'Adil', 'Valiyev Parviz oglu', 'adil.valiyev@leznik.edu.az'),
  ('LZ-A1T4R9XL', 'Javad', 'Hasan Said oglu', 'javad.hasan@leznik.edu.az'),
  ('LZ-B6M2V7KP', 'Jeyla', 'Jeyranova Elchin', 'jeyla.jeyranova@leznik.edu.az'),
  ('LZ-C9Q5D1WX', 'Ferah', 'Badalli Fuad qizi', 'ferah.badelli@leznik.edu.az'),
  ('LZ-D3H8L4TN', 'Minara', 'Babayeva Mustafa qizi', 'minara.babayeva@leznik.edu.az'),
  ('LZ-E7K1P9RM', 'Nuray', 'Agayeva Samir', 'nuray.agayeva@leznik.edu.az'),
  ('LZ-F2X6T5WL', 'Nuray', 'Isazade Rustam qizi', 'nuray.isazade@leznik.edu.az'),
  ('LZ-G8V3Q1NP', 'Oleksandra', 'Shulhach', 'oleksandra.shulhach@leznik.edu.az'),
  ('LZ-H4M7K2XD', 'Nargiz', 'Rasulova Elnur qizi', 'nargiz.rasulova@leznik.edu.az'),
  ('LZ-I1P9R6WL', 'Sahib', 'Bagirov Farid oglu', 'sahib.bagirov@leznik.edu.az'),
  ('LZ-J7T3X8KC', 'Seyyida', 'Fatima Zakizade Shahin qizi', 'seyyida.fatima@leznik.edu.az'),
  ('LZ-K2H5M4VP', 'Sima', 'Aslanbeyli Arzu qizi', 'sima.aslanbayli@leznik.edu.az'),
  ('LZ-L6Q1R9XN', 'Suad', 'Agayev Fuad oglu', 'suad.agayev@leznik.edu.az'),
  ('LZ-M9P4D7KT', 'Suada', 'Safaraliyeva Zohrab qizi', 'suade.seferaliyeva@leznik.edu.az')
) as v(student_id_code, name, surname, official_email)
on conflict (student_id_code) do update
set name = excluded.name,
    surname = excluded.surname,
    classroom_id = excluded.classroom_id,
    organization_id = excluded.organization_id,
    official_email = excluded.official_email,
    is_active = true;

-- Verification query
select c.name, count(sp.id) as student_count
from public.classrooms c
left join public.student_profiles sp on sp.classroom_id = c.id
where c.organization_id = 'ieltsmock'
  and c.name in ('Spark', 'Harmony', 'Hope', 'Shine', 'Blok', 'Pearl', 'Dream', 'Spirit')
group by c.name
order by c.name;

commit;
