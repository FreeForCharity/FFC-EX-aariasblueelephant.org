-- ═══════════════════════════════ one registration per person per event ══
-- Nothing stopped the same person registering twice for one event (a double
-- click, the sign-in round trip re-submitting, or simply registering again).
-- 1. Merge existing duplicates into the earliest registration: an
--    accommodation request on any copy is kept, and so is an approval.
-- 2. A unique index makes a second registration impossible from now on.
-- Keyed on the email (always present; older rows stored an email in user_id).
-- Re-runnable. Event counts follow automatically (event_registrations_recount).
-- Run with:  supabase db query --linked -f supabase/event_registrations_one_per_person.sql

with ranked as (
  select id, event_id, lower(btrim(user_email)) as email,
         row_number() over (partition by event_id, lower(btrim(user_email)) order by created_at, id) as rn
  from event_registrations
),
merged as (
  select r.event_id, r.email,
         bool_or(coalesce(e.special_needs, false)) as any_needs,
         bool_or(lower(e.status) = 'approved') as any_approved
  from ranked r join event_registrations e on e.id = r.id
  group by r.event_id, r.email
  having count(*) > 1
)
update event_registrations e
   set special_needs = m.any_needs,
       status = case when m.any_approved then 'Approved' else e.status end
  from ranked r join merged m on m.event_id = r.event_id and m.email = r.email
 where e.id = r.id and r.rn = 1;

delete from event_registrations e
 using (select id, row_number() over (partition by event_id, lower(btrim(user_email)) order by created_at, id) as rn
          from event_registrations) d
 where e.id = d.id and d.rn > 1;

create unique index if not exists event_registrations_one_per_person
  on event_registrations (event_id, lower(btrim(user_email)));

select 'one registration per person ready' as result;
