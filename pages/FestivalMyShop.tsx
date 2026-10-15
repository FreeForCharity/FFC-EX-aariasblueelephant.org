import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Store, Printer, Clock, Hourglass, XCircle, MailWarning, KeyRound, CheckCircle2, Laptop, Check } from 'lucide-react';
import Button from '../components/Button';
import ShopForm, { ShopFormValues } from '../components/festival/ShopForm';
import { QrSign, PrintTarget, printSign } from '../components/festival/QrSign';
import { festivalDb, MyShop } from '../lib/festival/db';
import { fmtShortDay, SHOP_KEY } from '../lib/festival/store';
import { isCategory } from '../lib/festival/types';
import { useAuth } from '../context/AuthContext';
import { tr, isEs } from '../lib/lang';

/**
 * /InclusionFestival/myshop?k=<manage token> — a shop's own page.
 *
 * No password: the link in their emails is the key, and this device remembers
 * it. &confirm=<token> on the first visit is the "confirm your email" click.
 * Shops that signed up with Google before this existed still get in by signing in.
 */
const FestivalMyShop: React.FC = () => {
  const { user, isLoading } = useAuth();
  const es = isEs();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [key, setKey] = useState<string | null>(() => {
    const k = params.get('k');
    if (k) return k;
    try { return localStorage.getItem(SHOP_KEY); } catch { return null; }
  });
  const [shop, setShop] = useState<MyShop | null | undefined>(undefined);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [resent, setResent] = useState(false);
  const [lostEmail, setLostEmail] = useState('');
  const [lostSent, setLostSent] = useState(false);
  const [codeQuery, setCodeQuery] = useState('');

  const load = useCallback(async (k: string | null) => {
    if (k) {
      const s = await festivalDb.shopByManage(k);
      if (s) { try { localStorage.setItem(SHOP_KEY, k); } catch { /* private mode */ } }
      setShop(s);
      return;
    }
    setShop(user ? await festivalDb.myShop() : null);
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    (async () => {
      const confirm = params.get('confirm');
      if (confirm) {
        const r = await festivalDb.confirm(confirm);
        if (r.ok && r.manage) {
          setJustConfirmed(!!r.justConfirmed);
          setKey(r.manage);
          // drop the confirm token from the address bar once it has done its job
          navigate(`/InclusionFestival/myshop?k=${r.manage}`, { replace: true });
          await load(r.manage);
          return;
        }
      }
      await load(key);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const save = async (v: ShopFormValues, logo: File | null) => {
    if (!key) return;
    setBusy(true); setError(''); setSaved(false);
    const r = await festivalDb.updateByManage(key, v);
    if (r.ok && logo) {
      const url = await festivalDb.uploadLogoByManage(key, logo);
      if (!url) setError(tr('Your details saved, but the logo did not upload. Try a PNG or JPG.', 'Tus datos se guardaron, pero el logo no se subió. Prueba un PNG o JPG.'));
    }
    if (!r.ok) setError(r.error === 'already_approved'
      ? tr('You are already on the card — changes go through us. Just reply to your email.', 'Ya estás en la tarjeta: los cambios los hacemos nosotros. Responde a tu correo.')
      : tr('Please fill in the business name, the offer and your name.', 'Completa el nombre del negocio, la oferta y tu nombre.'));
    else setSaved(true);
    setBusy(false);
    await load(key);
  };

  const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="mx-auto max-w-2xl px-4 py-12">{children}</div>
  );

  const LostLink = (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-left dark:border-slate-700 dark:bg-slate-900">
      <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
        <KeyRound className="h-4 w-4 text-sky-600" />{tr('Email me my shop link', 'Envíame el enlace de mi tienda')}
      </p>
      {lostSent ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{tr('If that email signed up a shop, the link is on its way.', 'Si ese correo inscribió una tienda, el enlace va en camino.')}</p>
      ) : (
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); await festivalDb.emailMyLink(lostEmail); setLostSent(true); }}>
          <input type="email" required value={lostEmail} onChange={(e) => setLostEmail(e.target.value)} placeholder="you@yourshop.com"
                 className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <Button type="submit" variant="secondary">{tr('Send', 'Enviar')}</Button>
        </form>
      )}
    </div>
  );

  if (isLoading || shop === undefined) {
    return <Shell><div className="mx-auto mt-10 h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></Shell>;
  }

  if (!shop) {
    return (
      <Shell>
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-sky-300" />
          <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{tr('Your festival shop page', 'La página de tu tienda')}</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {key
              ? tr('This link is not working any more. Ask for a fresh one below.', 'Este enlace ya no funciona. Pide uno nuevo abajo.')
              : tr('Open the link from your sign-up email, or have it sent again.', 'Abre el enlace de tu correo de inscripción, o pide que te lo enviemos otra vez.')}
          </p>
          <Link to="/InclusionFestival/join" className="mt-6 inline-block"><Button variant="secondary">{tr('Sign up a shop', 'Inscribir una tienda')}</Button></Link>
        </div>
        {LostLink}
      </Shell>
    );
  }

  const initial: Partial<ShopFormValues> = {
    name: shop.name, category: isCategory(shop.category) ? shop.category : 'other',
    offer_en: shop.offer_en, offer_es: shop.offer_es || '', detail_en: shop.detail_en || '',
    address: shop.address || '', website: shop.website || '',
    contact_name: shop.contact_name, contact_email: shop.contact_email, contact_phone: shop.contact_phone || '',
    instore: shop.instore !== false, online: !!shop.online,
    online_link: shop.online_link || '', online_note: shop.online_note || '',
  };

  /* ── before approval ──────────────────────────────────────────────── */
  if (shop.status !== 'approved') {
    const st = shop.status;
    return (
      <Shell>
        <div className="text-center">
          {st === 'unconfirmed' ? <MailWarning className="mx-auto h-12 w-12 text-amber-500" />
            : st === 'pending' ? (justConfirmed ? <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" /> : <Hourglass className="mx-auto h-12 w-12 text-sky-600" />)
            : st === 'waitlist' ? <Clock className="mx-auto h-12 w-12 text-amber-500" />
            : <XCircle className="mx-auto h-12 w-12 text-slate-400" />}
          <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
            {st === 'unconfirmed' ? tr('One more step: confirm your email', 'Un paso más: confirma tu correo')
              : st === 'pending' ? (justConfirmed ? tr('Email confirmed — thank you!', '¡Correo confirmado, gracias!') : tr('We are reviewing your offer', 'Estamos revisando tu oferta'))
              : st === 'waitlist' ? tr('You are on the waiting list', 'Estás en la lista de espera')
              : tr('Not on the card this time', 'Esta vez no está en la tarjeta')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600 dark:text-slate-400">
            {st === 'unconfirmed'
              ? tr(`We emailed a confirm link to ${shop.contact_email}. Click it to send your sign-up to us. Check spam if you do not see it.`,
                   `Enviamos un enlace de confirmación a ${shop.contact_email}. Haz clic para enviarnos tu inscripción. Revisa el correo no deseado si no lo ves.`)
              : st === 'pending' ? tr('We will email you within 48 hours. Once you are approved, your QR sign appears right here to print — keep this page’s link.',
                                      'Te escribiremos en 48 horas. Al ser aprobado, tu letrero QR aparece aquí mismo para imprimir. Guarda el enlace de esta página.')
              : st === 'waitlist' ? tr('Every spot is taken right now. We will email you the moment one opens.', 'Todos los lugares están ocupados. Te escribiremos en cuanto se libere uno.')
              : tr('Thank you for your interest. Reply to our email if you have questions.', 'Gracias por tu interés. Responde a nuestro correo si tienes preguntas.')}
          </p>
          {st === 'unconfirmed' && (
            <Button className="mt-5" variant="secondary" disabled={resent}
                    onClick={() => { festivalDb.resendConfirm(shop.id); setResent(true); }}>
              {resent ? tr('Sent — check your inbox', 'Enviado: revisa tu correo') : tr('Send the confirm email again', 'Enviar el correo de nuevo')}
            </Button>
          )}
        </div>

        {key && st !== 'declined' && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-white">{tr('Your details', 'Tus datos')}</h2>
            <ShopForm askEmail={false} initial={initial} logoUrl={shop.logo_url} busy={busy} error={error}
                      submitLabel={tr('Save changes', 'Guardar cambios')} onSubmit={save} />
            {saved && <p className="mt-3 text-center text-sm font-bold text-green-600">{tr('Saved ✓', 'Guardado ✓')}</p>}
          </div>
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
          { n: shop.new_cards, en: 'new families through you', es: 'familias nuevas gracias a ti' },
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

      {shop.online && (
        <div className="mt-8 rounded-2xl border-2 border-violet-100 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
            <Laptop className="h-5 w-5 text-violet-600" />{tr('Online codes', 'Códigos en línea')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('Families get a personal code (like ABE-7K4M) on our site and quote it when they book. When someone books with one, find it here and tick Used. Each code works once.',
                'Las familias reciben un código personal (como ABE-7K4M) en nuestro sitio y lo mencionan al reservar. Cuando alguien reserve con uno, búscalo aquí y marca Usado. Cada código sirve una vez.')}
          </p>
          <input value={codeQuery} onChange={(e) => setCodeQuery(e.target.value.toUpperCase())}
                 placeholder={tr('Find a code, e.g. ABE-7K4M', 'Busca un código, ej. ABE-7K4M')}
                 className="mt-4 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2 font-mono text-slate-900 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          {shop.codes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">{tr('No codes yet.', 'Todavía no hay códigos.')}</p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {shop.codes.filter((c) => !codeQuery || c.code.includes(codeQuery)).map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="font-mono font-black tracking-wider text-slate-900 dark:text-white">{c.code}</span>
                  <span className="flex-1 text-xs text-slate-500">{fmtShortDay(c.at, es)}</span>
                  <button disabled={!key} onClick={async () => { if (key && await festivalDb.markCode(key, c.code, !c.used_at)) await load(key); }}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${c.used_at
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {c.used_at && <Check className="h-3 w-3" />}{c.used_at ? tr('Used', 'Usado') : tr('Mark used', 'Marcar usado')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {shop.instore !== false && (
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
            {tr('Keep this page’s link — it is your key, no password needed. Every scan of your sign counts toward your numbers here.',
                'Guarda el enlace de esta página: es tu llave, sin contraseña. Cada escaneo de tu letrero cuenta en tus números aquí.')}
          </p>
        </div>
        <PrintTarget id="my-sign">
          {shop.qr_token && (
            <QrSign token={shop.qr_token} name={shop.name} offerEn={shop.offer_en} offerEs={shop.offer_es}
                    logoUrl={shop.logo_url} redeemFrom={shop.redeem_from} redeemTo={shop.redeem_to} />
          )}
        </PrintTarget>
      </div>
      )}
    </div>
  );
};

export default FestivalMyShop;
