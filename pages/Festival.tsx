import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Store, Ticket, Calendar, MapPin, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import ShopTile from '../components/festival/ShopTile';
import SpotMeter from '../components/festival/SpotMeter';
import Dialog from '../components/festival/Dialog';
import { SimBanner, SimNote } from '../components/festival/Simulated';
import { festival, SETTINGS, fromPublic } from '../lib/festival/store';
import { festivalDb } from '../lib/festival/db';
import { FestivalShop, FestivalSettings, CATEGORY_LABEL } from '../lib/festival/types';
import { tr, isEs } from '../lib/lang';

const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString(isEs() ? 'es-US' : 'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' });

const Festival: React.FC = () => {
  /**
   * The committed file is a SNAPSHOT, not the source of truth.
   *
   * It paints the page instantly and works with no signal, which is worth
   * having. But Supabase is what is actually true, so it replaces the snapshot
   * the moment it answers — exactly as the punch card has always done.
   *
   * Before this, the landing page read the file and nothing else, so a shop you
   * approved and published sat in festival_shops with a punch code, showed up
   * on everyone's card, and was still invisible here until somebody pasted JSON
   * into GitHub and waited for a rebuild. The stage was worse: the file could
   * say "live" while the database said "recruiting", so the button invited you
   * to a card that then told you it was closed.
   */
  const [shops, setShops] = useState<FestivalShop[]>(festival.shops());
  const [settings, setSettings] = useState<FestivalSettings>(SETTINGS);
  const [open, setOpen] = useState<FestivalShop | null>(null);

  useEffect(() => {
    let gone = false;
    (async () => {
      const remote = await festivalDb.shops();
      // an empty answer means the shops are not published yet, NOT that there
      // are none — keep the snapshot rather than blanking the card
      if (!gone && remote && remote.length) setShops(remote.map(fromPublic));
      const live = await festivalDb.settings();
      if (!gone && live) setSettings((cur) => ({ ...cur, ...live }));
    })();
    return () => { gone = true; };
  }, []);

  const counts = useMemo(() => ({
    ...festival.counts(),
    taken: shops.length,
    spots: settings.spots,
    free: Math.max(0, settings.spots - shops.length),
    full: shops.length >= settings.spots,
  }), [shops, settings.spots]);

  // one square per spot, looked up BY spot number — placing by array index
  // meant a single released spot shifted every later shop into the wrong square
  const tiles: (FestivalShop | null)[] = [];
  for (let i = 1; i <= settings.spots; i++) {
    tiles.push(shops.find((s) => s.spot === i) || null);
  }
  // any shop without a spot number still deserves a tile
  shops.filter((s) => !s.spot).forEach((s) => {
    const gap = tiles.indexOf(null);
    if (gap >= 0) tiles[gap] = s;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* ── hero ───────────────────────────────────────────────────────── */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1.5 text-sm font-bold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
          <Sparkles className="h-4 w-4" />
          {tr('Mountain House', 'Mountain House')}
        </span>
        <h1 className="mt-5 text-4xl font-black text-slate-900 dark:text-white sm:text-5xl">
          {tr('Inclusion Festival', 'Festival de Inclusión')}
          <span className="block text-sky-700 dark:text-sky-400">{tr('& Resource Fair', 'y Feria de Recursos')}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          {tr('One day together, and one month of Mountain House businesses saying welcome. Every family who comes gets a digital punch card — a deal at every shop that joins in.',
              'Un día juntos y un mes entero de negocios de Mountain House dando la bienvenida. Cada familia que venga recibe una tarjeta digital: una oferta en cada tienda que participe.')}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{fmtDate(settings.festivalDate)}</span>
          <span className="inline-flex items-center gap-1.5"><Ticket className="h-4 w-4" />
            {tr('Offers valid', 'Ofertas válidas')} {fmtDate(settings.redeemFrom)} – {fmtDate(settings.redeemTo)}
          </span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />Mountain House, CA</span>
        </div>

        <div className="mt-8">
          {settings.state === 'live' ? (
            <Link to="/InclusionFestival/pass"><Button size="lg">{tr('Get my punch card', 'Obtener mi tarjeta')}</Button></Link>
          ) : (
            <div className="inline-flex flex-col items-center gap-2">
              <Button size="lg" disabled>{tr('Registration opens soon', 'La inscripción abre pronto')}</Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tr('We are signing up shops first — check back shortly.', 'Primero estamos inscribiendo tiendas, vuelve pronto.')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── how it works ───────────────────────────────────────────────── */}
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { n: '1', en: 'Register — free', es: 'Regístrate, es gratis',
            de: 'Sign in and your punch card appears, with every shop on it.',
            ds: 'Inicia sesión y aparece tu tarjeta con todas las tiendas.' },
          { n: '2', en: 'Visit a shop', es: 'Visita una tienda',
            de: 'Show your card. Staff types their 4-digit code and the stamp lands.',
            ds: 'Muestra tu tarjeta. El personal escribe su código de 4 dígitos y llega el sello.' },
          { n: '3', en: 'Fill your card', es: 'Llena tu tarjeta',
            de: 'Collect stamps all through November. Enough of them and you are in the raffle.',
            ds: 'Junta sellos durante todo noviembre. Con suficientes, entras al sorteo.' },
        ].map((s) => (
          <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-black text-white">{s.n}</span>
            <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{tr(s.en, s.es)}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{tr(s.de, s.ds)}</p>
          </div>
        ))}
      </div>

      {/* ── the card ───────────────────────────────────────────────────── */}
      <div className="mt-16">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {tr('The shops taking part', 'Las tiendas que participan')}
        </h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {shops.length
            ? tr(`${shops.length} confirmed so far — this is your punch card.`, `${shops.length} confirmadas hasta ahora: esta es tu tarjeta.`)
            : tr('The first shops are signing up now.', 'Las primeras tiendas se están inscribiendo ahora.')}
        </p>

        {shops.some((s) => s.simulated) && (
          <div className="mt-6"><SimBanner count={shops.filter((s) => s.simulated).length} /></div>
        )}

        <div className="mt-6 rounded-3xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:p-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {tiles.map((shop, i) =>
              shop
                ? <ShopTile key={shop.id} shop={shop} onClick={() => setOpen(shop)} />
                : (
                  <div key={`empty-${i}`}
                       className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600">
                    <span className="text-xl font-black">?</span>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── businesses ─────────────────────────────────────────────────── */}
      <div className="mt-16 rounded-3xl border border-sky-100 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex items-start gap-4">
          <Store className="mt-1 h-7 w-7 shrink-0 text-sky-700 dark:text-sky-400" />
          <div className="flex-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {tr('Run a shop in Mountain House?', '¿Tienes un negocio en Mountain House?')}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
              {tr('Free to join. You choose the offer — a free drink, two for one, a month of membership, whatever suits you. You get a month of new faces through the door, and your logo on every family’s card.',
                  'Participar es gratis. Tú eliges la oferta: una bebida gratis, dos por uno, un mes de membresía, lo que mejor te funcione. Ganas un mes de caras nuevas en tu puerta y tu logo en la tarjeta de cada familia.')}
            </p>
            <div className="mt-5"><SpotMeter counts={counts} /></div>
            <Link to="/InclusionFestival/join" className="mt-5 inline-block">
              <Button>
                {counts.full ? tr('Join the waiting list', 'Unirme a la lista de espera') : tr('Claim a spot', 'Reservar un lugar')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── offer detail ───────────────────────────────────────────────── */}
      {open && (
        <Dialog sheet label={open.name} onClose={() => setOpen(null)}
                className="bg-white p-6 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-3">
              {open.logoUrl
                ? <img src={open.logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />
                : <span className="text-4xl" aria-hidden>{open.emoji}</span>}
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{open.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                  {isEs() ? CATEGORY_LABEL[open.category].es : CATEGORY_LABEL[open.category].en}
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              {isEs() ? (open.offerEs || open.offerEn) : open.offerEn}
            </p>
            {(isEs() ? open.detailEs : open.detailEn) && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {isEs() ? open.detailEs : open.detailEn}
              </p>
            )}
            {open.address && (
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />{open.address}
              </p>
            )}
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              {tr('Valid', 'Válido')} {fmtDate(open.redeemFrom)} – {fmtDate(open.redeemTo)}
            </p>
            {open.simulated && <SimNote />}
            <Button className="mt-6" fullWidth variant="secondary" onClick={() => setOpen(null)}>
              {tr('Close', 'Cerrar')}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default Festival;
