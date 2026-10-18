import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Store, Ticket, Calendar, MapPin, ArrowRight, Clock } from 'lucide-react';
import Button from '../components/Button';
import ShopCard from '../components/festival/ShopCard';
import SpotMeter, { toSpotCount } from '../components/festival/SpotMeter';
import Dialog from '../components/festival/Dialog';
import VideoFacade from '../components/festival/VideoFacade';
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
  const [loaded, setLoaded] = useState(false);
  // two tabs: local businesses, and kid-run Young Founders. The address is the tab —
  // /InclusionFestival/youngfounders (or the older #young-founders) opens the second
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const tab: 'shops' | 'young' = /\/youngfounders\/?$/i.test(pathname) || hash === '#young-founders' ? 'young' : 'shops';
  // replace, not push: a tab click is not a page to go back to
  const pick = (t: 'shops' | 'young') =>
    navigate(t === 'young' ? '/InclusionFestival/youngfounders' : '/InclusionFestival', { replace: true, state: { keepScroll: true } });

  useEffect(() => {
    let gone = false;
    Promise.all([festivalDb.shops(), festivalDb.settings(), festivalDb.spotCounts()]).then(([s, st, c]) => {
      if (gone) return;
      setShops(s); setSettings(st); setTaken(c); setLoaded(true);
    });
    return () => { gone = true; };
  }, []);

  // a link straight to the kids' tab lands on the tabs once the page has its content
  useEffect(() => {
    if (!loaded || tab !== 'young') return;
    document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // only on arrival; tab clicks stay put
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const counts = useMemo(() => toSpotCount(taken.taken, taken.waitlist, settings.spots), [taken, settings.spots]);

  const byName = (a: FestivalShop, b: FestivalShop) => (a.spot ?? 999) - (b.spot ?? 999) || a.name.localeCompare(b.name);
  const regular = shops.filter((s) => !s.youngFounder);
  const ordered = regular.sort(byName);
  const founders = shops.filter((s) => s.youngFounder).sort(byName);

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
            ? <Button disabled>{tr('Offers open soon', 'Las ofertas abren pronto')}</Button>
            : <Link to="/InclusionFestival/pass"><Button>{tr('My Festival Offers', 'Mis ofertas del festival')}</Button></Link>}
          <button type="button" onClick={() => { pick('young'); document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className="mx-auto mt-2 block text-sm font-bold text-amber-700 hover:underline dark:text-amber-400 md:mx-0">
            🌟 {tr('Young Founders', 'Jóvenes Emprendedores')}
          </button>
        </div>
      </div>

      {/* ── the tabs: local businesses first, it is why families come; then the kids ── */}
      <div id="offers" role="tablist" aria-label={tr('Festival offers', 'Ofertas del festival')}
           className="mt-8 flex scroll-mt-24 gap-2 border-b-2 border-slate-200 dark:border-slate-700">
        {([
          ['shops', <><Store className="h-5 w-5" />{tr('Local businesses', 'Negocios locales')}</>, regular.length, 'border-sky-600 text-sky-800 dark:text-sky-300'],
          ['young', <>🌟 {tr('Young Founders', 'Jóvenes Emprendedores')}</>, founders.length, 'border-amber-500 text-amber-800 dark:text-amber-300'],
        ] as const).map(([k, label, n, on]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} aria-controls={k === 'young' ? 'young-founders' : 'shops'}
                  onClick={() => pick(k)}
                  className={`-mb-0.5 inline-flex flex-1 items-center justify-center gap-2 rounded-t-xl border-b-4 px-2 py-2.5 text-sm font-black leading-tight transition sm:flex-none sm:px-5 sm:text-lg ${tab === k
                    ? `${on} bg-white dark:bg-slate-900` : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            {label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === k ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-100/70 dark:bg-slate-800/70'}`}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'shops' && (
      <div className="mt-6" id="shops" role="tabpanel">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              {tr('Offers from participating businesses', 'Ofertas de los negocios participantes')}
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {regular.length
                ? tr(`${regular.length} ${regular.length === 1 ? 'business is' : 'businesses are'} welcoming festival families. One offer each for your family, all month — tap one for details.`,
                     `${regular.length} ${regular.length === 1 ? 'negocio da' : 'negocios dan'} la bienvenida a las familias del festival. Una oferta de cada uno para tu familia, todo el mes: toca uno para ver detalles.`)
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
      )}

      {/* ── young founders: kid-run businesses, their own tab, never counted against the shop spots ── */}
      {tab === 'young' && (
      <div className="mt-6 rounded-3xl border-2 border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/50 dark:bg-slate-900/60 sm:p-8" id="young-founders" role="tabpanel">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">🌟 {tr('Young Founders', 'Jóvenes Emprendedores')}</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {tr('Businesses run by kids in our community. Their offers work just like the shops’ — and every purchase builds a young entrepreneur’s confidence.',
              'Negocios dirigidos por niños y jóvenes de nuestra comunidad. Sus ofertas funcionan igual que las de las tiendas, y cada compra le da confianza a un joven emprendedor.')}
        </p>

        {founders.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {founders.map((shop) => (
              <div key={shop.id} className="flex flex-col gap-3">
                <ShopCard shop={shop} onClick={() => setOpen(shop)} />
                {shop.videoId && <VideoFacade id={shop.videoId} title={tr(`Video from ${shop.name}`, `Video de ${shop.name}`)} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-white p-5 text-center font-bold text-amber-900 dark:bg-slate-800 dark:text-amber-200">
            {tr('Be the first young founder featured here!', '¡Sé el primer joven emprendedor que aparezca aquí!')}
          </p>
        )}

        {settings.state !== 'ended' && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-center">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              {tr('Run a business and you’re under 18? Get featured here — free.', '¿Tienes un negocio y eres menor de 18? Aparece aquí, es gratis.')}
            </p>
            <Link to="/InclusionFestival/youngfounders/join">
              <Button>{tr('Get featured', 'Quiero aparecer')}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        )}
      </div>
      )}

      {/* ── how it works ───────────────────────────────────────────────── */}
      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { n: '1', en: 'Sign in — free', es: 'Inicia sesión, es gratis',
            de: 'Sign in with Google once. My Festival Offers keeps every offer, and which ones you have used, in one place.',
            ds: 'Inicia sesión con Google una vez. Mis ofertas del festival guarda todas las ofertas, y las que ya usaste, en un solo lugar.' },
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
              {tr('Own a business?', '¿Tienes un negocio?')}
            </h2>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
              {tr('Free to join. You choose the offer — a free drink, two for one, a month of membership, whatever suits you. You get a month of new families through the door, your logo on our website shared with our community, and a count at the end of how many came.',
                  'Participar es gratis. Tú eliges la oferta: una bebida gratis, dos por uno, un mes de membresía, lo que mejor te funcione. Recibes un mes de familias nuevas, tu logo en nuestro sitio compartido con nuestra comunidad y, al final, cuántas vinieron.')}
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
                {open.youngFounder && <p className="text-xs font-bold text-amber-700 dark:text-amber-400">🌟 {tr('Young Founder', 'Joven Emprendedor')}</p>}
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
