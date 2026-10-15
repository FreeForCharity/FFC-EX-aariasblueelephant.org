import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Laptop, LogIn, Copy, ExternalLink, AlertTriangle, CalendarClock } from 'lucide-react';
import Button from '../components/Button';
import StayInTouch from '../components/festival/StayInTouch';
import { useAuth } from '../context/AuthContext';
import { festivalDb, OnlineCode } from '../lib/festival/db';
import { fmtDay, fmtTime } from '../lib/festival/store';
import { FestivalShop } from '../lib/festival/types';
import { tr, isEs } from '../lib/lang';

/**
 * /InclusionFestival/code/:shopId — an online offer (classes, tutoring…).
 *
 * There is no counter to scan, so the family signs in and gets a personal
 * code to quote when they book. Same rule as in store: one per Google account
 * per business, and asking again shows the same code.
 */
const FestivalOnlineCode: React.FC = () => {
  const { shopId = '' } = useParams();
  const { user, isLoading, loginWithGoogle } = useAuth();
  const es = isEs();
  const [shop, setShop] = useState<FestivalShop | null | undefined>(undefined);
  const [result, setResult] = useState<OnlineCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optin, setOptin] = useState(false);

  useEffect(() => {
    festivalDb.shops().then((all) => setShop(all.find((s) => s.id === shopId && s.online) || null));
  }, [shopId]);

  // already have one? show it straight away, without a tap
  useEffect(() => {
    if (!user || !shop) return;
    festivalDb.myRedemptions().then((rs) => {
      const r = rs.find((x) => x.shop_id === shop.id);
      if (r) setResult(r.code ? { ok: true, code: r.code, punched_at: r.punched_at, again: true } : { ok: false, error: 'already_used', punched_at: r.punched_at });
    });
    festivalDb.existingPass().then((p) => setOptin(!!p?.email_optin));
  }, [user, shop]);

  const getCode = async () => {
    if (!shop) return;
    setBusy(true);
    const r = await festivalDb.onlineCode(shop.id);
    setResult(r);
    if (r.ok) festivalDb.existingPass().then((p) => setOptin(!!p?.email_optin));
    setBusy(false);
  };

  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt(tr('Copy your code:', 'Copia tu código:'), code); }
  };

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
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{tr('This online offer is not available', 'Esta oferta en línea no está disponible')}</h1>
          <Link to="/InclusionFestival" className="mt-8 inline-block"><Button variant="secondary">{tr('See all offers', 'Ver todas las ofertas')}</Button></Link>
        </div>
      </Shell>
    );
  }

  const offer = es ? (shop.offerEs || shop.offerEn) : shop.offerEn;
  const detail = es ? (shop.detailEs || shop.detailEn) : shop.detailEn;

  return (
    <Shell>
      <div className="rounded-3xl border-2 border-sky-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          <Laptop className="h-3.5 w-3.5" />{tr('Online offer', 'Oferta en línea')}
        </p>
        <div className="mt-4 flex justify-center">
          {shop.logoUrl
            ? <img src={shop.logoUrl} alt="" className="h-24 w-24 rounded-2xl bg-white object-contain p-1.5 shadow-md ring-1 ring-slate-100" />
            : <span className="text-6xl" aria-hidden>{shop.emoji}</span>}
        </div>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{shop.name}</h1>
        <p className="mt-2 text-lg font-bold text-amber-800 dark:text-amber-200">🎁 {offer}</p>
        {detail && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{detail}</p>}
      </div>

      {result?.ok && result.code ? (
        <div className="mt-5 rounded-3xl border-[3px] border-[#E0A526] bg-[#FFFBEB] p-6 text-center dark:bg-amber-900/20">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{tr('Your personal code', 'Tu código personal')}</p>
          <p className="mt-2 select-all font-mono text-4xl font-black tracking-widest text-[#0C4A6E] dark:text-sky-300">{result.code}</p>
          <button onClick={() => copy(result.code!)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 dark:text-sky-400">
            <Copy className="h-4 w-4" />{copied ? tr('Copied', 'Copiado') : tr('Copy code', 'Copiar código')}
          </button>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">
            {shop.onlineNote || tr(`Quote this code when you book with ${shop.name}.`, `Menciona este código al reservar con ${shop.name}.`)}
          </p>
          {shop.onlineLink && (
            <a href={shop.onlineLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Button><ExternalLink className="mr-2 h-4 w-4" />{tr(`Book with ${shop.name}`, `Reservar con ${shop.name}`)}</Button>
            </a>
          )}
          <p className="mt-4 text-xs text-slate-500">
            {tr('Valid until', 'Válido hasta el')} {fmtDay(shop.redeemTo, es)} · {tr('This code is yours alone — one per account.', 'Este código es solo tuyo: uno por cuenta.')}
          </p>
        </div>
      ) : result && !result.ok && result.error === 'already_used' ? (
        <div className="mt-5 rounded-3xl bg-slate-200 p-6 text-center dark:bg-slate-800">
          <p className="text-2xl font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">{tr('Already used', 'Ya utilizada')}</p>
          {result.punched_at && <p className="mt-2 text-slate-600 dark:text-slate-400">{fmtDay(result.punched_at.slice(0, 10), es)}, {fmtTime(result.punched_at, es)}</p>}
        </div>
      ) : result && !result.ok && (result.error === 'not_started' || result.error === 'ended') ? (
        <div className="mt-5 rounded-3xl bg-amber-50 p-6 text-center dark:bg-amber-900/20">
          <CalendarClock className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-2 text-lg font-black text-amber-900 dark:text-amber-200">
            {result.error === 'ended' ? tr('This offer has ended', 'Esta oferta terminó') : tr('This offer has not started yet', 'Esta oferta aún no empieza')}
          </p>
        </div>
      ) : !user ? (
        <div className="mt-5 text-center">
          <Button size="lg" fullWidth onClick={() => { localStorage.setItem('authReturnTo', `/InclusionFestival/code/${shop.id}`); loginWithGoogle(); }}>
            <LogIn className="mr-2 h-5 w-5" />{tr('Sign in with Google to get my code', 'Inicia sesión con Google para obtener mi código')}
          </Button>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {tr('Use the same Google account as your festival card. No card yet? Signing in makes one — it’s free.',
                'Usa la misma cuenta de Google de tu tarjeta del festival. ¿Aún no tienes tarjeta? Al iniciar sesión se crea una, es gratis.')}
          </p>
        </div>
      ) : (
        <div className="mt-5 text-center">
          <button type="button" disabled={busy} onClick={getCode}
            className="w-full rounded-2xl bg-[#0C4A6E] py-5 text-xl font-black uppercase tracking-wider text-white shadow-lg transition active:scale-[0.98] disabled:opacity-60">
            {busy ? tr('Getting your code…', 'Obteniendo tu código…') : tr('Get my code', 'Obtener mi código')}
          </button>
          {result && !result.ok && (
            <p className="mt-3 text-sm font-bold text-rose-600">{tr('Something went wrong. Please try again.', 'Algo salió mal. Inténtalo de nuevo.')}</p>
          )}
          <p className="mt-3 text-xs text-slate-500">{tr(`Signed in as ${user.email}`, `Sesión iniciada como ${user.email}`)}</p>
        </div>
      )}

      {result?.ok && <div className="mt-8 flex justify-center"><StayInTouch optin={optin} /></div>}

      <Link to="/InclusionFestival" className="mt-8 block text-center text-sm font-semibold text-sky-700 underline dark:text-sky-400">
        {tr('See all festival offers', 'Ver todas las ofertas del festival')}
      </Link>
    </Shell>
  );
};

export default FestivalOnlineCode;
