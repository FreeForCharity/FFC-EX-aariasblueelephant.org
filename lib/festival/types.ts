/**
 * Inclusion Festival & Special Needs Resource Fair — shared types.
 *
 * A local business signs in with Google and applies with an offer. Once
 * an admin approves it, the shop prints a QR sign for the counter. Families scan
 * the sign with their own phone, sign in, and tap Redeem — one redemption per
 * Google account per shop, all of November.
 */

export type ShopCategory =
  | 'restaurant' | 'cafe' | 'bakery' | 'grocery'
  | 'gym' | 'dental' | 'health'
  | 'tutoring' | 'kids'
  | 'salon' | 'florist' | 'retail' | 'other';

/** unconfirmed = signed up, email link not clicked yet; nothing reaches the admin until it is */
/** paused = the business took its offer down for now; it can resume in one click */
export type ShopStatus = 'unconfirmed' | 'pending' | 'approved' | 'paused' | 'waitlist' | 'declined' | 'withdrawn';

/** a shop as the public card draws it — no contacts, no QR token */
export interface FestivalShop {
  id: string;
  name: string;
  category: ShopCategory;
  /** stands in for a logo until one is uploaded, so the grid is never broken */
  emoji: string;
  logoUrl?: string;
  offerEn: string;
  offerEs: string;
  detailEn?: string;
  detailEs?: string;
  address?: string;
  website?: string;
  redeemFrom: string;
  redeemTo: string;
  spot?: number;
  /** a QR sign at the counter */
  instore: boolean;
  /** booked on the web: families get a personal code instead */
  online: boolean;
  onlineLink?: string;
  onlineNote?: string;
  /** a kid's business (under 18), signed up by a parent — its own section, no spot */
  youngFounder?: boolean;
  /** YouTube video id, optional for any business, shown once an admin approves the card */
  videoId?: string;
  /** how families can reach them — public by choice, unlike the sign-up email */
  publicContact?: string;
  /** the business paused its offer for now — still shown, marked paused, nothing to redeem */
  paused?: boolean;
}

/** the full row, as an admin sees it */
export interface AdminShop extends FestivalShop {
  ownerId?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  pledgePct?: number | null;
  qrToken: string;
  /** the shop's private page link — the key in every email we send them */
  manageToken: string;
  emailConfirmedAt?: string | null;
  /** a change the shop asked for after approval, waiting for an admin */
  pendingChanges?: Record<string, any> | null;
  status: ShopStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

/**
 * Anyone on the organisation's own Google Workspace domain runs the festival.
 * The database enforces the same rule in festival_is_admin(); this copy only
 * decides what to show.
 */
export const FESTIVAL_ADMIN_DOMAIN = '@aariasblueelephant.org';
export const isFestivalAdmin = (email?: string | null) =>
  (email || '').toLowerCase().trim().endsWith(FESTIVAL_ADMIN_DOMAIN);

export type FestivalState = 'recruiting' | 'live' | 'ended';

export interface FestivalSettings {
  /** how many shops fit on the card */
  spots: number;
  state: FestivalState;
  festivalDate: string;
  eventTime: string;
  venue: string;
  redeemFrom: string;
  redeemTo: string;
}

/** what a shop owner fills in */
export interface ShopApplication {
  contact_email?: string;
  name: string;
  category: ShopCategory;
  offer_en: string;
  offer_es?: string;
  detail_en?: string;
  address?: string;
  website?: string;
  contact_name: string;
  contact_phone?: string;
  pledge_pct?: number | null;
  logo_url?: string | null;
  instore?: boolean;
  online?: boolean;
  online_link?: string;
  online_note?: string;
  young_founder?: boolean;
  /** the parent or guardian said yes — required when young_founder */
  guardian_consent?: boolean;
  /** any YouTube link; the database keeps only the video id */
  video_url?: string;
  public_contact?: string;
}

export const CATEGORY_EMOJI: Record<ShopCategory, string> = {
  restaurant: '🍛', cafe: '☕', bakery: '🧁', grocery: '🛒',
  gym: '🏋️', dental: '🦷', health: '💊',
  tutoring: '📚', kids: '🎨',
  salon: '✂️', florist: '💐', retail: '🛍️', other: '🏪',
};

export const CATEGORY_LABEL: Record<ShopCategory, { en: string; es: string }> = {
  restaurant: { en: 'Restaurant', es: 'Restaurante' },
  cafe: { en: 'Café', es: 'Cafetería' },
  bakery: { en: 'Bakery', es: 'Panadería' },
  grocery: { en: 'Grocery', es: 'Supermercado' },
  gym: { en: 'Gym & Fitness', es: 'Gimnasio' },
  dental: { en: 'Dental', es: 'Dental' },
  health: { en: 'Health', es: 'Salud' },
  tutoring: { en: 'Tutoring', es: 'Tutorías' },
  kids: { en: 'Kids & Art', es: 'Niños y Arte' },
  salon: { en: 'Salon', es: 'Peluquería' },
  florist: { en: 'Florist', es: 'Floristería' },
  retail: { en: 'Retail', es: 'Tienda' },
  other: { en: 'Other', es: 'Otro' },
};

export const isCategory = (c: string): c is ShopCategory => c in CATEGORY_EMOJI;
