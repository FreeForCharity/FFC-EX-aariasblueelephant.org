-- ============================================================================
-- 2027 program plan: the board's working budget. Safe to re-run.
--
-- Line items (what each program needs, estimated cost, how we'll fund it,
-- who owns it, where the ask stands) are readable and editable ONLY by staff
-- (abe_is_staff() = signed in with an @aariasblueelephant.org Google account).
-- The repo is public and the anon key ships in every page, so nothing here
-- may live in code.
--
-- The public /events/2027 page gets one thing: per-program totals rounded to
-- the nearest $50 and the list of funding routes, through
-- program_plan_summary(). No item names, owners, notes or statuses leave.
-- ============================================================================

create or replace function abe_is_staff() returns boolean
language sql stable as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') like '%@aariasblueelephant.org';
$$;

create table if not exists program_plan_items (
  id              uuid primary key default gen_random_uuid(),
  plan_year       int  not null default 2027,
  program_key     text not null check (length(program_key) between 1 and 40),
  item            text not null check (length(item) between 1 and 200),
  est_cost        numeric(10,2) not null default 0 check (est_cost >= 0 and est_cost <= 1000000),
  funding_source  text not null default 'donations'
                  check (funding_source in ('grant','sponsor','in_kind','giving_tuesday','employee_giving','donations','own_funds')),
  status          text not null default 'planned'
                  check (status in ('planned','asked','committed','received')),
  owner           text check (owner is null or length(owner) <= 80),
  notes           text check (notes is null or length(notes) <= 500),
  sort            int  not null default 0,
  updated_at      timestamptz not null default now(),
  updated_by      text
);
create index if not exists program_plan_items_prog_idx on program_plan_items (plan_year, program_key, sort);

create or replace function program_plan_items_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := lower(auth.jwt() ->> 'email');
  return new;
end $$;
drop trigger if exists program_plan_items_stamp on program_plan_items;
create trigger program_plan_items_stamp before insert or update on program_plan_items
  for each row execute function program_plan_items_stamp();

alter table program_plan_items enable row level security;
drop policy if exists program_plan_items_staff_read on program_plan_items;
create policy program_plan_items_staff_read on program_plan_items for select to authenticated using (abe_is_staff());
drop policy if exists program_plan_items_staff_insert on program_plan_items;
create policy program_plan_items_staff_insert on program_plan_items for insert to authenticated with check (abe_is_staff());
drop policy if exists program_plan_items_staff_update on program_plan_items;
create policy program_plan_items_staff_update on program_plan_items for update to authenticated using (abe_is_staff()) with check (abe_is_staff());
drop policy if exists program_plan_items_staff_delete on program_plan_items;
create policy program_plan_items_staff_delete on program_plan_items for delete to authenticated using (abe_is_staff());
revoke all on program_plan_items from anon;

-- public: rounded totals + funding routes per program, nothing else
create or replace function program_plan_summary(p_year int default 2027)
returns table (program_key text, est_total numeric, sources text[])
language sql stable security definer set search_path = public as $$
  select program_key,
         round(sum(est_cost) / 50) * 50,
         array_agg(distinct funding_source order by funding_source)
  from program_plan_items
  where plan_year = p_year
  group by program_key;
$$;
revoke all on function program_plan_summary(int) from public;
grant execute on function program_plan_summary(int) to anon, authenticated;

-- ── line items ───────────────────────────────────────────────────────────────
-- Deliberately NOT in this file: the starting estimates were inserted once on
-- production (Nov 2026) and are maintained in Dashboard → 2027 Plan. This repo
-- is public; the line-item budget is board-only.

select 'program plan ready' as result;
