import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Every email the site sends: event registrations, volunteer applications and
 * Inclusion Festival shops. (SHOP_LINK is the one exception to "only an id":
 * it takes an email address, and only ever writes to that address's own shop.)
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

/**
 * The ask, twice, in two looks — so it is seen whether someone reads the top
 * of the email or scrolls to the end.
 *   donateTop     warm amber, one line and a button, right under the headline
 *   donateBottom  deep blue, why a gift matters, at the end
 * Every figure here is ours and public: keep them true when they change.
 * The query string rides through /give to Zeffy, so each email is countable.
 */
const giveUrl = (campaign: string, spot: string) =>
  `${SITE}/give?utm_source=email&utm_campaign=${campaign}&utm_content=${spot}`;

const donateTop = (campaign: string) => `
  <div style="background-color: #FFFBEB; border: 2px solid #FCD34D; border-radius: 12px; padding: 16px 20px; margin: 8px 0 24px; text-align: center;">
    <p style="font-size: 16px; color: #92400E; margin: 0 0 12px;"><strong>💛 This is free for your family because neighbors give.</strong></p>
    <a href="${giveUrl(campaign, 'top')}" style="display: inline-block; background-color: #F59E0B; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Donate to the cause</a>
  </div>`;

const donateBottom = (campaign: string) => `
  <div style="background-color: #0C4A6E; border-radius: 14px; padding: 26px 24px; margin: 32px 0 8px; text-align: center; color: #ffffff;">
    <p style="font-size: 20px; margin: 0 0 8px; color: #ffffff;"><strong>💙 Help keep it free for every family</strong></p>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #E0F2FE;">
      Aaria's Blue Elephant is run by families who know what it's like to look for a place where every child belongs.
      Every playgroup, festival and resource fair we host is free — so no family ever has to ask whether they can afford to come.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 18px; text-align: left;">
      <tr><td style="padding: 4px 8px; font-size: 15px; color: #ffffff;">✨ <strong>100+</strong> lives touched</td></tr>
      <tr><td style="padding: 4px 8px; font-size: 15px; color: #ffffff;">🎉 <strong>32+</strong> free events, and more on the way</td></tr>
      <tr><td style="padding: 4px 8px; font-size: 15px; color: #ffffff;">🧾 <strong>Tax-deductible</strong> — we are a 501(c)(3), EIN 39-4799956</td></tr>
    </table>
    <p style="font-size: 15px; margin: 0 0 18px; color: #E0F2FE;">A gift of any size goes straight into the next event a family like yours walks into.</p>
    <a href="${giveUrl(campaign, 'bottom')}" style="display: inline-block; background-color: #ffffff; color: #0C4A6E; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 17px;">Give today</a>
  </div>`;

/** a shop's private page: no password, the link is the key */
// the key sits after '#', which is never sent to a server, analytics or another site
const shopLink = (manage: string, confirm?: string) =>
  `${SITE}/InclusionFestival/myshop#k=${encodeURIComponent(manage)}${confirm ? `&confirm=${encodeURIComponent(confirm)}` : ''}`;

/** "at most one of these every ten minutes" — for emails a person may ask for again */
const tenMinuteSlot = () => String(Math.floor(Date.now() / 600_000));

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
      ${donateTop('registration_approved')}
      <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
      <p style="font-size: 16px; color: #4a5568;">Great news — your registration for <strong>${title}</strong> is approved. Your spot is confirmed.</p>
      ${details}
      <p style="font-size: 16px; color: #4a5568;">We can't wait to see you there! Reply to this email if anything changes or if there is anything we can do to make the day easier for your family.</p>
      ${button(`${SITE}/dashboard`, 'See my events')}
      ${donateBottom('registration_approved')}`));
    return json(r, r.ok ? 200 : 502);
  }

  const r = await sendOnce('reg_received', id, reg.user_email, `Registration received: ${evt?.title || 'your event'}`, shell(`
    <h1 style="color: #00AEEF; text-align: center;">Registration received!</h1>
    ${donateTop('registration_received')}
    <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
    <p style="font-size: 16px; color: #4a5568;">Thank you for registering for <strong>${title}</strong>. We've got your request and our team is making sure everything is ready for your family.</p>
    ${details}
    <p style="font-size: 16px; color: #4a5568;">You'll get another email as soon as your registration is approved.</p>
    ${button(`${SITE}/dashboard`, 'See my events')}
    ${donateBottom('registration_received')}`));
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

async function festivalShop(id: string, kind: 'confirm' | 'received' | 'approved') {
  const { data: shop } = await sb.from('festival_shops').select('*').eq('id', id).maybeSingle();
  if (!shop || !shop.contact_email || !shop.contact_email.includes('@')) return json({ error: 'not_found' }, 404);
  const { data: fs } = await sb.from('festival_settings').select('*').eq('id', 1).maybeSingle();
  const name = esc(shop.contact_name || 'there');
  const shopName = esc(shop.name);
  const offer = esc(shop.offer_en);
  const runs = `${fmtDate(shop.redeem_from)} – ${fmtDate(shop.redeem_to)}`;
  // a kid's business, signed up by a parent: featured in its own section, no spot
  const young = shop.young_founder === true;
  const video = shop.video_id ? `https://youtu.be/${esc(shop.video_id)}` : '';

  // 1 · "confirm your sign-up" — the only way a sign-up reaches the admin
  if (kind === 'confirm') {
    if (shop.status !== 'unconfirmed' || !shop.confirm_token) return json({ error: 'not_unconfirmed' }, 409);
    const r = await sendOnce('shop_confirm', `${id}:${tenMinuteSlot()}`, shop.contact_email, `Confirm your Inclusion Festival sign-up: ${shop.name}`, shell(`
      <h1 style="color: #00AEEF; text-align: center;">One click to confirm</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
      <p style="font-size: 16px; color: #4a5568;">Thanks for signing up <strong>${shopName}</strong> for the Inclusion Festival${fs?.festival_date ? ` (${esc(fmtDate(fs.festival_date))})` : ''}. Please confirm this is your email:</p>
      ${button(shopLink(shop.manage_token, shop.confirm_token), 'Confirm my sign-up')}
      <p style="font-size: 14px; color: #718096;">That button also opens your shop page — keep this email. No password needed: the link is your key. If you didn't sign up, just ignore this email.</p>`));
    return json(r, r.ok ? 200 : 502);
  }

  // 2 · confirmed — tell the admin there is one to review
  if (kind === 'received') {
    if ((shop.status !== 'pending' && shop.status !== 'waitlist') || !shop.email_confirmed_at) return json({ error: 'not_pending' }, 409);
    const waitlisted = shop.status === 'waitlist';
    const r = await sendOnce('shop_received_admin', id, ADMIN_EMAIL, `New festival ${young ? 'Young Founder' : 'shop'}: ${shop.name}${waitlisted ? ' (waiting list)' : ''}`, shell(`
      <h1 style="color: #00AEEF; font-size: 20px;">New Inclusion Festival ${young ? 'Young Founder 🌟' : 'shop'}</h1>
      <p><strong>${young ? 'Business' : 'Shop'}:</strong> ${shopName}</p>
      ${young ? `<p><strong>Young Founder</strong> — run by a kid, signed up by a parent or guardian (consent given). No spot used.</p>` : ''}
      ${video ? `<p><strong>Video:</strong> <a href="${video}">${video}</a> — please watch it before approving.</p>` : ''}
      <p><strong>Offer:</strong> ${offer}</p>
      ${shop.detail_en ? `<p><strong>Conditions:</strong> ${esc(shop.detail_en)}</p>` : ''}
      ${shop.address ? `<p><strong>Address:</strong> ${esc(shop.address)}</p>` : ''}
      <p><strong>Where:</strong> ${[shop.instore !== false ? 'In store' : '', shop.online ? 'Online' + (shop.online_link ? ` (${esc(shop.online_link)})` : '') : ''].filter(Boolean).join(' + ')}</p>
      <p><strong>${young ? 'Parent / guardian' : 'Contact'}:</strong> ${name} · ${esc(shop.contact_email)}${shop.contact_phone ? ' · ' + esc(shop.contact_phone) : ''}</p>
      <p>Email confirmed ✓${waitlisted ? ' · every spot was taken, so they are on the waiting list' : ''}</p>
      ${button(`${SITE}/dashboard?view=festival`, 'Approve in dashboard')}`));
    return json(r, r.ok ? 200 : 502);
  }

  // 3 · approved — their sign is ready
  if (shop.status !== 'approved') return json({ error: 'not_approved' }, 409);
  const r = await sendOnce('shop_approved', id, shop.contact_email, young ? `${shop.name} is featured on our Inclusion Festival page! 🌟` : `${shop.name} is on the Inclusion Festival card! 🎉`, shell(`
    <h1 style="color: #48BB78; text-align: center;">${young ? "You're featured!" : "You're on the card!"}</h1>
    <p style="font-size: 16px; color: #4a5568;">Hi ${name},</p>
    ${young
      ? `<p style="font-size: 16px; color: #4a5568;"><strong>${shopName}</strong> is now featured in the Young Founders section of our Inclusion Festival page${video ? ', video and all' : ''}. Please tell your young founder we're proud of them!</p>
    ${button(`${SITE}/InclusionFestival/youngfounders`, 'See it on our website')}
    <p style="font-size: 15px; color: #4a5568;">${shop.instore !== false ? 'Selling at the farmers market? Print your QR sign (below) for your stall. After that, your' : 'Your'} offer keeps running on our website until ${esc(fmtDate(shop.redeem_to))}, and if you want to stop sooner, just reply to this email and we'll take it down.</p>`
      : `<p style="font-size: 16px; color: #4a5568;"><strong>${shopName}</strong> is approved for the Inclusion Festival. Thank you for welcoming festival families!</p>`}
    <div style="background-color: #f0fff4; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5;">
      <p style="margin: 4px 0; font-size: 15px; color: #276749;"><strong>Your offer:</strong> ${offer}</p>
      <p style="margin: 4px 0; font-size: 15px; color: #276749;"><strong>Runs:</strong> ${esc(runs)}</p>
    </div>
    ${shop.instore !== false ? `
    <h2 style="font-size: 18px; color: #2d3748;">In store: print your QR sign</h2>
    <p style="font-size: 15px; color: #4a5568;">Open your shop page, print your sign and put it by the register. That's it.</p>
    ${button(shopLink(shop.manage_token), 'Print my QR sign')}
    <ol style="font-size: 15px; color: #4a5568; line-height: 1.6;">
      <li>A family scans your sign with their phone camera and taps <strong>Redeem</strong>.</li>
      <li>Their phone shows a big green <strong>REDEEMED</strong> screen with your shop name and a live clock.</li>
      <li>You give the offer. A grey "Already used" screen means it was used before.</li>
    </ol>` : ''}
    ${shop.online ? `
    <h2 style="font-size: 18px; color: #2d3748;">Online: families bring a code</h2>
    <ol style="font-size: 15px; color: #4a5568; line-height: 1.6;">
      <li>A family gets a personal code (like <strong>ABE-7K4M</strong>) for your offer on our festival page.</li>
      <li>They quote it when they book${shop.online_link ? ` at <a href="${esc(shop.online_link)}">${esc(shop.online_link)}</a>` : ''}.</li>
      <li>Find the code on your shop page and tick <strong>Used</strong>. Each code works once.</li>
    </ol>
    ${shop.instore === false ? button(shopLink(shop.manage_token), 'Open my shop page') : ''}` : ''}
    <p style="font-size: 15px; color: #4a5568;">You can change your offer or logo any time from your shop page, and it also shows how many families have redeemed so far. Keep this email — the button above is your key to it. Questions? Just reply.</p>
    ${donateBottom('shop_approved')}`));
  return json(r, r.ok ? 200 : 502);
}

/** a business paused or resumed its own offer — the admin hears which, from the row itself */
async function festivalShopPaused(id: string) {
  const { data: shop } = await sb.from('festival_shops').select('*').eq('id', id).maybeSingle();
  if (!shop || (shop.status !== 'paused' && shop.status !== 'approved')) return json({ error: 'not_found' }, 404);
  const paused = shop.status === 'paused';
  const r = await sendOnce('shop_paused', `${id}:${shop.status}:${tenMinuteSlot()}`, ADMIN_EMAIL,
    `Festival ${shop.young_founder ? 'Young Founder' : 'shop'} ${paused ? 'paused' : 'resumed'}: ${shop.name}`, shell(`
    <h1 style="color: #00AEEF; font-size: 20px;">${paused ? '⏸️ A business paused its offer' : '▶️ A business resumed its offer'}</h1>
    <p><strong>${shop.young_founder ? 'Young Founder' : 'Shop'}:</strong> ${esc(shop.name)}</p>
    <p><strong>Offer:</strong> ${esc(shop.offer_en)}</p>
    <p style="color: #718096;">${paused
      ? 'Their card shows as paused on the festival page, their sign says so, and no new online codes are given out. Codes families already have still work. They can resume anytime.'
      : 'Their offer is live again on the festival page and their sign works.'}</p>
    ${button(`${SITE}/dashboard?view=festival`, 'Open the dashboard')}`));
  return json(r, r.ok ? 200 : 502);
}

/** a business changed its details — the admin hears about it, at most every ten minutes per shop */
async function festivalShopUpdated(id: string) {
  const { data: shop } = await sb.from('festival_shops').select('*').eq('id', id).maybeSingle();
  if (!shop) return json({ error: 'not_found' }, 404);
  const c = shop.pending_changes || null;
  const waiting = shop.status === 'approved' && !!c;
  const r = await sendOnce('shop_updated', `${id}:${tenMinuteSlot()}`, ADMIN_EMAIL,
    waiting ? `Festival shop change to approve: ${shop.name}` : `Festival shop updated: ${shop.name}`, shell(`
    <h1 style="color: #00AEEF; font-size: 20px;">${waiting ? 'A shop on the card asked for a change' : 'A festival shop changed its details'}</h1>
    <p><strong>Shop:</strong> ${esc(shop.name)}</p>
    ${waiting ? `
      <p><strong>Offer now:</strong> ${esc(shop.offer_en)}</p>
      <p><strong>Asking for:</strong> ${esc(c.offer_en || shop.offer_en)}</p>
      ${c.detail_en !== undefined && c.detail_en !== shop.detail_en ? `<p><strong>Conditions:</strong> ${esc(c.detail_en || '—')}</p>` : ''}
      ${c.logo_url ? '<p><strong>New logo</strong> uploaded.</p>' : ''}
      ${c.video_id && c.video_id !== shop.video_id ? `<p><strong>New video:</strong> <a href="https://youtu.be/${esc(c.video_id)}">https://youtu.be/${esc(c.video_id)}</a> — please watch it before approving.</p>` : ''}
      <p style="color: #718096;">The card keeps the current offer until you approve.</p>`
    : `<p><strong>Offer:</strong> ${esc(shop.offer_en)}</p>`}
    ${button(`${SITE}/dashboard?view=festival`, waiting ? 'Review the change' : 'Open the dashboard')}`));
  return json(r, r.ok ? 200 : 502);
}

/** "email me my link" — sent only to the address on file, at most every ten minutes */
async function festivalShopLink(email: string) {
  const addr = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return json({ ok: true });
  const { data: shops } = await sb.from('festival_shops').select('*')
    // case-insensitive, but literal: % and _ would otherwise be wildcards
    .ilike('contact_email', addr.replace(/[%_\\]/g, '\\$&')).in('status', ['unconfirmed', 'pending', 'approved', 'waitlist']);
  for (const shop of shops || []) {
    if (shop.status === 'unconfirmed') { await festivalShop(shop.id, 'confirm'); continue; }
    await sendOnce('shop_link', `${shop.id}:${tenMinuteSlot()}`, shop.contact_email, `Your Inclusion Festival shop page: ${shop.name}`, shell(`
      <h1 style="color: #00AEEF; text-align: center;">Your shop page</h1>
      <p style="font-size: 16px; color: #4a5568;">Hi ${esc(shop.contact_name || 'there')},</p>
      <p style="font-size: 16px; color: #4a5568;">Here is the link to <strong>${esc(shop.name)}</strong>'s Inclusion Festival page${shop.status === 'approved' ? ', where you can print your QR sign and see how many families have redeemed' : ''}.</p>
      ${button(shopLink(shop.manage_token), 'Open my shop page')}
      <p style="font-size: 14px; color: #718096;">Didn't ask for this? You can ignore it — the link only works for whoever has this email.</p>`));
  }
  // the same answer whether or not the address is on file
  return json({ ok: true });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const type = String(body?.type || '');
    if (type === 'SHOP_LINK') return await festivalShopLink(String(body?.email || ''));
    const id = String(body?.id || body?.record?.id || '');
    if (!id) return json({ error: 'missing_id' }, 400);

    switch (type) {
      case 'INSERT':
      case 'REGISTRATION_RECEIVED': return await registration(id, false);
      case 'REGISTRATION_APPROVED': return await registration(id, true);
      case 'VOLUNTEER_RECEIVED':    return await volunteer(id, false);
      case 'VOLUNTEER_APPROVED':    return await volunteer(id, true);
      case 'SHOP_CONFIRM':          return await festivalShop(id, 'confirm');
      case 'SHOP_RECEIVED':         return await festivalShop(id, 'received');
      case 'SHOP_APPROVED':         return await festivalShop(id, 'approved');
      case 'SHOP_UPDATED':          return await festivalShopUpdated(id);
      case 'SHOP_PAUSED':           return await festivalShopPaused(id);
      default:                      return json({ error: 'unsupported_type' }, 400);
    }
  } catch (error: any) {
    console.error(error);
    return json({ error: error.message }, 500);
  }
});
