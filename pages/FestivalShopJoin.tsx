import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, MailCheck, KeyRound } from 'lucide-react';
import Button from '../components/Button';
import SpotMeter, { SpotCount, toSpotCount } from '../components/festival/SpotMeter';
import ShopForm, { ShopFormValues } from '../components/festival/ShopForm';
import ShopSteps from '../components/festival/ShopSteps';
import { festivalDb } from '../lib/festival/db';
import { SHOP_KEY, DEFAULT_SETTINGS } from '../lib/festival/store';
import { FestivalSettings } from '../lib/festival/types';
import { tr } from '../lib/lang';

/**
 * /InclusionFestival/join — the link we send to businesses.
 *
 * No account and no Google: plenty of shops run on shop@theirdomain.com. They
 * fill in the form and we email a confirm link. That link is also their
 * private shop page, so there is never a password to forget.
 */
const FestivalShopJoin: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<SpotCount | null>(null);
  const [settings, setSettings] = useState<FestivalSettings>(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [known, setKnown] = useState<string | null>(null);
  const [lostEmail, setLostEmail] = useState('');
  const [lostSent, setLostSent] = useState(false);

  useEffect(() => {
    Promise.all([festivalDb.spotCounts(), festivalDb.settings()])
      .then(([c, s]) => { setCounts(toSpotCount(c.taken, c.waitlist, s.spots)); setSettings(s); });
    try { setKnown(localStorage.getItem(SHOP_KEY)); } catch { /* private mode */ }
  }, []);

  const submit = async (v: ShopFormValues, logo: File | null) => {
    setBusy(true); setError('');
    const r = await festivalDb.signup(v);
    if (r.ok && r.manage) {
      if (logo) await festivalDb.uploadLogoByManage(r.manage, logo);
      try { localStorage.setItem(SHOP_KEY, r.manage); } catch { /* private mode */ }
      // the key stays on this device; the address never carries it
      navigate('/InclusionFestival/myshop');
      return;
    }
    setBusy(false);
    if (r.ok) { setSentTo(v.contact_email || ''); return; }   // resent, or quietly dropped
    if (r.error === 'already_signed_up') {
      await festivalDb.emailMyLink(v.contact_email || '');
      setError(tr('This email has already signed up a shop — we just emailed you the link to your shop page.',
                  'Este correo ya inscribió una tienda: te acabamos de enviar el enlace a tu página.'));
      return;
    }
    setError(
      r.error === 'missing_fields' ? tr('Please fill in the business name, the offer and your name.', 'Completa el nombre del negocio, la oferta y tu nombre.')
      : r.error === 'bad_email' ? tr('That email address does not look right.', 'Ese correo no parece correcto.')
      : r.error === 'closed' ? tr('Sign-ups for this festival have closed.', 'Las inscripciones para este festival ya cerraron.')
      : r.error === 'busy' ? tr('We are getting a lot of sign-ups right now. Please try again in a few minutes.', 'Estamos recibiendo muchas inscripciones. Inténtalo en unos minutos.')
      : tr('Something went wrong. Please try again.', 'Algo salió mal. Inténtalo de nuevo.'));
  };

  if (sentTo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-sky-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">{tr('Check your email', 'Revisa tu correo')}</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr(`We sent a confirm link to ${sentTo}. Click it to finish signing up — it can take a minute, and check spam too.`,
              `Enviamos un enlace de confirmación a ${sentTo}. Haz clic para terminar tu inscripción. Puede tardar un minuto; revisa también el correo no deseado.`)}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-sky-700 dark:text-sky-400" />
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">{tr('Join the Inclusion Festival', 'Únete al Festival de Inclusión')}</h1>
      </div>
      <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
        {tr('Offer festival families something special for a month — you choose what. Free to join, two minutes, no account needed. Once approved you print a QR sign for your counter: families scan it to redeem, so there is nothing for your staff to set up.',
            'Ofrece algo especial a las familias del festival durante un mes: tú eliges qué. Gratis, dos minutos y sin crear cuenta. Al ser aprobado imprimes un letrero QR para tu mostrador: las familias lo escanean para canjear, así que tu personal no tiene nada que configurar.')}
      </p>

      {known && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-50 p-4 dark:bg-sky-900/20">
          <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">
            {tr('You already signed up a shop on this device.', 'Ya inscribiste una tienda en este dispositivo.')}
          </p>
          <Link to="/InclusionFestival/myshop"><Button size="sm">{tr('Open my shop page', 'Abrir mi tienda')}</Button></Link>
        </div>
      )}

      <div className="mt-8"><ShopSteps redeemFrom={settings.redeemFrom} redeemTo={settings.redeemTo} /></div>

      <div className="mx-auto mt-12 max-w-2xl" id="signup">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white">{tr('Sign up your shop', 'Inscribe tu negocio')}</h2>
      {counts && <div className="mt-4"><SpotMeter counts={counts} /></div>}

      <div className="mt-8">
        <ShopForm askEmail busy={busy} error={error} onSubmit={submit}
                  submitLabel={counts?.full ? tr('Join the waiting list', 'Unirme a la lista de espera') : tr('Sign up my shop', 'Inscribir mi tienda')} />
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          {tr('We email you a link to confirm. Then we review your offer and get back to you within 48 hours.',
              'Te enviamos un enlace para confirmar. Luego revisamos tu oferta y te respondemos en 48 horas.')}
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <KeyRound className="h-4 w-4 text-sky-600" />{tr('Already signed up? Lost your link?', '¿Ya te inscribiste? ¿Perdiste tu enlace?')}
        </p>
        {lostSent ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {tr('If that email signed up a shop, the link is on its way.', 'Si ese correo inscribió una tienda, el enlace va en camino.')}
          </p>
        ) : (
          <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (e) => {
            e.preventDefault();
            await festivalDb.emailMyLink(lostEmail);
            setLostSent(true);
          }}>
            <input type="email" required value={lostEmail} onChange={(e) => setLostEmail(e.target.value)}
                   placeholder="you@yourshop.com"
                   className="min-w-0 flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <Button type="submit" variant="secondary">{tr('Email me my link', 'Envíame mi enlace')}</Button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
};

export default FestivalShopJoin;
