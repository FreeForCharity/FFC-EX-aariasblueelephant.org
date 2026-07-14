-- Anonymous, aggregate game-play counter (COPPA-safe: no identifiers of any kind).
-- Games call record_game_play('blockcraft') once per session; admins read totals.

create table if not exists public.game_play_counts (
  game text not null,
  day date not null default (now() at time zone 'utc')::date,
  plays bigint not null default 0,
  primary key (game, day)
);

alter table public.game_play_counts enable row level security;

-- Only signed-in users (the admin dashboard) may read; nobody writes directly.
drop policy if exists "authenticated can read game plays" on public.game_play_counts;
create policy "authenticated can read game plays"
  on public.game_play_counts for select
  to authenticated
  using (true);

-- Increment runs as definer so anon callers never touch the table directly.
create or replace function public.record_game_play(g text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- allowlist keeps junk out of the table
  -- NEW GAMES: add the slug here AND re-run this function block in the
  -- Supabase SQL editor (the allowlist lives in the DB, not just this file).
  if g not in ('elly-tubbies','blockcraft','nilus-world','roadsafety',
               'doughlab','magnetblocks','helpinghands','grocery','dayplanner','feelings') then
    return;
  end if;
  insert into public.game_play_counts (game, day, plays)
  values (g, (now() at time zone 'utc')::date, 1)
  on conflict (game, day)
  do update set plays = public.game_play_counts.plays + 1;
end;
$$;

revoke all on function public.record_game_play(text) from public;
grant execute on function public.record_game_play(text) to anon, authenticated;

-- Anonymous aggregate play TIME (seconds per game per day; no identifiers).
-- Clients flush small batches of active-play seconds; clamped server-side.
alter table public.game_play_counts add column if not exists seconds bigint not null default 0;

create or replace function public.record_game_time(g text, s int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if s is null or s < 5 then return; end if;
  if s > 600 then s := 600; end if;
  -- same allowlist as record_game_play — keep both in sync (and in the live DB)
  if g not in ('elly-tubbies','blockcraft','nilus-world','roadsafety',
               'doughlab','magnetblocks','helpinghands','grocery','dayplanner','feelings') then
    return;
  end if;
  insert into public.game_play_counts (game, day, plays, seconds)
  values (g, (now() at time zone 'utc')::date, 0, s)
  on conflict (game, day)
  do update set seconds = public.game_play_counts.seconds + excluded.seconds;
end;
$$;

revoke all on function public.record_game_time(text, int) from public;
grant execute on function public.record_game_time(text, int) to anon, authenticated;
