/**
 * Festival shop list.
 *
 * There is no database here, on purpose. Sixteen shops added over a few weeks,
 * each one needing a human to approve it anyway, is not a database problem —
 * it is a file. data/festival.json IS the store; editing it and committing is
 * the approval. The admin page generates the whole file so nobody hand-edits
 * JSON.
 *
 * Attendee passes and punches are a different matter and will need a real
 * store — see supabase/create_festival.sql for that half.
 */

import RAW from '../../data/festival.json';
import { FestivalShop, FestivalSettings, ShopCategory, CATEGORY_EMOJI } from './types';

interface RawShop {
  id: string; name: string; category: string; spot?: number;
  offerEn: string; offerEs?: string; detailEn?: string; detailEs?: string;
  address?: string; website?: string; logo?: string;
  pledgePct?: number; status?: string;
  contactName?: string; contactEmail?: string;
}

export const SETTINGS: FestivalSettings = {
  ...(RAW.settings as any),
  holdHours: 48,
};

export const CONTACT_EMAIL: string =
  (RAW.settings as any).contactEmail || 'hello@aariasblueelephant.org';

function hydrate(r: RawShop): FestivalShop {
  const category = (r.category || 'other') as ShopCategory;
  return {
    id: r.id,
    name: r.name,
    category,
    emoji: CATEGORY_EMOJI[category] || '🏪',
    // logos are committed alongside the site; a missing one falls back to the emoji
    logoUrl: r.logo ? `/festival/logos/${r.logo}` : undefined,
    offerEn: r.offerEn,
    offerEs: r.offerEs || '',
    detailEn: r.detailEn,
    detailEs: r.detailEs,
    address: r.address,
    website: r.website,
    contactName: r.contactName || '',
    contactEmail: r.contactEmail || '',
    pledgePct: r.pledgePct,
    punchCode: '',   // codes live in Supabase only — see lib/festival/db.ts
    redeemFrom: SETTINGS.redeemFrom,
    redeemTo: SETTINGS.redeemTo,
    spot: r.spot,
    status: (r.status as FestivalShop['status']) || 'approved',
    createdAt: '',
  };
}

const ALL: FestivalShop[] = (RAW.shops as RawShop[])
  .map(hydrate)
  .sort((a, b) => (a.spot ?? 999) - (b.spot ?? 999));

export interface SpotCount {
  taken: number;
  spots: number;
  free: number;
  waitlist: number;
  full: boolean;
}

export const festival = {
  settings: (): FestivalSettings => SETTINGS,

  /** every shop on the card */
  shops: (): FestivalShop[] => ALL.filter((s) => s.status === 'approved'),

  /** including any we are still talking to */
  allShops: (): FestivalShop[] => ALL,

  counts: (): SpotCount => {
    const taken = ALL.filter((s) => s.status === 'approved' || s.status === 'held').length;
    return {
      taken,
      spots: SETTINGS.spots,
      free: Math.max(0, SETTINGS.spots - taken),
      waitlist: ALL.filter((s) => s.status === 'waitlist').length,
      full: taken >= SETTINGS.spots,
    };
  },

  /** the next free number, so the admin page can suggest one */
  nextSpot: (): number => {
    const used = new Set(ALL.filter((s) => s.spot).map((s) => s.spot));
    for (let i = 1; i <= SETTINGS.spots; i++) if (!used.has(i)) return i;
    return SETTINGS.spots + 1;
  },

  /** four digits nobody else is using */
  nextPunchCode: (): string => {
    const used = new Set(ALL.map((s) => s.punchCode));
    for (let i = 0; i < 500; i++) {
      const c = String(1000 + Math.floor(Math.random() * 9000));
      if (!used.has(c)) return c;
    }
    return String(1000 + used.size);
  },

  /** shops that have claimed a spot but not sent a logo yet */
  missingLogos: (): FestivalShop[] => ALL.filter((s) => s.status === 'approved' && !s.logoUrl),
};

/** a slug that will be the id and the logo filename */
export const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
