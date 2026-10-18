-- ============================================================================
-- Inclusion Festival & Resource Fair — November offers, redeemed by QR
--
-- Run this once in the Supabase SQL editor (or `supabase db query --linked -f`).
-- It is safe to re-run. To start over from an older version, run
-- reset_festival.sql first — it drops every festival_* object.
--
-- How it works:
--   * A shop owner signs in with Google and applies (festival_shop_apply). The
--     shop waits as 'pending' until an admin approves it in the dashboard.
--   * An approved shop gets a printed QR sign. The QR holds the shop's
--     qr_token — random, never shown anywhere public, so nobody can make a
--     working sign for a shop they don't have.
--   * A family scans the sign with their own phone, signs in with Google and
--     taps Redeem (festival_redeem). Their phone shows a green REDEEMED screen
--     with a live clock, which is what staff look at.
--   * One redemption per Google account per shop, enforced by a unique index on
--     (user_id, shop_id). Deleting a card does NOT delete redemptions, so
--     "delete my card and sign up again" cannot reuse an offer.
--   * Dates are Mountain House dates (America/Los_Angeles). The database runs
--     on UTC, so never compare against current_date directly.
-- ============================================================================

-- anyone on the organisation's Google Workspace domain runs the festival
create or replace function festival_is_admin() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') like '%@aariasblueelephant.org';
$$;

-- "today" in Mountain House, not in UTC (UTC rolls over at 4–5 pm Pacific)
create or replace function festival_today() returns date
language sql stable as $$
  select (now() at time zone 'America/Los_Angeles')::date;
$$;

-- ──────────────────────────────────────────────────────────── settings ──
create table if not exists festival_settings (
  id            int primary key default 1 check (id = 1),
  spots         int  not null default 16,
  state         text not null default 'recruiting' check (state in ('recruiting','live','ended')),
  festival_date date not null default '2026-11-01',
  event_time    text not null default '10:00 AM – 2:00 PM',
  venue         text not null default 'Mountain House Town Hall',
  redeem_from   date not null default '2026-11-01',
  redeem_to     date not null default '2026-11-30'
);
insert into festival_settings (id) values (1) on conflict (id) do nothing;

alter table festival_settings enable row level security;
drop policy if exists festival_settings_read on festival_settings;
create policy festival_settings_read on festival_settings for select to anon, authenticated using (true);
drop policy if exists festival_settings_write on festival_settings;
create policy festival_settings_write on festival_settings for update to authenticated
  using (festival_is_admin()) with check (festival_is_admin());

-- ─────────────────────────────────────────────────────────────── shops ──
create table if not exists festival_shops (
  id            text primary key,            -- a slug made from the name
  owner_id      uuid references auth.users(id) on delete set null,  -- null when an admin added it
  name          text not null,
  category      text not null default 'other',
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
  qr_token      text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 16),
  redeem_from   date not null default '2026-11-01',
  redeem_to     date not null default '2026-11-30',
  spot          int,
  status        text not null default 'pending'
                check (status in ('pending','approved','waitlist','declined','withdrawn')),
  approved_by   text,
  approved_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists festival_shops_status_idx on festival_shops (status);
-- one live application per Google account
create unique index if not exists festival_shops_one_per_owner
  on festival_shops (owner_id) where status in ('pending','approved','waitlist');

-- Where the offer can be used. In store: a QR sign at the counter. Online
-- (classes, tutoring, anything booked on the web): the family gets a personal
-- code on our site and quotes it when they book. A shop can do both.
alter table festival_shops add column if not exists instore boolean not null default true;
alter table festival_shops add column if not exists online boolean not null default false;
alter table festival_shops add column if not exists online_link text;   -- where to book
alter table festival_shops add column if not exists online_note text;   -- how to use the code
-- a change an approved shop asked for, waiting for an admin; the card keeps
-- showing what families were promised until it is approved
alter table festival_shops add column if not exists pending_changes jsonb;
alter table festival_shops add column if not exists pending_at timestamptz;
-- Young Founders: a business run by a kid (under 18), signed up by a parent or
-- guardian, whose contact details are the ones on file. Shown in its own
-- section and never counted against the shop spots.
alter table festival_shops add column if not exists young_founder boolean not null default false;
-- when the parent or guardian ticked the consent box
alter table festival_shops add column if not exists guardian_consent_at timestamptz;
-- a YouTube video about what they make: the 11-character id only, never a raw
-- link, so nothing but a YouTube embed can ever come out of it
alter table festival_shops add column if not exists video_id text
  check (video_id is null or video_id ~ '^[A-Za-z0-9_-]{11}$');

-- the video id out of any YouTube link people paste (watch, youtu.be, shorts,
-- embed, live); null when it is not one
create or replace function festival_youtube_id(u text) returns text
language sql immutable as $$
  select (regexp_match(coalesce(u, ''),
    '(?:youtube\.com/(?:watch\?(?:[^#]*&)?v=|shorts/|embed/|live/)|youtu\.be/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])'))[1]
$$;

alter table festival_shops enable row level security;
-- Only admins touch the table directly. Owners go through festival_shop_apply()
-- and festival_my_shop(), which never let them approve themselves.
drop policy if exists festival_shops_admin_read on festival_shops;
create policy festival_shops_admin_read on festival_shops for select to authenticated using (festival_is_admin());
drop policy if exists festival_shops_admin_insert on festival_shops;
create policy festival_shops_admin_insert on festival_shops for insert to authenticated with check (festival_is_admin());
drop policy if exists festival_shops_admin_write on festival_shops;
create policy festival_shops_admin_write on festival_shops for update to authenticated
  using (festival_is_admin()) with check (festival_is_admin());
drop policy if exists festival_shops_admin_delete on festival_shops;
create policy festival_shops_admin_delete on festival_shops for delete to authenticated using (festival_is_admin());

-- what the public may see: approved shops, safe columns only — no QR token, no contacts
create or replace view festival_shops_public
with (security_invoker = off) as
  select id, name, category, logo_url,
         offer_en, offer_es, detail_en, detail_es,
         address, website, spot, redeem_from, redeem_to,
         instore, online, online_link, online_note,
         young_founder, video_id
  from festival_shops
  where status = 'approved';
grant select on festival_shops_public to anon, authenticated;

-- how many spots are gone, without revealing who has them
create or replace view festival_spot_counts
with (security_invoker = off) as
  select
    count(*) filter (where status in ('pending','approved') and not young_founder) as taken,
    count(*) filter (where status = 'waitlist' and not young_founder)              as waitlist
  from festival_shops;
grant select on festival_spot_counts to anon, authenticated;

-- ─────────────────────────────────────────────────────────────── passes ──
create table if not exists festival_passes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references auth.users(id) on delete cascade,
  email        text,                       -- admin-only; how a raffle winner is reached
  short_code   text not null unique,
  display_name text,
  party_size   int not null default 1 check (party_size between 1 and 12),
  -- 'card' = made on the card page; otherwise the id of the shop whose QR sign
  -- they scanned before they had a card — a family that shop brought in
  source       text not null default 'card',
  created_at   timestamptz not null default now()
);

alter table festival_passes enable row level security;
drop policy if exists festival_passes_own on festival_passes;
create policy festival_passes_own on festival_passes for select to authenticated
  using (user_id = auth.uid() or festival_is_admin());
-- passes are only ever created by festival_my_pass() / festival_redeem()
drop policy if exists festival_passes_create on festival_passes;
drop policy if exists festival_passes_delete_own on festival_passes;
create policy festival_passes_delete_own on festival_passes for delete to authenticated
  using (user_id = auth.uid());
drop policy if exists festival_passes_delete_admin on festival_passes;
create policy festival_passes_delete_admin on festival_passes for delete to authenticated
  using (festival_is_admin());

-- "Email me about future events" — unticked until the family ticks it
alter table festival_passes add column if not exists email_optin boolean not null default false;
alter table festival_passes add column if not exists optin_at timestamptz;

create or replace function festival_set_optin(p_on boolean)
returns json
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'signed_out'); end if;
  update festival_passes set email_optin = coalesce(p_on, false),
         optin_at = case when coalesce(p_on, false) then now() end
   where user_id = auth.uid();
  return json_build_object('ok', found);
end $$;
revoke all on function festival_set_optin(boolean) from public;
grant execute on function festival_set_optin(boolean) to authenticated;

-- a short human-readable code for the top of the card, e.g. 7K4M9P
create or replace function festival_short_code() returns text
language plpgsql volatile as $$
declare a text := 'ACDEFGHJKLMNPQRTUVWXY34679'; v text := ''; i int;
begin
  for i in 1..6 loop
    v := v || substr(a, 1 + floor(random() * length(a))::int, 1);
  end loop;
  return v;
end $$;

-- the caller's pass, made on first use. Internal: called by the two below.
create or replace function festival_ensure_pass(p_name text, p_party int, p_source text)
returns festival_passes
language plpgsql security definer set search_path = public as $$
declare v_pass festival_passes; v_try int := 0;
begin
  select * into v_pass from festival_passes where user_id = auth.uid();
  if found then return v_pass; end if;
  loop
    v_try := v_try + 1;
    begin
      insert into festival_passes (user_id, email, short_code, display_name, party_size, source)
      values (auth.uid(), lower(auth.jwt() ->> 'email'), festival_short_code(),
              left(coalesce(nullif(btrim(p_name), ''),
                            auth.jwt() -> 'user_metadata' ->> 'full_name',
                            auth.jwt() -> 'user_metadata' ->> 'name',
                            split_part(auth.jwt() ->> 'email', '@', 1)), 80),
              greatest(1, least(12, coalesce(p_party, 1))), p_source)
      returning * into v_pass;
      return v_pass;
    exception when unique_violation then
      -- either the same person in two tabs (take theirs) or a short-code clash (retry)
      select * into v_pass from festival_passes where user_id = auth.uid();
      if found then return v_pass; end if;
      if v_try >= 8 then raise; end if;
    end;
  end loop;
end $$;
revoke all on function festival_ensure_pass(text, int, text) from public, anon, authenticated;

create or replace function festival_my_pass(p_name text default null, p_party int default 1)
returns json
language plpgsql security definer set search_path = public as $$
declare v_pass festival_passes;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'signed_out'); end if;
  v_pass := festival_ensure_pass(p_name, p_party, 'card');
  return json_build_object('ok', true, 'id', v_pass.id, 'short_code', v_pass.short_code,
                           'display_name', v_pass.display_name, 'party_size', v_pass.party_size,
                           'created_at', v_pass.created_at);
end $$;
revoke all on function festival_my_pass(text, int) from public;
grant execute on function festival_my_pass(text, int) to authenticated;

-- ────────────────────────────────────────────────────────── redemptions ──
-- (the table keeps its old name, festival_punches)
create table if not exists festival_punches (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  pass_id     uuid references festival_passes(id) on delete set null,
  shop_id     text not null references festival_shops(id) on delete cascade,
  punched_at  timestamptz not null default now(),
  local_date  date not null default festival_today(),
  -- true when this scan is what made their card: the shop's sign brought them in
  new_card    boolean not null default false
);
-- THE rule: one offer per Google account per shop, card or no card
create unique index if not exists festival_punches_once on festival_punches (user_id, shop_id);
-- online redemptions carry a personal code the family quotes when booking;
-- the business ticks it off on its shop page
alter table festival_punches add column if not exists method text not null default 'qr';
alter table festival_punches add column if not exists code text;
alter table festival_punches add column if not exists used_at timestamptz;
create unique index if not exists festival_punches_code_idx on festival_punches (code) where code is not null;
create index if not exists festival_punches_shop_idx on festival_punches (shop_id, local_date);

alter table festival_punches enable row level security;
drop policy if exists festival_punches_read on festival_punches;
create policy festival_punches_read on festival_punches for select to authenticated
  using (user_id = auth.uid() or festival_is_admin());
drop policy if exists festival_punches_admin_write on festival_punches;
create policy festival_punches_admin_write on festival_punches for delete to authenticated
  using (festival_is_admin());

-- ─────────────────────────────────────────────── shop sign-up (owners) ──
create or replace function festival_shop_apply(p jsonb)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_email   text := lower(auth.jwt() ->> 'email');
  v_shop    festival_shops;
  v_state   text;
  v_spots   int;
  v_taken   int;
  v_base    text;
  v_id      text;
  v_n       int := 1;
  v_name    text := left(btrim(coalesce(p ->> 'name', '')), 80);
  v_offer   text := left(btrim(coalesce(p ->> 'offer_en', '')), 140);
  v_contact text := left(btrim(coalesce(p ->> 'contact_name', '')), 80);
  v_cat     text := coalesce(p ->> 'category', 'other');
  v_logo    text := p ->> 'logo_url';
  v_web     text := left(btrim(coalesce(p ->> 'website', '')), 200);
  v_pledge  int  := case when (p ->> 'pledge_pct') ~ '^\d{1,3}$'
                         then least(100, (p ->> 'pledge_pct')::int) end;
begin
  if v_uid is null or v_email is null then
    return json_build_object('ok', false, 'error', 'signed_out');
  end if;
  if length(v_name) < 2 or length(v_offer) < 3 or length(v_contact) < 2 then
    return json_build_object('ok', false, 'error', 'missing_fields');
  end if;
  select state, spots into v_state, v_spots from festival_settings where id = 1;
  if v_state = 'ended' then
    return json_build_object('ok', false, 'error', 'closed');
  end if;
  if v_cat not in ('restaurant','cafe','bakery','grocery','gym','dental','health',
                   'tutoring','kids','salon','florist','retail','other') then
    v_cat := 'other';
  end if;
  -- a logo must be one this person uploaded to the festival bucket
  if v_logo is not null and v_logo not like '%/storage/v1/object/public/festival-logos/' || v_uid::text || '/%' then
    v_logo := null;
  end if;
  if v_web <> '' and v_web !~* '^https?://' then v_web := 'https://' || v_web; end if;

  select * into v_shop from festival_shops
   where owner_id = v_uid and status in ('pending','waitlist','approved');
  if found then
    -- once a shop is on the card, its offer is what families were promised;
    -- changes go through us
    if v_shop.status = 'approved' then
      return json_build_object('ok', false, 'error', 'already_approved', 'id', v_shop.id);
    end if;
    update festival_shops set
      name = v_name, category = v_cat, offer_en = v_offer,
      offer_es  = nullif(left(btrim(coalesce(p ->> 'offer_es', '')), 140), ''),
      detail_en = nullif(left(btrim(coalesce(p ->> 'detail_en', '')), 200), ''),
      address   = nullif(left(btrim(coalesce(p ->> 'address', '')), 140), ''),
      website   = nullif(v_web, ''),
      contact_name = v_contact,
      contact_phone = nullif(left(btrim(coalesce(p ->> 'contact_phone', '')), 30), ''),
      pledge_pct = v_pledge,
      logo_url = coalesce(v_logo, logo_url),
      updated_at = now()
    where id = v_shop.id
    returning * into v_shop;
    return json_build_object('ok', true, 'id', v_shop.id, 'status', v_shop.status, 'updated', true);
  end if;

  -- two shops applying at the same instant must not both take the last spot
  perform pg_advisory_xact_lock(hashtext('festival_shop_apply'));
  select count(*) into v_taken from festival_shops where status in ('pending','approved') and not young_founder;

  v_base := left(coalesce(nullif(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), ''), 'shop'), 28);
  v_id := v_base;
  while exists (select 1 from festival_shops where id = v_id) loop
    v_n := v_n + 1;
    v_id := v_base || '-' || v_n;
  end loop;

  -- a new shop runs on the festival's own dates, not the column defaults
  insert into festival_shops (id, owner_id, name, category, logo_url, offer_en, offer_es, detail_en,
                              address, website, contact_name, contact_email, contact_phone,
                              pledge_pct, status, redeem_from, redeem_to)
  values (v_id, v_uid, v_name, v_cat, v_logo, v_offer,
          nullif(left(btrim(coalesce(p ->> 'offer_es', '')), 140), ''),
          nullif(left(btrim(coalesce(p ->> 'detail_en', '')), 200), ''),
          nullif(left(btrim(coalesce(p ->> 'address', '')), 140), ''),
          nullif(v_web, ''), v_contact, v_email,
          nullif(left(btrim(coalesce(p ->> 'contact_phone', '')), 30), ''),
          v_pledge,
          case when v_taken < v_spots then 'pending' else 'waitlist' end,
          (select redeem_from from festival_settings where id = 1),
          (select redeem_to from festival_settings where id = 1))
  returning * into v_shop;

  return json_build_object('ok', true, 'id', v_shop.id, 'status', v_shop.status, 'updated', false);
end $$;
revoke all on function festival_shop_apply(jsonb) from public;
grant execute on function festival_shop_apply(jsonb) to authenticated;

-- ═══════════════════════════════════════ shop sign-up with ANY email ══
-- Shops are not all on Google (shop@pizza.com, Outlook, Yahoo…), so a shop
-- signs up with just an email address and no password:
--   1. festival_shop_signup()  saves the shop as 'unconfirmed' and hands back
--      its private manage_token (the shop's own page) — nothing reaches the
--      admin yet.
--   2. The email function sends a link carrying confirm_token. Only that
--      link, i.e. only someone who can read the inbox, can confirm.
--   3. festival_shop_confirm() moves it to 'pending' (or 'waitlist') and the
--      admin is alerted.
--   4. manage_token is the shop's key from then on: edit while waiting,
--      print the QR sign once approved. It is in every email we send them.
alter table festival_shops add column if not exists manage_token text;
update festival_shops set manage_token = replace(gen_random_uuid()::text, '-', '') where manage_token is null;
alter table festival_shops alter column manage_token set default replace(gen_random_uuid()::text, '-', '');
alter table festival_shops alter column manage_token set not null;
create unique index if not exists festival_shops_manage_idx on festival_shops (manage_token);
alter table festival_shops add column if not exists confirm_token text;
alter table festival_shops add column if not exists email_confirmed_at timestamptz;
-- Google sign-ups proved their email when they signed in
update festival_shops set email_confirmed_at = created_at where email_confirmed_at is null and owner_id is not null;
alter table festival_shops drop constraint if exists festival_shops_status_check;
alter table festival_shops add constraint festival_shops_status_check
  check (status in ('unconfirmed','pending','approved','waitlist','declined','withdrawn'));

-- the form, cleaned: trimmed, length-capped, category checked. null = missing a required field
create or replace function festival_shop_fields(p jsonb) returns jsonb
language plpgsql immutable as $$
declare
  n   text := left(btrim(coalesce(p ->> 'name', '')), 80);
  o   text := left(btrim(coalesce(p ->> 'offer_en', '')), 140);
  c   text := left(btrim(coalesce(p ->> 'contact_name', '')), 80);
  cat text := coalesce(p ->> 'category', 'other');
  web text := left(btrim(coalesce(p ->> 'website', '')), 200);
  yf  boolean := coalesce((p ->> 'young_founder')::boolean, false);
begin
  if length(n) < 2 or length(o) < 3 or length(c) < 2 then return null; end if;
  -- a kid's business only with a parent or guardian saying yes
  if yf and not coalesce((p ->> 'guardian_consent')::boolean, false) then return null; end if;
  if cat not in ('restaurant','cafe','bakery','grocery','gym','dental','health',
                 'tutoring','kids','salon','florist','retail','other') then cat := 'other'; end if;
  if web <> '' and web !~* '^https?://' then web := 'https://' || web; end if;
  return jsonb_build_object(
    'name', n, 'offer_en', o, 'contact_name', c, 'category', cat,
    'offer_es',      nullif(left(btrim(coalesce(p ->> 'offer_es', '')), 140), ''),
    'detail_en',     nullif(left(btrim(coalesce(p ->> 'detail_en', '')), 200), ''),
    'address',       nullif(left(btrim(coalesce(p ->> 'address', '')), 140), ''),
    'website',       nullif(web, ''),
    'contact_phone', nullif(left(btrim(coalesce(p ->> 'contact_phone', '')), 30), ''),
    -- at least one of the two; an offer nobody can use is no offer
    'instore', case when coalesce((p ->> 'online')::boolean, false) then coalesce((p ->> 'instore')::boolean, false) else true end,
    'online', coalesce((p ->> 'online')::boolean, false),
    'online_link', case when coalesce((p ->> 'online')::boolean, false) then
                     nullif(case when btrim(coalesce(p ->> 'online_link', '')) ~* '^https?://' or btrim(coalesce(p ->> 'online_link', '')) = ''
                                 then left(btrim(coalesce(p ->> 'online_link', '')), 300)
                                 else 'https://' || left(btrim(p ->> 'online_link'), 290) end, '') end,
    'online_note', case when coalesce((p ->> 'online')::boolean, false) then
                     nullif(left(btrim(coalesce(p ->> 'online_note', '')), 200), '') end,
    'young_founder', yf,
    -- videos are a Young Founders thing
    'video_id', case when yf then festival_youtube_id(p ->> 'video_url') end);
end $$;

-- a video link that is not a YouTube link gets told so, not silently dropped
create or replace function festival_bad_video(p jsonb) returns boolean
language sql immutable as $$
  select coalesce((p ->> 'young_founder')::boolean, false)
     and btrim(coalesce(p ->> 'video_url', '')) <> ''
     and festival_youtube_id(p ->> 'video_url') is null
$$;

-- what a shop's own page shows: its details, its QR once approved, its numbers
create or replace function festival_shop_view(v_shop festival_shops) returns json
language plpgsql stable security definer set search_path = public as $$
declare v_days json; v_total int; v_today int; v_new int; v_codes json;
begin
  -- codes only, never names: shops get numbers and codes, nothing about who
  select coalesce(json_agg(json_build_object('code', code, 'at', punched_at, 'used_at', used_at) order by punched_at desc), '[]'::json)
    into v_codes
    from festival_punches where shop_id = v_shop.id and code is not null;
  select count(*), count(*) filter (where local_date = festival_today()), count(*) filter (where new_card)
    into v_total, v_today, v_new
    from festival_punches where shop_id = v_shop.id;
  select coalesce(json_agg(json_build_object('date', d, 'count', c) order by d), '[]'::json) into v_days
    from (select local_date d, count(*) c from festival_punches where shop_id = v_shop.id group by 1) x;
  return json_build_object(
    'ok', true, 'id', v_shop.id, 'name', v_shop.name, 'category', v_shop.category,
    'logo_url', v_shop.logo_url, 'offer_en', v_shop.offer_en, 'offer_es', v_shop.offer_es,
    'detail_en', v_shop.detail_en, 'address', v_shop.address, 'website', v_shop.website,
    'contact_name', v_shop.contact_name, 'contact_email', v_shop.contact_email,
    'contact_phone', v_shop.contact_phone, 'pledge_pct', v_shop.pledge_pct,
    'status', v_shop.status, 'redeem_from', v_shop.redeem_from, 'redeem_to', v_shop.redeem_to,
    'qr_token', case when v_shop.status = 'approved' then v_shop.qr_token end,
    'total', v_total, 'today', v_today, 'new_cards', v_new, 'days', v_days,
    'instore', v_shop.instore, 'online', v_shop.online,
    'online_link', v_shop.online_link, 'online_note', v_shop.online_note, 'codes', v_codes,
    'pending_changes', v_shop.pending_changes, 'pending_at', v_shop.pending_at,
    'young_founder', v_shop.young_founder, 'video_id', v_shop.video_id);
end $$;
revoke all on function festival_shop_view(festival_shops) from public, anon, authenticated;

-- the Google-account way in, for shops that signed up that way before
create or replace function festival_my_shop()
returns json
language plpgsql security definer set search_path = public as $$
declare v_shop festival_shops;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'signed_out'); end if;
  select * into v_shop from festival_shops
   where owner_id = auth.uid() and status <> 'withdrawn'
   order by (status = 'approved') desc, created_at desc limit 1;
  if not found then return json_build_object('ok', false, 'error', 'no_shop'); end if;
  return festival_shop_view(v_shop);
end $$;
revoke all on function festival_my_shop() from public;
grant execute on function festival_my_shop() to authenticated;

create or replace function festival_shop_signup(p jsonb)
returns json
language plpgsql security definer set search_path = public as $$
declare
  f       jsonb := festival_shop_fields(p);
  v_email text  := lower(btrim(coalesce(p ->> 'contact_email', '')));
  v_state text;
  v_shop  festival_shops;
  v_recent int;
  v_base  text;
  v_id    text;
  v_n     int := 1;
begin
  -- a hidden field people never see; bots fill in everything
  if coalesce(p ->> 'company_fax', '') <> '' then return json_build_object('ok', true); end if;
  if festival_bad_video(p) then return json_build_object('ok', false, 'error', 'bad_video'); end if;
  if f is null then return json_build_object('ok', false, 'error', 'missing_fields'); end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_email) > 120 then
    return json_build_object('ok', false, 'error', 'bad_email');
  end if;
  select state into v_state from festival_settings where id = 1;
  if v_state = 'ended' then return json_build_object('ok', false, 'error', 'closed'); end if;

  select * into v_shop from festival_shops
   where lower(contact_email) = v_email and status in ('unconfirmed','pending','approved','waitlist')
   order by created_at desc limit 1;
  if found then
    if v_shop.status <> 'unconfirmed' then
      return json_build_object('ok', false, 'error', 'already_signed_up');
    end if;
    -- signed up but never confirmed: take the new details and send the link again.
    -- No manage token back: whoever typed this address may not own it.
    update festival_shops set
      name = f ->> 'name', category = f ->> 'category', offer_en = f ->> 'offer_en',
      offer_es = f ->> 'offer_es', detail_en = f ->> 'detail_en', address = f ->> 'address',
      website = f ->> 'website', contact_name = f ->> 'contact_name', contact_phone = f ->> 'contact_phone',
      instore = (f ->> 'instore')::boolean, online = (f ->> 'online')::boolean,
      online_link = f ->> 'online_link', online_note = f ->> 'online_note',
      young_founder = (f ->> 'young_founder')::boolean, video_id = f ->> 'video_id',
      guardian_consent_at = case when (f ->> 'young_founder')::boolean then now() end,
      updated_at = now()
    where id = v_shop.id;
    return json_build_object('ok', true, 'id', v_shop.id, 'resent', true);
  end if;

  -- a flood of unconfirmed sign-ups is someone abusing the form
  select count(*) into v_recent from festival_shops
   where status = 'unconfirmed' and created_at > now() - interval '1 hour';
  if v_recent >= 40 then return json_build_object('ok', false, 'error', 'busy'); end if;

  v_base := left(coalesce(nullif(trim(both '-' from regexp_replace(lower(f ->> 'name'), '[^a-z0-9]+', '-', 'g')), ''), 'shop'), 28);
  v_id := v_base;
  while exists (select 1 from festival_shops where id = v_id) loop
    v_n := v_n + 1;
    v_id := v_base || '-' || v_n;
  end loop;

  insert into festival_shops (id, name, category, offer_en, offer_es, detail_en, address, website,
                              contact_name, contact_email, contact_phone, status, confirm_token,
                              instore, online, online_link, online_note,
                              young_founder, video_id, guardian_consent_at,
                              redeem_from, redeem_to)
  values (v_id, f ->> 'name', f ->> 'category', f ->> 'offer_en', f ->> 'offer_es', f ->> 'detail_en',
          f ->> 'address', f ->> 'website', f ->> 'contact_name', v_email, f ->> 'contact_phone',
          'unconfirmed', replace(gen_random_uuid()::text, '-', ''),
          (f ->> 'instore')::boolean, (f ->> 'online')::boolean, f ->> 'online_link', f ->> 'online_note',
          (f ->> 'young_founder')::boolean, f ->> 'video_id',
          case when (f ->> 'young_founder')::boolean then now() end,
          (select redeem_from from festival_settings where id = 1),
          (select redeem_to from festival_settings where id = 1))
  returning * into v_shop;

  return json_build_object('ok', true, 'id', v_shop.id, 'manage', v_shop.manage_token);
end $$;
revoke all on function festival_shop_signup(jsonb) from public;
grant execute on function festival_shop_signup(jsonb) to anon, authenticated;

create or replace function festival_shop_confirm(p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare v_shop festival_shops; v_taken int; v_spots int;
begin
  select * into v_shop from festival_shops where confirm_token = p_token and coalesce(p_token, '') <> '';
  if not found then return json_build_object('ok', false, 'error', 'bad_token'); end if;
  if v_shop.status <> 'unconfirmed' then
    return json_build_object('ok', true, 'id', v_shop.id, 'manage', v_shop.manage_token, 'just_confirmed', false);
  end if;
  perform pg_advisory_xact_lock(hashtext('festival_shop_apply'));
  select spots into v_spots from festival_settings where id = 1;
  select count(*) into v_taken from festival_shops where status in ('pending','approved') and not young_founder;
  update festival_shops
     set status = case when v_shop.young_founder or v_taken < v_spots then 'pending' else 'waitlist' end,
         email_confirmed_at = now(), updated_at = now()
   where id = v_shop.id
  returning * into v_shop;
  return json_build_object('ok', true, 'id', v_shop.id, 'manage', v_shop.manage_token,
                           'just_confirmed', true, 'status', v_shop.status);
end $$;
revoke all on function festival_shop_confirm(text) from public;
grant execute on function festival_shop_confirm(text) to anon, authenticated;

create or replace function festival_shop_by_manage(p_token text)
returns json
language plpgsql stable security definer set search_path = public as $$
declare v_shop festival_shops;
begin
  select * into v_shop from festival_shops
   where manage_token = p_token and coalesce(p_token, '') <> '' and status <> 'withdrawn';
  if not found then return json_build_object('ok', false, 'error', 'bad_token'); end if;
  return festival_shop_view(v_shop);
end $$;
revoke all on function festival_shop_by_manage(text) from public;
grant execute on function festival_shop_by_manage(text) to anon, authenticated;

-- A business can change its offer whenever it likes. Before approval the edit
-- simply replaces what is under review. Once on the card, the edit waits in
-- pending_changes for an admin (festival_review_change) and the card keeps
-- the current offer meanwhile. The admin is emailed either way (SHOP_UPDATED).
create or replace function festival_shop_update_by_manage(p_token text, p jsonb)
returns json
language plpgsql security definer set search_path = public as $$
declare f jsonb := festival_shop_fields(p); v_shop festival_shops;
begin
  select * into v_shop from festival_shops where manage_token = p_token and coalesce(p_token, '') <> '';
  if not found then return json_build_object('ok', false, 'error', 'bad_token'); end if;
  if v_shop.status not in ('unconfirmed','pending','waitlist','approved') then
    return json_build_object('ok', false, 'error', 'closed');
  end if;
  if festival_bad_video(p) then return json_build_object('ok', false, 'error', 'bad_video'); end if;
  if f is null then return json_build_object('ok', false, 'error', 'missing_fields'); end if;
  if v_shop.status = 'approved' then
    -- keep any logo already waiting; the rest is replaced by this edit
    update festival_shops
       set pending_changes = f || case when pending_changes ? 'logo_url'
                                      then jsonb_build_object('logo_url', pending_changes -> 'logo_url')
                                      else '{}'::jsonb end,
           pending_at = now(), updated_at = now()
     where id = v_shop.id;
    return json_build_object('ok', true, 'id', v_shop.id, 'pending', true);
  end if;
  update festival_shops set
    name = f ->> 'name', category = f ->> 'category', offer_en = f ->> 'offer_en',
    offer_es = f ->> 'offer_es', detail_en = f ->> 'detail_en', address = f ->> 'address',
    website = f ->> 'website', contact_name = f ->> 'contact_name', contact_phone = f ->> 'contact_phone',
    instore = (f ->> 'instore')::boolean, online = (f ->> 'online')::boolean,
    online_link = f ->> 'online_link', online_note = f ->> 'online_note',
    young_founder = (f ->> 'young_founder')::boolean, video_id = f ->> 'video_id',
    guardian_consent_at = case when (f ->> 'young_founder')::boolean then coalesce(guardian_consent_at, now()) end,
    updated_at = now()
  where id = v_shop.id;
  return json_build_object('ok', true, 'id', v_shop.id, 'pending', false);
end $$;
revoke all on function festival_shop_update_by_manage(text, jsonb) from public;
grant execute on function festival_shop_update_by_manage(text, jsonb) to anon, authenticated;

-- ──────────────────────────────────────────────── redeeming, by QR sign ──
-- What a scanned sign shows before anyone signs in. Public: name and offer only.
create or replace function festival_shop_by_token(p_token text)
returns json
language plpgsql stable security definer set search_path = public as $$
declare v_shop festival_shops; v_state text;
begin
  select * into v_shop from festival_shops where qr_token = p_token and status = 'approved';
  if not found then return json_build_object('ok', false, 'error', 'bad_token'); end if;
  select state into v_state from festival_settings where id = 1;
  return json_build_object(
    'ok', true, 'id', v_shop.id, 'name', v_shop.name, 'category', v_shop.category,
    'logo_url', v_shop.logo_url, 'offer_en', v_shop.offer_en, 'offer_es', v_shop.offer_es,
    'detail_en', v_shop.detail_en, 'detail_es', v_shop.detail_es, 'address', v_shop.address,
    'redeem_from', v_shop.redeem_from, 'redeem_to', v_shop.redeem_to,
    'state', v_state, 'today', festival_today());
end $$;
revoke all on function festival_shop_by_token(text) from public;
grant execute on function festival_shop_by_token(text) to anon, authenticated;

create or replace function festival_redeem(p_token text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_shop  festival_shops;
  v_state text;
  v_pass  festival_passes;
  v_new   boolean := false;
  v_at    timestamptz;
  v_today date := festival_today();
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'signed_out'); end if;

  select * into v_shop from festival_shops where qr_token = p_token and status = 'approved';
  if not found then return json_build_object('ok', false, 'error', 'bad_token'); end if;

  select state into v_state from festival_settings where id = 1;
  if v_state = 'ended' or v_today > v_shop.redeem_to then
    return json_build_object('ok', false, 'error', 'ended', 'to', v_shop.redeem_to);
  end if;
  if v_state <> 'live' or v_today < v_shop.redeem_from then
    return json_build_object('ok', false, 'error', 'not_started', 'from', v_shop.redeem_from);
  end if;

  select * into v_pass from festival_passes where user_id = auth.uid();
  if not found then
    v_pass := festival_ensure_pass(null, 1, v_shop.id);
    v_new := true;
  end if;

  insert into festival_punches (user_id, pass_id, shop_id, new_card)
  values (auth.uid(), v_pass.id, v_shop.id, v_new)
  on conflict (user_id, shop_id) do nothing
  returning punched_at into v_at;

  if v_at is null then
    select punched_at into v_at from festival_punches where user_id = auth.uid() and shop_id = v_shop.id;
    return json_build_object('ok', false, 'error', 'already_used', 'shop_id', v_shop.id,
                             'shop_name', v_shop.name, 'punched_at', v_at);
  end if;

  return json_build_object('ok', true, 'shop_id', v_shop.id, 'shop_name', v_shop.name,
                           'punched_at', v_at, 'new_card', v_new);
end $$;
revoke all on function festival_redeem(text) from public;
grant execute on function festival_redeem(text) to authenticated;

-- an admin approves or turns down a waiting change
create or replace function festival_review_change(p_shop text, p_accept boolean)
returns json
language plpgsql security definer set search_path = public as $$
declare v_shop festival_shops; c jsonb;
begin
  if not festival_is_admin() then return json_build_object('ok', false, 'error', 'not_admin'); end if;
  select * into v_shop from festival_shops where id = p_shop;
  if not found or v_shop.pending_changes is null then return json_build_object('ok', false, 'error', 'nothing_pending'); end if;
  c := v_shop.pending_changes;
  if p_accept then
    update festival_shops set
      name          = coalesce(c ->> 'name', name),
      category      = coalesce(c ->> 'category', category),
      offer_en      = coalesce(c ->> 'offer_en', offer_en),
      offer_es      = case when c ? 'offer_es' then c ->> 'offer_es' else offer_es end,
      detail_en     = case when c ? 'detail_en' then c ->> 'detail_en' else detail_en end,
      address       = case when c ? 'address' then c ->> 'address' else address end,
      website       = case when c ? 'website' then c ->> 'website' else website end,
      contact_name  = coalesce(c ->> 'contact_name', contact_name),
      contact_phone = case when c ? 'contact_phone' then c ->> 'contact_phone' else contact_phone end,
      instore       = coalesce((c ->> 'instore')::boolean, instore),
      online        = coalesce((c ->> 'online')::boolean, online),
      online_link   = case when c ? 'online_link' then c ->> 'online_link' else online_link end,
      online_note   = case when c ? 'online_note' then c ->> 'online_note' else online_note end,
      logo_url      = coalesce(c ->> 'logo_url', logo_url),
      young_founder = coalesce((c ->> 'young_founder')::boolean, young_founder),
      video_id      = case when c ? 'video_id' then c ->> 'video_id' else video_id end,
      guardian_consent_at = case when coalesce((c ->> 'young_founder')::boolean, young_founder)
                                 then coalesce(guardian_consent_at, v_shop.pending_at, now()) end,
      pending_changes = null, pending_at = null, updated_at = now()
    where id = p_shop;
  else
    update festival_shops set pending_changes = null, pending_at = null, updated_at = now() where id = p_shop;
  end if;
  return json_build_object('ok', true);
end $$;
revoke all on function festival_review_change(text, boolean) from public;
grant execute on function festival_review_change(text, boolean) to authenticated;

-- ──────────────────────────────────────────── online offers, by code ──
create or replace function festival_code_text() returns text
language plpgsql volatile as $$
declare a text := 'ACDEFGHJKLMNPQRTUVWXY34679'; v text := 'ABE-'; i int;
begin
  for i in 1..4 loop v := v || substr(a, 1 + floor(random() * length(a))::int, 1); end loop;
  return v;
end $$;

-- the family's personal code for an online offer — one per Google account per
-- business, the same rule as the counter (a counter redemption counts too)
create or replace function festival_online_code(p_shop text)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_shop  festival_shops;
  v_state text;
  v_pass  festival_passes;
  v_new   boolean := false;
  v_row   festival_punches;
  v_try   int := 0;
  v_today date := festival_today();
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'signed_out'); end if;
  select * into v_shop from festival_shops where id = p_shop and status = 'approved' and online;
  if not found then return json_build_object('ok', false, 'error', 'not_online'); end if;

  select * into v_row from festival_punches where user_id = auth.uid() and shop_id = v_shop.id;
  if found then
    return json_build_object('ok', v_row.code is not null, 'error', case when v_row.code is null then 'already_used' end,
                             'code', v_row.code, 'punched_at', v_row.punched_at, 'used_at', v_row.used_at, 'again', true);
  end if;

  select state into v_state from festival_settings where id = 1;
  if v_state = 'ended' or v_today > v_shop.redeem_to then
    return json_build_object('ok', false, 'error', 'ended', 'to', v_shop.redeem_to);
  end if;
  if v_state <> 'live' or v_today < v_shop.redeem_from then
    return json_build_object('ok', false, 'error', 'not_started', 'from', v_shop.redeem_from);
  end if;

  select * into v_pass from festival_passes where user_id = auth.uid();
  if not found then
    v_pass := festival_ensure_pass(null, 1, v_shop.id);
    v_new := true;
  end if;

  loop
    v_try := v_try + 1;
    begin
      insert into festival_punches (user_id, pass_id, shop_id, new_card, method, code)
      values (auth.uid(), v_pass.id, v_shop.id, v_new, 'online', festival_code_text())
      returning * into v_row;
      exit;
    exception when unique_violation then
      -- a second tab got there first: hand back what it made
      select * into v_row from festival_punches where user_id = auth.uid() and shop_id = v_shop.id;
      if found then exit; end if;
      if v_try >= 8 then raise; end if;   -- otherwise a code clash: try another
    end;
  end loop;

  return json_build_object('ok', true, 'code', v_row.code, 'punched_at', v_row.punched_at,
                           'new_card', v_new, 'again', false);
end $$;
revoke all on function festival_online_code(text) from public;
grant execute on function festival_online_code(text) to authenticated;

-- the business ticks a code off when someone books with it (or unticks a slip)
create or replace function festival_mark_code(p_manage text, p_code text, p_used boolean)
returns json
language plpgsql security definer set search_path = public as $$
declare v_shop festival_shops;
begin
  select * into v_shop from festival_shops where manage_token = p_manage and coalesce(p_manage, '') <> '';
  if not found then return json_build_object('ok', false, 'error', 'bad_token'); end if;
  update festival_punches set used_at = case when p_used then now() end
   where shop_id = v_shop.id and code = upper(btrim(p_code));
  if not found then return json_build_object('ok', false, 'error', 'no_code'); end if;
  return json_build_object('ok', true);
end $$;
revoke all on function festival_mark_code(text, text, boolean) from public;
grant execute on function festival_mark_code(text, text, boolean) to anon, authenticated;

-- ──────────────────────────────────────────────────── reports (admins) ──
-- security_invoker: these read through the RLS above, so only admins see rows
create or replace view festival_report_shops
with (security_invoker = on) as
  select s.id, s.name, s.spot, s.category, s.pledge_pct,
         s.contact_name, s.contact_email, s.contact_phone,
         count(p.id)                              as redemptions,
         count(p.id) filter (where p.new_card)    as new_cards,
         min(p.punched_at)                        as first_at,
         max(p.punched_at)                        as last_at,
         count(p.id) filter (where p.method = 'online')   as online_codes,
         count(p.id) filter (where p.used_at is not null) as codes_used,
         s.young_founder
  from festival_shops s
  left join festival_punches p on p.shop_id = s.id
  where s.status = 'approved'
  group by s.id;
grant select on festival_report_shops to authenticated;

create or replace view festival_report_daily
with (security_invoker = on) as
  select shop_id, local_date, count(*) as redemptions
  from festival_punches
  group by shop_id, local_date;
grant select on festival_report_daily to authenticated;

-- ─────────────────────────────────────────────────────── shop logos ──
-- Public read (they are on the card). Each owner writes only inside a folder
-- named after their own user id; admins may write anywhere.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('festival-logos', 'festival-logos', true, 1048576,
        array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 1048576,
        allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists festival_logos_insert on storage.objects;
create policy festival_logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'festival-logos'
              and ((storage.foldername(name))[1] = auth.uid()::text or festival_is_admin()));
drop policy if exists festival_logos_delete on storage.objects;
create policy festival_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'festival-logos'
         and ((storage.foldername(name))[1] = auth.uid()::text or festival_is_admin()));

select 'festival schema ready' as result;
