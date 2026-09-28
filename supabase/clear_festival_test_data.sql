-- ============================================================================
-- Clear festival TEST data.
--
-- This is the one to run after a test run. It empties data and leaves the
-- tables, views, functions and policies exactly where they are — unlike
-- reset_festival.sql, which drops the whole schema and makes you run
-- create_festival.sql again.
--
-- Every section is commented out. Uncomment the one you want and press Run.
-- Nothing here touches anything outside the festival_* tables.
-- ============================================================================


-- ── 1 · attendee registrations only ─────────────────────────────────────────
-- Punch cards, their stamps and their failed code attempts. Shops, offers and
-- punch codes are left alone, so the card is still standing and ready.
-- This is the usual one between test runs.

-- delete from festival_passes;
--   -- festival_punches and festival_punch_tries cascade with the pass


-- ── 2 · stamps only, keeping the registrations ──────────────────────────────
-- Useful when you want the same test accounts to punch the same shops again.

-- delete from festival_punches;
-- delete from festival_punch_tries;


-- ── 3 · one person, by the code on their card ───────────────────────────────
-- What to run when a family asks to be removed. Their stamps go with them.

-- delete from festival_passes where short_code = 'ABC123';


-- ── 4 · the simulated shops ─────────────────────────────────────────────────
-- The nine worked examples seeded for testing. Deleting a shop cascades to any
-- punch that was made against it. Real shops are untouched.
-- Remember to drop "simulated": true from data/festival.json too, or the next
-- Publish puts them straight back.

-- delete from festival_shops where id in (
--   'spice-route', 'bean-and-bloom', 'altamont-fitness', 'bright-smiles',
--   'sunrise-tutoring', 'sweet-tooth', 'golden-crust', 'wildflower',
--   'little-picassos'
-- );


-- ── 5 · close the festival again ────────────────────────────────────────────
-- Puts the front page back to "Registration opens soon". Does not delete
-- anything. Set data/festival.json state back to "recruiting" as well, or the
-- landing page and the card will disagree.

-- update festival_settings set state = 'recruiting' where id = 1;


-- ── 6 · back to a clean slate, keeping the schema ───────────────────────────
-- Everything above at once. The tables survive; only the rows go.

-- delete from festival_passes;
-- delete from festival_punches;
-- delete from festival_punch_tries;
-- delete from festival_shops;
-- update festival_settings set state = 'recruiting' where id = 1;


-- ── what is in there right now ──────────────────────────────────────────────
-- Safe to run on its own: it only counts.
select
  (select count(*) from festival_passes)       as registrations,
  (select count(*) from festival_punches)      as stamps,
  (select count(*) from festival_punch_tries)  as failed_code_tries,
  (select count(*) from festival_shops)        as shops,
  (select state from festival_settings where id = 1) as stage;
