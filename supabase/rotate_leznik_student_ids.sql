-- Rotate Leznik Student IDs to non-predictable codes.
-- Run after the Flame/Bloom students already exist.
-- Safe for one-time use; matches current rows by the old classroom codes.

with id_changes(old_code, new_code, name, surname, official_email) as (
  values
    -- Flame
    ('FLM001', 'LZ-UY6KT8G2', 'Murad', 'Bayramli', 'm.bayramli.bayram@leznik.edu.az'),
    ('FLM002', 'LZ-B35SRV8J', 'Farida', 'Bakir', 'farida.bakir@leznik.edu.az'),
    ('FLM003', 'LZ-GWULCAG3', 'Jalal', 'Jahangirov', 'jalal.jahangirov@leznik.edu.az'),
    ('FLM004', 'LZ-SLM6P7D8', 'Saidali', 'Jabrayilov', 'jabrayilov.saidali@leznik.edu.az'),
    ('FLM005', 'LZ-PTH4HHKC', 'Ayla', 'Ahmadzada', 'ayla.ahmadzada@leznik.edu.az'),
    ('FLM006', 'LZ-8NPGW438', 'Amin', 'Alisafazade', 'amin.alisafazade@leznik.edu.az'),
    ('FLM007', 'LZ-HE3Z9Z3Q', 'Huseyn', 'Aliyev', 'huseyn.aliyev@leznik.edu.az'),
    ('FLM008', 'LZ-7MA7SRFT', 'Fidan', 'Asadli', 'fidan.asadli@leznik.edu.az'),
    ('FLM009', 'LZ-ND3LXDAH', 'Zarin', 'Asgarova', 'asgarova.zarin@leznik.edu.az'),
    ('FLM010', 'LZ-7HZ8CJFH', 'Faraj', 'Farajzada', 'faraj.farajzada@leznik.edu.az'),
    ('FLM011', 'LZ-TC6ZY72Q', 'Ali', 'Hajiyev', 'ali.hajiyev@leznik.edu.az'),
    ('FLM012', 'LZ-JY4Y5R9T', 'Ayla', 'Mirzazada', 'ayla.mirzazada@leznik.edu.az'),
    ('FLM013', 'LZ-65V8YJKP', 'Namiq', 'Rustamov', 'n.rustamov@leznik.edu.az'),
    ('FLM014', 'LZ-ZZJJB5E7', 'Yasmin', 'Nurova', 'yasmin.nurova@leznik.edu.az'),
    ('FLM015', 'LZ-B2PKS4SG', 'Javidan', 'Qambarov', 'javidan.qambarov@leznik.edu.az'),
    ('FLM016', 'LZ-73VCWKV6', 'Aylin', 'Quluzada', 'aylin.quluzada@leznik.edu.az'),
    ('FLM017', 'LZ-796DDKUT', 'Turqut', 'Ismayilzada', 'turqut.ismayilzada@leznik.edu.az'),
    ('FLM018', 'LZ-5QXA3ZKU', 'Valeriya', 'Roshenko', 'valeriya.roshenko@leznik.edu.az'),
    ('FLM019', 'LZ-TFTTGUKD', 'Aziza', 'Yolchuyeva', 'aziza.yolchuyeva@leznik.edu.az'),
    ('FLM020', 'LZ-HPAXDRML', 'Sara', 'Miray', 'sara.miray@leznik.edu.az'),
    ('FLM021', 'LZ-GG2T738R', 'Layla', 'Muradi', 'layla.muradi@leznik.edu.az'),

    -- Bloom
    ('BLM001', 'LZ-K6EZD9BN', 'Yusif', 'Tahirli', 'yusif.tahirli@leznik.edu.az'),
    ('BLM002', 'LZ-ERJGLQWD', 'Adel', 'Danilova', 'adel.irina@leznik.edu.az'),
    ('BLM003', 'LZ-9V7EWD6F', 'Jamil', 'Rustamov', 'jamil.rustamov@leznik.edu.az'),
    ('BLM004', 'LZ-W3RYBWTH', 'Sevil', 'Afandiyeva', 'sevil.afandiyeva@leznik.edu.az'),
    ('BLM005', 'LZ-97EK2U9P', 'Gozel', 'Alekberzade', 'gozel.alekberzade@leznik.edu.az'),
    ('BLM006', 'LZ-H2XJTQM8', 'Humay', 'Alizade', 'humay.elizade@leznik.edu.az'),
    ('BLM007', 'LZ-U7D3XHFS', 'Zeynab', 'Huseynova', 'zeynab.huseynova@leznik.edu.az'),
    ('BLM008', 'LZ-VKTYET87', 'Leyla', 'Mammadli', 'leyla.mammadli@leznik.edu.az'),
    ('BLM009', 'LZ-DDBK7VMZ', 'Aylin', 'Mansurova', 'aylin.mansurova@leznik.edu.az'),
    ('BLM010', 'LZ-PSTHMR6X', 'Medina', 'Huseynzade', 'medina.huseynzade@leznik.edu.az'),
    ('BLM011', 'LZ-W5VH3H6C', 'Oguz', 'Hacili', 'oguz.hacili@leznik.edu.az'),
    ('BLM012', 'LZ-RLGXCD6H', 'Muhammed', 'Qarayev', 'muhammed.qarayev@leznik.edu.az'),
    ('BLM013', 'LZ-CW2Y6MUJ', 'Tahir', 'Jafarov', 'tahir.jafarov@leznik.edu.az'),
    ('BLM014', 'LZ-WBNV6SL3', 'Uzeyir', 'Hajiyev', 'uzeyir.hajiyev@leznik.edu.az'),
    ('BLM015', 'LZ-585UDNEN', 'Khayyam', 'Yusufzade', 'khayyam.yusufzade@leznik.edu.az')
), updated as (
  update public.student_profiles sp
  set
    student_id_code = c.new_code,
    name = c.name,
    surname = c.surname,
    official_email = c.official_email,
    updated_at = now()
  from id_changes c
  where sp.organization_id = 'ieltsmock'
    and sp.student_id_code = c.old_code
  returning c.old_code, sp.student_id_code as new_code, sp.name, sp.surname, sp.official_email
)
select * from updated order by new_code;

select count(*) as rotated_rows
from public.student_profiles
where organization_id = 'ieltsmock'
  and student_id_code like 'LZ-%';
