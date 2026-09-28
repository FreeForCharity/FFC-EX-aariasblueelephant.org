import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, RefreshCw, AlertTriangle, CalendarDays } from 'lucide-react';
import Button from '../components/Button';
import { festivalDb, ShopConsole } from '../lib/festival/db';
import { tr, isEs } from '../lib/lang';

/**
 * The shop's till screen. One link, bookmarked once, left on the counter phone.
 *
 * The token lives in the URL hash rather than the query string, so it stays out
 * of referrer headers on the way to anywhere else. It is the only thing that
 * identifies the shop — deliberately not the shop id, which is public in
 * data/festival.json and would otherwise let anyone read the punch code.
 */
const FestivalShopConsole: React.FC = () => {
  const [token] = useState(() =>
    (typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '').trim() : ''));
  const [shop, setShop] = useState<ShopConsole | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!token) { setLoading(false); return; }
    quiet ? setRefreshing(true) : setLoading(true);
    setShop(await festivalDb.shopConsole(token));
    setLoading(false); setRefreshing(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);
  // the tally is the reason a shop keeps this open, so keep it honest
  useEffect(() => {
    const t = setInterval(() => load(true), 60000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('This link is not working', 'Este enlace no funciona')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('Use the exact link from your welcome email. If you have lost it, email us and we will send it again.',
              'Usa el enlace exacto de tu correo de bienvenida. Si lo perdiste, escríbenos y te lo enviamos otra vez.')}
        </p>
        <Link to="/InclusionFestival" className="mt-8 inline-block">
          <Button variant="secondary">{tr('About the festival', 'Sobre el festival')}</Button>
        </Link>
      </div>
    );
  }

  const offer = isEs() ? (shop.offer_es || shop.offer_en) : shop.offer_en;
  const detail = isEs() ? shop.detail_es : shop.detail_en;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-3xl border-2 border-sky-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-center gap-3">
          {shop.logo_url
            ? <img src={shop.logo_url} alt="" className="h-12 w-12 rounded-xl object-contain" />
            : <span className="text-4xl" aria-hidden>{shop.emoji || '🏪'}</span>}
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">{shop.name}</h1>
        </div>
        <p className="mt-2 font-bold text-slate-600 dark:text-slate-300">{offer}</p>
        {detail && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>}

        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          {tr('Your code', 'Tu código')}
        </p>
        <div className="mt-2 flex justify-center gap-2 sm:gap-3">
          {shop.punch_code.split('').map((d, i) => (
            <span key={i}
                  className="flex h-20 w-16 items-center justify-center rounded-2xl border-4 border-sky-600 bg-sky-50 font-mono text-4xl font-black text-sky-800 dark:bg-slate-800 dark:text-sky-300 sm:h-24 sm:w-20 sm:text-5xl">
              {d}
            </span>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{shop.today}</p>
            <p className="text-xs font-bold text-slate-500">{tr('today', 'hoy')}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{shop.total}</p>
            <p className="text-xs font-bold text-slate-500">{tr('all November', 'todo noviembre')}</p>
          </div>
        </div>
        <button onClick={() => load(true)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-sky-600">
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {tr('Refresh', 'Actualizar')}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-bold text-slate-900 dark:text-white">{tr('What to do', 'Qué hacer')}</h2>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <li>{tr('1. A customer shows you their punch card and hands you their phone.', '1. Un cliente te muestra su tarjeta y te pasa su teléfono.')}</li>
          <li>{tr('2. Type the four digits above.', '2. Escribe los cuatro dígitos de arriba.')}</li>
          <li>
            <strong>{tr('3. Give the offer only while the badge is GREEN.', '3. Da la oferta solo mientras la insignia esté VERDE.')}</strong>{' '}
            {tr('A stamp with a time on it was used earlier and has already been claimed.',
                'Un sello con una hora ya fue usado antes y ya se reclamó.')}
          </li>
        </ol>
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {tr('Keep this code to yourself — it is what protects your offer.',
              'Guarda este código para ti: es lo que protege tu oferta.')}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Smartphone className="h-4 w-4 text-sky-600" />
          {tr('Keep this on the till phone', 'Deja esto en el teléfono de la caja')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {tr('Tap your browser’s share button and choose “Add to Home Screen”. It becomes an icon your staff can open in one tap — nothing to install and nothing to log into.',
              'Toca el botón de compartir del navegador y elige «Agregar a la pantalla de inicio». Se convierte en un ícono que tu personal abre con un toque: nada que instalar ni con qué iniciar sesión.')}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {tr('Offer runs', 'La oferta va')} {shop.redeem_from} → {shop.redeem_to}
        </p>
      </div>
    </div>
  );
};

export default FestivalShopConsole;
