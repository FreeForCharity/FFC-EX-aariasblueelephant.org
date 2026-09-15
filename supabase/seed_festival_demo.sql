-- ============================================================================
-- Seed the nine demo shops and open the festival, so the whole thing can be
-- walked end to end as a real attendee and a real shop.
--
-- Safe to re-run: it upserts by id and leaves any punches alone.
-- When you are done testing, run the two lines at the bottom to close it again.
-- ============================================================================

insert into festival_shops
  (id, name, category, emoji, offer_en, offer_es, detail_en, detail_es,
   address, website, contact_name, contact_email, pledge_pct, punch_code,
   redeem_from, redeem_to, spot, status)
values
  ('spice-route', 'Spice Route Biryani', 'restaurant', null, 'Two biryanis for the price of one', 'Dos biryanis por el precio de uno', 'Dine-in only. One per family, please.', 'Solo para comer aquí. Uno por familia, por favor.', 'Main St, Mountain House', null, 'Demo contact', 'demo@example.com', 20, '2086', '2026-11-01', '2026-11-30', 1, 'approved'),
  ('bean-and-bloom', 'Bean & Bloom Café', 'cafe', null, 'Free drink with any pastry', 'Bebida gratis con cualquier pan dulce', null, null, 'Central Pkwy, Mountain House', null, 'Demo contact', 'demo@example.com', 20, '7179', '2026-11-01', '2026-11-30', 2, 'approved'),
  ('altamont-fitness', 'Altamont Fitness', 'gym', null, '30 days free with an annual membership', '30 días gratis con la membresía anual', 'New members only. Redeem any time in November.', 'Solo miembros nuevos. Canjea cuando quieras en noviembre.', 'Grant Line Rd, Mountain House', null, 'Demo contact', 'demo@example.com', 15, '3611', '2026-11-01', '2026-11-30', 3, 'approved'),
  ('bright-smiles', 'Bright Smiles Dental', 'dental', null, 'Free first cleaning for new patients', 'Primera limpieza gratis para pacientes nuevos', null, null, 'Mountain House Blvd', null, 'Demo contact', 'demo@example.com', 20, '2992', '2026-11-01', '2026-11-30', 4, 'approved'),
  ('sunrise-tutoring', 'Sunrise Tutoring', 'tutoring', null, 'First month half price', 'Primer mes a mitad de precio', null, null, 'Wicklund Ave', null, 'Demo contact', 'demo@example.com', 10, '7793', '2026-11-01', '2026-11-30', 5, 'approved'),
  ('sweet-tooth', 'The Sweet Tooth', 'bakery', null, 'Free cookie with any purchase', 'Galleta gratis con cualquier compra', null, null, 'Central Pkwy', null, 'Demo contact', 'demo@example.com', 20, '1732', '2026-11-01', '2026-11-30', 6, 'approved'),
  ('golden-crust', 'Golden Crust Pizza', 'restaurant', null, 'Free garlic bread with any large pizza', 'Pan de ajo gratis con cualquier pizza grande', null, null, 'Main St', null, 'Demo contact', 'demo@example.com', 20, '4325', '2026-11-01', '2026-11-30', 7, 'approved'),
  ('wildflower', 'Wildflower Florist', 'florist', null, '20% off any bouquet', '20% de descuento en cualquier ramo', null, null, 'Mountain House Blvd', null, 'Demo contact', 'demo@example.com', 20, '7639', '2026-11-01', '2026-11-30', 8, 'approved'),
  ('little-picassos', 'Little Picassos Art Studio', 'kids', null, 'One free trial class', 'Una clase de prueba gratis', 'Ages 4–12. Booking required.', 'De 4 a 12 años. Se requiere reserva.', 'Wicklund Ave', null, 'Demo contact', 'demo@example.com', 20, '9452', '2026-11-01', '2026-11-30', 9, 'approved')
on conflict (id) do update set
  name = excluded.name, category = excluded.category,
  offer_en = excluded.offer_en, offer_es = excluded.offer_es,
  detail_en = excluded.detail_en, detail_es = excluded.detail_es,
  address = excluded.address, pledge_pct = excluded.pledge_pct,
  redeem_from = excluded.redeem_from, redeem_to = excluded.redeem_to,
  spot = excluded.spot, status = excluded.status;

-- offers must be redeemable today, not only in November, or every punch during
-- testing is refused with "that offer is not running today"
update festival_shops
   set redeem_from = least(redeem_from, current_date),
       redeem_to   = greatest(redeem_to, current_date);

-- open it
update festival_settings set state = 'live' where id = 1;

-- the codes, and each shop's till screen
select name, punch_code,
       'https://aariasblueelephant.org/InclusionFestival/shop#' || console_token as till_screen
  from festival_shops where status = 'approved' order by spot;

-- ── when testing is finished ────────────────────────────────────────────────
-- update festival_settings set state = 'recruiting' where id = 1;
-- delete from festival_punches; delete from festival_passes;
