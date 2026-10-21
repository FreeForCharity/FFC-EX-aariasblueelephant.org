-- ═══════════════════════════════════════════ event "registered" counts ══
-- events.registered used to be typed in by hand and never moved when people
-- registered online, so every event page showed a stale number. Now:
--
--   registered = online registrations (Approved + Pending — both hold a spot)
--              + offline_count (walk-ins, outreach tallies: still typed by hand)
--
-- kept right by triggers, whoever writes the registration. Re-runnable: the
-- backfill takes offline_count = registered − online, which is the same answer
-- every time once the two are in step, so past events keep the totals they show.
-- Run with:  supabase db query --linked -f supabase/event_registered_count.sql

alter table events add column if not exists offline_count int not null default 0
  check (offline_count >= 0);

-- online registrations that hold a spot
create or replace function event_online_count(p_event uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from event_registrations
   where event_id = p_event and lower(status) in ('approved','pending')
$$;
revoke all on function event_online_count(uuid) from public;

-- a registration came, changed or went: recount its event (and the old one, if it moved).
-- security definer: a family's own insert must be able to update the event's count,
-- which plain RLS (staff-only writes on events) would refuse
create or replace function event_registrations_recount() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT','UPDATE') then
    update events set registered = event_online_count(new.event_id) + offline_count where id = new.event_id;
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.event_id is distinct from new.event_id) then
    update events set registered = event_online_count(old.event_id) + offline_count where id = old.event_id;
  end if;
  return null;
end $$;

drop trigger if exists event_registrations_recount on event_registrations;
create trigger event_registrations_recount
  after insert or update of status, event_id or delete on event_registrations
  for each row execute function event_registrations_recount();

-- whenever an event row is written, its total follows the rule — a hand edit
-- changes offline_count; a stray write to registered cannot drift it
create or replace function events_keep_registered() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.registered := event_online_count(new.id) + coalesce(new.offline_count, 0);
  return new;
end $$;

drop trigger if exists events_keep_registered on events;
create trigger events_keep_registered
  before insert or update on events
  for each row execute function events_keep_registered();

-- backfill: whatever a past event shows beyond its online registrations was
-- counted by hand — keep it as offline_count, so no total changes
update events e
   set offline_count = greatest(0, e.registered - event_online_count(e.id));

select 'event counts ready' as result;
