import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Heart, LogIn, ImagePlus, Send } from 'lucide-react';
import Button from '../components/Button';
import SpotMeter, { SpotCount, toSpotCount } from '../components/festival/SpotMeter';
import { festivalDb } from '../lib/festival/db';
import { ShopCategory, CATEGORY_LABEL, CATEGORY_EMOJI, isCategory } from '../lib/festival/types';
import { useAuth } from '../context/AuthContext';
import { tr, isEs } from '../lib/lang';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ShopCategory[];

/** Honour-system pledge. 20% is what we suggest; every one of these is fine. */
const PLEDGE_CHOICES = [20, 15, 10, 5];

const label = 'block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5';
const field = 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

/**
 * /InclusionFestival/join — a shop owner signs in with Google and applies.
 *
 * Signing in gives us a verified email (no typos, no spam sign-ups) and gives
 * the owner a page of their own to come back to: /InclusionFestival/myshop,
 * where they print their QR sign once approved. Nothing here puts a shop on the
 * card — an admin approves it in the dashboard.
 */
const FestivalShopJoin: React.FC = () => {
  const { user, isLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<SpotCount | null>(null);
  const [checking, setChecking] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', category: 'restaurant' as ShopCategory,
    offer_en: '', offer_es: '', detail_en: '',
    address: '', website: '',
    contact_name: '', contact_phone: '',
    pledge_pct: '20',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([festivalDb.spotCounts(), festivalDb.settings()])
      .then(([c, s]) => setCounts(toSpotCount(c.taken, c.waitlist, s.spots)));
  }, []);

  // already applied? approved shops go to their page; waiting ones can edit
  useEffect(() => {
    if (isLoading) return;
    if (!user) { setChecking(false); return; }
    festivalDb.myShop().then((s) => {
      if (s && s.status === 'approved') { navigate('/InclusionFestival/myshop', { replace: true }); return; }
      if (s && (s.status === 'pending' || s.status === 'waitlist')) {
        setEditing(true);
        setLogoUrl(s.logo_url);
        setForm({
          name: s.name, category: isCategory(s.category) ? s.category : 'other',
          offer_en: s.offer_en, offer_es: s.offer_es || '', detail_en: s.detail_en || '',
          address: s.address || '', website: s.website || '',
          contact_name: s.contact_name, contact_phone: s.contact_phone || '',
          pledge_pct: s.pledge_pct != null ? String(s.pledge_pct) : '',
        });
      } else {
        setForm((f) => ({ ...f, contact_name: f.contact_name || user.name || '' }));
      }
      setChecking(false);
    });
  }, [user, isLoading, navigate]);

  const signIn = () => {
    localStorage.setItem('authReturnTo', '/InclusionFestival/join');
    loginWithGoogle();
  };

  const onLogo = async (file?: File) => {
    if (!file || !user) return;
    setUploading(true); setError('');
    const url = await festivalDb.uploadLogo(file, user.id);
    if (url) setLogoUrl(url);
    else setError(tr('That image did not upload. Try a PNG or JPG under 10 MB.', 'Esa imagen no se subió. Prueba un PNG o JPG de menos de 10 MB.'));
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await festivalDb.apply({
      ...form,
      pledge_pct: form.pledge_pct ? Number(form.pledge_pct) : null,
      logo_url: logoUrl,
    });
    setBusy(false);
    if (r.ok) { navigate('/InclusionFestival/myshop'); return; }
    setError(
      r.error === 'missing_fields' ? tr('Please fill in the business name, the offer and your name.', 'Completa el nombre del negocio, la oferta y tu nombre.')
      : r.error === 'already_approved' ? tr('Your shop is already approved — changes go through us. Just reply to your welcome email.', 'Tu tienda ya está aprobada: los cambios los hacemos nosotros. Responde a tu correo de bienvenida.')
      : r.error === 'closed' ? tr('Sign-ups for this festival have closed.', 'Las inscripciones para este festival ya cerraron.')
      : tr('Something went wrong. Please try again.', 'Algo salió mal. Inténtalo de nuevo.'));
  };

  if (isLoading || checking) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" /></div>;
  }

  const Intro = (
    <>
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-sky-700 dark:text-sky-400" />
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {editing ? tr('Edit your sign-up', 'Edita tu inscripción') : tr('Claim your spot', 'Reserva tu lugar')}
        </h1>
      </div>
      <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
        {tr('Free to join, and you pick the offer. Once you are approved you print a QR sign for your counter — families scan it to redeem, so there is nothing for your staff to set up.',
            'Participar es gratis y tú eliges la oferta. Al ser aprobado imprimes un letrero QR para tu mostrador: las familias lo escanean para canjear, así que tu personal no tiene nada que configurar.')}
      </p>
      {counts && !editing && <div className="mt-6"><SpotMeter counts={counts} /></div>}
    </>
  );

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {Intro}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <Button size="lg" onClick={signIn}>
            <LogIn className="mr-2 h-5 w-5" />{tr('Sign in with Google to start', 'Inicia sesión con Google para empezar')}
          </Button>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {tr('Use the Google account you check for email — your approval and your QR sign come to it.',
                'Usa la cuenta de Google donde revisas tu correo: ahí llegan tu aprobación y tu letrero QR.')}
          </p>
        </div>
        <Link to="/InclusionFestival" className="mt-6 inline-block text-sm font-semibold text-sky-700 underline dark:text-sky-400">
          {tr('Back to the festival', 'Volver al festival')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {Intro}

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className={label} htmlFor="name">{tr('Business name', 'Nombre del negocio')} *</label>
          <input id="name" required maxLength={80} className={field} value={form.name}
                 onChange={(e) => set('name', e.target.value)}
                 placeholder={tr('e.g. Spice Route Biryani', 'ej. Spice Route Biryani')} />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={label} htmlFor="category">{tr('What kind of business?', '¿Qué tipo de negocio?')} *</label>
            <select id="category" className={field} value={form.category}
                    onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_EMOJI[c]}  {isEs() ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className={label}>{tr('Logo', 'Logo')}</span>
            <label className="flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-sky-400 dark:border-slate-600 dark:text-slate-300">
              {logoUrl
                ? <img src={logoUrl} alt="" className="h-9 w-9 rounded object-contain" />
                : <ImagePlus className="h-5 w-5" />}
              {uploading ? tr('Uploading…', 'Subiendo…') : logoUrl ? tr('Change', 'Cambiar') : tr('Upload', 'Subir')}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                     onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
          </div>
        </div>
        <p className="-mt-3 text-xs text-slate-500 dark:text-slate-400">
          {tr('No logo? Your tile shows the icon for your type of business.', '¿Sin logo? Tu casilla muestra el ícono de tu tipo de negocio.')}
        </p>

        <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <label className={label} htmlFor="offer_en">{tr('Your offer', 'Tu oferta')} *</label>
          <input id="offer_en" required maxLength={140} className={field} value={form.offer_en}
                 onChange={(e) => set('offer_en', e.target.value)}
                 placeholder={tr('e.g. Free garlic bread with any large pizza', 'ej. Pan de ajo gratis con cualquier pizza grande')} />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tr('Short and clear — this is what families read on their card and on your sign.', 'Corto y claro: esto es lo que las familias leen en su tarjeta y en tu letrero.')}
          </p>

          <label className={`${label} mt-4`} htmlFor="offer_es">{tr('The same in Spanish', 'Lo mismo en español')}</label>
          <input id="offer_es" maxLength={140} className={field} value={form.offer_es}
                 onChange={(e) => set('offer_es', e.target.value)}
                 placeholder={tr('Leave blank and we will translate it for you', 'Déjalo en blanco y lo traducimos por ti')} />

          <label className={`${label} mt-4`} htmlFor="detail_en">{tr('Any conditions?', '¿Alguna condición?')}</label>
          <input id="detail_en" maxLength={200} className={field} value={form.detail_en}
                 onChange={(e) => set('detail_en', e.target.value)}
                 placeholder={tr('e.g. Dine-in only. One per family.', 'ej. Solo para comer aquí. Uno por familia.')} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="contact_name">{tr('Your name', 'Tu nombre')} *</label>
            <input id="contact_name" required maxLength={80} className={field} value={form.contact_name}
                   onChange={(e) => set('contact_name', e.target.value)} />
          </div>
          <div>
            <span className={label}>{tr('Email', 'Correo')}</span>
            <p className={`${field} truncate bg-slate-50 text-slate-500 dark:bg-slate-900`}>{user.email}</p>
          </div>
          <div>
            <label className={label} htmlFor="contact_phone">{tr('Phone', 'Teléfono')}</label>
            <input id="contact_phone" type="tel" maxLength={30} className={field} value={form.contact_phone}
                   onChange={(e) => set('contact_phone', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="address">{tr('Address', 'Dirección')}</label>
            <input id="address" maxLength={140} className={field} value={form.address}
                   onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="website">{tr('Website', 'Sitio web')}</label>
            <input id="website" maxLength={200} className={field} value={form.website}
                   onChange={(e) => set('website', e.target.value)} placeholder="https://" />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Heart className="h-4 w-4 text-rose-500" />
            {tr('Would you like to give back a share of these sales?', '¿Te gustaría donar una parte de estas ventas?')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('We suggest 20%, but it is your call entirely. This runs on honour — we never check, there are no invoices and nothing to report.',
                'Sugerimos 20%, pero la decisión es totalmente tuya. Esto funciona por honor: nunca lo revisamos, no hay facturas ni nada que reportar.')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PLEDGE_CHOICES.map((n) => (
              <button key={n} type="button" onClick={() => set('pledge_pct', String(n))}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition
                  ${form.pledge_pct === String(n)
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}>
                {n}%{n === 20 ? ' · ' + tr('suggested', 'sugerido') : ''}
              </button>
            ))}
            <button type="button" onClick={() => set('pledge_pct', '')}
              className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition
                ${form.pledge_pct === ''
                  ? 'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {tr('Not this time', 'Esta vez no')}
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {form.pledge_pct
              ? tr('Thank you — that really does help. 💙', 'Gracias, eso ayuda de verdad. 💙')
              : tr('Giving something says you are with us. Giving nothing is just as welcome.',
                   'Dar algo dice que estás con nosotros. No dar nada es igual de bienvenido.')}
            {' '}
            {tr("Either way, you are part of the Aaria's Blue Elephant family.",
                "De cualquier forma, eres parte de la familia de Aaria's Blue Elephant.")}
          </p>
        </div>

        {error && <p className="text-center text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>}

        <Button type="submit" size="lg" fullWidth disabled={busy || uploading}>
          <Send className="mr-2 h-5 w-5" />
          {busy ? tr('Sending…', 'Enviando…')
            : editing ? tr('Save my changes', 'Guardar mis cambios')
            : counts?.full ? tr('Join the waiting list', 'Unirme a la lista de espera')
            : tr('Sign up my shop', 'Inscribir mi tienda')}
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {tr('We review every offer and email you within 48 hours.', 'Revisamos cada oferta y te escribimos en 48 horas.')}
        </p>
      </form>
    </div>
  );
};

export default FestivalShopJoin;
