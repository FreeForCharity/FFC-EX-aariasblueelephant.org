/**
 * Festival defaults and row mapping.
 *
 * Everything real lives in Supabase (see supabase/create_festival.sql). These
 * defaults only paint the page in the moment before the database answers, so
 * keep them matching the festival_settings row.
 */

import { FestivalShop, FestivalSettings, AdminShop, CATEGORY_EMOJI, isCategory } from './types';

export const DEFAULT_SETTINGS: FestivalSettings = {
  spots: 16,
  state: 'recruiting',
  festivalDate: '2026-11-01',
  eventTime: '10:00 AM – 2:00 PM',
  venue: 'Mountain House Town Hall',
  redeemFrom: '2026-11-01',
  redeemTo: '2026-11-30',
};

/** a row of festival_shops_public (or festival_shops), as the UI draws it */
export function toShop(p: any): FestivalShop {
  const category = isCategory(p.category) ? p.category : 'other';
  return {
    id: p.id,
    name: p.name,
    category,
    emoji: CATEGORY_EMOJI[category],
    logoUrl: p.logo_url || undefined,
    offerEn: p.offer_en,
    offerEs: p.offer_es || '',
    detailEn: p.detail_en || undefined,
    detailEs: p.detail_es || undefined,
    address: p.address || undefined,
    website: p.website || undefined,
    redeemFrom: p.redeem_from,
    redeemTo: p.redeem_to,
    spot: p.spot ?? undefined,
    instore: p.instore !== false,
    online: p.online === true,
    onlineLink: p.online_link || undefined,
    onlineNote: p.online_note || undefined,
    youngFounder: p.young_founder === true,
    videoId: p.video_id || undefined,
    publicContact: p.public_contact || undefined,
  };
}

export function toAdminShop(p: any): AdminShop {
  return {
    ...toShop(p),
    ownerId: p.owner_id,
    contactName: p.contact_name,
    contactEmail: p.contact_email,
    contactPhone: p.contact_phone || undefined,
    pledgePct: p.pledge_pct,
    qrToken: p.qr_token,
    manageToken: p.manage_token,
    emailConfirmedAt: p.email_confirmed_at,
    pendingChanges: p.pending_changes || null,
    status: p.status,
    approvedBy: p.approved_by,
    approvedAt: p.approved_at,
    notes: p.notes,
    createdAt: p.created_at,
  };
}

/** the video id out of a YouTube link — the same rule as festival_youtube_id() in the database */
export const youtubeId = (url: string): string | null =>
  (url || '').match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/)?.[1] || null;

/** privacy-enhanced embed: no YouTube cookies until someone presses play */
export const youtubeEmbed = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
export const youtubeLink = (id: string) => `https://youtu.be/${id}`;

/**
 * A link for whatever a business typed as its public contact — an email, a
 * phone, a web address — or null for anything else (an @handle stays text).
 * We pick the scheme ourselves, so nothing typed can become a script link.
 */
export const contactHref = (text: string): string | null => {
  const t = (text || '').trim();
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) return `mailto:${t}`;
  if (/^https?:\/\/[^\s]+$/i.test(t)) return t;
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(t)) return `https://${t}`;
  const digits = t.replace(/[^\d+]/g, '');
  if (/^[\d\s()+.-]+$/.test(t) && digits.replace('+', '').length >= 7) return `tel:${digits}`;
  return null;
};

/** a shop's private page — no password, the link is the key */
// the key sits after '#': the part of a URL that is never sent to a server,
// an analytics tag or another site
export const shopPageUrl = (manage: string) => `https://aariasblueelephant.org/InclusionFestival/myshop#k=${manage}`;

/** this device remembers the shop it signed up, so the page opens without the email */
export const SHOP_KEY = 'abe.festival.shop';

/** the link a shop's QR sign opens */
export const redeemUrl = (token: string) => `https://aariasblueelephant.org/r/${token}`;

/** "November 1" / "1 de noviembre" — dates are calendar days, so pin to noon */
export const fmtDay = (iso: string, es: boolean, withYear = false) =>
  new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(es ? 'es-US' : 'en-US',
    withYear ? { month: 'long', day: 'numeric', year: 'numeric' } : { month: 'long', day: 'numeric' });

/** "Nov 5" / "5 nov" — short enough for a tile */
export const fmtShortDay = (iso: string, es: boolean) =>
  new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' });

export const fmtTime = (iso: string, es: boolean) =>
  new Date(iso).toLocaleTimeString(es ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit' });
