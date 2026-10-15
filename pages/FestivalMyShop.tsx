import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, LogIn, Printer, Clock, Hourglass, XCircle, Pencil } from 'lucide-react';
import Button from '../components/Button';
import { QrSign, PrintTarget, printSign } from '../components/festival/QrSign';
import { festivalDb, MyShop } from '../lib/festival/db';
import { fmtShortDay } from '../lib/festival/store';
import { useAuth } from '../context/AuthContext';
import { tr, isEs } from '../lib/lang';

/**
 * /InclusionFestival/myshop — the shop owner's own page, behind their Google
 * sign-in. Waiting: what they sent and how to change it. Approved: their QR
 * sign to print, and how many families have redeemed.
 */
const FestivalMyShop: React.FC = () => {
  const { user, isLoading, loginWithGoogle } = useAuth();
  const es = isEs();
  const [shop, setShop] = useState<MyShop | null | undefined>(undefined);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { setShop(null); return; }
    festivalDb.myShop().then(setShop);
  }, [user, isLoading]);

  const signIn = () => {
    localStorage.setItem('authReturnTo', '/InclusionFestival/myshop');
    loginWithGoogle();
  };

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">{children}</div>
  );

  if (isLoading || shop === undefined) {
    return <Shell><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></Shell>;
  }

  if (!user) {
    return (
      <Shell>
        <Store className="mx-auto h-12 w-12 text-sky-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{tr('Your festival shop', 'Tu tienda del festival')}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('Sign in with the Google account you signed up with.', 'Inicia sesión con la cuenta de Google con la que te inscribiste.')}
        </p>
        <Button className="mt-8" size="lg" onClick={signIn}>
          <LogIn className="mr-2 h-5 w-5" />{tr('Sign in with Google', 'Iniciar sesión con Google')}
        </Button>
      </Shell>
    );
  }

  if (!shop) {
    return (
      <Shell>
        <Store className="mx-auto h-12 w-12 text-sky-300" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{tr('No shop on this account', 'No hay tienda en esta cuenta')}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr(`You are signed in as ${user.email}. Signed up with a different account? Sign out and back in with that one.`,
              `Iniciaste sesión como ${user.email}. ¿Te inscribiste con otra cuenta? Cierra sesión y entra con esa.`)}
        </p>
        <Link to="/InclusionFestival/join" className="mt-8 inline-block">
          <Button>{tr('Sign up my shop', 'Inscribir mi tienda')}</Button>
        </Link>
      </Shell>
    );
  }

  /* ── waiting, waitlisted or declined ─────────────────────────────── */
  if (shop.status !== 'approved') {
    const waiting = shop.status === 'pending';
    const listed = shop.status === 'waitlist';
    return (
      <Shell>
        {waiting ? <Hourglass className="mx-auto h-12 w-12 text-sky-600" />
          : listed ? <Clock className="mx-auto h-12 w-12 text-amber-500" />
          : <XCircle className="mx-auto h-12 w-12 text-slate-400" />}
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {waiting ? tr('Thanks — we are reviewing your offer', 'Gracias, estamos revisando tu oferta')
            : listed ? tr('You are on the waiting list', 'Estás en la lista de espera')
            : tr('Not on the card this time', 'Esta vez no está en la tarjeta')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {waiting ? tr('We will email you within 48 hours. Once approved, your QR sign appears right here to print.',
                        'Te escribiremos en 48 horas. Al ser aprobado, tu letrero QR aparece aquí mismo para imprimir.')
            : listed ? tr('Every spot is taken right now. We will email you the moment one opens.',
                          'Todos los lugares están ocupados. Te escribiremos en cuanto se libere uno.')
            : tr('Thank you for your interest. Reply to our email if you have questions.',
                 'Gracias por tu interés. Responde a nuestro correo si tienes preguntas.')}
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-left dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-black text-slate-900 dark:text-white">{shop.name}</p>
          <p className="mt-1 font-semibold text-sky-800 dark:text-sky-300">{shop.offer_en}</p>
          {shop.detail_en && <p className="mt-1 text-sm text-slate-500">{shop.detail_en}</p>}
          <p className="mt-3 text-xs text-slate-500">{shop.contact_name} · {shop.contact_email}{shop.contact_phone ? ` · ${shop.contact_phone}` : ''}</p>
        </div>
        {(waiting || listed) && (
          <Link to="/InclusionFestival/join" className="mt-5 inline-block">
            <Button variant="secondary"><Pencil className="mr-2 h-4 w-4" />{tr('Edit my sign-up', 'Editar mi inscripción')}</Button>
          </Link>
        )}
      </Shell>
    );
  }

  /* ── approved ─────────────────────────────────────────────────────── */
  const maxDay = Math.max(1, ...shop.days.map((d) => d.count));
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-black uppercase tracking-widest text-green-700 dark:text-green-400">
        ✓ {tr('On the festival card', 'En la tarjeta del festival')}
      </p>
      <h1 className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{shop.name}</h1>
      <p className="mt-1 font-semibold text-sky-800 dark:text-sky-300">{es ? (shop.offer_es || shop.offer_en) : shop.offer_en}</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { n: shop.total, en: 'families redeemed', es: 'familias canjearon' },
          { n: shop.today, en: 'today', es: 'hoy' },
          { n: shop.new_cards, en: 'joined at your counter', es: 'se unieron en tu mostrador' },
        ].map((s) => (
          <div key={s.en} className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800">
            <p className="text-3xl font-black text-slate-900 dark:text-white">{s.n}</p>
            <p className="text-xs font-bold text-slate-500">{tr(s.en, s.es)}</p>
          </div>
        ))}
      </div>

      {shop.days.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{tr('By day', 'Por día')}</p>
          <div className="mt-3 space-y-1.5">
            {shop.days.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-slate-500">{fmtShortDay(d.date, es)}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-sky-600" style={{ width: `${(d.count / maxDay) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-bold text-slate-700 dark:text-slate-200">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1fr] md:items-start">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{tr('Your QR sign', 'Tu letrero QR')}</h2>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <li>{tr('1. Print it and put it by the register.', '1. Imprímelo y ponlo junto a la caja.')}</li>
            <li>{tr('2. A family scans it with their phone and taps Redeem.', '2. Una familia lo escanea con su teléfono y toca Canjear.')}</li>
            <li><strong>{tr('3. Give the offer when you see the big green REDEEMED screen with a ticking clock.',
                             '3. Da la oferta cuando veas la gran pantalla verde de CANJEADA con un reloj en marcha.')}</strong></li>
            <li>{tr('A grey “Already used” screen means that family used it before.',
                    'Una pantalla gris de “Ya utilizada” significa que esa familia ya la usó.')}</li>
          </ol>
          <Button className="mt-5" onClick={() => printSign('my-sign')}>
            <Printer className="mr-2 h-4 w-4" />{tr('Print my sign', 'Imprimir mi letrero')}
          </Button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {tr('Keep the sign at the counter — the QR is yours alone, and every scan counts toward your numbers.',
                'Mantén el letrero en el mostrador: el QR es solo tuyo y cada escaneo cuenta en tus números.')}
          </p>
        </div>
        <PrintTarget id="my-sign">
          {shop.qr_token && (
            <QrSign token={shop.qr_token} name={shop.name} offerEn={shop.offer_en} offerEs={shop.offer_es}
                    logoUrl={shop.logo_url} redeemFrom={shop.redeem_from} redeemTo={shop.redeem_to} />
          )}
        </PrintTarget>
      </div>
    </div>
  );
};

export default FestivalMyShop;
