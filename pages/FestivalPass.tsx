import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, MapPin, LogIn, QrCode } from 'lucide-react';
import Button from '../components/Button';
import ShopTile from '../components/festival/ShopTile';
import Dialog from '../components/festival/Dialog';
import { festivalDb, Pass, Redemption } from '../lib/festival/db';
import { DEFAULT_SETTINGS, fmtDay, fmtShortDay, fmtTime } from '../lib/festival/store';
import { FestivalShop, FestivalSettings, CATEGORY_LABEL } from '../lib/festival/types';
import { useAuth } from '../context/AuthContext';
import { tr, isEs } from '../lib/lang';

/**
 * The family's card: every shop, and which offers they have used.
 *
 * Nothing is redeemed from here. A family redeems by scanning the QR sign at
 * the shop's counter (pages/FestivalRedeem.tsx), so the card is a map and a
 * record — which shops are in, what each offers, and what is still to use.
 */
const FestivalPass: React.FC = () => {
  const { user, isLoading, loginWithGoogle } = useAuth();
  const es = isEs();
  const [settings, setSettings] = useState<FestivalSettings>(DEFAULT_SETTINGS);
  const [shops, setShops] = useState<FestivalShop[] | null>(null);
  const [pass, setPass] = useState<Pass | null | undefined>(undefined);
  const [used, setUsed] = useState<Redemption[]>([]);
  const [partySize, setPartySize] = useState(1);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<FestivalShop | null>(null);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    festivalDb.settings().then(setSettings);
    festivalDb.shops().then(setShops);
  }, []);

  useEffect(() => {
    if (!user) { setPass(null); setUsed([]); return; }
    festivalDb.existingPass().then(setPass);
    festivalDb.myRedemptions().then(setUsed);
  }, [user]);

  const makeCard = async () => {
    setBusy(true);
    setPass(await festivalDb.myPass(user?.name, partySize));
    setBusy(false);
  };

  const signIn = () => {
    localStorage.setItem('authReturnTo', '/InclusionFestival/pass');
    loginWithGoogle();
  };

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">{children}</div>
  );

  if (isLoading || shops === null || (user && pass === undefined)) {
    return <Shell><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></Shell>;
  }

  if (settings.state === 'recruiting') {
    return (
      <Shell>
        <Ticket className="mx-auto h-12 w-12 text-sky-300" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('Cards open soon', 'Las tarjetas abren pronto')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('We are still signing up shops. Your card will be ready at the festival.',
              'Todavía estamos inscribiendo tiendas. Tu tarjeta estará lista en el festival.')}
        </p>
        <Link to="/InclusionFestival" className="mt-8 inline-block">
          <Button variant="secondary">{tr('See the shops', 'Ver las tiendas')}</Button>
        </Link>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Ticket className="mx-auto h-12 w-12 text-sky-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('Get your festival card', 'Obtén tu tarjeta del festival')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('Sign in and your card appears, with every Mountain House shop on it. Free, and it lasts all November.',
              'Inicia sesión y aparece tu tarjeta con todas las tiendas de Mountain House. Gratis, y dura todo noviembre.')}
        </p>
        <Button className="mt-8" size="lg" onClick={signIn}>
          <LogIn className="mr-2 h-5 w-5" />{tr('Sign in with Google', 'Iniciar sesión con Google')}
        </Button>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {tr('We count visits to thank our partner shops. We never share your name or email with them.',
              'Contamos las visitas para agradecer a las tiendas. Nunca les compartimos tu nombre ni tu correo.')}
        </p>
      </Shell>
    );
  }

  if (!pass) {
    return (
      <Shell>
        <Ticket className="mx-auto h-12 w-12 text-sky-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{tr('One last thing', 'Una última cosa')}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">{tr('How many of you are coming?', '¿Cuántos vienen?')}</p>
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
        <Button className="mt-8" size="lg" disabled={busy} onClick={makeCard}>
          {busy ? tr('Making your card…', 'Creando tu tarjeta…') : tr('Make my card', 'Crear mi tarjeta')}
        </Button>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {tr('We count visits to thank our partner shops. We never share your name or email with them.',
              'Contamos las visitas para agradecer a las tiendas. Nunca les compartimos tu nombre ni tu correo.')}
        </p>
      </Shell>
    );
  }

  /* ── the card ─────────────────────────────────────────────────────── */
  const usedMap = new Map(used.map((r) => [r.shop_id, r]));
  const done = shops.filter((s) => usedMap.has(s.id)).length;
  const total = shops.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const openUsed = open ? usedMap.get(open.id) : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-3xl border-2 border-sky-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">
            🐘 {tr('Inclusion Festival card', 'Tarjeta del Festival de Inclusión')}
          </p>
          <p className="font-mono text-xs font-bold text-slate-400">{pass.short_code}</p>
        </div>
        <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{pass.display_name || user.name}</h1>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-sky-600 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="shrink-0 text-sm font-black text-slate-700 dark:text-slate-200">{done} / {total}</p>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {tr('Offers valid', 'Ofertas válidas')} {fmtDay(settings.redeemFrom, es)} – {fmtDay(settings.redeemTo, es)}
        </p>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-sky-50 p-4 dark:bg-sky-900/20">
        <QrCode className="mt-0.5 h-6 w-6 shrink-0 text-sky-700 dark:text-sky-400" />
        <p className="text-sm leading-relaxed text-sky-900 dark:text-sky-200">
          <span className="font-bold">{tr('How to use an offer:', 'Cómo usar una oferta:')}</span>{' '}
          {tr('at the shop, scan the festival QR sign by the register with your phone camera, then tap Redeem and show the green screen.',
              'en la tienda, escanea con la cámara el letrero QR del festival junto a la caja, toca Canjear y muestra la pantalla verde.')}
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-8 text-center text-slate-500">{tr('Shops are being added — check back soon.', 'Estamos agregando tiendas, vuelve pronto.')}</p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {shops.map((shop) => {
            const r = usedMap.get(shop.id);
            return (
              <ShopTile key={shop.id} shop={shop}
                        usedOn={r ? fmtShortDay(r.local_date, es) : undefined}
                        onClick={() => setOpen(shop)} />
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={async () => {
            if (!window.confirm(tr(
              'Delete your festival card?\n\nYour card is removed. Offers you already used stay used, so they cannot be claimed twice.',
              '¿Eliminar tu tarjeta del festival?\n\nTu tarjeta se elimina. Las ofertas que ya usaste siguen usadas, así no se pueden reclamar dos veces.'))) return;
            if (await festivalDb.deleteMyPass(pass.id)) setPass(null);
            else window.alert(tr('Could not delete the card. Please try again, or email us.',
                                 'No se pudo eliminar la tarjeta. Inténtalo de nuevo o escríbenos.'));
          }}
          className="text-xs font-semibold text-slate-400 underline underline-offset-2 hover:text-rose-600 dark:hover:text-rose-400"
        >
          {tr('Delete my card', 'Eliminar mi tarjeta')}
        </button>
      </div>

      {open && (
        <Dialog sheet label={open.name} onClose={close} className="bg-white p-6 dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-3">
              {open.logoUrl
                ? <img src={open.logoUrl} alt="" className="h-12 w-12 rounded-xl object-contain" />
                : <span className="text-4xl" aria-hidden>{open.emoji}</span>}
              <div className="min-w-0">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{open.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                  {es ? CATEGORY_LABEL[open.category].es : CATEGORY_LABEL[open.category].en}
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{es ? (open.offerEs || open.offerEn) : open.offerEn}</p>
            {(es ? open.detailEs || open.detailEn : open.detailEn) && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{es ? open.detailEs || open.detailEn : open.detailEn}</p>
            )}
            {open.address && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />{open.address}
              </p>
            )}
            <div className={`mt-5 rounded-2xl p-4 text-center ${openUsed ? 'bg-slate-100 dark:bg-slate-800' : 'bg-sky-50 dark:bg-sky-900/20'}`}>
              {openUsed ? (
                <p className="font-bold text-slate-600 dark:text-slate-300">
                  {tr('Used on', 'Usada el')} {fmtDay(openUsed.local_date, es)}, {fmtTime(openUsed.punched_at, es)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
                  {tr('To use it, scan the festival QR sign at their counter.', 'Para usarla, escanea el letrero QR del festival en su mostrador.')}
                </p>
              )}
            </div>
            <Button className="mt-6" fullWidth variant="secondary" onClick={close}>{tr('Close', 'Cerrar')}</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default FestivalPass;
