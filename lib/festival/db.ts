/**
 * Festival passes and punches — the half that genuinely needs a server.
 *
 * WHY THIS IS NOT LOCAL-FIRST VALIDATION
 * A punch code is four digits. If those four digits ship in the JS bundle,
 * an attendee reads the file, types the code themselves in front of the till
 * and shows a stamp that landed one second ago — which is exactly what staff
 * are told to look for. Local validation would hand away every offer.
 *
 * So: codes live only in Supabase, and festival_punch() checks them inside a
 * security-definer function. The code never reaches a browser.
 *
 * WHAT IS STILL LOCAL-FIRST
 * Reading. The card renders instantly from cache and from the committed shop
 * snapshot, so it opens in a restaurant car park with no signal. Only the act
 * of punching needs a moment of network, and a failed punch is queued and
 * retried rather than lost.
 */

import { supabase } from '../supabase';
import { FestivalSettings } from './types';

export interface Pass {
  id: string;
  short_code: string;
  display_name: string | null;
  party_size: number;
  status: 'active' | 'void';
  created_at: string;
}

export interface Punch {
  id: string;
  pass_id: string;
  shop_id: string;
  punched_at: string;
  method: string;
}

export interface PublicShop {
  id: string;
  name: string;
  category: string;
  emoji: string | null;
  logo_url: string | null;
  offer_en: string;
  offer_es: string | null;
  detail_en: string | null;
  detail_es: string | null;
  address: string | null;
  website: string | null;
  spot: number | null;
  redeem_from: string;
  redeem_to: string;
}

export type PunchOutcome =
  | { ok: true; shopId: string; shopName: string; punchedAt: string }
  | { ok: false; error: 'bad_code' | 'already_used' | 'outside_window' | 'not_live' | 'not_your_pass' | 'offline' | 'no_backend';
      shopId?: string; shopName?: string; from?: string; to?: string };

const CACHE = 'abe_festival_pass_v1';

interface Cached {
  pass?: Pass;
  punches?: Punch[];
  queued?: { code: string; at: number }[];
  savedAt?: number;
}

const readCache = (): Cached => {
  try { return JSON.parse(localStorage.getItem(CACHE) || '{}'); } catch { return {}; }
};
const writeCache = (c: Cached) => {
  try { localStorage.setItem(CACHE, JSON.stringify({ ...c, savedAt: Date.now() })); } catch { /* private mode */ }
};

/** a short human-readable code for the top of the card, e.g. 7K4M9P */
const makeShortCode = () => {
  const A = 'ACDEFGHJKLMNPQRTUVWXY34679';   // no look-alikes
  let out = '';
  const r = new Uint32Array(6);
  (globalThis.crypto || ({} as any)).getRandomValues?.(r);
  for (let i = 0; i < 6; i++) out += A[(r[i] || Math.floor(Math.random() * 1e9)) % A.length];
  return out;
};

/** missing table / missing function — the SQL has not been run yet */
const noBackend = (e: any) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST202' || /does not exist|schema cache/i.test(e.message || ''));

export const festivalDb = {
  cached: readCache,

  /** has supabase/create_festival.sql been run? */
  async ready(): Promise<boolean> {
    try {
      const { error } = await supabase.from('festival_settings').select('id').limit(1);
      return !error;
    } catch { return false; }
  },

  async settings(): Promise<FestivalSettings | null> {
    const { data, error } = await supabase
      .from('festival_settings')
      .select('spots, state, festival_date, redeem_from, redeem_to, hold_hours')
      .eq('id', 1).maybeSingle();
    if (error || !data) return null;
    return {
      spots: data.spots, state: data.state,
      festivalDate: data.festival_date, redeemFrom: data.redeem_from,
      redeemTo: data.redeem_to, holdHours: data.hold_hours,
    };
  },

  /** the card's shops, from the view that carries no punch codes */
  async shops(): Promise<PublicShop[] | null> {
    const { data, error } = await supabase
      .from('festival_shops_public').select('*').order('spot', { ascending: true });
    if (error) return null;
    return data as PublicShop[];
  },

  /** the signed-in person's pass, creating one the first time */
  async myPass(displayName: string, partySize = 1): Promise<{ pass?: Pass; error?: string }> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return { error: 'signed_out' };

    const existing = await supabase
      .from('festival_passes').select('*')
      .eq('user_id', uid).eq('status', 'active').maybeSingle();
    if (existing.error && noBackend(existing.error)) return { error: 'no_backend' };
    if (existing.data) {
      const pass = existing.data as Pass;
      writeCache({ ...readCache(), pass });
      return { pass };
    }

    const { data, error } = await supabase.from('festival_passes').insert({
      user_id: uid,
      short_code: makeShortCode(),
      display_name: displayName,
      party_size: partySize,
    }).select().single();
    if (error) return { error: noBackend(error) ? 'no_backend' : error.message };

    const pass = data as Pass;
    writeCache({ ...readCache(), pass, punches: [] });
    return { pass };
  },

  async punches(passId: string): Promise<Punch[]> {
    const { data, error } = await supabase
      .from('festival_punches').select('*').eq('pass_id', passId)
      .order('punched_at', { ascending: true });
    if (error) return readCache().punches || [];
    const punches = (data || []) as Punch[];
    writeCache({ ...readCache(), punches });
    return punches;
  },

  /**
   * The punch itself. Everything that matters happens in Postgres: the code is
   * looked up there, the November window is checked there, and one-per-shop is
   * a unique index rather than a hopeful if-statement.
   */
  async punch(passId: string, code: string, method: 'code' | 'qr' = 'code'): Promise<PunchOutcome> {
    const clean = (code || '').replace(/\D/g, '').slice(0, 4);
    try {
      const { data, error } = await supabase.rpc('festival_punch', {
        p_pass: passId, p_code: clean, p_method: method, p_sale: null,
      });
      if (error) {
        if (noBackend(error)) return { ok: false, error: 'no_backend' };
        // network trouble: hold the attempt and let the card retry later
        const c = readCache();
        writeCache({ ...c, queued: [...(c.queued || []), { code: clean, at: Date.now() }] });
        return { ok: false, error: 'offline' };
      }
      const r = data as any;
      if (r?.ok) {
        return { ok: true, shopId: r.shop_id, shopName: r.shop_name, punchedAt: r.punched_at };
      }
      return { ok: false, error: r?.error || 'bad_code', shopId: r?.shop_id, shopName: r?.shop_name,
               from: r?.from, to: r?.to };
    } catch {
      const c = readCache();
      writeCache({ ...c, queued: [...(c.queued || []), { code: clean, at: Date.now() }] });
      return { ok: false, error: 'offline' };
    }
  },

  /* ───────────────────────────────────────────────── admin side ── */

  /**
   * Push the committed shop list into Supabase and hand back the punch codes.
   *
   * This is the moment codes come into existence. They are generated here and
   * stored ONLY in the table — never in data/festival.json, which ships to
   * every browser. A shop learns its code from the email you send it.
   */
  async publishShops(rows: {
    id: string; name: string; category: string; emoji?: string; logo?: string;
    offerEn: string; offerEs?: string; detailEn?: string; detailEs?: string;
    address?: string; website?: string; spot?: number; pledgePct?: number;
    contactName?: string; contactEmail?: string; status: string;
  }[], redeemFrom: string, redeemTo: string): Promise<{ error?: string; codes?: Record<string, string> }> {
    const current = await supabase.from('festival_shops').select('id, punch_code');
    if (current.error) return { error: noBackend(current.error) ? 'no_backend' : current.error.message };

    const existing = new Map((current.data || []).map((r: any) => [r.id, r.punch_code as string]));
    const used = new Set(existing.values());
    const freshCode = () => {
      for (let i = 0; i < 900; i++) {
        const c = String(1000 + Math.floor(Math.random() * 9000));
        if (!used.has(c)) { used.add(c); return c; }
      }
      return String(1000 + used.size);
    };

    const payload = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      emoji: r.emoji || null,
      logo_url: r.logo ? `/festival/logos/${r.logo}` : null,
      offer_en: r.offerEn,
      offer_es: r.offerEs || null,
      detail_en: r.detailEn || null,
      detail_es: r.detailEs || null,
      address: r.address || null,
      website: r.website || null,
      contact_name: r.contactName || '—',
      contact_email: r.contactEmail || '—',
      pledge_pct: r.pledgePct ?? null,
      // keep a code a shop already knows; only mint one for a new shop
      punch_code: existing.get(r.id) || freshCode(),
      redeem_from: redeemFrom,
      redeem_to: redeemTo,
      spot: r.spot ?? null,
      status: r.status,
    }));

    const { error } = await supabase.from('festival_shops').upsert(payload, { onConflict: 'id' });
    if (error) return { error: error.message };

    const codes: Record<string, string> = {};
    payload.forEach((p) => { codes[p.id] = p.punch_code; });
    return { codes };
  },

  /** the codes, for the emails you send to shops */
  async shopCodes(): Promise<Record<string, string> | null> {
    const { data, error } = await supabase.from('festival_shops').select('id, punch_code');
    if (error) return null;
    const out: Record<string, string> = {};
    (data || []).forEach((r: any) => { out[r.id] = r.punch_code; });
    return out;
  },

  async setSettings(patch: Partial<{ spots: number; state: string; festival_date: string; redeem_from: string; redeem_to: string }>) {
    const { error } = await supabase.from('festival_settings').update(patch).eq('id', 1);
    return error ? { error: error.message } : {};
  },

  /** how it is going: passes issued, and punches per shop */
  async metrics(): Promise<{ passes: number; punches: number; perShop: { id: string; name: string; punches: number; sales: number }[] } | null> {
    const passes = await supabase.from('festival_passes').select('id', { count: 'exact', head: true }).eq('status', 'active');
    const stats = await supabase.from('festival_shop_stats').select('*');
    if (passes.error || stats.error) return null;
    const perShop = (stats.data || []).map((r: any) => ({
      id: r.id, name: r.name, punches: Number(r.punches) || 0, sales: Number(r.sales) || 0,
    })).sort((a, b) => b.punches - a.punches);
    return {
      passes: passes.count || 0,
      punches: perShop.reduce((n, s) => n + s.punches, 0),
      perShop,
    };
  },

  /** retry anything that was typed while the signal was gone */
  async flushQueue(passId: string): Promise<number> {
    const c = readCache();
    const queued = c.queued || [];
    if (!queued.length) return 0;
    let done = 0;
    const left: typeof queued = [];
    for (const q of queued) {
      const r = await this.punch(passId, q.code);
      if (r.ok || (!r.ok && r.error !== 'offline')) done++;   // settled, either way
      else left.push(q);
    }
    writeCache({ ...readCache(), queued: left });
    return done;
  },
};
