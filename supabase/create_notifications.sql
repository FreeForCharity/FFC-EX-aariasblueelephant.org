-- ============================================================================
-- Email plumbing. Safe to re-run.
--
-- notification_log: every email the send-registration-email function sends is
-- recorded here by (kind, ref) BEFORE it goes out, so the same email can never
-- be sent twice — however often, or by whom, the function is called. No RLS
-- policies on purpose: only the service role (the edge function) touches it.
--
-- pg_net: the admin-daily-registration-digest cron job calls net.http_post(),
-- which does not exist until this extension is on. Without it the job failed
-- every morning with: schema "net" does not exist.
-- ============================================================================

create table if not exists notification_log (
  kind     text not null,
  ref      text not null,
  sent_to  text,
  sent_at  timestamptz not null default now(),
  primary key (kind, ref)
);
alter table notification_log enable row level security;

create extension if not exists pg_net;

select 'notifications ready' as result;
