-- Таблица общего рейтинга «Пасеки». Вставь целиком в Supabase -> SQL Editor -> Run.
create table if not exists public.players (
  id uuid primary key,
  nick text not null default 'Пчеловод',
  av text default '🐝',
  honey double precision not null default 0,
  coins double precision not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);
create index if not exists players_honey_idx on public.players (honey desc);
create index if not exists players_coins_idx on public.players (coins desc);
create index if not exists players_level_idx on public.players (level desc);

alter table public.players enable row level security;
drop policy if exists "read all" on public.players;
drop policy if exists "insert own" on public.players;
drop policy if exists "update own" on public.players;
create policy "read all"   on public.players for select to anon using (true);
create policy "insert own" on public.players for insert to anon with check (char_length(nick) between 2 and 16);
create policy "update own" on public.players for update to anon using (true) with check (char_length(nick) between 2 and 16);
