import React, { useEffect, useState } from 'react';
import { ImagePlus, Send, Store, Laptop, Check, Eye } from 'lucide-react';
import ShopCard from './ShopCard';
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

export interface ShopFormValues extends ShopApplication {
  /** a field people never see; bots fill in everything */
  company_fax?: string;
}

interface Props {
  initial?: Partial<ShopFormValues>;
  logoUrl?: string | null;
  /** sign-up asks for the email; editing later does not change it */
  askEmail: boolean;
  submitLabel: string;
  busy?: boolean;
  error?: string;
  onSubmit: (values: ShopFormValues, logo: File | null) => void;
}

/**
 * The shop's details — the same form for signing up and for changing them
 * while waiting for approval.
 */
const ShopForm: React.FC<Props> = ({ initial, logoUrl, askEmail, submitLabel, busy, error, onSubmit }) => {
  const [v, setV] = useState<ShopFormValues>({
    // a kid's business starts on Kids & Art, not Restaurant
    name: '', category: initial?.young_founder ? 'kids' : 'restaurant', offer_en: '', offer_es: '', detail_en: '',
    address: '', website: '', contact_name: '', contact_email: '', contact_phone: '', company_fax: '',
    instore: true, online: false, online_link: '', online_note: '',
    young_founder: false, guardian_consent: false, video_url: '',
    ...initial,
  });
  const setFlag = (k: 'instore' | 'online', on: boolean) => setV((f) => {
    const next = { ...f, [k]: on };
    // one of the two must stay on — an offer nobody can use is no offer
    if (!next.instore && !next.online) next[k === 'instore' ? 'online' : 'instore'] = true;
    return next;
  });
  const young = !!v.young_founder;
  const videoBad = young && !!(v.video_url || '').trim() && !youtubeId(v.video_url || '');
  const [localError, setLocalError] = useState('');
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
      const out = young ? v : { ...v, young_founder: false, guardian_consent: undefined, video_url: undefined };
      onSubmit(out, logo);
    }} className="space-y-5">
      {/* hidden from people, irresistible to bots */}
      <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" aria-hidden="true"
             value={v.company_fax} onChange={(e) => set('company_fax', e.target.value)}
             className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        <span className="text-rose-600">*</span> {tr('Required', 'Obligatorio')}
      </p>

      <button type="button" role="checkbox" aria-checked={young}
        onClick={() => setV((f) => ({ ...f, young_founder: !f.young_founder }))}
        className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition ${young
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${young ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
          {young && <Check className="h-3.5 w-3.5" />}
        </span>
        <span>
          <span className="block font-bold text-slate-900 dark:text-white">🌟 {tr('This is a kid’s business (Young Founder)', 'Este es el negocio de un niño o niña (Joven Emprendedor)')}</span>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{tr('Run by someone under 18. A parent or guardian fills this in.', 'Dirigido por alguien menor de 18 años. Un padre, madre o tutor lo llena.')}</span>
        </span>
      </button>

      <div>
        <label className={label} htmlFor="name">{tr('Business name', 'Nombre del negocio')}<Req /></label>
        <input id="name" required maxLength={80} className={field} value={v.name}
               onChange={(e) => set('name', e.target.value)}
               placeholder={tr('e.g. Golden Crust Pizza', 'ej. Golden Crust Pizza')} />
        {young && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tr('Use the business name only — please leave out your child’s full name, age and school.',
                'Usa solo el nombre del negocio: por favor no incluyas el nombre completo, la edad ni la escuela de tu hijo o hija.')}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <label className={label} htmlFor="category">{tr('What kind of business?', '¿Qué tipo de negocio?')}<Req /></label>
          <select id="category" className={field} value={v.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]}  {isEs() ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en}</option>
            ))}
          </select>
        </div>
        <div>
          <span className={label}>{tr('Logo', 'Logo')}<Opt /></span>
          <label className="flex h-[52px] cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:border-sky-400 dark:border-slate-600 dark:text-slate-300">
            {preview ? <img src={preview} alt="" className="h-9 w-9 rounded bg-white object-contain" /> : <ImagePlus className="h-5 w-5" />}
            {preview ? tr('Change', 'Cambiar') : tr('Upload', 'Subir')}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                   onChange={(e) => setLogo(e.target.files?.[0] || null)} />
          </label>
        </div>
      </div>
      <p className="-mt-3 text-xs text-slate-500 dark:text-slate-400">
        {tr('No logo? Your card shows the icon for your type of business.', '¿Sin logo? Tu tarjeta muestra el ícono de tu tipo de negocio.')}
      </p>

      <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/40">
        <label className={label} htmlFor="offer_en">{tr('Your offer', 'Tu oferta')}<Req /></label>
        <input id="offer_en" required maxLength={140} className={field} value={v.offer_en}
               onChange={(e) => set('offer_en', e.target.value)}
               placeholder={tr('e.g. Free garlic bread with any large pizza', 'ej. Pan de ajo gratis con cualquier pizza grande')} />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {tr('Short and clear — this is what families read on the website and on your sign.', 'Corto y claro: esto es lo que las familias leen en el sitio y en tu letrero.')}
        </p>
        <label className={`${label} mt-4`} htmlFor="offer_es">{tr('The same in Spanish', 'Lo mismo en español')}<Opt /></label>
        <input id="offer_es" maxLength={140} className={field} value={v.offer_es || ''}
               onChange={(e) => set('offer_es', e.target.value)}
               placeholder={tr('Leave blank and we will translate it for you', 'Déjalo en blanco y lo traducimos por ti')} />
        <label className={`${label} mt-4`} htmlFor="detail_en">{tr('Any conditions?', '¿Alguna condición?')}<Opt /></label>
        <input id="detail_en" maxLength={200} className={field} value={v.detail_en || ''}
               onChange={(e) => set('detail_en', e.target.value)}
               placeholder={tr('e.g. Dine-in only. One per family.', 'ej. Solo para comer aquí. Uno por familia.')} />
      </div>


      <div>
        <span className={label}>{tr('Where can families use your offer?', '¿Dónde pueden usar tu oferta las familias?')}<Req /></span>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['instore', Store, tr('In store', 'En tienda'), tr('Families scan a QR sign at your counter.', 'Las familias escanean un letrero QR en tu mostrador.')],
            ['online', Laptop, tr('Online', 'En línea'), tr('Classes or services booked online — families get a personal code to use when they book.', 'Clases o servicios reservados en línea: las familias reciben un código personal para usar al reservar.')],
          ] as const).map(([k, Icon, title, desc]) => {
            const on = !!v[k];
            return (
              <button key={k} type="button" role="checkbox" aria-checked={on} onClick={() => setFlag(k, !on)}
                className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${on
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${on ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'}`}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
                <span>
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white"><Icon className="h-4 w-4 text-sky-600" />{title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{tr('Tick both if you do both.', 'Marca ambas si haces las dos.')}</p>
      </div>

      {v.online && (
        <div className="grid gap-5 rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="online_link">{tr('Where do families book?', '¿Dónde reservan las familias?')}<Opt /></label>
            <input id="online_link" maxLength={300} className={field} value={v.online_link || ''}
                   onChange={(e) => set('online_link', e.target.value)} placeholder="https://yoursite.com/book" />
          </div>
          <div>
            <label className={label} htmlFor="online_note">{tr('How should they use the code?', '¿Cómo deben usar el código?')}<Opt /></label>
            <input id="online_note" maxLength={200} className={field} value={v.online_note || ''}
                   onChange={(e) => set('online_note', e.target.value)}
                   placeholder={tr('e.g. Enter it at checkout, or email it to us', 'ej. Escríbelo al pagar, o envíanoslo por correo')} />
          </div>
        </div>
      )}

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
        <div className="sm:col-span-2">
          <label className={label} htmlFor="website">{tr('Website', 'Sitio web')}<Opt /></label>
          <input id="website" maxLength={200} className={field} value={v.website || ''}
                 onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </div>
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

      {/* what they get, before they press the button: their card, as families will see it */}
      <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/40 p-5 dark:border-slate-700 dark:bg-slate-800/40">
        <p className="flex items-center justify-center gap-2 text-sm font-black text-sky-800 dark:text-sky-300">
          <Eye className="h-4 w-4" />{tr('How your business will look on our website', 'Así se verá tu negocio en nuestro sitio')}
        </p>
        <div className="mx-auto mt-4 max-w-[17rem]">
          <ShopCard shop={{
            id: 'preview', name: v.name || tr('Your business', 'Tu negocio'),
            category: isCategory(v.category) ? v.category : 'other',
            emoji: CATEGORY_EMOJI[isCategory(v.category) ? v.category : 'other'],
            logoUrl: preview || undefined,
            offerEn: v.offer_en || tr('Your offer for festival families', 'Tu oferta para las familias del festival'),
            offerEs: v.offer_es || '', detailEn: v.detail_en || undefined, detailEs: undefined,
            address: v.address || undefined, redeemFrom: '', redeemTo: '',
            instore: v.instore !== false, online: !!v.online,
            youngFounder: young, videoId: young ? youtubeId(v.video_url || '') || undefined : undefined,
          }} />
        </div>
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          {tr('Shown on our festival page and shared with our community. Free — nothing to pay, now or later.',
              'Se muestra en la página del festival y se comparte con nuestra comunidad. Gratis: nada que pagar, ni ahora ni después.')}
        </p>
      </div>

      {(localError || error) && <p className="text-center text-sm font-bold text-rose-600 dark:text-rose-400">{localError || error}</p>}

      <Button type="submit" size="lg" fullWidth disabled={busy}>
        <Send className="mr-2 h-5 w-5" />{busy ? tr('Sending…', 'Enviando…') : submitLabel}
      </Button>
    </form>
  );
};

export default ShopForm;
