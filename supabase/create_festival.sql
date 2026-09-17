-- ============================================================================
-- Inclusion Festival & Resource Fair — November punch card
--
-- Run this once in the Supabase SQL editor. It is safe to re-run.
--
-- Design notes that matter:
--   * Shop punch codes are NEVER readable by the public. Attendees punch via
--     the festival_punch() function, which checks the code server-side. That
--     is the whole security model, so do not expose festival_shops to anon.
--   * The public reads festival_shops_public, a view with only safe columns
--     and only approved shops, so shop contact emails stay private.
--   * One punch per (pass, shop) is enforced by a unique index, not by app
--     code, so a double tap or a flaky network can never double-redeem.
-- ============================================================================

-- who may approve shops and read everything
create or replace function festival_is_admin() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'admin@aariasblueelephant.org';
$$;

-- ─────────────────────────────────────────────────────────────── shops ──
create table if not exists festival_shops (
  -- the slug from data/festival.json ("spice-route"), NOT a uuid: it is the
  -- stable human-readable key the committed file and the logo filenames share
  id            text primary key,
  name          text not null,
  category      text not null default 'other',
  emoji         text,
  logo_url      text,
  offer_en      text not null,
  offer_es      text,
  detail_en     text,
  detail_es     text,
  address       text,
  website       text,
  contact_name  text not null,
  contact_email text not null,
  contact_phone text,
  pledge_pct    int check (pledge_pct is null or (pledge_pct >= 0 and pledge_pct <= 100)),
  punch_code    text not null,
  -- never NULL: a NULL made the November window comparison evaluate to NULL,
  -- which silently skipped the check and let an offer be punched on any date
  redeem_from   date not null default '2026-11-01',
  redeem_to     date not null default '2026-11-30',
  spot          int,
  status        text not null default 'held'
                check (status in ('held','approved','waitlist','rejected','released')),
  held_until    timestamptz,
  approved_by   text,
  approved_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now()
);
create unique index if not exists festival_shops_code_idx on festival_shops (punch_code);
create index if not exists festival_shops_status_idx on festival_shops (status);

alter table festival_shops enable row level security;

-- Only the admin may touch this table at all. There is deliberately no public
-- insert policy: with one, an anonymous caller could insert a row with
-- status='approved' and a punch code of their choosing, putting a fake shop on
-- the card or squatting every spot. Sign-ups arrive by email and the admin
-- enters them, so the client never needs to write here.
drop policy if exists festival_shops_insert on festival_shops;

drop policy if exists festival_shops_admin_read on festival_shops;
create policy festival_shops_admin_read on festival_shops for select to authenticated using (festival_is_admin());

drop policy if exists festival_shops_admin_write on festival_shops;
create policy festival_shops_admin_write on festival_shops for update to authenticated using (festival_is_admin()) with check (festival_is_admin());

drop policy if exists festival_shops_admin_delete on festival_shops;
create policy festival_shops_admin_delete on festival_shops for delete to authenticated using (festival_is_admin());

-- what the public may see: approved shops, safe columns only, no punch code
create or replace view festival_shops_public
with (security_invoker = off) as
  select id, name, category, emoji, logo_url,
         offer_en, offer_es, detail_en, detail_es,
         address, website, spot, redeem_from, redeem_to
  from festival_shops
  where status = 'approved';
grant select on festival_shops_public to anon, authenticated;

-- how many spots are gone, without revealing who has them
create or replace view festival_spot_counts
with (security_invoker = off) as
  select
    count(*) filter (where status in ('held','approved'))              as taken,
    count(*) filter (where status = 'waitlist')                        as waitlist
  from festival_shops;
grant select on festival_spot_counts to anon, authenticated;

-- ──────────────────────────────────────────────────────────── settings ──
create table if not exists festival_settings (
  id            int primary key default 1 check (id = 1),
  spots         int  not null default 16,
  state         text not null default 'recruiting' check (state in ('recruiting','live','ended')),
  festival_date date not null default '2026-11-02',
  redeem_from   date not null default '2026-11-01',
  redeem_to     date not null default '2026-11-30',
  hold_hours    int  not null default 48
);
insert into festival_settings (id) values (1) on conflict (id) do nothing;

alter table festival_settings enable row level security;
drop policy if exists festival_settings_read on festival_settings;
create policy festival_settings_read on festival_settings for select to anon, authenticated using (true);
drop policy if exists festival_settings_write on festival_settings;
create policy festival_settings_write on festival_settings for update to authenticated using (festival_is_admin()) with check (festival_is_admin());

-- ─────────────────────────────────────────────────────────────── passes ──
create table if not exists festival_passes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  short_code   text not null,
  display_name text,
  party_size   int not null default 1 check (party_size between 1 and 12),
  status       text not null default 'active' check (status in ('active','void')),
  replaced_by  uuid references festival_passes(id),
  created_at   timestamptz not null default now()
);
create unique index if not exists festival_passes_code_idx on festival_passes (short_code);
-- one live pass per person; a replacement is only issued after voiding the old one
create unique index if not exists festival_passes_one_active
  on festival_passes (user_id) where status = 'active';

alter table festival_passes enable row level security;
drop policy if exists festival_passes_own on festival_passes;
create policy festival_passes_own on festival_passes for select to authenticated
  using (user_id = auth.uid() or festival_is_admin());
drop policy if exists festival_passes_create on festival_passes;
create policy festival_passes_create on festival_passes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists festival_passes_admin_write on festival_passes;
create policy festival_passes_admin_write on festival_passes for update to authenticated
  using (festival_is_admin()) with check (festival_is_admin());
-- Deleting matters as much as creating: a family who asks to be forgotten has
-- to be forgettable, and a test run has to be clearable. Punches and failed
-- code attempts both cascade off the pass, so one delete is enough.
drop policy if exists festival_passes_delete_own on festival_passes;
create policy festival_passes_delete_own on festival_passes for delete to authenticated
  using (user_id = auth.uid());
drop policy if exists festival_passes_delete_admin on festival_passes;
create policy festival_passes_delete_admin on festival_passes for delete to authenticated
  using (festival_is_admin());

-- ─────────────────────────────────────────────────────────────── punches ──
create table if not exists festival_punches (
  id          uuid primary key default gen_random_uuid(),
  pass_id     uuid not null references festival_passes(id) on delete cascade,
  shop_id     text not null references festival_shops(id) on delete cascade,
  punched_at  timestamptz not null default now(),
  method      text not null default 'code' check (method in ('code','qr','shop','admin')),
  sale_amount numeric(10,2)
);
-- the rule that stops an offer being used twice
create unique index if not exists festival_punches_once on festival_punches (pass_id, shop_id);
create index if not exists festival_punches_shop_idx on festival_punches (shop_id);

alter table festival_punches enable row level security;
drop policy if exists festival_punches_read on festival_punches;
create policy festival_punches_read on festival_punches for select to authenticated
  using (
    festival_is_admin()
    or exists (select 1 from festival_passes p where p.id = pass_id and p.user_id = auth.uid())
  );
-- no direct inserts: everything goes through festival_punch() so the code is checked
drop policy if exists festival_punches_admin_write on festival_punches;
create policy festival_punches_admin_write on festival_punches for delete to authenticated
  using (festival_is_admin());

-- ─────────────────────────────────────── the punch, validated server-side ──
-- failed guesses, so a four-digit code cannot simply be enumerated
create table if not exists festival_punch_tries (
  id      bigserial primary key,
  pass_id uuid not null references festival_passes(id) on delete cascade,
  tried_at timestamptz not null default now()
);
create index if not exists festival_punch_tries_idx on festival_punch_tries (pass_id, tried_at);
alter table festival_punch_tries enable row level security;

-- p_sale is gone on purpose: it was caller-controlled and written straight into
-- the pledge figures. Sale amounts now go through festival_set_sale(), which is
-- write-once. p_method is clamped so nobody can label their own punch 'admin'.
create or replace function festival_punch(
  p_pass uuid, p_code text, p_method text default 'code'
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_owner  uuid;
  v_shop   festival_shops%rowtype;
  v_state  text;
  v_recent int;
  v_method text := case when p_method in ('code','qr') then p_method else 'code' end;
begin
  select user_id into v_owner from festival_passes where id = p_pass and status = 'active';
  if v_owner is null or v_owner <> auth.uid() then
    return json_build_object('ok', false, 'error', 'not_your_pass');
  end if;

  select state into v_state from festival_settings where id = 1;
  if v_state <> 'live' then
    return json_build_object('ok', false, 'error', 'not_live');
  end if;

  -- 12 wrong guesses in ten minutes and this card stops guessing for a while
  select count(*) into v_recent from festival_punch_tries
   where pass_id = p_pass and tried_at > now() - interval '10 minutes';
  if v_recent >= 12 then
    return json_build_object('ok', false, 'error', 'too_many_tries');
  end if;

  select * into v_shop from festival_shops
   where punch_code = regexp_replace(coalesce(p_code, ''), '\D', '', 'g')
     and status = 'approved'
   limit 1;
  if v_shop.id is null then
    insert into festival_punch_tries (pass_id) values (p_pass);
    return json_build_object('ok', false, 'error', 'bad_code');
  end if;

  if current_date < v_shop.redeem_from or current_date > v_shop.redeem_to then
    return json_build_object('ok', false, 'error', 'outside_window',
                             'from', v_shop.redeem_from, 'to', v_shop.redeem_to);
  end if;

  begin
    insert into festival_punches (pass_id, shop_id, method)
    values (p_pass, v_shop.id, v_method);
  exception when unique_violation then
    return json_build_object('ok', false, 'error', 'already_used',
                             'shop_id', v_shop.id, 'shop_name', v_shop.name);
  end;

  return json_build_object('ok', true, 'shop_id', v_shop.id, 'shop_name', v_shop.name,
                           'punched_at', now());
end $$;

revoke all on function festival_punch(uuid, text, text) from public;
grant execute on function festival_punch(uuid, text, text) to authenticated;

-- ────────────────────────────────────────────── metrics, for the admin ──
create or replace view festival_shop_stats
with (security_invoker = on) as
  select s.id, s.name, s.spot, s.pledge_pct,
         count(p.id)                                  as punches,
         coalesce(sum(p.sale_amount), 0)              as sales,
         max(p.punched_at)                            as last_punch
  from festival_shops s
  left join festival_punches p on p.shop_id = s.id
  where s.status = 'approved'
  group by s.id, s.name, s.spot, s.pledge_pct;
grant select on festival_shop_stats to authenticated;

-- ============================================================================
-- Phase 3 & 4 — the shop's own till screen, and the pledge figures
-- ============================================================================

-- A shop opens one link on the till phone and bookmarks it. The token is the
-- only thing that identifies them, so it must not be guessable and must not be
-- the shop id (which is public in data/festival.json).
-- gen_random_uuid() is built into Postgres 13+, so this needs no extension.
-- (gen_random_bytes would have dragged in pgcrypto and its search path.)
alter table festival_shops
  add column if not exists console_token text
  default replace(gen_random_uuid()::text, '-', '');
update festival_shops
   set console_token = replace(gen_random_uuid()::text, '-', '')
 where console_token is null;
alter table festival_shops alter column console_token set not null;
create unique index if not exists festival_shops_token_idx on festival_shops (console_token);

-- What the till screen is allowed to see: its own name, offer, code and tally.
-- Nothing about any other shop, and nothing about any attendee.
create or replace function festival_shop_console(p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare v_shop festival_shops%rowtype; v_today int; v_total int;
begin
  select * into v_shop from festival_shops
   where console_token = p_token and status = 'approved' limit 1;
  if v_shop.id is null then
    return json_build_object('ok', false, 'error', 'bad_token');
  end if;

  select count(*) into v_today from festival_punches
   where shop_id = v_shop.id and punched_at >= date_trunc('day', now());
  select count(*) into v_total from festival_punches where shop_id = v_shop.id;

  return json_build_object(
    'ok', true,
    'id', v_shop.id, 'name', v_shop.name, 'emoji', v_shop.emoji,
    'logo_url', v_shop.logo_url,
    'offer_en', v_shop.offer_en, 'offer_es', v_shop.offer_es,
    'detail_en', v_shop.detail_en, 'detail_es', v_shop.detail_es,
    'punch_code', v_shop.punch_code,
    'redeem_from', v_shop.redeem_from, 'redeem_to', v_shop.redeem_to,
    'today', v_today, 'total', v_total
  );
end $$;

revoke all on function festival_shop_console(text) from public;
grant execute on function festival_shop_console(text) to anon, authenticated;

-- The optional sale amount, typed by staff straight after the stamp lands.
-- Only the owner of the punch may set it, and only once — so a figure cannot
-- be revised upward later to inflate what a shop appears to owe.
create or replace function festival_set_sale(p_pass uuid, p_shop text, p_amount numeric)
returns json
language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select user_id into v_owner from festival_passes where id = p_pass and status = 'active';
  if v_owner is null or v_owner <> auth.uid() then
    return json_build_object('ok', false, 'error', 'not_your_pass');
  end if;
  if p_amount is null or p_amount < 0 or p_amount > 10000 then
    return json_build_object('ok', false, 'error', 'bad_amount');
  end if;

  update festival_punches
     set sale_amount = p_amount
   where pass_id = p_pass and shop_id = p_shop and sale_amount is null;

  if not found then
    return json_build_object('ok', false, 'error', 'already_set');
  end if;
  return json_build_object('ok', true);
end $$;

revoke all on function festival_set_sale(uuid, text, numeric) from public;
grant execute on function festival_set_sale(uuid, text, numeric) to authenticated;

-- The pledge board: what each shop said they would give, against what was sold.
-- Honour system, so this is an estimate to thank people with, never an invoice.
create or replace view festival_pledges
with (security_invoker = on) as
  select s.id, s.name, s.pledge_pct,
         count(p.id)                                             as punches,
         coalesce(sum(p.sale_amount), 0)                          as sales_reported,
         count(p.sale_amount)                                     as sales_entered,
         round(coalesce(sum(p.sale_amount), 0) * coalesce(s.pledge_pct, 0) / 100.0, 2) as pledge_estimate
  from festival_shops s
  left join festival_punches p on p.shop_id = s.id
  where s.status = 'approved'
  group by s.id, s.name, s.pledge_pct;
grant select on festival_pledges to authenticated;
