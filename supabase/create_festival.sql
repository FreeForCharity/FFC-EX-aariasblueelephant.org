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
         address, website, spot, redeem_from, redeem_to
  from festival_shops
  where status = 'approved';
grant select on festival_shops_public to anon, authenticated;

-- how many spots are gone, without revealing who has them
create or replace view festival_spot_counts
with (security_invoker = off) as
  select
    count(*) filter (where status in ('pending','approved')) as taken,
    count(*) filter (where status = 'waitlist')              as waitlist
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
  select count(*) into v_taken from festival_shops where status in ('pending','approved');

  v_base := left(coalesce(nullif(trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g')), ''), 'shop'), 28);
  v_id := v_base;
  while exists (select 1 from festival_shops where id = v_id) loop
    v_n := v_n + 1;
    v_id := v_base || '-' || v_n;
  end loop;

  insert into festival_shops (id, owner_id, name, category, logo_url, offer_en, offer_es, detail_en,
                              address, website, contact_name, contact_email, contact_phone,
                              pledge_pct, status)
  values (v_id, v_uid, v_name, v_cat, v_logo, v_offer,
          nullif(left(btrim(coalesce(p ->> 'offer_es', '')), 140), ''),
          nullif(left(btrim(coalesce(p ->> 'detail_en', '')), 200), ''),
          nullif(left(btrim(coalesce(p ->> 'address', '')), 140), ''),
          nullif(v_web, ''), v_contact, v_email,
          nullif(left(btrim(coalesce(p ->> 'contact_phone', '')), 30), ''),
          v_pledge,
          case when v_taken < v_spots then 'pending' else 'waitlist' end)
  returning * into v_shop;

  return json_build_object('ok', true, 'id', v_shop.id, 'status', v_shop.status, 'updated', false);
end $$;
revoke all on function festival_shop_apply(jsonb) from public;
grant execute on function festival_shop_apply(jsonb) to authenticated;

-- the owner's own shop, its QR token once approved, and its numbers
create or replace function festival_my_shop()
returns json
language plpgsql security definer set search_path = public as $$
declare v_shop festival_shops; v_days json; v_total int; v_today int; v_new int;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'error', 'signed_out'); end if;
  select * into v_shop from festival_shops
   where owner_id = auth.uid() and status <> 'withdrawn'
   order by (status = 'approved') desc, created_at desc limit 1;
  if not found then return json_build_object('ok', false, 'error', 'no_shop'); end if;

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
    'total', v_total, 'today', v_today, 'new_cards', v_new, 'days', v_days);
end $$;
revoke all on function festival_my_shop() from public;
grant execute on function festival_my_shop() to authenticated;

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

-- ──────────────────────────────────────────────────── reports (admins) ──
-- security_invoker: these read through the RLS above, so only admins see rows
create or replace view festival_report_shops
with (security_invoker = on) as
  select s.id, s.name, s.spot, s.category, s.pledge_pct,
         s.contact_name, s.contact_email, s.contact_phone,
         count(p.id)                              as redemptions,
         count(p.id) filter (where p.new_card)    as new_cards,
         min(p.punched_at)                        as first_at,
         max(p.punched_at)                        as last_at
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
