-- ============================================================================
-- Reset the festival tables.
--
-- Drops every festival_* table, view and function — including the ones from
-- the first, punch-code version — so create_festival.sql can be run fresh.
-- It touches nothing else in the database (the festival-logos bucket and its
-- files are left alone).
--
-- DO NOT run this once real redemptions exist — it deletes them.
-- ============================================================================

drop view   if exists festival_report_daily  cascade;
drop view   if exists festival_report_shops  cascade;
drop view   if exists festival_pledges       cascade;
drop view   if exists festival_shop_stats    cascade;
drop view   if exists festival_spot_counts   cascade;
drop view   if exists festival_shops_public  cascade;

drop function if exists festival_punch(uuid, text, text, numeric) cascade;
drop function if exists festival_punch(uuid, text, text)          cascade;
drop function if exists festival_set_sale(uuid, uuid, numeric)    cascade;
drop function if exists festival_set_sale(uuid, text, numeric)    cascade;
drop function if exists festival_shop_console(text)               cascade;
drop function if exists festival_redeem(text)                     cascade;
drop function if exists festival_shop_by_token(text)              cascade;
drop function if exists festival_my_shop()                        cascade;
drop function if exists festival_shop_apply(jsonb)                cascade;
drop function if exists festival_shop_signup(jsonb)               cascade;
drop function if exists festival_shop_confirm(text)               cascade;
drop function if exists festival_shop_by_manage(text)             cascade;
drop function if exists festival_shop_update_by_manage(text, jsonb) cascade;
drop function if exists festival_shop_view(festival_shops)        cascade;
drop function if exists festival_shop_fields(jsonb)               cascade;
drop function if exists festival_my_pass(text, int)               cascade;
drop function if exists festival_set_optin(boolean)               cascade;
drop function if exists festival_ensure_pass(text, int, text)     cascade;
drop function if exists festival_short_code()                     cascade;
drop function if exists festival_online_code(text)                cascade;
drop function if exists festival_mark_code(text, text, boolean)   cascade;
drop function if exists festival_code_text()                      cascade;

drop table if exists festival_punch_tries cascade;
drop table if exists festival_punches     cascade;
drop table if exists festival_passes      cascade;
drop table if exists festival_settings    cascade;
drop table if exists festival_shops       cascade;

drop function if exists festival_today()                          cascade;
drop function if exists festival_is_admin()                       cascade;
