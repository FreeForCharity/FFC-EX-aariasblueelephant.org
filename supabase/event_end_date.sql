-- ═══════════════════════════════════════════════ event end dates ══
-- Optional last day for events that run over a season (e.g. the Special
-- Olympics Junior Athlete Division, Jan – Dec). With an end date the event
-- stays under "Upcoming" (shown as "Ongoing" once it has started) and keeps
-- taking sign-ups until that day has passed. Null = a one-day event, as before.
-- Additive and re-runnable. Run with:
--   supabase db query --linked -f supabase/event_end_date.sql
-- or paste into the Supabase SQL editor.

alter table public.events add column if not exists end_date text;
