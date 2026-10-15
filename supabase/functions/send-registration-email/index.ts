import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Every email the site sends: event registrations, volunteer applications and
 * Inclusion Festival shops.
 *
 * WHY THE CALLER ONLY SENDS AN ID
 * This function is reachable with the public anon key. The first version took
 * the recipient, the name and the event title from the request body, so anyone
 * could send a branded "Aaria's Blue Elephant" email, with text of their
 * choosing, to any address. Now the caller says only WHICH record changed:
 *   { type: 'REGISTRATION_APPROVED', id: '<row id>' }
 * The recipient and every word of the email come from the database, the
 * record's status must actually match the type, and notification_log makes
 * each (type, id) send at most once. Calling it again, or for someone else's
 * record, can at worst send the one email that person was due anyway.
 *
 * Needs supabase/create_notifications.sql (the notification_log table).
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'hello@aariasblueelephant.org';
const SITE = 'https://aariasblueelephant.org';
const FROM = "Aaria's Blue Elephant <hello@aariasblueelephant.org>";

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** everything that came from a form is escaped before it goes into HTML */
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const fmtDate = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z');
  return isNaN(+d) ? String(iso)
    : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};

const shell = (inner: string) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${SITE}/logo.webp" alt="Aaria's Blue Elephant" style="width: 120px; height: auto;" />
    </div>
    ${inner}
    <p style="font-size: 12px; color: #a0aec0; text-align: center; margin-top: 32px;">
      Aaria's Blue Elephant · <a href="${SITE}" style="color: #a0aec0;">aariasblueelephant.org</a>
    </p>
  </div>`;

const button = (href: string, label: string, color = '#00AEEF') =>
  `<div style="text-align: center; margin: 24px 0;"><a href="${href}" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">${label}</a></div>`;

async function send(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  // read the body once: calling res.text() after a failed res.json() threw
  // "Body already consumed" and hid Resend's real answer
  const text = await res.text().catch(() => '');
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 500) }; }
  console.log(`Resend [${res.status}] ${subject} -> ${to}:`, JSON.stringify(data));
  return { ok: res.status < 400, status: res.status, data };
}

/**
 * Claim the (kind, ref) slot, send, and give the slot back if the send failed
 * so a retry can go through. Returns 'duplicate' when it was already sent.
 */
async function sendOnce(kind: string, ref: string, to: string, subject: string, html: string) {
  const claim = await sb.from('notification_log').insert({ kind, ref, sent_to: to });
  if (claim.error) {
    if (claim.error.code === '23505') return { ok: true, duplicate: true };
    throw new Error('notification_log: ' + claim.error.message);
  }
  const r = await send(to, subject, html);
  if (!r.ok) await sb.from('notification_log').delete().eq('kind', kind).eq('ref', ref);
  return { ok: r.ok, status: r.status, data: r.data };
}

/* ───────────────────────────────────────────────── event registrations ── */

async function registration(id: string, approved: boolean) {
  const { data: reg } = await sb.from('event_registrations').select('*').eq('id', id).maybeSingle();
  if (!reg || !reg.user_email) return json({ error: 'not_found' }, 404);
  if (approved && reg.status !== 'Approved') return json({ error: 'not_approved' }, 409);

  const { data: evt } = await sb.from('events').select('title, date, time, location').eq('id', reg.event_id).maybeSingle();
  const title = esc(evt?.title || 'our upcoming event');
  const when = [fmtDate(evt?.date), evt?.time].filter(Boolean).map(esc).join(' · ');
  const where = esc(evt?.location || '');
  const details = (when || where) ? `
    <div style="background-color: #f7fafc; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
      ${when ? `<p style="margin: 4px 0; font-size: 15px; color: #2d3748;"><strong>When:</strong> ${when}</p>` : ''}
      ${where ? `<p style="margin: 4px 0; font-size: 15px; color: #2d3748;"><strong>Where:</strong> ${where}</p>` : ''}
    </div>` : '';
  const name = esc(reg.user_name || 'Friend');

  if (approved) {
    const r = await sendOnce('reg_approved', id, reg.user_email, `You're confirmed: ${evt?.title || 'your registration'} 🎉`, shell(`
      <h1 style="color: #48BB78; text-align: center;">You're confirmed!</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
      <p style="font-size: 16px; color: #4a5568;">Great news — your registration for <strong>${title}</strong> is approved. Your spot is confirmed.</p>
      ${details}
      <p style="font-size: 16px; color: #4a5568;">We can't wait to see you there! Reply to this email if anything changes or if there is anything we can do to make the day easier for your family.</p>
      ${button(`${SITE}/dashboard`, 'See my events')}`));
    return json(r, r.ok ? 200 : 502);
  }

  const r = await sendOnce('reg_received', id, reg.user_email, `Registration received: ${evt?.title || 'your event'}`, shell(`
    <h1 style="color: #00AEEF; text-align: center;">Registration received!</h1>
    <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
    <p style="font-size: 16px; color: #4a5568;">Thank you for registering for <strong>${title}</strong>. We've got your request and our team is making sure everything is ready for your family.</p>
    ${details}
    <p style="font-size: 16px; color: #4a5568;">You'll get another email as soon as your registration is approved.</p>`));
  await sendOnce('reg_received_admin', id, ADMIN_EMAIL, `New registration: ${reg.user_name || reg.user_email} – ${evt?.title || 'event'}`, shell(`
    <h1 style="color: #00AEEF; font-size: 20px;">New event registration</h1>
    <p><strong>Who:</strong> ${name} (${esc(reg.user_email)})</p>
    <p><strong>Event:</strong> ${title}</p>
    <p><strong>Accommodations:</strong> ${reg.special_needs ? 'Yes' : 'No'}</p>
    ${button(`${SITE}/dashboard?view=manage-registrations`, 'Review in dashboard')}`));
  return json(r, r.ok ? 200 : 502);
}

/* ───────────────────────────────────────────────────────── volunteers ── */

async function volunteer(id: string, approved: boolean) {
  const { data: app } = await sb.from('volunteer_applications').select('*').eq('id', id).maybeSingle();
  if (!app || !app.email) return json({ error: 'not_found' }, 404);
  if (approved && app.status !== 'Approved') return json({ error: 'not_approved' }, 409);
  const name = esc(app.name || 'Friend');

  if (approved) {
    const r = await sendOnce('vol_approved', id, app.email, 'Welcome to the team! 🎉', shell(`
      <h1 style="color: #48BB78; text-align: center;">Welcome to the team!</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
      <p style="font-size: 16px; color: #4a5568;">Your volunteer application has been approved! We are so excited to have you join our community. We'll be in touch about upcoming events where you can help.</p>`));
    return json(r, r.ok ? 200 : 502);
  }

  const r = await sendOnce('vol_received', id, app.email, 'Volunteer application received', shell(`
    <h1 style="color: #00AEEF; text-align: center;">Application received!</h1>
    <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
    <p style="font-size: 16px; color: #4a5568;">Thank you for your interest in volunteering with Aaria's Blue Elephant! Our board will review your application and get back to you soon.</p>`));
  await sendOnce('vol_received_admin', id, ADMIN_EMAIL, `New volunteer application: ${app.name || app.email}`, shell(`
    <h1 style="color: #00AEEF; font-size: 20px;">New volunteer application</h1>
    <p><strong>Who:</strong> ${name} (${esc(app.email)})</p>
    <p><strong>Interest:</strong> ${esc(app.interest || '—')}</p>
    ${button(`${SITE}/dashboard?view=volunteers`, 'Review in dashboard')}`));
  return json(r, r.ok ? 200 : 502);
}

/* ────────────────────────────────────────────── Inclusion Festival shops ── */

async function festivalShop(id: string, approved: boolean) {
  const { data: shop } = await sb.from('festival_shops').select('*').eq('id', id).maybeSingle();
  if (!shop || !shop.contact_email || !shop.contact_email.includes('@')) return json({ error: 'not_found' }, 404);
  const { data: fs } = await sb.from('festival_settings').select('*').eq('id', 1).maybeSingle();
  const name = esc(shop.contact_name || 'there');
  const shopName = esc(shop.name);
  const offer = esc(shop.offer_en);
  const runs = `${fmtDate(shop.redeem_from)} – ${fmtDate(shop.redeem_to)}`;

  if (approved) {
    if (shop.status !== 'approved') return json({ error: 'not_approved' }, 409);
    // added by hand in the dashboard: no Google account to sign in with, so a
    // "print your sign" email would point at a page they cannot open
    if (!shop.owner_id) return json({ error: 'no_owner' }, 409);
    const r = await sendOnce('shop_approved', id, shop.contact_email, `${shop.name} is on the Inclusion Festival card! 🎉`, shell(`
      <h1 style="color: #48BB78; text-align: center;">You're on the card!</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
      <p style="font-size: 16px; color: #4a5568;"><strong>${shopName}</strong> is approved for the Inclusion Festival. Thank you for welcoming festival families!</p>
      <div style="background-color: #f0fff4; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5;">
        <p style="margin: 4px 0; font-size: 15px; color: #276749;"><strong>Your offer:</strong> ${offer}</p>
        <p style="margin: 4px 0; font-size: 15px; color: #276749;"><strong>Runs:</strong> ${esc(runs)}</p>
      </div>
      <h2 style="font-size: 18px; color: #2d3748;">One thing to do: print your QR sign</h2>
      <p style="font-size: 15px; color: #4a5568;">Sign in with this Google account, print your sign and put it by the register. That's it.</p>
      ${button(`${SITE}/InclusionFestival/myshop`, 'Print my QR sign')}
      <h2 style="font-size: 18px; color: #2d3748;">How a family redeems</h2>
      <ol style="font-size: 15px; color: #4a5568; line-height: 1.6;">
        <li>They scan your sign with their phone camera and tap <strong>Redeem</strong>.</li>
        <li>Their phone shows a big green <strong>REDEEMED</strong> screen with your shop name and a live clock.</li>
        <li>You give the offer. A grey "Already used" screen means it was used before.</li>
      </ol>
      <p style="font-size: 15px; color: #4a5568;">Your shop page also shows how many families have redeemed so far. Questions? Just reply to this email.</p>`));
    return json(r, r.ok ? 200 : 502);
  }

  if (shop.status !== 'pending' && shop.status !== 'waitlist') return json({ error: 'not_pending' }, 409);
  const waitlisted = shop.status === 'waitlist';
  const r = await sendOnce('shop_received', id, shop.contact_email, `We got your sign-up: ${shop.name}`, shell(`
    <h1 style="color: #00AEEF; text-align: center;">Thanks for signing up!</h1>
    <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
    <p style="font-size: 16px; color: #4a5568;">We've received <strong>${shopName}</strong>'s sign-up for the Inclusion Festival${fs?.festival_date ? ` (${esc(fmtDate(fs.festival_date))})` : ''}.</p>
    <p style="font-size: 16px; color: #4a5568;">${waitlisted
      ? "Every spot is taken right now, so you're on the waiting list. We'll email you the moment one opens up."
      : "We'll review your offer and email you within 48 hours. Once you're approved, you'll print your QR sign from your shop page."}</p>
    ${button(`${SITE}/InclusionFestival/myshop`, 'My shop page')}`));
  await sendOnce('shop_received_admin', id, ADMIN_EMAIL, `New festival shop: ${shop.name}${waitlisted ? ' (waiting list)' : ''}`, shell(`
    <h1 style="color: #00AEEF; font-size: 20px;">New Inclusion Festival shop</h1>
    <p><strong>Shop:</strong> ${shopName}</p>
    <p><strong>Offer:</strong> ${offer}</p>
    <p><strong>Contact:</strong> ${name} · ${esc(shop.contact_email)}${shop.contact_phone ? ' · ' + esc(shop.contact_phone) : ''}</p>
    <p><strong>Pledge:</strong> ${shop.pledge_pct ? esc(shop.pledge_pct) + '%' : 'none'}</p>
    ${button(`${SITE}/dashboard?view=festival`, 'Approve in dashboard')}`));
  return json(r, r.ok ? 200 : 502);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const type = String(body?.type || '');
    const id = String(body?.id || body?.record?.id || '');
    if (!id) return json({ error: 'missing_id' }, 400);

    switch (type) {
      case 'INSERT':
      case 'REGISTRATION_RECEIVED': return await registration(id, false);
      case 'REGISTRATION_APPROVED': return await registration(id, true);
      case 'VOLUNTEER_RECEIVED':    return await volunteer(id, false);
      case 'VOLUNTEER_APPROVED':    return await volunteer(id, true);
      case 'SHOP_RECEIVED':         return await festivalShop(id, false);
      case 'SHOP_APPROVED':         return await festivalShop(id, true);
      default:                      return json({ error: 'unsupported_type' }, 400);
    }
  } catch (error: any) {
    console.error(error);
    return json({ error: error.message }, 500);
  }
});
