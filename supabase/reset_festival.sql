-- ============================================================================
-- Reset the festival tables.
--
-- Run this ONLY if you ran an earlier version of create_festival.sql and the
-- tables are still empty. The first version declared festival_shops.id as a
-- uuid, but the shop id is the slug from data/festival.json ("spice-route"),
-- so Publish would have failed with an invalid-uuid error.
--
-- This throws away every festival table. It touches nothing else in the
-- database. After running it, run create_festival.sql again.
--
-- DO NOT run this once real punches exist — it deletes them.
-- ============================================================================

drop view   if exists festival_pledges       cascade;
drop view   if exists festival_shop_stats    cascade;
drop view   if exists festival_spot_counts   cascade;
drop view   if exists festival_shops_public  cascade;

drop function if exists festival_punch(uuid, text, text, numeric) cascade;
drop function if exists festival_punch(uuid, text, text)          cascade;
drop function if exists festival_set_sale(uuid, uuid, numeric)    cascade;
drop function if exists festival_set_sale(uuid, text, numeric)    cascade;
drop function if exists festival_shop_console(text)               cascade;
drop function if exists festival_is_admin()                       cascade;

drop table if exists festival_punch_tries cascade;
drop table if exists festival_punches     cascade;
drop table if exists festival_passes      cascade;
drop table if exists festival_settings    cascade;
drop table if exists festival_shops       cascade;
