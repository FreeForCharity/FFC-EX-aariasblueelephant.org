/**
 * Inclusion Festival — every call to Supabase.
 *
 * The rules live in the database (supabase/create_festival.sql), not here:
 * who may approve, one redemption per Google account per shop, Mountain House
 * dates. This file only asks.
 */

import { supabase } from '../supabase';
import { FestivalSettings, FestivalShop, AdminShop, ShopApplication } from './types';
import { DEFAULT_SETTINGS, toShop, toAdminShop } from './store';

export interface Pass {
  id: string;
  short_code: string;
  display_name: string | null;
  party_size: number;
  created_at: string;
  email_optin?: boolean;
}

export interface Redemption {
  id: string;
  shop_id: string;
  punched_at: string;
  local_date: string;
}

/** what a scanned sign shows before anyone signs in */
export interface SignShop {
  ok: true;
  id: string; name: string; category: string; logo_url: string | null;
  offer_en: string; offer_es: string | null; detail_en: string | null; detail_es: string | null;
  address: string | null; redeem_from: string; redeem_to: string;
  state: string; today: string;
}

/** one flat shape: this repo builds without strictNullChecks, which stops a
 *  { ok: true } | { ok: false } union from narrowing */
export interface RedeemOutcome {
  ok: boolean;
  error?: 'signed_out' | 'bad_token' | 'not_started' | 'ended' | 'already_used' | 'network';
  shop_id?: string;
  shop_name?: string;
  punched_at?: string;
  new_card?: boolean;
  from?: string;
  to?: string;
}

/** the owner's own shop, from festival_my_shop() */
export interface MyShop {
  ok: true;
  id: string; name: string; category: string; logo_url: string | null;
  offer_en: string; offer_es: string | null; detail_en: string | null;
  address: string | null; website: string | null;
  contact_name: string; contact_email: string; contact_phone: string | null;
  pledge_pct: number | null; status: string;
  redeem_from: string; redeem_to: string;
  qr_token: string | null;
  total: number; today: number; new_cards: number;
  days: { date: string; count: number }[];
}

export interface Registration {
  id: string; short_code: string; display_name: string | null; email: string | null;
  party_size: number; source: string; created_at: string; redemptions: number; email_optin: boolean;
}

export interface ShopReport {
  id: string; name: string; spot: number | null; category: string; pledge_pct: number | null;
  contact_name: string; contact_email: string; contact_phone: string | null;
  redemptions: number; new_cards: number; first_at: string | null; last_at: string | null;
}

const toSettings = (d: any): FestivalSettings => ({
  spots: d.spots, state: d.state,
  festivalDate: d.festival_date, eventTime: d.event_time, venue: d.venue,
  redeemFrom: d.redeem_from, redeemTo: d.redeem_to,
});

/** ask the email function to send one email; it never blocks the caller */
const notify = (type: 'SHOP_RECEIVED' | 'SHOP_APPROVED', id: string) => {
  supabase.functions.invoke('send-registration-email', { body: { type, id } })
    .catch((e) => console.warn('email not sent', type, e));
};

export const festivalDb = {
  /* ───────────────────────────────────────────────────── everyone ── */

  async settings(): Promise<FestivalSettings> {
    const { data } = await supabase.from('festival_settings').select('*').eq('id', 1).maybeSingle();
    return data ? toSettings(data) : DEFAULT_SETTINGS;
  },

  async shops(): Promise<FestivalShop[]> {
    const { data } = await supabase.from('festival_shops_public').select('*')
      .order('spot', { ascending: true, nullsFirst: false }).order('name');
    return (data || []).map(toShop);
  },

  async spotCounts(): Promise<{ taken: number; waitlist: number }> {
    const { data } = await supabase.from('festival_spot_counts').select('*').maybeSingle();
    return { taken: Number(data?.taken) || 0, waitlist: Number(data?.waitlist) || 0 };
  },

  /* ────────────────────────────────────────────────────── families ── */

  /** the signed-in person's card, made the first time */
  async myPass(name?: string, party = 1): Promise<Pass | null> {
    const { data, error } = await supabase.rpc('festival_my_pass', { p_name: name || null, p_party: party });
    if (error || !(data as any)?.ok) return null;
    return data as Pass;
  },

  /** their card if they have one, without making one */
  async existingPass(): Promise<Pass | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return null;
    const { data } = await supabase.from('festival_passes')
      .select('id, short_code, display_name, party_size, created_at, email_optin')
      .eq('user_id', auth.user.id).maybeSingle();
    return (data as Pass) || null;
  },

  /** every offer they have used — by account, so it survives deleting the card */
  async myRedemptions(): Promise<Redemption[]> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return [];
    const { data } = await supabase.from('festival_punches')
      .select('id, shop_id, punched_at, local_date')
      .eq('user_id', auth.user.id).order('punched_at');
    return (data || []) as Redemption[];
  },

  /** "Email me about future events" — consent, so it starts unticked */
  async setOptin(on: boolean): Promise<boolean> {
    const { data, error } = await supabase.rpc('festival_set_optin', { p_on: on });
    return !error && !!(data as any)?.ok;
  },

  async deleteMyPass(id: string): Promise<boolean> {
    const { data, error } = await supabase.from('festival_passes').delete().eq('id', id).select('id');
    return !error && !!data?.length;
  },

  async signShop(token: string): Promise<SignShop | null> {
    const { data, error } = await supabase.rpc('festival_shop_by_token', { p_token: token });
    if (error || !(data as any)?.ok) return null;
    return data as SignShop;
  },

  async redeem(token: string): Promise<RedeemOutcome> {
    try {
      const { data, error } = await supabase.rpc('festival_redeem', { p_token: token });
      if (error || !data) return { ok: false, error: 'network' };
      return data as RedeemOutcome;
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  /* ─────────────────────────────────────────────────── shop owners ── */

  async myShop(): Promise<MyShop | null> {
    const { data, error } = await supabase.rpc('festival_my_shop');
    if (error || !(data as any)?.ok) return null;
    return data as MyShop;
  },

  /** sign up, or edit while still waiting. Sends the "we got it" emails once. */
  async apply(form: ShopApplication): Promise<{ ok: boolean; id?: string; status?: string; error?: string }> {
    const { data, error } = await supabase.rpc('festival_shop_apply', { p: form });
    if (error) return { ok: false, error: error.message };
    const r = data as any;
    if (r?.ok && !r.updated) notify('SHOP_RECEIVED', r.id);
    return r;
  },

  /**
   * Shrink a logo to a 256px square in the browser, then upload it into
   * the uploader's own folder. Phone photos are megabytes; a tile needs ~15 KB.
   */
  async uploadLogo(file: File, folder: string): Promise<string | null> {
    const blob = await squareImage(file, 256).catch(() => null);
    if (!blob) return null;
    // older Safari cannot encode WebP and quietly hands back a PNG
    const ext = blob.type === 'image/webp' ? 'webp' : 'png';
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('festival-logos')
      .upload(path, blob, { contentType: blob.type || 'image/png', upsert: false });
    if (error) return null;
    return supabase.storage.from('festival-logos').getPublicUrl(path).data.publicUrl;
  },

  /* ──────────────────────────────────────────────────────── admins ── */

  async allShops(): Promise<AdminShop[] | null> {
    const { data, error } = await supabase.from('festival_shops').select('*').order('created_at');
    if (error) return null;
    return (data || []).map(toAdminShop);
  },

  async updateShop(id: string, patch: Record<string, unknown>): Promise<string | null> {
    const { data, error } = await supabase.from('festival_shops')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('id');
    if (error) return error.message;
    return data?.length ? null : 'not_permitted';
  },

  /**
   * Approve onto the card, in a numbered spot. A shop that signed up online is
   * emailed a link to print its sign; one added by hand has no account to sign
   * in with, so you print its sign yourself and no email goes out.
   */
  async approve(id: string, spot: number, by: string, hasOwner: boolean): Promise<string | null> {
    const err = await festivalDb.updateShop(id, {
      status: 'approved', spot, approved_by: by, approved_at: new Date().toISOString(),
    });
    if (!err && hasOwner) notify('SHOP_APPROVED', id);
    return err;
  },

  /** a shop that will never sign up online — you add it, you print its sign */
  async addShop(row: Record<string, unknown>): Promise<string | null> {
    const { error } = await supabase.from('festival_shops').insert(row);
    return error ? error.message : null;
  },

  async deleteShop(id: string): Promise<string | null> {
    const { data, error } = await supabase.from('festival_shops').delete().eq('id', id).select('id');
    if (error) return error.message;
    return data?.length ? null : 'not_permitted';
  },

  async setSettings(s: Partial<FestivalSettings>): Promise<string | null> {
    const patch: Record<string, unknown> = {};
    if (s.spots !== undefined) patch.spots = s.spots;
    if (s.state !== undefined) patch.state = s.state;
    if (s.festivalDate !== undefined) patch.festival_date = s.festivalDate;
    if (s.eventTime !== undefined) patch.event_time = s.eventTime;
    if (s.venue !== undefined) patch.venue = s.venue;
    if (s.redeemFrom !== undefined) patch.redeem_from = s.redeemFrom;
    if (s.redeemTo !== undefined) patch.redeem_to = s.redeemTo;
    const { data, error } = await supabase.from('festival_settings').update(patch).eq('id', 1).select('id');
    if (error) return error.message;
    return data?.length ? null : 'not_permitted';
  },

  async registrations(): Promise<Registration[] | null> {
    const passes = await supabase.from('festival_passes')
      .select('id, short_code, display_name, email, party_size, source, created_at, email_optin')
      .order('created_at', { ascending: false });
    if (passes.error) return null;
    const used = await supabase.from('festival_punches').select('user_id, pass_id');
    const tally = new Map<string, number>();
    (used.data || []).forEach((r: any) => { if (r.pass_id) tally.set(r.pass_id, (tally.get(r.pass_id) || 0) + 1); });
    return (passes.data || []).map((r: any) => ({ ...r, redemptions: tally.get(r.id) || 0 }));
  },

  async deletePass(id: string): Promise<string | null> {
    const { data, error } = await supabase.from('festival_passes').delete().eq('id', id).select('id');
    if (error) return error.message;
    return data?.length ? null : 'not_permitted';
  },

  async report(): Promise<{ shops: ShopReport[]; daily: { shop_id: string; local_date: string; redemptions: number }[] } | null> {
    const [shops, daily] = await Promise.all([
      supabase.from('festival_report_shops').select('*'),
      supabase.from('festival_report_daily').select('*').order('local_date'),
    ]);
    if (shops.error || daily.error) return null;
    return {
      shops: (shops.data || []).map((r: any) => ({
        ...r, redemptions: Number(r.redemptions) || 0, new_cards: Number(r.new_cards) || 0,
      })).sort((a: ShopReport, b: ShopReport) => b.redemptions - a.redemptions),
      daily: (daily.data || []).map((r: any) => ({ ...r, redemptions: Number(r.redemptions) || 0 })),
    };
  },

  /** every redemption, for the CSV — who, where and when */
  async redemptionRows(): Promise<{ shop_id: string; punched_at: string; local_date: string; new_card: boolean; pass_id: string | null }[]> {
    const { data } = await supabase.from('festival_punches')
      .select('shop_id, punched_at, local_date, new_card, pass_id').order('punched_at');
    return (data || []) as any[];
  },
};

/**
 * Fit the whole logo inside a white square (never crop: wordmarks are wide)
 * and re-encode it small.
 */
async function squareImage(file: File, size: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // transparent logos stay readable on dark tiles against white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const pad = size * 0.06;
    const scale = Math.min((size - 2 * pad) / img.naturalWidth, (size - 2 * pad) / img.naturalHeight);
    const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/webp', 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}
