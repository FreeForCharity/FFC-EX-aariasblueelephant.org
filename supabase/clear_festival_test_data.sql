-- ============================================================================
-- Clear festival TEST data.
--
-- Empties rows and leaves the tables, views, functions and policies where they
-- are — unlike reset_festival.sql, which drops the whole schema.
--
-- Every section is commented out. Uncomment the one you want and press Run.
-- Nothing here touches anything outside the festival_* tables.
-- ============================================================================


-- ── 1 · redemptions only ────────────────────────────────────────────────────
-- Every "used" offer goes; cards and shops stay. Redemptions are keyed on the
-- Google account, so deleting cards alone does NOT free an offer — this does.

-- delete from festival_punches;


-- ── 2 · one family, by the code on their card ───────────────────────────────
-- What to run when a family asks to be removed. Their redemptions go too.

-- delete from festival_punches where user_id = (select user_id from festival_passes where short_code = 'ABC123');
-- delete from festival_passes where short_code = 'ABC123';


-- ── 3 · every family card and redemption ────────────────────────────────────

-- delete from festival_punches;
-- delete from festival_passes;


-- ── 4 · one shop ────────────────────────────────────────────────────────────
-- Its redemptions cascade with it, and its QR sign stops working.

-- delete from festival_shops where id = 'shop-id-here';


-- ── 5 · back to a clean slate, keeping the schema ───────────────────────────

-- delete from festival_punches;
-- delete from festival_passes;
-- delete from festival_shops;
-- update festival_settings set state = 'recruiting' where id = 1;


-- ── what is in there right now ──────────────────────────────────────────────
-- Safe to run on its own: it only counts.
select
  (select count(*) from festival_passes)  as family_cards,
  (select count(*) from festival_punches) as redemptions,
  (select count(*) from festival_shops)   as shops,
  (select state from festival_settings where id = 1) as stage;
