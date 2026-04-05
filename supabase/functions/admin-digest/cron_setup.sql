-- 1. Enable the pg_cron extension
create extension if not exists pg_cron;

-- 2. Schedule the admin digest email
-- This runs once a day at 8:00 AM UTC
-- Format: select cron.schedule('name', 'cron_expression', 'command')
select
  cron.schedule(
    'admin-daily-registration-digest',
    '0 8 * * *',
    $$
    select
      net.http_post(
        url:='https://[PROJECT_REF].functions.supabase.co/admin-digest',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- IMPORTANT: Replace [PROJECT_REF] with your Supabase Project ID
-- Replace [SERVICE_ROLE_KEY] with your Service Role Key from Project Settings > API
