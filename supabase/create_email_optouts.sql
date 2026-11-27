-- ============================================================================
-- Email opt-outs: people who asked not to get our bulk emails. Safe to re-run.
--
-- Every bulk send (cards, newsletters, GivingTuesday) must leave these
-- addresses out. They can still sign in, register and get the transactional
-- emails about their own registrations; this list only stops mass mailings.
--
-- Staff only (abe_is_staff() = an @aariasblueelephant.org account): nobody
-- else can read or change it. The addresses themselves are never committed;
-- they are added straight into the database.
-- ============================================================================

create or replace function abe_is_staff() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') like '%@aariasblueelephant.org';
$$;

create table if not exists email_optouts (
  email       text primary key check (email = lower(trim(email)) and position('@' in email) > 1),
  reason      text check (reason is null or length(reason) <= 300),
  created_at  timestamptz not null default now(),
  added_by    text default lower(auth.jwt() ->> 'email')
);

alter table email_optouts enable row level security;
drop policy if exists email_optouts_staff_all on email_optouts;
create policy email_optouts_staff_all on email_optouts for all to authenticated
  using (abe_is_staff()) with check (abe_is_staff());
revoke all on email_optouts from anon;

select 'email opt-outs ready' as result;
