-- ============================================================================
-- Circle of Friends: publish children the way schools do. Safe to re-run.
--
-- Families gave permission to publish, but full name + school + grade +
-- teacher (+ photo) together tell a stranger exactly where a child is every
-- school day. The public now sees "First L.", school and grade — no teacher —
-- through circle_of_friends_public, and that is all anyone can download.
-- The full record stays in the table, readable only by staff.
-- ============================================================================

create or replace view circle_of_friends_public
with (security_invoker = off) as
  select id,
         case when array_length(regexp_split_to_array(btrim(name), '\s+'), 1) > 1
              then split_part(btrim(name), ' ', 1) || ' ' ||
                   upper(left((regexp_split_to_array(btrim(name), '\s+'))[array_length(regexp_split_to_array(btrim(name), '\s+'), 1)], 1)) || '.'
              else btrim(name) end as name,
         grade, school, category, content, media, priority, created_at
  from circle_of_friends;
grant select on circle_of_friends_public to anon, authenticated;

drop policy if exists "Enable read access for all users" on circle_of_friends;
drop policy if exists circle_of_friends_staff_read on circle_of_friends;
create policy circle_of_friends_staff_read on circle_of_friends for select to authenticated
  using (abe_is_staff());

select 'circle of friends private' as result;
