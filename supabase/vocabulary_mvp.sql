-- Vocabulary MVP schema and seed data.
-- Safe/additive: this migration only creates vocabulary tables, indexes, RLS policies, and sample content.

create extension if not exists pgcrypto;

create table if not exists public.vocab_decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  level text,
  topic text,
  unit_code text,
  cover_image text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.vocab_words (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.vocab_decks(id) on delete cascade,
  term text not null,
  term_normalized text,
  part_of_speech text,
  meaning_en text,
  meaning_az text,
  meaning_ru text,
  example_1 text,
  example_2 text,
  collocations jsonb default '[]'::jsonb,
  synonyms jsonb default '[]'::jsonb,
  audio_url text,
  image_url text,
  difficulty int default 1,
  tags jsonb default '[]'::jsonb,
  distractors_json jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.user_vocab_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  word_id uuid references public.vocab_words(id) on delete cascade,
  status text not null default 'new',
  ease_factor numeric default 2.5,
  interval_days int default 0,
  repetition_count int default 0,
  due_at timestamptz,
  last_seen_at timestamptz,
  last_result boolean,
  correct_streak int default 0,
  incorrect_count int default 0,
  total_attempts int default 0,
  mastered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, word_id),
  constraint user_vocab_progress_status_check check (status in ('new', 'learning', 'review', 'mastered'))
);

create table if not exists public.user_vocab_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  word_id uuid references public.vocab_words(id) on delete cascade,
  deck_id uuid references public.vocab_decks(id) on delete set null,
  session_id uuid,
  exercise_type text,
  result boolean,
  response_ms int,
  created_at timestamptz default now()
);

create table if not exists public.user_vocab_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  deck_id uuid references public.vocab_decks(id) on delete set null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  correct int default 0,
  incorrect int default 0,
  xp_earned int default 0
);

create index if not exists vocab_words_deck_id_idx on public.vocab_words(deck_id);
create index if not exists user_vocab_progress_user_id_idx on public.user_vocab_progress(user_id);
create index if not exists user_vocab_progress_due_at_idx on public.user_vocab_progress(user_id, due_at);
create index if not exists user_vocab_events_user_created_idx on public.user_vocab_events(user_id, created_at desc);
create index if not exists user_vocab_sessions_user_started_idx on public.user_vocab_sessions(user_id, started_at desc);

create or replace function public.set_user_vocab_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_vocab_progress_updated_at on public.user_vocab_progress;
create trigger set_user_vocab_progress_updated_at
before update on public.user_vocab_progress
for each row execute function public.set_user_vocab_progress_updated_at();

alter table public.vocab_decks enable row level security;
alter table public.vocab_words enable row level security;
alter table public.user_vocab_progress enable row level security;
alter table public.user_vocab_events enable row level security;
alter table public.user_vocab_sessions enable row level security;

drop policy if exists "Read active vocabulary decks" on public.vocab_decks;
create policy "Read active vocabulary decks"
on public.vocab_decks
for select
to authenticated
using (is_active = true);

drop policy if exists "Read words in active vocabulary decks" on public.vocab_words;
create policy "Read words in active vocabulary decks"
on public.vocab_words
for select
to authenticated
using (
  exists (
    select 1
    from public.vocab_decks d
    where d.id = vocab_words.deck_id
      and d.is_active = true
  )
);

drop policy if exists "Users read own vocabulary progress" on public.user_vocab_progress;
create policy "Users read own vocabulary progress"
on public.user_vocab_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own vocabulary progress" on public.user_vocab_progress;
create policy "Users insert own vocabulary progress"
on public.user_vocab_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own vocabulary progress" on public.user_vocab_progress;
create policy "Users update own vocabulary progress"
on public.user_vocab_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users read own vocabulary events" on public.user_vocab_events;
create policy "Users read own vocabulary events"
on public.user_vocab_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own vocabulary events" on public.user_vocab_events;
create policy "Users insert own vocabulary events"
on public.user_vocab_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users read own vocabulary sessions" on public.user_vocab_sessions;
create policy "Users read own vocabulary sessions"
on public.user_vocab_sessions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own vocabulary sessions" on public.user_vocab_sessions;
create policy "Users insert own vocabulary sessions"
on public.user_vocab_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own vocabulary sessions" on public.user_vocab_sessions;
create policy "Users update own vocabulary sessions"
on public.user_vocab_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Deck/word content remains admin/service-role managed: no public insert/update/delete policies are created.

insert into public.vocab_decks (id, title, description, level, topic, unit_code, cover_image, is_active)
values
  ('11111111-1111-4111-8111-111111111111', 'Academic Writing Essentials', 'High-value words for IELTS Task 1 and Task 2 explanations, comparisons, and trends.', 'B2-C1', 'Academic IELTS', 'VOC-AW-001', null, true),
  ('22222222-2222-4222-8222-222222222222', 'Speaking Precision Pack', 'Natural words and phrases for richer IELTS Speaking answers.', 'B1-B2', 'Speaking', 'VOC-SP-001', null, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  level = excluded.level,
  topic = excluded.topic,
  unit_code = excluded.unit_code,
  cover_image = excluded.cover_image,
  is_active = excluded.is_active;

insert into public.vocab_words (
  id, deck_id, term, term_normalized, part_of_speech, meaning_en, meaning_az, meaning_ru, example_1, example_2,
  collocations, synonyms, difficulty, tags, distractors_json
)
values
  ('11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-111111111111', 'fluctuate', 'fluctuate', 'verb', 'to change frequently, especially from one level to another', 'tez-tez dəyişmək', 'колебаться, меняться', 'Fuel prices tend to fluctuate throughout the year.', 'The graph shows that attendance fluctuated between 2010 and 2020.', '["fluctuate considerably", "prices fluctuate", "fluctuate between"]', '["vary", "change", "shift"]', 2, '["task 1", "trends"]', '["remain stable", "increase sharply", "decline steadily"]'),
  ('11111111-1111-4111-8111-000000000002', '11111111-1111-4111-8111-111111111111', 'substantial', 'substantial', 'adjective', 'large in amount, value, or importance', 'əhəmiyyətli, böyük', 'значительный', 'There was a substantial rise in online shopping.', 'The proposal would require substantial investment.', '["substantial increase", "substantial evidence", "substantial amount"]', '["significant", "considerable", "major"]', 2, '["academic", "writing"]', '["tiny", "temporary", "ordinary"]'),
  ('11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-111111111111', 'whereas', 'whereas', 'conjunction', 'used to compare two different facts or situations', 'halbuki, müqayisə üçün', 'тогда как, в то время как', 'The figure for France rose, whereas the figure for Italy fell.', 'Some people prefer cities, whereas others enjoy rural life.', '["whereas others", "whereas the figure"]', '["while", "in contrast"]', 1, '["comparison", "cohesion"]', '["because", "therefore", "unless"]'),
  ('22222222-2222-4222-8222-000000000001', '22222222-2222-4222-8222-222222222222', 'persuasive', 'persuasive', 'adjective', 'able to make someone believe or do something', 'inandırıcı', 'убедительный', 'She gave a persuasive explanation during the interview.', 'A persuasive speaker supports opinions with clear examples.', '["persuasive argument", "persuasive speaker", "highly persuasive"]', '["convincing", "compelling"]', 2, '["speaking", "opinions"]', '["confusing", "silent", "ordinary"]'),
  ('22222222-2222-4222-8222-000000000002', '22222222-2222-4222-8222-222222222222', 'tendency', 'tendency', 'noun', 'a habit or natural likelihood to behave in a particular way', 'meyl, tendensiya', 'склонность, тенденция', 'Young people have a tendency to rely on social media for news.', 'I have a tendency to plan carefully before travelling.', '["have a tendency", "natural tendency", "growing tendency"]', '["inclination", "habit", "trend"]', 2, '["speaking", "task 2"]', '["destination", "permission", "solution"]'),
  ('22222222-2222-4222-8222-000000000003', '22222222-2222-4222-8222-222222222222', 'remarkable', 'remarkable', 'adjective', 'unusual or impressive and therefore worth noticing', 'diqqətəlayiq, heyrətamiz', 'замечательный, выдающийся', 'The museum has a remarkable collection of historical objects.', 'Her progress in English has been remarkable.', '["remarkable progress", "remarkable achievement", "truly remarkable"]', '["impressive", "notable", "extraordinary"]', 1, '["speaking", "description"]', '["boring", "minor", "unclear"]')
on conflict (id) do update set
  deck_id = excluded.deck_id,
  term = excluded.term,
  term_normalized = excluded.term_normalized,
  part_of_speech = excluded.part_of_speech,
  meaning_en = excluded.meaning_en,
  meaning_az = excluded.meaning_az,
  meaning_ru = excluded.meaning_ru,
  example_1 = excluded.example_1,
  example_2 = excluded.example_2,
  collocations = excluded.collocations,
  synonyms = excluded.synonyms,
  difficulty = excluded.difficulty,
  tags = excluded.tags,
  distractors_json = excluded.distractors_json;
