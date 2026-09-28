-- ============================================================================
-- Deleting festival data.
--
-- The first cut of create_festival.sql could add, read and update, but nothing
-- could ever be DELETED:
--
--   · festival_passes had no delete policy at all, so an attendee's
--     registration could not be removed by the admin OR by the attendee. RLS
--     denies anything it has no policy for.
--   · festival_shops had a delete policy, but no screen ever called it — the
--     bin icon on the admin page only drops the shop out of the local list,
--     and publishing then marks it 'released'. The row, with the contact name
--     and email on it, stayed in the table for good.
--
-- That is a problem for testing (you cannot clear what you made) and a bigger
-- one for real people: a family who asks to be forgotten has to be forgettable.
--
-- Safe to run more than once. It only adds policies; it deletes nothing.
-- Paste into the Supabase SQL editor and press Run.
-- ============================================================================

-- ── an attendee may delete their own registration ───────────────────────────
-- Their punches and their failed-code attempts go with it: both tables are
-- "references festival_passes(id) on delete cascade", so one delete is enough.
drop policy if exists festival_passes_delete_own on festival_passes;
create policy festival_passes_delete_own on festival_passes for delete to authenticated
  using (user_id = auth.uid());

-- ── and the admin may delete anybody's ──────────────────────────────────────
drop policy if exists festival_passes_delete_admin on festival_passes;
create policy festival_passes_delete_admin on festival_passes for delete to authenticated
  using (festival_is_admin());

-- ── an attendee may see their own failed attempts cleared with the pass ─────
-- (cascade handles the rows; this is only so the admin can audit and clear.)
alter table festival_punch_tries enable row level security;
drop policy if exists festival_punch_tries_admin on festival_punch_tries;
create policy festival_punch_tries_admin on festival_punch_tries for select to authenticated
  using (festival_is_admin());
drop policy if exists festival_punch_tries_admin_delete on festival_punch_tries;
create policy festival_punch_tries_admin_delete on festival_punch_tries for delete to authenticated
  using (festival_is_admin());

-- ── who can delete what, after this runs ────────────────────────────────────
--   festival_passes       attendee (own) + admin        punches cascade away
--   festival_punches      admin                          (or via the pass)
--   festival_shops        admin                          punches cascade away
--   festival_settings     nobody — there is one row and it is meant to stay
select 'festival delete policies installed' as result;
