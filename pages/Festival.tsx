import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, Ticket, Calendar, MapPin, ArrowRight, Clock } from 'lucide-react';
import Button from '../components/Button';
import ShopCard from '../components/festival/ShopCard';
import SpotMeter, { toSpotCount } from '../components/festival/SpotMeter';
import Dialog from '../components/festival/Dialog';
import { festivalDb } from '../lib/festival/db';
import { DEFAULT_SETTINGS, fmtDay } from '../lib/festival/store';
import { FestivalShop, FestivalSettings, CATEGORY_LABEL } from '../lib/festival/types';
import { tr, isEs } from '../lib/lang';

const Festival: React.FC = () => {
  const es = isEs();
  const [shops, setShops] = useState<FestivalShop[]>([]);
  const [settings, setSettings] = useState<FestivalSettings>(DEFAULT_SETTINGS);
  const [taken, setTaken] = useState({ taken: 0, waitlist: 0 });
  const [open, setOpen] = useState<FestivalShop | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    let gone = false;
    Promise.all([festivalDb.shops(), festivalDb.settings(), festivalDb.spotCounts()]).then(([s, st, c]) => {
      if (gone) return;
      setShops(s); setSettings(st); setTaken(c);
    });
    return () => { gone = true; };
  }, []);

  const counts = useMemo(() => toSpotCount(taken.taken, taken.waitlist, settings.spots), [taken, settings.spots]);

  const ordered = [...shops].sort((a, b) => (a.spot ?? 999) - (b.spot ?? 999) || a.name.localeCompare(b.name));

  return (
    // -mt-16 eats most of Layout's pt-24, which is only empty space under the sticky navbar
    <div className="mx-auto -mt-16 max-w-5xl px-4 pb-12">
      {/* ── hero: one compact strip — the shops below are the point of the page ── */}
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-sky-100 bg-white px-5 py-5 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 md:flex-row md:justify-between md:text-left">
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
            {tr('Inclusion Festival', 'Festival de Inclusión')}{' '}
            <span className="text-sky-700 dark:text-sky-400">{tr('& Special Needs Resource Fair', 'y Feria de Recursos para Necesidades Especiales')}</span>
          </h1>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-600 dark:text-slate-300 md:justify-start">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-sky-600" />{fmtDay(settings.festivalDate, es, true)}</span>
            {settings.eventTime && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-sky-600" />{settings.eventTime}</span>}
            {settings.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-sky-600" />{settings.venue}</span>}
            <span className="inline-flex items-center gap-1.5"><Ticket className="h-4 w-4 text-sky-600" />
              {tr(`Offers through ${fmtDay(settings.redeemTo, false)}`, `Ofertas hasta el ${fmtDay(settings.redeemTo, true)}`)}</span>
          </p>
        </div>
        <div className="shrink-0">
          {settings.state === 'recruiting'
            ? <Button disabled>{tr('Cards open soon', 'Las tarjetas abren pronto')}</Button>
            : <Link to="/InclusionFestival/pass"><Button>{tr('Get my festival card', 'Obtener mi tarjeta')}</Button></Link>}
        </div>
      </div>

      {/* ── the shops: first thing after the hero, it is why families come ── */}
      <div className="mt-8" id="shops">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              {tr('Offers from local businesses', 'Ofertas de negocios locales')}
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {shops.length
                ? tr(`${shops.length} ${shops.length === 1 ? 'business is' : 'businesses are'} welcoming festival families. One offer each for your family, all month — tap one for details.`,
                     `${shops.length} ${shops.length === 1 ? 'negocio da' : 'negocios dan'} la bienvenida a las familias del festival. Una oferta de cada uno para tu familia, todo el mes: toca uno para ver detalles.`)
                : tr('The first shops are signing up now — check back soon.', 'Las primeras tiendas se están inscribiendo ahora, vuelve pronto.')}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {ordered.map((shop) => <ShopCard key={shop.id} shop={shop} onClick={() => setOpen(shop)} />)}
          {!counts.full && settings.state !== 'ended' && (
            <Link to="/InclusionFestival/join"
                  className="flex min-h-[14rem] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-300 bg-sky-50/50 p-4 text-center sm:p-6 transition hover:border-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900/40 dark:hover:border-sky-600">
              <Store className="h-10 w-10 text-sky-600 dark:text-sky-400" />
              <p className="mt-3 text-lg font-black text-slate-900 dark:text-white">{tr('Your shop here?', '¿Tu tienda aquí?')}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {tr(`Free to join · ${counts.free} ${counts.free === 1 ? 'spot' : 'spots'} left`, `Gratis · ${counts.free === 1 ? 'queda 1 lugar' : `quedan ${counts.free} lugares`}`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sky-700 dark:text-sky-400">
                {tr('Claim a spot', 'Reservar un lugar')} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── how it works ───────────────────────────────────────────────── */}
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { n: '1', en: 'Get your card — free', es: 'Obtén tu tarjeta, es gratis',
            de: 'Sign in with Google and your card appears, with every shop on it.',
            ds: 'Inicia sesión con Google y aparece tu tarjeta con todas las tiendas.' },
          { n: '2', en: 'Scan at the shop', es: 'Escanea en la tienda',
            de: 'Scan the festival QR sign by the register, tap Redeem and show the green screen.',
            ds: 'Escanea el letrero QR del festival junto a la caja, toca Canjear y muestra la pantalla verde.' },
          { n: '3', en: 'Enjoy all November', es: 'Disfruta todo noviembre',
            de: 'One offer per shop for your family, any day in November.',
            ds: 'Una oferta por tienda para tu familia, cualquier día de noviembre.' },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-black text-white">{s.n}</span>
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{tr(s.en, s.es)}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{tr(s.de, s.ds)}</p>
          </div>
        ))}
      </div>

      {/* ── businesses ─────────────────────────────────────────────────── */}
      <div className="mt-16 rounded-3xl border border-sky-100 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex items-start gap-4">
          <Store className="mt-1 h-7 w-7 shrink-0 text-sky-700 dark:text-sky-400" />
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {tr('Own a local business?', '¿Tienes un negocio local?')}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
              {tr('Free to join. You choose the offer — a free drink, two for one, a month of membership, whatever suits you. You get a month of new families through the door, your logo on every card, and a count at the end of how many came.',
                  'Participar es gratis. Tú eliges la oferta: una bebida gratis, dos por uno, un mes de membresía, lo que mejor te funcione. Recibes un mes de familias nuevas, tu logo en cada tarjeta y, al final, cuántas vinieron.')}
            </p>
            <div className="mt-5"><SpotMeter counts={counts} /></div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link to="/InclusionFestival/join">
                <Button>
                  {counts.full ? tr('Join the waiting list', 'Unirme a la lista de espera') : tr('Claim a spot', 'Reservar un lugar')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/InclusionFestival/myshop" className="text-sm font-semibold text-sky-700 underline dark:text-sky-400">
                {tr('Already signed up? My shop', '¿Ya te inscribiste? Mi tienda')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── offer detail ───────────────────────────────────────────────── */}
      {open && (
        <Dialog sheet label={open.name} onClose={close} className="bg-white p-6 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-3">
              {open.logoUrl
                ? <img src={open.logoUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl bg-white object-contain p-1 shadow-md ring-1 ring-slate-100" />
                : <span className="text-5xl" aria-hidden>{open.emoji}</span>}
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{open.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                  {es ? CATEGORY_LABEL[open.category].es : CATEGORY_LABEL[open.category].en}
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{es ? (open.offerEs || open.offerEn) : open.offerEn}</p>
            {(es ? open.detailEs || open.detailEn : open.detailEn) && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{es ? open.detailEs || open.detailEn : open.detailEn}</p>
            )}
            {open.address && (
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />{open.address}
              </p>
            )}
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              {tr(`Valid through ${fmtDay(open.redeemTo, false)}`, `Válida hasta el ${fmtDay(open.redeemTo, true)}`)}
            </p>
            {open.online && (
              <Link to={`/InclusionFestival/code/${open.id}`} className="mt-5 block">
                <Button fullWidth>{tr('Get my code for this online offer', 'Obtener mi código para esta oferta en línea')}</Button>
              </Link>
            )}
            {open.instore && (
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                {tr('In store: scan the festival QR sign at their counter.', 'En tienda: escanea el letrero QR del festival en su mostrador.')}
              </p>
            )}
            <Button className="mt-6" fullWidth variant="secondary" onClick={close}>{tr('Close', 'Cerrar')}</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Festival;
