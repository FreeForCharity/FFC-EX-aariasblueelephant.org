import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Mail, Copy, Store, Heart, Check } from 'lucide-react';
import Button from '../components/Button';
import SpotMeter from '../components/festival/SpotMeter';
import { festival, CONTACT_EMAIL } from '../lib/festival/store';
import { ShopCategory, CATEGORY_LABEL, CATEGORY_EMOJI } from '../lib/festival/types';
import { tr, isEs } from '../lib/lang';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ShopCategory[];

/** Honour-system pledge. 20% is what we suggest; every one of these is fine. */
const PLEDGE_CHOICES = [20, 15, 10, 5];

const label = 'block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5';
const field = 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

const FestivalShopJoin: React.FC = () => {
  const counts = festival.counts();
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef('');

  const [form, setForm] = useState({
    name: '', category: 'restaurant' as ShopCategory,
    offerEn: '', offerEs: '', detailEn: '',
    address: '', website: '',
    contactName: '', contactEmail: '', contactPhone: '',
    pledgePct: '20',
  });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const subject = tr('Inclusion Festival', 'Festival de Inclusión') + ' — ' + (form.name || tr('shop sign-up', 'inscripción de tienda'));
  const buildBody = () => [
    tr('We would like a spot at the Inclusion Festival.', 'Nos gustaría un lugar en el Festival de Inclusión.'),
    '',
    `${tr('Business', 'Negocio')}:  ${form.name}`,
    `${tr('Type', 'Tipo')}:  ${isEs() ? CATEGORY_LABEL[form.category].es : CATEGORY_LABEL[form.category].en}`,
    `${tr('Offer', 'Oferta')}:  ${form.offerEn}`,
    form.offerEs ? `${tr('Offer (Spanish)', 'Oferta (español)')}: ${form.offerEs}` : '',
    form.detailEn ? `${tr('Conditions', 'Condiciones')}: ${form.detailEn}` : '',
    form.address ? `${tr('Address', 'Dirección')}: ${form.address}` : '',
    form.website ? `${tr('Website', 'Sitio web')}: ${form.website}` : '',
    '',
    `${tr('Contact', 'Contacto')}:  ${form.contactName}`,
    `${tr('Email', 'Correo')}:  ${form.contactEmail}`,
    form.contactPhone ? `${tr('Phone', 'Teléfono')}: ${form.contactPhone}` : '',
    form.pledgePct
      ? `${tr('Pledge', 'Donación')}:  ${form.pledgePct}% ${tr('of these sales', 'de estas ventas')}`
      : `${tr('Pledge', 'Donación')}:  ${tr('none this time', 'esta vez no')}`,
    '',
    tr('Our logo is attached (a square image works best).', 'Adjuntamos nuestro logo (una imagen cuadrada funciona mejor).'),
  ].filter(Boolean).join('\n');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    bodyRef.current = buildBody();
    setSent(true);
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyRef.current)}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bodyRef.current || buildBody());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked — the text is on screen anyway */ }
  };

  /* ── after they press send ────────────────────────────────────────── */
  if (sent) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900 dark:text-white">
            {tr('Almost there — press send', 'Casi listo: presiona enviar')}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('Your email app should have opened with everything filled in. Attach your logo and hit send — that is all we need.',
                'Tu aplicación de correo debería haberse abierto con todo listo. Adjunta tu logo y presiona enviar: eso es todo lo que necesitamos.')}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {tr("Didn't open? Copy this and email it to us.", '¿No se abrió? Copia esto y envíanoslo.')}
          </p>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-300">
{bodyRef.current}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={copy}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? tr('Copied', 'Copiado') : tr('Copy the details', 'Copiar los datos')}
            </Button>
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyRef.current)}`}>
              <Button size="sm" variant="secondary"><Mail className="mr-2 h-4 w-4" />{CONTACT_EMAIL}</Button>
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-bold text-slate-900 dark:text-white">{tr('What happens next', 'Qué sigue')}</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>{tr('1. We read your offer and confirm your spot within 48 hours.', '1. Leemos tu oferta y confirmamos tu lugar en 48 horas.')}</li>
            <li>{tr('2. You get your 4-digit punch code and your logo goes on the card.', '2. Recibes tu código de 4 dígitos y tu logo aparece en la tarjeta.')}</li>
            <li>{tr('3. Families start walking in with your tile on their phone.', '3. Las familias empiezan a llegar con tu casilla en su teléfono.')}</li>
          </ol>
        </div>

        <div className="mt-8 text-center">
          <Link to="/InclusionFestival"><Button variant="secondary">{tr('Back to the festival', 'Volver al festival')}</Button></Link>
        </div>
      </div>
    );
  }

  /* ── the form ─────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-3">
        <Store className="h-8 w-8 text-sky-700 dark:text-sky-400" />
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {tr('Claim your spot', 'Reserva tu lugar')}
        </h1>
      </div>
      <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300">
        {tr('Free to join, free to leave, and you pick the offer. Two minutes.',
            'Participar es gratis, salir también, y tú eliges la oferta. Dos minutos.')}
      </p>

      <div className="mt-6"><SpotMeter counts={counts} /></div>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className={label} htmlFor="name">{tr('Business name', 'Nombre del negocio')} *</label>
          <input id="name" required className={field} value={form.name}
                 onChange={(e) => set('name', e.target.value)}
                 placeholder={tr('e.g. Spice Route Biryani', 'ej. Spice Route Biryani')} />
        </div>

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
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tr('Sets the icon on your tile until your logo arrives.', 'Define el ícono de tu casilla hasta que llegue tu logo.')}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <label className={label} htmlFor="offerEn">{tr('Your offer', 'Tu oferta')} *</label>
          <input id="offerEn" required className={field} value={form.offerEn}
                 onChange={(e) => set('offerEn', e.target.value)}
                 placeholder={tr('e.g. Two biryanis for the price of one', 'ej. Dos biryanis por el precio de uno')} />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tr('Short and clear — this is what families read on their card.', 'Corto y claro: esto es lo que las familias leen en su tarjeta.')}
          </p>

          <label className={`${label} mt-4`} htmlFor="offerEs">{tr('The same in Spanish', 'Lo mismo en español')}</label>
          <input id="offerEs" className={field} value={form.offerEs}
                 onChange={(e) => set('offerEs', e.target.value)}
                 placeholder={tr('Leave blank and we will translate it for you', 'Déjalo en blanco y lo traducimos por ti')} />

          <label className={`${label} mt-4`} htmlFor="detailEn">{tr('Any conditions?', '¿Alguna condición?')}</label>
          <input id="detailEn" className={field} value={form.detailEn}
                 onChange={(e) => set('detailEn', e.target.value)}
                 placeholder={tr('e.g. Dine-in only. One per family.', 'ej. Solo para comer aquí. Uno por familia.')} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="contactName">{tr('Your name', 'Tu nombre')} *</label>
            <input id="contactName" required className={field} value={form.contactName}
                   onChange={(e) => set('contactName', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="contactEmail">{tr('Email', 'Correo')} *</label>
            <input id="contactEmail" required type="email" className={field} value={form.contactEmail}
                   onChange={(e) => set('contactEmail', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="contactPhone">{tr('Phone', 'Teléfono')}</label>
            <input id="contactPhone" className={field} value={form.contactPhone}
                   onChange={(e) => set('contactPhone', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="address">{tr('Address', 'Dirección')}</label>
            <input id="address" className={field} value={form.address}
                   onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="website">{tr('Website', 'Sitio web')}</label>
            <input id="website" className={field} value={form.website}
                   onChange={(e) => set('website', e.target.value)}
                   placeholder="https://" />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Heart className="h-4 w-4 text-rose-500" />
            {tr('Would you like to give back a share of these sales?', '¿Te gustaría donar una parte de estas ventas?')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('We suggest 20%, but it is your call entirely. This runs on honour — we never check, there are no invoices, no receipts and nothing to report.',
                'Sugerimos 20%, pero la decisión es totalmente tuya. Esto funciona por honor: nunca lo revisamos, no hay facturas, ni recibos, ni nada que reportar.')}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {PLEDGE_CHOICES.map((n) => (
              <button key={n} type="button" onClick={() => set('pledgePct', String(n))}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition
                  ${form.pledgePct === String(n)
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'}`}>
                {n}%{n === 20 ? ' · ' + tr('suggested', 'sugerido') : ''}
              </button>
            ))}
            <button type="button" onClick={() => set('pledgePct', '')}
              className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition
                ${form.pledgePct === ''
                  ? 'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-700 dark:text-slate-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {tr('Not this time', 'Esta vez no')}
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {form.pledgePct
              ? tr('Thank you — that really does help. 💙', 'Gracias, eso ayuda de verdad. 💙')
              : tr('Giving something says you are with us. Giving nothing is just as welcome.',
                   'Dar algo dice que estás con nosotros. No dar nada es igual de bienvenido.')}
            {' '}
            {tr("Either way, you are part of the Aaria's Blue Elephant family.",
                "De cualquier forma, eres parte de la familia de Aaria's Blue Elephant.")}
          </p>
        </div>

        <Button type="submit" size="lg" fullWidth>
          <Mail className="mr-2 h-5 w-5" />
          {counts.full
            ? tr('Send my details for the waiting list', 'Enviar mis datos para la lista de espera')
            : tr('Send my details', 'Enviar mis datos')}
        </Button>
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {tr('This opens your email app with everything filled in. Attach your logo before sending.',
              'Esto abre tu correo con todo listo. Adjunta tu logo antes de enviar.')}
        </p>
      </form>
    </div>
  );
};

export default FestivalShopJoin;
