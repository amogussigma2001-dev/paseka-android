-- ============================================================
-- Пасека: рейтинг, друзья, подарки и обмен (версия 2).
-- Вставь ЦЕЛИКОМ в Supabase -> SQL Editor -> New query -> Run.
-- Скрипт можно запускать повторно.
-- ============================================================

-- 1. Профили игроков (id = анонимный пользователь Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nick text not null default 'Пчеловод' check (char_length(nick) between 2 and 16),
  av text default 'bee_0',
  honey double precision not null default 0,
  coins double precision not null default 0,
  level integer not null default 1,
  vip boolean not null default false,
  friend_code text unique,
  updated_at timestamptz not null default now()
);
create index if not exists profiles_honey_idx on public.profiles (honey desc);
create index if not exists profiles_coins_idx on public.profiles (coins desc);
create index if not exists profiles_level_idx on public.profiles (level desc);

-- 2. Дружба, заявки, подарки, обмен
create table if not exists public.friendships (
  a uuid not null references public.profiles(id) on delete cascade,
  b uuid not null references public.profiles(id) on delete cascade,
  created timestamptz not null default now(),
  primary key (a, b), check (a < b)
);
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created timestamptz not null default now(),
  unique (from_id, to_id)
);
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date,
  claimed boolean not null default false,
  unique (from_id, to_id, day)
);
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  give jsonb not null,
  want jsonb not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  delivered boolean not null default false,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

-- 3. Защита строк (RLS): читать можно только своё, писать напрямую нельзя вообще
alter table public.profiles        enable row level security;
alter table public.friendships     enable row level security;
alter table public.friend_requests enable row level security;
alter table public.gifts           enable row level security;
alter table public.trades          enable row level security;
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "friends read"    on public.friendships;
drop policy if exists "requests read"   on public.friend_requests;
drop policy if exists "gifts read"      on public.gifts;
drop policy if exists "trades read"     on public.trades;
create policy "profiles read" on public.profiles        for select to authenticated using (true);
create policy "friends read"  on public.friendships     for select to authenticated using (auth.uid() in (a, b));
create policy "requests read" on public.friend_requests for select to authenticated using (auth.uid() in (from_id, to_id));
create policy "gifts read"    on public.gifts           for select to authenticated using (auth.uid() in (from_id, to_id));
create policy "trades read"   on public.trades         for select to authenticated using (auth.uid() in (from_id, to_id));
revoke insert, update, delete on public.profiles, public.friendships, public.friend_requests, public.gifts, public.trades from anon, authenticated;
revoke all on public.profiles, public.friendships, public.friend_requests, public.gifts, public.trades from anon;

-- 4. Функции (вся запись идёт только через них)
create or replace function public.upsert_profile(p_nick text, p_av text, p_honey double precision, p_coins double precision, p_level integer, p_vip boolean)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); code text; n int := 0; nk text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  nk := left(regexp_replace(coalesce(p_nick,''), '[<>&"'']', '', 'g'), 16);
  if char_length(nk) < 2 then nk := 'Пчеловод'; end if;
  select friend_code into code from public.profiles where id = uid;
  if code is null then
    loop
      code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)); n := n + 1;
      exit when not exists (select 1 from public.profiles where friend_code = code) or n > 10;
    end loop;
  end if;
  insert into public.profiles as pr (id, nick, av, honey, coins, level, vip, friend_code, updated_at)
  values (uid, nk, left(coalesce(p_av,'bee_0'),24), greatest(0,coalesce(p_honey,0)), greatest(0,coalesce(p_coins,0)), greatest(1,coalesce(p_level,1)), coalesce(p_vip,false), code, now())
  on conflict (id) do update set nick = excluded.nick, av = excluded.av, honey = excluded.honey, coins = excluded.coins,
    level = excluded.level, vip = excluded.vip, updated_at = now(), friend_code = coalesce(pr.friend_code, excluded.friend_code);
  return (select friend_code from public.profiles where id = uid);
end $$;

create or replace function public.send_friend_request(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t uuid;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select id into t from public.profiles where friend_code = upper(trim(p_code));
  if t is null then return 'not_found'; end if;
  if t = uid then return 'self'; end if;
  if exists (select 1 from public.friendships where a = least(uid,t) and b = greatest(uid,t)) then return 'already_friends'; end if;
  if (select count(*) from public.friend_requests where from_id = uid and status = 'pending') >= 30 then return 'too_many'; end if;
  if exists (select 1 from public.friend_requests where from_id = t and to_id = uid and status = 'pending') then
    update public.friend_requests set status = 'accepted' where from_id = t and to_id = uid;
    insert into public.friendships (a, b) values (least(uid,t), greatest(uid,t)) on conflict do nothing;
    return 'accepted';
  end if;
  insert into public.friend_requests as fr (from_id, to_id) values (uid, t)
  on conflict (from_id, to_id) do update set status = 'pending', created = now() where fr.status in ('declined','accepted');
  return 'sent';
end $$;

create or replace function public.respond_friend_request(p_id uuid, p_accept boolean) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record;
begin
  select * into r from public.friend_requests where id = p_id and to_id = uid and status = 'pending';
  if not found then return 'not_found'; end if;
  if p_accept then
    if (select count(*) from public.friendships where uid in (a,b)) >= 100 then return 'too_many'; end if;
    update public.friend_requests set status = 'accepted' where id = p_id;
    insert into public.friendships (a, b) values (least(uid, r.from_id), greatest(uid, r.from_id)) on conflict do nothing;
    return 'accepted';
  end if;
  update public.friend_requests set status = 'declined' where id = p_id;
  return 'declined';
end $$;

create or replace function public.my_friends()
returns table (id uuid, nick text, av text, level integer, vip boolean, updated_at timestamptz, gifted_today boolean)
language sql security definer set search_path = public stable as $$
  select p.id, p.nick, p.av, p.level, p.vip, p.updated_at,
         exists (select 1 from public.gifts g where g.from_id = auth.uid() and g.to_id = p.id and g.day = current_date)
  from public.friendships f join public.profiles p on p.id = case when f.a = auth.uid() then f.b else f.a end
  where auth.uid() in (f.a, f.b) order by p.updated_at desc limit 200 $$;

create or replace function public.my_requests()
returns table (id uuid, from_id uuid, nick text, av text)
language sql security definer set search_path = public stable as $$
  select r.id, r.from_id, p.nick, p.av from public.friend_requests r join public.profiles p on p.id = r.from_id
  where r.to_id = auth.uid() and r.status = 'pending' order by r.created desc limit 50 $$;

create or replace function public.remove_friend(p_id uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.friendships where a = least(auth.uid(), p_id) and b = greatest(auth.uid(), p_id) $$;

create or replace function public.send_gift(p_to uuid) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); n int;
begin
  if not exists (select 1 from public.friendships where a = least(uid,p_to) and b = greatest(uid,p_to)) then raise exception 'not friends'; end if;
  insert into public.gifts (from_id, to_id) values (uid, p_to) on conflict do nothing;
  get diagnostics n = row_count;
  return case when n > 0 then 'ok' else 'already' end;
end $$;

create or replace function public.claim_gifts() returns integer
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with u as (update public.gifts set claimed = true where to_id = auth.uid() and not claimed returning 1) select count(*) into n from u;
  return coalesce(n, 0);
end $$;

-- проверка содержимого обмена: яйца, монеты, мёд, обычные пчёлы (без 11, 12, 13)
create or replace function public.trade_ok(j jsonb) returns boolean
language plpgsql immutable as $$
declare k text; v jsonb; b jsonb;
begin
  if jsonb_typeof(j) <> 'object' then return false; end if;
  for k, v in select * from jsonb_each(j) loop
    if k not in ('eggs','coins','honey','bees') then return false; end if;
    if k = 'bees' then
      if jsonb_typeof(v) <> 'array' or jsonb_array_length(v) > 5 then return false; end if;
      for b in select * from jsonb_array_elements(v) loop
        if jsonb_typeof(b) <> 'number' or (b::text)::numeric not between 0 and 40 or (b::text)::numeric in (11,12,13) then return false; end if;
      end loop;
    else
      if jsonb_typeof(v) <> 'number' or (v::text)::numeric < 0 then return false; end if;
      if k = 'eggs' and (v::text)::numeric > 50 then return false; end if;
      if k <> 'eggs' and (v::text)::numeric > 1e15 then return false; end if;
    end if;
  end loop;
  return true;
end $$;

create or replace function public.create_trade(p_to uuid, p_give jsonb, p_want jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid uuid;
begin
  if not exists (select 1 from public.friendships where a = least(uid,p_to) and b = greatest(uid,p_to)) then raise exception 'обмен только с друзьями'; end if;
  if not public.trade_ok(p_give) or not public.trade_ok(p_want) then raise exception 'недопустимый состав обмена'; end if;
  if p_give = '{}'::jsonb or p_want = '{}'::jsonb then raise exception 'обмен не может быть пустым'; end if;
  if (select count(*) from public.trades where from_id = uid and status = 'pending') >= 5 then raise exception 'не больше 5 открытых предложений'; end if;
  if (select count(*) from public.trades where from_id = uid and created > now() - interval '1 day') >= 20 then raise exception 'лимит: 20 предложений в сутки'; end if;
  insert into public.trades (from_id, to_id, give, want) values (uid, p_to, p_give, p_want) returning id into tid;
  return tid;
end $$;

create or replace function public.my_trades()
returns table (id uuid, from_id uuid, to_id uuid, from_nick text, to_nick text, give jsonb, want jsonb, status text, delivered boolean, created timestamptz)
language sql security definer set search_path = public stable as $$
  select t.id, t.from_id, t.to_id, pf.nick, pt.nick, t.give, t.want, t.status, t.delivered, t.created
  from public.trades t join public.profiles pf on pf.id = t.from_id join public.profiles pt on pt.id = t.to_id
  where auth.uid() in (t.from_id, t.to_id) order by t.created desc limit 50 $$;

create or replace function public.accept_trade(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g jsonb; w jsonb;
begin
  update public.trades set status = 'accepted', updated = now() where id = p_id and to_id = auth.uid() and status = 'pending' returning give, want into g, w;
  if g is null then raise exception 'предложение недоступно'; end if;
  return jsonb_build_object('give', g, 'want', w);
end $$;

create or replace function public.decline_trade(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.trades set status = 'declined', updated = now() where id = p_id and to_id = auth.uid() and status = 'pending' $$;

create or replace function public.cancel_trade(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.trades set status = 'cancelled', updated = now() where id = p_id and from_id = auth.uid() and status = 'pending' $$;

create or replace function public.ack_trade(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s text; g jsonb; w jsonb;
begin
  update public.trades set delivered = true where id = p_id and from_id = auth.uid() and not delivered and status in ('accepted','declined','cancelled') returning status, give, want into s, g, w;
  if s is null then return null; end if;
  return jsonb_build_object('status', s, 'items', case when s = 'accepted' then w else g end);
end $$;

-- 5. Права на вызов функций только у вошедших пользователей
revoke execute on all functions in schema public from public, anon;
grant execute on function public.upsert_profile(text,text,double precision,double precision,integer,boolean),
  public.send_friend_request(text), public.respond_friend_request(uuid,boolean), public.my_friends(), public.my_requests(),
  public.remove_friend(uuid), public.send_gift(uuid), public.claim_gifts(), public.create_trade(uuid,jsonb,jsonb),
  public.my_trades(), public.accept_trade(uuid), public.decline_trade(uuid), public.cancel_trade(uuid), public.ack_trade(uuid)
  to authenticated;
