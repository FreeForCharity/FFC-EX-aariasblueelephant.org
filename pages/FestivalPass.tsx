import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MapPin, WifiOff, PartyPopper, LogIn, Clock } from 'lucide-react';
import Button from '../components/Button';
import ShopTile from '../components/festival/ShopTile';
import { festival, SETTINGS } from '../lib/festival/store';
import { festivalDb, Pass, Punch, PublicShop, PunchOutcome } from '../lib/festival/db';
import { FestivalShop, CATEGORY_EMOJI, CATEGORY_LABEL, ShopCategory } from '../lib/festival/types';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/database';
import { tr, isEs } from '../lib/lang';

/** give the offer only while the stamp is this fresh */
const FRESH_SECONDS = 60;
/** punches that earn a raffle entry */
const MILESTONE = 8;

const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString(isEs() ? 'es-US' : 'en-US', { month: 'long', day: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(isEs() ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit' });

/** the Supabase view and the committed snapshot both become this */
const toShop = (p: PublicShop): FestivalShop => {
  const category = (p.category || 'other') as ShopCategory;
  return {
    id: p.id, name: p.name, category,
    emoji: p.emoji || CATEGORY_EMOJI[category] || '🏪',
    logoUrl: p.logo_url || undefined,
    offerEn: p.offer_en, offerEs: p.offer_es || '',
    detailEn: p.detail_en || undefined, detailEs: p.detail_es || undefined,
    address: p.address || undefined, website: p.website || undefined,
    contactName: '', contactEmail: '', punchCode: '',
    redeemFrom: p.redeem_from, redeemTo: p.redeem_to,
    spot: p.spot ?? undefined, status: 'approved', createdAt: '',
  };
};

const STAMP_CSS = `
@keyframes abeStamp {
  0%   { transform: scale(2.6) rotate(-18deg); opacity: 0; }
  55%  { transform: scale(0.92) rotate(-12deg); opacity: 1; }
  75%  { transform: scale(1.06) rotate(-12deg); }
  100% { transform: scale(1) rotate(-12deg); opacity: 1; }
}
.abe-stamp { animation: abeStamp .5s cubic-bezier(.2,.8,.3,1) both; }
`;

/**
 * ?preview=1 renders the card with the committed shop list and stamps kept in
 * this browser only. It exists so the card can be looked at, and shown to
 * people, before any of the backend is switched on. It never touches real
 * data, and the banner on screen says so.
 */
const PREVIEW_KEY = 'abe_festival_preview_punches';

const FestivalPass: React.FC = () => {
  const { user, isLoading } = useAuth();
  const preview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview');
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [state, setState] = useState(SETTINGS.state);
  const [shops, setShops] = useState<FestivalShop[]>(festival.shops());
  const [pass, setPass] = useState<Pass | null>(festivalDb.cached().pass || null);
  const [punches, setPunches] = useState<Punch[]>(festivalDb.cached().punches || []);
  const [partySize, setPartySize] = useState(1);
  const [busy, setBusy] = useState(false);

  const [open, setOpen] = useState<FestivalShop | null>(null);
  const [code, setCode] = useState('');
  const [outcome, setOutcome] = useState<PunchOutcome | null>(null);
  const [now, setNow] = useState(Date.now());
  const [cheer, setCheer] = useState(false);
  const [sale, setSale] = useState('');
  const [saleDone, setSaleDone] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  // one ticking clock drives every freshness countdown on the card
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (preview) {
      setBackendReady(true);
      setState('live');
      setPass({
        id: 'preview', short_code: 'PREVIEW', display_name: user?.name || 'Preview',
        party_size: 1, status: 'active', created_at: new Date().toISOString(),
      });
      try { setPunches(JSON.parse(localStorage.getItem(PREVIEW_KEY) || '[]')); } catch { /* ignore */ }
      return;
    }
    (async () => {
      const ready = await festivalDb.ready();
      setBackendReady(ready);
      if (!ready) return;
      const s = await festivalDb.settings();
      if (s) setState(s.state);
      const remote = await festivalDb.shops();
      if (remote && remote.length) setShops(remote.map(toShop));
    })();
  }, [preview, user]);

  const loadPass = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    const { pass: p } = await festivalDb.myPass(user.name || user.email, partySize);
    if (p) {
      setPass(p);
      setPunches(await festivalDb.punches(p.id));
      await festivalDb.flushQueue(p.id);
    }
    setBusy(false);
  }, [user, partySize]);

  useEffect(() => {
    if (!preview && user && backendReady && !pass) loadPass();
  }, [preview, user, backendReady, pass, loadPass]);

  const punchedMap = new Map(punches.map((p) => [p.shop_id, p]));
  const freshFor = (shopId: string) => {
    const p = punchedMap.get(shopId);
    if (!p) return 0;
    const left = FRESH_SECONDS - Math.floor((now - new Date(p.punched_at).getTime()) / 1000);
    return left > 0 ? left : 0;
  };

  const submitCode = async (value: string) => {
    if (!pass || value.length !== 4) return;
    if (preview) {
      // stamp whichever tile is open, so the interaction can be felt end to end
      if (!open) return;
      const fake: Punch = {
        id: 'pv-' + open.id, pass_id: 'preview', shop_id: open.id,
        punched_at: new Date().toISOString(), method: 'code',
      };
      const next = [...punches.filter((x) => x.shop_id !== open.id), fake];
      setPunches(next);
      try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      setOutcome({ ok: true, shopId: open.id, shopName: open.name, punchedAt: fake.punched_at });
      if (next.length === MILESTONE) { setCheer(true); setTimeout(() => setCheer(false), 4000); }
      return;
    }
    setBusy(true);
    const r = await festivalDb.punch(pass.id, value);
    setOutcome(r);
    if (r.ok) {
      const fresh = await festivalDb.punches(pass.id);
      setPunches(fresh);
      if (fresh.length === MILESTONE) { setCheer(true); setTimeout(() => setCheer(false), 4000); }
    }
    setBusy(false);
  };

  const openTile = (shop: FestivalShop) => {
    setOpen(shop); setCode(''); setOutcome(null); setSale(''); setSaleDone(false);
    setTimeout(() => codeRef.current?.focus(), 250);
  };

  /* ── gates ────────────────────────────────────────────────────────── */
  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">{children}</div>
  );

  if (isLoading || backendReady === null) {
    return <Shell><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></Shell>;
  }

  if (!backendReady || state !== 'live') {
    return (
      <Shell>
        <Ticket className="mx-auto h-12 w-12 text-sky-300" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('Punch cards open soon', 'Las tarjetas abren pronto')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('We are still signing up shops. Come back when registration opens and your card will be waiting.',
              'Todavía estamos inscribiendo tiendas. Vuelve cuando abra la inscripción y tu tarjeta estará lista.')}
        </p>
        <Link to="/InclusionFestival" className="mt-8 inline-block">
          <Button variant="secondary">{tr('See the shops', 'Ver las tiendas')}</Button>
        </Link>
      </Shell>
    );
  }

  if (!user && !preview) {
    return (
      <Shell>
        <Ticket className="mx-auto h-12 w-12 text-sky-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('Get your punch card', 'Obtén tu tarjeta')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('Sign in and your card appears, with every Mountain House shop on it. Free, and it lasts all November.',
              'Inicia sesión y aparece tu tarjeta con todas las tiendas de Mountain House. Gratis, y dura todo noviembre.')}
        </p>
        <Button className="mt-8" size="lg" onClick={() => db.signInWithGoogle()}>
          <LogIn className="mr-2 h-5 w-5" />{tr('Sign in with Google', 'Iniciar sesión con Google')}
        </Button>
      </Shell>
    );
  }

  if (!pass) {
    return (
      <Shell>
        <Ticket className="mx-auto h-12 w-12 text-sky-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('One last thing', 'Una última cosa')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('How many of you are coming?', '¿Cuántos vienen?')}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} onClick={() => setPartySize(n)}
              className={`h-12 w-12 rounded-full border-2 text-lg font-black transition
                ${partySize === n ? 'border-sky-600 bg-sky-600 text-white'
                                  : 'border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300'}`}>
              {n}{n === 6 ? '+' : ''}
            </button>
          ))}
        </div>
        <Button className="mt-8" size="lg" disabled={busy} onClick={loadPass}>
          {busy ? tr('Making your card…', 'Creando tu tarjeta…') : tr('Make my card', 'Crear mi tarjeta')}
        </Button>
      </Shell>
    );
  }

  /* ── the card ─────────────────────────────────────────────────────── */
  const done = punches.length;
  const total = shops.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <style>{STAMP_CSS}</style>

      {preview && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <span>{tr('Preview — any 4 digits will stamp, and nothing is saved anywhere.',
                    'Vista previa: cualquier código de 4 dígitos sella, y nada se guarda.')}</span>
          <button className="underline"
                  onClick={() => { try { localStorage.removeItem(PREVIEW_KEY); } catch { /* ignore */ } setPunches([]); }}>
            {tr('Clear', 'Limpiar')}
          </button>
        </div>
      )}

      <div className="rounded-3xl border-2 border-sky-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">
            🐘 {tr('November Pass', 'Pase de Noviembre')}
          </p>
          <p className="font-mono text-xs font-bold text-slate-400">{pass.short_code}</p>
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
          {pass.display_name || user?.name}
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-sky-600 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="shrink-0 text-sm font-black text-slate-700 dark:text-slate-200">{done} / {total}</p>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {done >= MILESTONE
            ? tr('🎟️ You are in the raffle!', '🎟️ ¡Estás en el sorteo!')
            : tr(`${MILESTONE - done} more and you are in the raffle`, `${MILESTONE - done} más y entras al sorteo`)}
          {' · '}{tr('Offers end', 'Las ofertas terminan')} {fmtDate(SETTINGS.redeemTo)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
        {shops.map((shop) => {
          const p = punchedMap.get(shop.id);
          return (
            <ShopTile key={shop.id} shop={shop} punched={!!p}
                      punchedAt={p ? fmtTime(p.punched_at) : undefined}
                      freshFor={freshFor(shop.id)}
                      onClick={() => openTile(shop)} />
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        {tr('Tap a shop, then hand your phone to the staff.', 'Toca una tienda y pasa tu teléfono al personal.')}
      </p>

      {cheer && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
          <div className="rounded-3xl bg-white/95 px-8 py-6 text-center shadow-2xl dark:bg-slate-900/95">
            <PartyPopper className="mx-auto h-12 w-12 text-amber-500" />
            <p className="mt-3 text-xl font-black text-slate-900 dark:text-white">
              {tr(`${MILESTONE} punches!`, `¡${MILESTONE} sellos!`)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{tr('You are in the raffle 🎟️', 'Estás en el sorteo 🎟️')}</p>
          </div>
        </div>
      )}

      {/* ── punch sheet ───────────────────────────────────────────────── */}
      {open && (() => {
        const already = punchedMap.get(open.id);
        const fresh = freshFor(open.id);
        // pull the failure out first: narrowing does not reach into nested JSX
        const err = outcome && outcome.ok === false ? outcome : null;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
               onClick={() => setOpen(null)}>
            <div className="w-full max-w-md rounded-t-3xl bg-white p-6 dark:bg-slate-900 sm:rounded-3xl"
                 onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                {open.logoUrl
                  ? <img src={open.logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />
                  : <span className="text-4xl" aria-hidden>{open.emoji}</span>}
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-slate-900 dark:text-white">{open.name}</h3>
                  <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                    {isEs() ? CATEGORY_LABEL[open.category].es : CATEGORY_LABEL[open.category].en}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                {isEs() ? (open.offerEs || open.offerEn) : open.offerEn}
              </p>
              {(isEs() ? open.detailEs : open.detailEn) && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{isEs() ? open.detailEs : open.detailEn}</p>
              )}
              {open.address && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />{open.address}
                </p>
              )}

              {/* already used */}
              {already && !outcome?.ok && (
                <div className={`mt-5 rounded-2xl p-4 text-center ${fresh
                  ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <p className={`text-lg font-black ${fresh ? 'text-green-700 dark:text-green-400' : 'text-slate-500'}`}>
                    {fresh
                      ? tr('✓ Punched just now', '✓ Sellado ahora mismo')
                      : tr('Already used', 'Ya utilizado')}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {fresh
                      ? tr(`Show this to the staff — ${fresh}s left`, `Muestra esto al personal — quedan ${fresh}s`)
                      : `${fmtTime(already.punched_at)}`}
                  </p>
                </div>
              )}

              {/* the punch */}
              {!already && (
                <div className="mt-5">
                  <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                    {tr('Hand your phone to the staff', 'Pasa tu teléfono al personal')}
                  </p>
                  <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                    {tr('They type their 4-digit code', 'Ellos escriben su código de 4 dígitos')}
                  </p>
                  <input
                    ref={codeRef}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={code}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCode(v); setOutcome(null);
                      if (v.length === 4) submitCode(v);
                    }}
                    className="mt-3 w-full rounded-2xl border-4 border-slate-200 bg-white py-5 text-center font-mono text-4xl font-black tracking-[0.5em] text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="••••"
                  />
                  {busy && <p className="mt-2 text-center text-sm text-slate-400">{tr('Checking…', 'Verificando…')}</p>}
                </div>
              )}

              {/* what happened */}
              {err && (
                <p className="mt-3 text-center text-sm font-bold text-rose-600 dark:text-rose-400">
                  {err.error === 'bad_code' && tr('That code did not match a shop. Try again?', 'Ese código no coincide con ninguna tienda. ¿Intentar de nuevo?')}
                  {err.error === 'already_used' && tr(`Already used at ${err.shopName}.`, `Ya usado en ${err.shopName}.`)}
                  {err.error === 'outside_window' && tr('That offer is not running today.', 'Esa oferta no está activa hoy.')}
                  {err.error === 'not_live' && tr('The festival has not started yet.', 'El festival aún no comienza.')}
                  {err.error === 'not_your_pass' && tr('Something is off with this card. Please find a volunteer.', 'Algo pasa con esta tarjeta. Busca a un voluntario.')}
                  {err.error === 'no_backend' && tr('Punching is not switched on yet.', 'Los sellos aún no están activados.')}
                  {err.error === 'offline' && (
                    <span className="inline-flex items-center gap-1.5">
                      <WifiOff className="h-4 w-4" />
                      {tr('No signal — saved, we will finish it when you are back online.',
                          'Sin señal: guardado, lo terminamos cuando vuelvas a tener conexión.')}
                    </span>
                  )}
                </p>
              )}
              {outcome?.ok && (
                <>
                  <div className="abe-stamp mt-5 rounded-2xl bg-green-50 p-5 text-center dark:bg-green-900/20">
                    <p className="text-2xl font-black text-green-700 dark:text-green-400">
                      {tr('Punched!', '¡Sellado!')}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <Clock className="h-4 w-4" />
                      {tr('Show the green badge to the staff', 'Muestra la insignia verde al personal')}
                    </p>
                  </div>

                  {/* Optional, and it stays optional. Shops that fill this in get
                      a real pledge figure; shops that skip it lose nothing. */}
                  {!preview && !saleDone && (
                    <div className="mt-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                      <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        {tr('Staff — sale amount? Optional.', 'Personal: ¿monto de la venta? Opcional.')}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-lg font-black text-slate-400">$</span>
                        <input inputMode="decimal" value={sale}
                               onChange={(e) => setSale(e.target.value.replace(/[^0-9.]/g, '').slice(0, 7))}
                               placeholder="0.00"
                               className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-lg font-bold text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        <Button size="sm" disabled={!sale}
                                onClick={async () => {
                                  if (pass && outcome.ok) {
                                    await festivalDb.setSale(pass.id, outcome.shopId, Number(sale));
                                  }
                                  setSaleDone(true);
                                }}>
                          {tr('Save', 'Guardar')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSaleDone(true)}>
                          {tr('Skip', 'Omitir')}
                        </Button>
                      </div>
                    </div>
                  )}
                  {saleDone && (
                    <p className="mt-3 text-center text-xs text-slate-400">{tr('Thank you 💙', 'Gracias 💙')}</p>
                  )}
                </>
              )}

              <Button className="mt-6" fullWidth variant="secondary" onClick={() => setOpen(null)}>
                {tr('Close', 'Cerrar')}
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default FestivalPass;
