import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, LogIn, MapPin, Ticket, CalendarClock } from 'lucide-react';
import Button from '../components/Button';
import StayInTouch from '../components/festival/StayInTouch';
import { useAuth } from '../context/AuthContext';
import { festivalDb, SignShop, RedeemOutcome } from '../lib/festival/db';
import { fmtDay, fmtTime } from '../lib/festival/store';
import { CATEGORY_EMOJI, isCategory } from '../lib/festival/types';
import { tr, isEs } from '../lib/lang';

/**
 * /r/:token — what a family's phone opens when they scan a shop's QR sign.
 *
 * Scanning never redeems on its own. The family taps Redeem, at the counter,
 * and their phone shows a full-screen green REDEEMED with a ticking clock —
 * that screen is what staff look at. A screenshot cannot tick, and an offer
 * used before shows grey with the date it was used.
 */

const CSS = `
@keyframes abeStampIn {
  0%   { transform: scale(3) rotate(-25deg); opacity: 0; }
  55%  { transform: scale(.9) rotate(-10deg); opacity: 1; }
  75%  { transform: scale(1.06) rotate(-10deg); }
  100% { transform: scale(1) rotate(-10deg); opacity: 1; }
}
@keyframes abeRing { 0% { transform: scale(.6); opacity: .7; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes abeBlink { 50% { opacity: .35; } }
.abe-stamp-in { animation: abeStampIn .55s cubic-bezier(.2,.8,.3,1) both; }
.abe-ring { animation: abeRing 1.1s ease-out .15s both; }
.abe-blink { animation: abeBlink 1s steps(1) infinite; }
@media (prefers-reduced-motion: reduce) { .abe-stamp-in, .abe-ring { animation: none; } .abe-blink { animation: none; } }
`;

/** a stamp "ka-chunk" and a bright chime, synthesised — nothing to download */
function playStamp() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ac = new Ctx();
    const t = ac.currentTime;
    const thump = ac.createOscillator(), tg = ac.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(160, t);
    thump.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    tg.gain.setValueAtTime(0.9, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    thump.connect(tg).connect(ac.destination);
    thump.start(t); thump.stop(t + 0.25);
    [880, 1318.5].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const s = t + 0.2 + i * 0.12;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.35, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.6);
      o.connect(g).connect(ac.destination);
      o.start(s); o.stop(s + 0.65);
    });
    setTimeout(() => ac.close().catch(() => {}), 1500);
  } catch { /* sound is a bonus */ }
  try { navigator.vibrate?.([60, 40, 120]); } catch { /* not on iPhone */ }
}

const Clock: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const hms = now.toLocaleTimeString(isEs() ? 'es-US' : 'en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  return (
    <div className="mt-6 text-center">
      <p className="font-mono text-5xl font-black tabular-nums tracking-tight sm:text-6xl">{hms}</p>
      <p className="mt-1 text-lg font-bold opacity-90">
        {now.toLocaleDateString(isEs() ? 'es-US' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
};

const FestivalRedeem: React.FC = () => {
  const { token = '' } = useParams();
  const { user, isLoading, loginWithGoogle } = useAuth();
  const [shop, setShop] = useState<SignShop | null | undefined>(undefined);
  const [usedAt, setUsedAt] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<RedeemOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [optin, setOptin] = useState(false);
  const fired = useRef(false);

  useEffect(() => { festivalDb.signShop(token).then(setShop); }, [token]);

  // has this account already used this shop's offer?
  useEffect(() => {
    if (!user || !shop) return;
    festivalDb.myRedemptions().then((rs) => {
      const r = rs.find((x) => x.shop_id === shop.id);
      setUsedAt(r ? r.punched_at : null);
      setChecked(true);
    });
  }, [user, shop]);

  const signIn = useCallback(() => {
    localStorage.setItem('authReturnTo', `/r/${token}`);
    loginWithGoogle();
  }, [token, loginWithGoogle]);

  const redeem = async () => {
    if (busy || fired.current) return;
    setBusy(true);
    const r = await festivalDb.redeem(token);
    setOutcome(r);
    if (r.ok) {
      fired.current = true;
      playStamp();
      festivalDb.existingPass().then((p) => setOptin(!!p?.email_optin));
    }
    else if (r.error === 'already_used' && r.punched_at) setUsedAt(r.punched_at);
    setBusy(false);
  };

  const es = isEs();
  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto max-w-md px-4 py-10">{children}</div>
  );

  if (shop === undefined || isLoading) {
    return <Shell><div className="mx-auto mt-16 h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></Shell>;
  }

  if (shop === null) {
    return (
      <Shell>
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
            {tr('This sign is not working', 'Este letrero no funciona')}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {tr('The shop may no longer be part of the festival. Please ask the staff, or see the shops that are.',
                'Puede que la tienda ya no participe en el festival. Pregunta al personal o mira las tiendas que sí participan.')}
          </p>
          <Link to="/InclusionFestival" className="mt-8 inline-block">
            <Button variant="secondary">{tr('See the festival shops', 'Ver las tiendas del festival')}</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const offer = es ? (shop.offer_es || shop.offer_en) : shop.offer_en;
  const detail = es ? (shop.detail_es || shop.detail_en) : shop.detail_en;
  const emoji = isCategory(shop.category) ? CATEGORY_EMOJI[shop.category] : '🏪';

  /* ── the green screen staff look at ─────────────────────────────── */
  if (outcome?.ok) {
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center overflow-y-auto bg-green-600 px-6 pb-10 pt-[12vh] text-white">
        <style>{CSS}</style>
        <div className="relative flex items-center justify-center">
          <span className="abe-ring absolute h-40 w-40 rounded-full border-8 border-white/70" aria-hidden />
          <div className="abe-stamp-in rounded-2xl border-[6px] border-white px-6 py-3">
            <p className="text-4xl font-black uppercase tracking-widest sm:text-5xl">{tr('Redeemed', 'Canjeada')}</p>
          </div>
        </div>
        <p className="mt-8 text-center text-3xl font-black leading-tight">{shop.name}</p>
        <p className="mt-2 max-w-sm text-center text-xl font-bold opacity-95">{offer}</p>
        {user?.name && <p className="mt-2 text-base font-semibold opacity-80">{user.name}</p>}
        <Clock />
        <p className="abe-blink mt-6 rounded-full bg-white/20 px-5 py-2 text-center text-base font-black">
          {tr('Show this screen to the staff', 'Muestra esta pantalla al personal')}
        </p>
        {outcome.new_card && (
          <p className="mt-4 max-w-xs text-center text-sm opacity-90">
            {tr('Every other participating business has an offer for you too — see them in My Festival Offers.',
                'Todos los demás negocios participantes también tienen una oferta para ti: velas en Mis ofertas del festival.')}
          </p>
        )}
        <Link to="/InclusionFestival/pass" className="mt-8">
          <span className="rounded-xl bg-white px-5 py-3 font-bold text-green-700 shadow">
            {tr('My Festival Offers', 'Mis ofertas del festival')}
          </span>
        </Link>
        {/* below the fold: staff read the screen above, the family scrolls to this after */}
        <div className="mt-10"><StayInTouch optin={optin} dark /></div>
      </div>
    );
  }

  const ShopHeader = (
    <div className="rounded-3xl border-2 border-sky-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">
        🐘 {tr('Inclusion Festival offer', 'Oferta del Festival de Inclusión')}
      </p>
      <div className="mt-4 flex items-center justify-center gap-3">
        {shop.logo_url
          ? <img src={shop.logo_url} alt="" className="h-24 w-24 rounded-2xl bg-white object-contain p-1.5 shadow-md ring-1 ring-slate-100" />
          : <span className="text-6xl" aria-hidden>{emoji}</span>}
      </div>
      <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{shop.name}</h1>
      <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">{offer}</p>
      {detail && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{detail}</p>}
      {shop.address && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <MapPin className="h-4 w-4" />{shop.address}
        </p>
      )}
    </div>
  );

  /* ── used before ────────────────────────────────────────────────── */
  if (usedAt) {
    return (
      <Shell>
        {ShopHeader}
        <div className="mt-5 rounded-3xl bg-slate-200 p-6 text-center dark:bg-slate-800">
          <p className="text-2xl font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
            {tr('Already used', 'Ya utilizada')}
          </p>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {tr('This offer was used on', 'Esta oferta se usó el')} {fmtDay(usedAt.slice(0, 10), es)}, {fmtTime(usedAt, es)}.
          </p>
        </div>
        <Link to="/InclusionFestival/pass" className="mt-6 block">
          <Button fullWidth variant="secondary">{tr('My Festival Offers', 'Mis ofertas del festival')}</Button>
        </Link>
      </Shell>
    );
  }

  /* ── not running today ──────────────────────────────────────────── */
  const notYet = shop.state !== 'live' || shop.today < shop.redeem_from;
  const over = shop.state === 'ended' || shop.today > shop.redeem_to;
  if (over || notYet || (outcome && !outcome.ok && (outcome.error === 'not_started' || outcome.error === 'ended'))) {
    return (
      <Shell>
        {ShopHeader}
        <div className="mt-5 rounded-3xl bg-amber-50 p-6 text-center dark:bg-amber-900/20">
          <CalendarClock className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-2 text-lg font-black text-amber-900 dark:text-amber-200">
            {over
              ? tr('This offer has ended', 'Esta oferta terminó')
              : tr(`Offers start ${fmtDay(shop.redeem_from, false)}`, `Las ofertas empiezan el ${fmtDay(shop.redeem_from, true)}`)}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            {tr('Valid', 'Válida')} {fmtDay(shop.redeem_from, es)} – {fmtDay(shop.redeem_to, es)}
          </p>
        </div>
        <Link to="/InclusionFestival" className="mt-6 block">
          <Button fullWidth variant="secondary">{tr('About the festival', 'Sobre el festival')}</Button>
        </Link>
      </Shell>
    );
  }

  /* ── signed out ─────────────────────────────────────────────────── */
  if (!user) {
    return (
      <Shell>
        {ShopHeader}
        <div className="mt-5 text-center">
          <Button size="lg" fullWidth onClick={signIn}>
            <LogIn className="mr-2 h-5 w-5" />{tr('Sign in with Google to redeem', 'Inicia sesión con Google para canjear')}
          </Button>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {tr('Use the same Google account every time, so your offers stay in one place. First time? Just sign in — it’s free.',
                'Usa siempre la misma cuenta de Google, así tus ofertas quedan en un solo lugar. ¿Primera vez? Solo inicia sesión, es gratis.')}
          </p>
        </div>
      </Shell>
    );
  }

  /* ── ready to redeem ────────────────────────────────────────────── */
  const err = outcome && !outcome.ok ? outcome : null;
  return (
    <Shell>
      {ShopHeader}
      <div className="mt-5 rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-center dark:border-green-900/50 dark:bg-green-900/20">
        <Ticket className="mx-auto h-8 w-8 text-green-700 dark:text-green-400" />
        <p className="mt-2 font-bold text-green-900 dark:text-green-200">
          {tr('Tap at the counter, in front of the staff.', 'Toca en el mostrador, frente al personal.')}
        </p>
        <p className="mt-1 text-sm text-green-800 dark:text-green-300">
          {tr('It can only be used once.', 'Solo se puede usar una vez.')}
        </p>
        <button
          type="button"
          disabled={busy || !checked}
          onClick={redeem}
          className="mt-5 w-full rounded-2xl bg-green-600 py-5 text-2xl font-black uppercase tracking-wider text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? tr('Redeeming…', 'Canjeando…') : tr('Redeem now', 'Canjear ahora')}
        </button>
        {err && (
          <p className="mt-3 text-sm font-bold text-rose-600 dark:text-rose-400">
            {err.error === 'network'
              ? tr('No connection. Check your signal and tap again.', 'Sin conexión. Revisa tu señal y toca otra vez.')
              : err.error === 'bad_token'
                ? tr('This sign is no longer active.', 'Este letrero ya no está activo.')
                : tr('Something went wrong. Please tap again.', 'Algo salió mal. Toca otra vez.')}
          </p>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
        {tr(`Signed in as ${user.email}`, `Sesión iniciada como ${user.email}`)}
      </p>
    </Shell>
  );
};

export default FestivalRedeem;
