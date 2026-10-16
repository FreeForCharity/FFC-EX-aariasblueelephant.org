-- ============================================================================
-- Close the personal-data leaks found on 2026-10-16. Safe to re-run.
--
-- With only the public anon key (it is in every page), anyone could read:
--   * profiles      — every sign-up's name and email (110 people)
--   * testimonials  — story authors' emails and account ids
--   * students / sub_coaches — open to the public, empty for now
-- Each now shows a person only their own row; staff (the organisation's
-- domain, abe_is_staff) see everything they manage.
-- ============================================================================

-- ── sign-ups ────────────────────────────────────────────────────────────────
drop policy if exists "Public profiles are viewable by everyone." on profiles;
drop policy if exists profiles_read_own_or_staff on profiles;
create policy profiles_read_own_or_staff on profiles for select to authenticated
  using (id = auth.uid() or abe_is_staff());

-- the "N members" figure, without handing out the list
create or replace function abe_member_count() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from profiles;
$$;
revoke all on function abe_member_count() from public;
grant execute on function abe_member_count() to anon, authenticated;

-- ── stories ────────────────────────────────────────────────────────────────
-- the public reads published stories through a view with no email or account id
create or replace view testimonials_public
with (security_invoker = off) as
  select id, author, role, title, content, date, avatar, status, rating, rank, media, created_at
  from testimonials
  where status = 'Approved';
grant select on testimonials_public to anon, authenticated;

drop policy if exists "Allow public read access on testimonials" on testimonials;
drop policy if exists testimonials_read_own_or_staff on testimonials;
create policy testimonials_read_own_or_staff on testimonials for select to authenticated
  using (user_id = auth.uid()
         or lower(coalesce(author_email, '')) = lower(coalesce(auth.jwt() ->> 'email', '-'))
         or abe_is_staff());

-- ── coaching tables (children's names live in students) ───────────────────
drop policy if exists "Allow public read access to students" on students;
drop policy if exists "Allow public read access to sub_coaches" on sub_coaches;

select 'personal data closed' as result;
