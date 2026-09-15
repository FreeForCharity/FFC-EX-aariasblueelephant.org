/**
 * Inclusion Festival & Resource Fair — shared types.
 *
 * A Mountain House business claims one of a limited number of spots, offers a
 * deal, and gets a 4-digit punch code. Attendees carry a digital punch card for
 * the whole of November and each shop punches their own tile.
 */

export type ShopCategory =
  | 'restaurant' | 'cafe' | 'bakery' | 'grocery'
  | 'gym' | 'dental' | 'health'
  | 'tutoring' | 'kids'
  | 'salon' | 'florist' | 'retail' | 'other';

/** held = spot reserved while we wait on their details; released = hold expired */
export type ShopStatus = 'held' | 'approved' | 'waitlist' | 'rejected' | 'released';

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

  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  /** what they'd like to give back to ABE, as a % of the sale. Always optional. */
  pledgePct?: number;

  /** four digits the staff type on the attendee's phone */
  punchCode: string;
  /** some offers (a free drink) are for the day; others (a gym membership) run on */
  redeemFrom: string;
  redeemTo: string;

  /** 1..spots once they hold or own a place; undefined while waitlisted */
  spot?: number;
  status: ShopStatus;
  /** ISO timestamp — an unconfirmed hold lapses and frees the spot */
  heldUntil?: string;

  createdAt: string;
  /** set when an admin approves — an audit trail for who let a shop on */
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

/**
 * Only this account can approve a shop onto the card. Claiming a spot is
 * self-service; being ON the card is not.
 */
export const FESTIVAL_ADMINS = ['admin@aariasblueelephant.org'];
export const isFestivalAdmin = (email?: string | null) =>
  !!email && FESTIVAL_ADMINS.includes(email.toLowerCase().trim());

export type FestivalState = 'recruiting' | 'live' | 'ended';

export interface FestivalSettings {
  /** 16 to start. Bumped to 32 if there's a queue worth opening for. */
  spots: number;
  state: FestivalState;
  festivalDate: string;
  redeemFrom: string;
  redeemTo: string;
  /** hours a provisional spot is held before it goes back in the pool */
  holdHours: number;
}

export interface ShopApplication {
  name: string;
  category: ShopCategory;
  offerEn: string;
  offerEs: string;
  detailEn?: string;
  address?: string;
  website?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  pledgePct?: number;
  logoUrl?: string;
}

export interface ApplyResult {
  shop: FestivalShop;
  /** true when every spot was taken and they joined the queue instead */
  waitlisted: boolean;
  position?: number;
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
