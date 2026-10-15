-- ============================================================================
-- "My Giving" — gifts a signed-in supporter tells us about. Safe to re-run.
--
-- Donations themselves happen on Zeffy (aariasblueelephant.org/give), which
-- sends the official tax receipt. Zeffy does not tell this site who gave, so
-- supporters log their own gifts in their dashboard: an honour-system record
-- that lets the team thank people by name and see who stands behind the work.
-- It is never a receipt and never a figure for the books.
-- ============================================================================

-- staff = anyone on the organisation's Google Workspace domain
create or replace function abe_is_staff() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') like '%@aariasblueelephant.org';
$$;

create table if not exists donation_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email       text,
  amount      numeric(10,2) not null check (amount > 0 and amount <= 100000),
  donated_on  date not null default current_date,
  campaign    text check (campaign is null or length(campaign) <= 60),
  note        text check (note is null or length(note) <= 300),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists donation_reports_user_idx on donation_reports (user_id);

-- whoever writes the row, it is theirs, under their own verified email
create or replace function donation_reports_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.email := lower(auth.jwt() ->> 'email');
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists donation_reports_owner on donation_reports;
create trigger donation_reports_owner before insert or update on donation_reports
  for each row execute function donation_reports_owner();

alter table donation_reports enable row level security;
drop policy if exists donation_reports_own_read on donation_reports;
create policy donation_reports_own_read on donation_reports for select to authenticated
  using (user_id = auth.uid() or abe_is_staff());
drop policy if exists donation_reports_own_insert on donation_reports;
create policy donation_reports_own_insert on donation_reports for insert to authenticated
  with check (auth.uid() is not null);
drop policy if exists donation_reports_own_update on donation_reports;
create policy donation_reports_own_update on donation_reports for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists donation_reports_own_delete on donation_reports;
create policy donation_reports_own_delete on donation_reports for delete to authenticated
  using (user_id = auth.uid() or abe_is_staff());

select 'donation reports ready' as result;
