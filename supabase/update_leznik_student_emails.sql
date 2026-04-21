-- Add official Leznik result emails to the pre-created Flame and Bloom Student IDs.
-- Run after supabase/classroom_identity_mvp.sql and supabase/seed_leznik_flame_bloom.sql.
-- Idempotent: safe to rerun; updates matching Student IDs only.

with email_updates (student_id_code, name, surname, official_email) as (
  values
    -- Flame
    ('LZ-UY6KT8G2', 'Murad', 'Bayramli', 'm.bayramli.bayram@leznik.edu.az'),
    ('LZ-B35SRV8J', 'Farida', 'Bakir', 'farida.bakir@leznik.edu.az'),
    ('LZ-GWULCAG3', 'Jalal', 'Jahangirov', 'jalal.jahangirov@leznik.edu.az'),
    ('LZ-SLM6P7D8', 'Saidali', 'Jabrayilov', 'jabrayilov.saidali@leznik.edu.az'),
    ('LZ-PTH4HHKC', 'Ayla', 'Ahmadzada', 'ayla.ahmadzada@leznik.edu.az'),
    ('LZ-8NPGW438', 'Amin', 'Alisafazade', 'amin.alisafazade@leznik.edu.az'),
    ('LZ-HE3Z9Z3Q', 'Huseyn', 'Aliyev', 'huseyn.aliyev@leznik.edu.az'),
    ('LZ-7MA7SRFT', 'Fidan', 'Asadli', 'fidan.asadli@leznik.edu.az'),
    ('LZ-ND3LXDAH', 'Zarin', 'Asgarova', 'asgarova.zarin@leznik.edu.az'),
    ('LZ-7HZ8CJFH', 'Faraj', 'Farajzada', 'faraj.farajzada@leznik.edu.az'),
    ('LZ-TC6ZY72Q', 'Ali', 'Hajiyev', 'ali.hajiyev@leznik.edu.az'),
    ('LZ-JY4Y5R9T', 'Ayla', 'Mirzazada', 'ayla.mirzazada@leznik.edu.az'),
    ('LZ-65V8YJKP', 'Namiq', 'Rustamov', 'n.rustamov@leznik.edu.az'),
    ('LZ-ZZJJB5E7', 'Yasmin', 'Nurova', 'yasmin.nurova@leznik.edu.az'),
    ('LZ-B2PKS4SG', 'Javidan', 'Qambarov', 'javidan.qambarov@leznik.edu.az'),
    ('LZ-73VCWKV6', 'Aylin', 'Quluzada', 'aylin.quluzada@leznik.edu.az'),
    ('LZ-796DDKUT', 'Turqut', 'Ismayilzada', 'turqut.ismayilzada@leznik.edu.az'),
    ('LZ-5QXA3ZKU', 'Valeriya', 'Roshenko', 'valeriya.roshenko@leznik.edu.az'),
    ('LZ-TFTTGUKD', 'Aziza', 'Yolchuyeva', 'aziza.yolchuyeva@leznik.edu.az'),
    ('LZ-HPAXDRML', 'Sara', 'Miray', 'sara.miray@leznik.edu.az'),
    ('LZ-GG2T738R', 'Layla', 'Muradi', 'layla.muradi@leznik.edu.az'),

    -- Bloom
    ('LZ-K6EZD9BN', 'Yusif', 'Tahirli', 'yusif.tahirli@leznik.edu.az'),
    ('LZ-ERJGLQWD', 'Adel', 'Danilova', 'adel.irina@leznik.edu.az'),
    ('LZ-9V7EWD6F', 'Jamil', 'Rustamov', 'jamil.rustamov@leznik.edu.az'),
    ('LZ-W3RYBWTH', 'Sevil', 'Afandiyeva', 'sevil.afandiyeva@leznik.edu.az'),
    ('LZ-97EK2U9P', 'Gozel', 'Alekberzade', 'gozel.alekberzade@leznik.edu.az'),
    ('LZ-H2XJTQM8', 'Humay', 'Alizade', 'humay.elizade@leznik.edu.az'),
    ('LZ-U7D3XHFS', 'Zeynab', 'Huseynova', 'zeynab.huseynova@leznik.edu.az'),
    ('LZ-VKTYET87', 'Leyla', 'Mammadli', 'leyla.mammadli@leznik.edu.az'),
    ('LZ-DDBK7VMZ', 'Aylin', 'Mansurova', 'aylin.mansurova@leznik.edu.az'),
    ('LZ-PSTHMR6X', 'Medina', 'Huseynzade', 'medina.huseynzade@leznik.edu.az'),
    ('LZ-W5VH3H6C', 'Oguz', 'Hacili', 'oguz.hacili@leznik.edu.az'),
    ('LZ-RLGXCD6H', 'Muhammed', 'Qarayev', 'muhammed.qarayev@leznik.edu.az'),
    ('LZ-CW2Y6MUJ', 'Tahir', 'Jafarov', 'tahir.jafarov@leznik.edu.az'),
    ('LZ-WBNV6SL3', 'Uzeyir', 'Hajiyev', 'uzeyir.hajiyev@leznik.edu.az'),
    ('LZ-585UDNEN', 'Khayyam', 'Yusufzade', 'khayyam.yusufzade@leznik.edu.az')
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
  and student_id_code like 'LZ-%';
