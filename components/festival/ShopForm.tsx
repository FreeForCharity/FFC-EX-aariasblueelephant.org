import React, { useEffect, useState } from 'react';
import { ImagePlus, Send, Check, ChevronDown } from 'lucide-react';
import ShopCard from './ShopCard';
import SignPreview from './SignPreview';
import Button from '../Button';
import { ShopApplication, ShopCategory, CATEGORY_LABEL, CATEGORY_EMOJI, isCategory } from '../../lib/festival/types';
import { youtubeId } from '../../lib/festival/store';
import { tr, isEs } from '../../lib/lang';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ShopCategory[];
const label = 'block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5';
/** a red star you cannot miss, and a quiet word for everything that can be skipped */
const Req = () => <span className="ml-0.5 text-rose-600" aria-hidden>*</span>;
const Opt = () => <span className="ml-1 text-xs font-medium text-slate-400">({tr('optional', 'opcional')})</span>;

const ParentNote = () => <span className="ml-1 text-xs font-medium text-slate-400">({tr('parent or guardian', 'padre, madre o tutor')})</span>;

const field = 'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

export type ShopFormValues = ShopApplication;

interface Props {
  initial?: Partial<ShopFormValues>;
  logoUrl?: string | null;
  /** sign-up asks for the email; editing later does not change it */
  askEmail: boolean;
  submitLabel: string;
  busy?: boolean;
  error?: string;
  onSubmit: (values: ShopFormValues, logo: File | null) => void;
  /** the sign shows the offer window; sign-up uses the festival's, editing the shop's own */
  redeemFrom?: string;
  redeemTo?: string;
  /** two columns with a sticky preview at lg; false keeps one column with the preview inline */
  wide?: boolean;
}

/** what they get, before they press the button: their card and their sign, as families will see them */
const PreviewPanel: React.FC<{ v: ShopFormValues; logoUrl: string | null; redeemFrom: string; redeemTo: string }> = ({ v, logoUrl, redeemFrom, redeemTo }) => {
  const young = !!v.young_founder;
  const sub = 'mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  return (
    <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/40">
      <p className="text-center text-sm font-black text-sky-800 dark:text-sky-300">{tr('👀 Live preview', '👀 Vista previa en vivo')}</p>
      <p className={`${sub} mt-3`}>{tr('Your card on our website', 'Tu tarjeta en nuestro sitio')}</p>
      <div className="mx-auto max-w-[17rem]">
        <ShopCard shop={{
          id: 'preview', name: v.name || tr('Your business', 'Tu negocio'),
          category: isCategory(v.category) ? v.category : 'other',
          emoji: CATEGORY_EMOJI[isCategory(v.category) ? v.category : 'other'],
          logoUrl: logoUrl || undefined,
          offerEn: v.offer_en || tr('Your offer for festival families', 'Tu oferta para las familias del festival'),
          offerEs: v.offer_es || '', detailEn: v.detail_en || undefined, detailEs: undefined,
          address: v.address || undefined, redeemFrom: '', redeemTo: '',
          instore: v.instore !== false, online: !!v.online,
          youngFounder: young, videoId: youtubeId(v.video_url || '') || undefined,
        }} />
      </div>
      {v.instore !== false && (
        <>
          <p className={`${sub} mt-5`}>{young ? tr('Your stall sign', 'Tu letrero para el puesto') : tr('Your counter sign', 'Tu letrero para el mostrador')}</p>
          <SignPreview name={v.name || tr('Your business', 'Tu negocio')}
                       offerEn={v.offer_en || tr('Your offer for festival families', 'Tu oferta para las familias del festival')}
                       offerEs={v.offer_es} logoUrl={logoUrl} redeemFrom={redeemFrom} redeemTo={redeemTo} youngFounder={young} />
        </>
      )}
      <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
        {tr('Shown on our festival page and shared with our community. Free — nothing to pay, now or later.',
            'Se muestra en la página del festival y se comparte con nuestra comunidad. Gratis: nada que pagar, ni ahora ni después.')}
      </p>
    </div>
  );
};

/**
 * The shop's details — the same form for signing up and for changing them
 * while waiting for approval. Up front only what we need, plus the two extras
 * most people have (logo, website); everything else waits behind "Add more
 * details". A kid's business (initial.young_founder) also asks for the
 * parent's consent and shows its video field up front.
 */
const ShopForm: React.FC<Props> = ({ initial, logoUrl, askEmail, submitLabel, busy, error, onSubmit, redeemFrom = '2026-10-15', redeemTo = '2026-11-30', wide = true }) => {
  const [v, setV] = useState<ShopFormValues>({
    // a kid's business starts on Kids & Art, not Restaurant
    name: '', category: initial?.young_founder ? 'kids' : 'restaurant', offer_en: '', offer_es: '', detail_en: '',
    address: '', website: '', contact_name: '', contact_email: '', contact_phone: '',
    // every offer works both ways — a QR sign in person, a personal code online —
    // so nobody has to choose
    instore: true, online: true, online_link: '', online_note: '',
    young_founder: false, guardian_consent: false, video_url: '', public_contact: '',
    ...initial,
  });
  const young = !!v.young_founder;
  const videoBad = !!(v.video_url || '').trim() && !youtubeId(v.video_url || '');
  const [localError, setLocalError] = useState('');
  // editing opens with everything showing; signing up starts short
  const [more, setMore] = useState(!askEmail);
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl || null);
  const set = (k: keyof ShopFormValues, val: string) => setV((f) => ({ ...f, [k]: val }));

  useEffect(() => { if (!logo) setPreview(logoUrl || null); }, [logoUrl, logo]);
  useEffect(() => {
    if (!logo) return;
    const url = URL.createObjectURL(logo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (young && !v.guardian_consent) {
        setLocalError(tr('A parent or guardian needs to tick the permission box.', 'Un padre, madre o tutor debe marcar la casilla de permiso.'));
        return;
      }
      if (videoBad) {
        setLocalError(tr('That doesn’t look like a YouTube link.', 'Eso no parece un enlace de YouTube.'));
        return;
      }
      setLocalError('');
      // the kid-only fields never travel with a regular shop
      const out = young ? v : { ...v, young_founder: false, guardian_consent: undefined };
      onSubmit(out, logo);
    }} className={wide ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8 lg:items-start' : ''}>
      {/* the form */}
      <div className="space-y-5">
        {/* No hidden bot-trap field: browser autofill and password managers kept
            filling it, and real sign-ups were silently dropped as bots. A
            sign-up does nothing until its email link is clicked, and the
            database caps unconfirmed sign-ups per hour, which is protection enough. */}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="text-rose-600">*</span> {tr('Required', 'Obligatorio')}
        </p>

        {young && (
          <p className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/30">
            <span className="block font-bold text-slate-900 dark:text-white">🌟 {tr('Young Founder — a kid’s business', 'Joven Emprendedor: el negocio de un niño o niña')}</span>
            <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-300">{tr('Run by someone under 18. A parent or guardian fills this in.', 'Dirigido por alguien menor de 18 años. Un padre, madre o tutor lo llena.')}</span>
          </p>
        )}

        <div>
          <label className={label} htmlFor="name">{tr('Business name', 'Nombre del negocio')}<Req /></label>
          <input id="name" required maxLength={80} className={field} value={v.name}
                 onChange={(e) => set('name', e.target.value)}
                 placeholder={young ? tr('e.g. Sparkle Bead Bracelets', 'ej. Sparkle Bead Bracelets') : tr('e.g. Golden Crust Pizza', 'ej. Golden Crust Pizza')} />
          {young && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tr('Use the business name only — please leave out your child’s full name, age and school.',
                  'Usa solo el nombre del negocio: por favor no incluyas el nombre completo, la edad ni la escuela de tu hijo o hija.')}
            </p>
          )}
        </div>

        <div>
          <label className={label} htmlFor="category">{tr('What kind of business?', '¿Qué tipo de negocio?')}<Req /></label>
          <select id="category" className={field} value={v.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]}  {isEs() ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en}</option>
            ))}
          </select>
        </div>

        {/* the two extras most people have — up front, still optional */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className={label}>{tr('Logo', 'Logo')}<Opt /></span>
            <label className="flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-sky-400 dark:border-slate-600 dark:text-slate-300">
              {preview ? <img src={preview} alt="" className="h-9 w-9 rounded bg-white object-contain" /> : <ImagePlus className="h-5 w-5" />}
              {preview ? tr('Change', 'Cambiar') : tr('Upload', 'Subir')}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                     onChange={(e) => setLogo(e.target.files?.[0] || null)} />
            </label>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tr('No logo? Your card shows the icon for your type of business.', '¿Sin logo? Tu tarjeta muestra el ícono de tu tipo de negocio.')}
            </p>
          </div>
          <div>
            <label className={label} htmlFor="website">{tr('Website', 'Sitio web')}<Opt /></label>
            <input id="website" maxLength={200} className={field} value={v.website || ''}
                   onChange={(e) => set('website', e.target.value)}
                   placeholder={young ? tr('Your shop page, Etsy or Instagram', 'Tu tienda en línea, Etsy o Instagram') : 'https://'} />
          </div>
        </div>

        <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
          <label className={label} htmlFor="offer_en">{tr('Your offer', 'Tu oferta')}<Req /></label>
          <input id="offer_en" required maxLength={140} className={field} value={v.offer_en}
                 onChange={(e) => set('offer_en', e.target.value)}
                 placeholder={young ? tr('e.g. Free sticker with any bracelet', 'ej. Calcomanía gratis con cualquier pulsera') : tr('e.g. Free garlic bread with any large pizza', 'ej. Pan de ajo gratis con cualquier pizza grande')} />
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {young
              ? tr('Families can use it in person — they scan your QR sign at your stall or table — or online, with a personal code they send you when they order. You get both.',
                   'Las familias pueden usarla en persona, escaneando tu letrero QR en tu puesto o mesa, o en línea, con un código personal que te envían al pedir. Tienes las dos.')
              : tr('Families can use it in person — they scan your QR sign at the counter — or online, with a personal code when they order or book. You get both.',
                   'Las familias pueden usarla en persona, escaneando tu letrero QR en el mostrador, o en línea, con un código personal al pedir o reservar. Tienes las dos.')}
          </p>
        </div>

        {/* phones see it early; wide screens get the sticky side panel */}
        <div className={wide ? 'lg:hidden' : ''}>
          <PreviewPanel v={v} logoUrl={preview} redeemFrom={redeemFrom} redeemTo={redeemTo} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="contact_name">{young ? tr('Parent or guardian’s name', 'Nombre del padre, madre o tutor') : tr('Your name', 'Tu nombre')}<Req /></label>
            <input id="contact_name" required maxLength={80} className={field} value={v.contact_name}
                   onChange={(e) => set('contact_name', e.target.value)} />
          </div>
          {askEmail ? (
            <div>
              <label className={label} htmlFor="contact_email">{tr('Email', 'Correo')}{young && <ParentNote />}<Req /></label>
              <input id="contact_email" required type="email" maxLength={120} className={field} value={v.contact_email || ''}
                     onChange={(e) => set('contact_email', e.target.value)} placeholder="you@yourshop.com" />
            </div>
          ) : (
            <div>
              <span className={label}>{tr('Email', 'Correo')}{young && <ParentNote />}</span>
              <p className={`${field} truncate bg-slate-50 text-slate-500 dark:bg-slate-900`}>{v.contact_email}</p>
            </div>
          )}
        </div>

        {young && (
          <div className="space-y-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-slate-800/40">
            <div>
              <label className={label} htmlFor="video_url">{tr('Video about your product', 'Video sobre tu producto')}<Opt /></label>
              <input id="video_url" maxLength={300} className={field} value={v.video_url || ''}
                     onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtu.be/…" />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {tr('A YouTube link — Public or Unlisted, on a parent’s account. We watch every video before it goes on our website.',
                    'Un enlace de YouTube, Público o No listado, en la cuenta de un padre o madre. Vemos cada video antes de publicarlo en nuestro sitio.')}
              </p>
              {videoBad && <p className="mt-1 text-xs font-bold text-rose-600 dark:text-rose-400">{tr('That doesn’t look like a YouTube link.', 'Eso no parece un enlace de YouTube.')}</p>}
            </div>
            <button type="button" role="checkbox" aria-checked={!!v.guardian_consent}
              onClick={() => setV((f) => ({ ...f, guardian_consent: !f.guardian_consent }))}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition ${v.guardian_consent
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${v.guardian_consent ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
                {v.guardian_consent && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {tr('I’m this young founder’s parent or legal guardian. I agree to have their business — and their video, if added — featured on Aaria’s Blue Elephant’s website, and I’m the contact for it.',
                    'Soy el padre, madre o tutor legal de este joven emprendedor. Acepto que su negocio, y su video si lo agrega, aparezca en el sitio web de Aaria’s Blue Elephant, y soy la persona de contacto.')}<Req />
              </span>
            </button>
          </div>
        )}

        {/* everything optional, out of the way until wanted */}
        <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700">
          <button type="button" aria-expanded={more} onClick={() => setMore((m) => !m)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
            <span>
              <span className="block font-bold text-slate-900 dark:text-white">{tr('Add more details', 'Agregar más detalles')}<Opt /></span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {young
                  ? tr('How families reach you, offer in Spanish, conditions, phone, address, where to order online',
                       'Cómo te contactan las familias, oferta en español, condiciones, teléfono, dirección, dónde pedir en línea')
                  : tr('A YouTube video, how families reach you, offer in Spanish, conditions, phone, address, where to order online',
                       'Un video de YouTube, cómo te contactan las familias, oferta en español, condiciones, teléfono, dirección, dónde pedir en línea')}
              </span>
            </span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${more ? 'rotate-180' : ''}`} />
          </button>
          {more && (
            <div className="grid gap-5 border-t-2 border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800 sm:grid-cols-2">
              {!young && (
                <div className="sm:col-span-2">
                  <label className={label} htmlFor="video_url">{tr('Video about your business', 'Video sobre tu negocio')}<Opt /></label>
                  <input id="video_url" maxLength={300} className={field} value={v.video_url || ''}
                         onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtu.be/…" />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tr('A YouTube link, Public or Unlisted. Families can play it on your card. We watch every video before it goes on our website.',
                        'Un enlace de YouTube, Público o No listado. Las familias pueden verlo en tu tarjeta. Vemos cada video antes de publicarlo en nuestro sitio.')}
                  </p>
                  {videoBad && <p className="mt-1 text-xs font-bold text-rose-600 dark:text-rose-400">{tr('That doesn’t look like a YouTube link.', 'Eso no parece un enlace de YouTube.')}</p>}
                </div>
              )}
              <div className="sm:col-span-2">
                <label className={label} htmlFor="public_contact">{tr('How can families reach you?', '¿Cómo pueden contactarte las familias?')}<Opt /></label>
                <input id="public_contact" maxLength={120} className={field} value={v.public_contact || ''}
                       onChange={(e) => set('public_contact', e.target.value)}
                       placeholder={tr('e.g. hello@yourshop.com, (209) 555-0100 or @yourshop', 'ej. hola@tunegocio.com, (209) 555-0100 o @tunegocio')} />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {young
                    ? tr('Shown publicly on your card — use a business contact, never a child’s personal email or phone. The email above stays private.',
                         'Se muestra públicamente en tu tarjeta: usa un contacto del negocio, nunca el correo o teléfono personal de un niño. El correo de arriba sigue siendo privado.')
                    : tr('Shown on your card for families. The email above stays private — we only use it to reach you.',
                         'Se muestra en tu tarjeta para las familias. El correo de arriba sigue siendo privado: solo lo usamos para contactarte.')}
                </p>
              </div>
              <div>
                <label className={label} htmlFor="offer_es">{tr('Your offer in Spanish', 'Tu oferta en español')}<Opt /></label>
                <input id="offer_es" maxLength={140} className={field} value={v.offer_es || ''}
                       onChange={(e) => set('offer_es', e.target.value)}
                       placeholder={tr('Leave blank and we will translate it for you', 'Déjalo en blanco y lo traducimos por ti')} />
              </div>
              <div>
                <label className={label} htmlFor="detail_en">{tr('Any conditions?', '¿Alguna condición?')}<Opt /></label>
                <input id="detail_en" maxLength={200} className={field} value={v.detail_en || ''}
                       onChange={(e) => set('detail_en', e.target.value)}
                       placeholder={tr('e.g. One per family.', 'ej. Uno por familia.')} />
              </div>
              <div>
                <label className={label} htmlFor="contact_phone">{tr('Phone', 'Teléfono')}{young && <ParentNote />}<Opt /></label>
                <input id="contact_phone" type="tel" maxLength={30} className={field} value={v.contact_phone || ''}
                       onChange={(e) => set('contact_phone', e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="address">{tr('Address', 'Dirección')}<Opt /></label>
                <input id="address" maxLength={140} className={field} value={v.address || ''}
                       onChange={(e) => set('address', e.target.value)} placeholder={tr('Street, city', 'Calle, ciudad')} />
              </div>
              <div>
                <label className={label} htmlFor="online_link">{tr('Where do families order or book online?', '¿Dónde piden o reservan en línea las familias?')}<Opt /></label>
                <input id="online_link" maxLength={300} className={field} value={v.online_link || ''}
                       onChange={(e) => set('online_link', e.target.value)} placeholder="https://" />
              </div>
              <div>
                <label className={label} htmlFor="online_note">{tr('How should they use their code?', '¿Cómo deben usar su código?')}<Opt /></label>
                <input id="online_note" maxLength={200} className={field} value={v.online_note || ''}
                       onChange={(e) => set('online_note', e.target.value)}
                       placeholder={young ? tr('e.g. Send us the code when you order', 'ej. Envíanos el código cuando hagas tu pedido') : tr('e.g. Enter it at checkout, or email it to us', 'ej. Escríbelo al pagar, o envíanoslo por correo')} />
              </div>
            </div>
          )}
        </div>

        {(localError || error) && <p className="text-center text-sm font-bold text-rose-600 dark:text-rose-400">{localError || error}</p>}

        <Button type="submit" size="lg" fullWidth disabled={busy}>
          <Send className="mr-2 h-5 w-5" />{busy ? tr('Sending…', 'Enviando…') : submitLabel}
        </Button>
      </div>

      {wide && (
        <div className="hidden lg:sticky lg:top-40 lg:block">
          <PreviewPanel v={v} logoUrl={preview} redeemFrom={redeemFrom} redeemTo={redeemTo} />
        </div>
      )}
    </form>
  );
};

export default ShopForm;
