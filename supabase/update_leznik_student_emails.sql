-- Add official Leznik result emails to the pre-created Flame and Bloom Student IDs.
-- Run after supabase/classroom_identity_mvp.sql and supabase/seed_leznik_flame_bloom.sql.
-- Idempotent: safe to rerun; updates matching Student IDs only.

with email_updates (student_id_code, name, surname, official_email) as (
  values
    -- Flame
    ('FLM001', 'Murad', 'Bayramli', 'm.bayramli.bayram@leznik.edu.az'),
    ('FLM002', 'Farida', 'Bakir', 'farida.bakir@leznik.edu.az'),
    ('FLM003', 'Jalal', 'Jahangirov', 'jalal.jahangirov@leznik.edu.az'),
    ('FLM004', 'Saidali', 'Jabrayilov', 'jabrayilov.saidali@leznik.edu.az'),
    ('FLM005', 'Ayla', 'Ahmadzada', 'ayla.ahmadzada@leznik.edu.az'),
    ('FLM006', 'Amin', 'Alisafazade', 'amin.alisafazade@leznik.edu.az'),
    ('FLM007', 'Huseyn', 'Aliyev', 'huseyn.aliyev@leznik.edu.az'),
    ('FLM008', 'Fidan', 'Asadli', 'fidan.asadli@leznik.edu.az'),
    ('FLM009', 'Zarin', 'Asgarova', 'asgarova.zarin@leznik.edu.az'),
    ('FLM010', 'Faraj', 'Farajzada', 'faraj.farajzada@leznik.edu.az'),
    ('FLM011', 'Ali', 'Hajiyev', 'ali.hajiyev@leznik.edu.az'),
    ('FLM012', 'Ayla', 'Mirzazada', 'ayla.mirzazada@leznik.edu.az'),
    ('FLM013', 'Namiq', 'Rustamov', 'n.rustamov@leznik.edu.az'),
    ('FLM014', 'Yasmin', 'Nurova', 'yasmin.nurova@leznik.edu.az'),
    ('FLM015', 'Javidan', 'Qambarov', 'javidan.qambarov@leznik.edu.az'),
    ('FLM016', 'Aylin', 'Quluzada', 'aylin.quluzada@leznik.edu.az'),
    ('FLM017', 'Turqut', 'Ismayilzada', 'turqut.ismayilzada@leznik.edu.az'),
    ('FLM018', 'Valeriya', 'Roshenko', 'valeriya.roshenko@leznik.edu.az'),
    ('FLM019', 'Aziza', 'Yolchuyeva', 'aziza.yolchuyeva@leznik.edu.az'),
    ('FLM020', 'Sara', 'Miray', 'sara.miray@leznik.edu.az'),
    ('FLM021', 'Layla', 'Muradi', 'layla.muradi@leznik.edu.az'),

    -- Bloom
    ('BLM001', 'Yusif', 'Tahirli', 'yusif.tahirli@leznik.edu.az'),
    ('BLM002', 'Adel', 'Danilova', 'adel.irina@leznik.edu.az'),
    ('BLM003', 'Jamil', 'Rustamov', 'jamil.rustamov@leznik.edu.az'),
    ('BLM004', 'Sevil', 'Afandiyeva', 'sevil.afandiyeva@leznik.edu.az'),
    ('BLM005', 'Gozel', 'Alekberzade', 'gozel.alekberzade@leznik.edu.az'),
    ('BLM006', 'Humay', 'Alizade', 'humay.elizade@leznik.edu.az'),
    ('BLM007', 'Zeynab', 'Huseynova', 'zeynab.huseynova@leznik.edu.az'),
    ('BLM008', 'Leyla', 'Mammadli', 'leyla.mammadli@leznik.edu.az'),
    ('BLM009', 'Aylin', 'Mansurova', 'aylin.mansurova@leznik.edu.az'),
    ('BLM010', 'Medina', 'Huseynzade', 'medina.huseynzade@leznik.edu.az'),
    ('BLM011', 'Oguz', 'Hacili', 'oguz.hacili@leznik.edu.az'),
    ('BLM012', 'Muhammed', 'Qarayev', 'muhammed.qarayev@leznik.edu.az'),
    ('BLM013', 'Tahir', 'Jafarov', 'tahir.jafarov@leznik.edu.az'),
    ('BLM014', 'Uzeyir', 'Hajiyev', 'uzeyir.hajiyev@leznik.edu.az'),
    ('BLM015', 'Khayyam', 'Yusufzade', 'khayyam.yusufzade@leznik.edu.az')
), updated as (
  update public.student_profiles sp
  set
    name = eu.name,
    surname = eu.surname,
    official_email = eu.official_email,
    updated_at = now()
  from email_updates eu
  where sp.organization_id = 'ieltsmock'
    and sp.student_id_code = eu.student_id_code
  returning sp.student_id_code, sp.name, sp.surname, sp.official_email
)
select
  student_id_code,
  surname,
  name,
  official_email
from updated
order by student_id_code;

-- Verification: this should return 36 rows and missing_email should be 0.
select
  count(*) as leznik_students,
  count(*) filter (where official_email is null or trim(official_email) = '') as missing_email
from public.student_profiles
where organization_id = 'ieltsmock'
  and (student_id_code like 'FLM%' or student_id_code like 'BLM%');
