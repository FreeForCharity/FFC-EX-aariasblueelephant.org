import React, { useEffect, useState } from 'react';
import { Heart, ImagePlus, Send } from 'lucide-react';
import Button from '../Button';
import { ShopApplication, ShopCategory, CATEGORY_LABEL, CATEGORY_EMOJI } from '../../lib/festival/types';
import { tr, isEs } from '../../lib/lang';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ShopCategory[];
const label = 'block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5';
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
    name: '', category: 'restaurant', offer_en: '', offer_es: '', detail_en: '',
    address: '', website: '', contact_name: '', contact_email: '', contact_phone: '', company_fax: '',
    ...initial,
  });
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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v, logo); }} className="space-y-5">
      {/* hidden from people, irresistible to bots */}
      <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" aria-hidden="true"
             value={v.company_fax} onChange={(e) => set('company_fax', e.target.value)}
             className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <div>
        <label className={label} htmlFor="name">{tr('Business name', 'Nombre del negocio')} *</label>
        <input id="name" required maxLength={80} className={field} value={v.name}
               onChange={(e) => set('name', e.target.value)}
               placeholder={tr('e.g. Golden Crust Pizza', 'ej. Golden Crust Pizza')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <div>
          <label className={label} htmlFor="category">{tr('What kind of business?', '¿Qué tipo de negocio?')} *</label>
          <select id="category" className={field} value={v.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_EMOJI[c]}  {isEs() ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en}</option>
            ))}
          </select>
        </div>
        <div>
          <span className={label}>{tr('Logo', 'Logo')}</span>
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
        <label className={label} htmlFor="offer_en">{tr('Your offer', 'Tu oferta')} *</label>
        <input id="offer_en" required maxLength={140} className={field} value={v.offer_en}
               onChange={(e) => set('offer_en', e.target.value)}
               placeholder={tr('e.g. Free garlic bread with any large pizza', 'ej. Pan de ajo gratis con cualquier pizza grande')} />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {tr('Short and clear — this is what families read on the website and on your sign.', 'Corto y claro: esto es lo que las familias leen en el sitio y en tu letrero.')}
        </p>
        <label className={`${label} mt-4`} htmlFor="offer_es">{tr('The same in Spanish', 'Lo mismo en español')}</label>
        <input id="offer_es" maxLength={140} className={field} value={v.offer_es || ''}
               onChange={(e) => set('offer_es', e.target.value)}
               placeholder={tr('Leave blank and we will translate it for you', 'Déjalo en blanco y lo traducimos por ti')} />
        <label className={`${label} mt-4`} htmlFor="detail_en">{tr('Any conditions?', '¿Alguna condición?')}</label>
        <input id="detail_en" maxLength={200} className={field} value={v.detail_en || ''}
               onChange={(e) => set('detail_en', e.target.value)}
               placeholder={tr('e.g. Dine-in only. One per family.', 'ej. Solo para comer aquí. Uno por familia.')} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="contact_name">{tr('Your name', 'Tu nombre')} *</label>
          <input id="contact_name" required maxLength={80} className={field} value={v.contact_name}
                 onChange={(e) => set('contact_name', e.target.value)} />
        </div>
        {askEmail ? (
          <div>
            <label className={label} htmlFor="contact_email">{tr('Email', 'Correo')} *</label>
            <input id="contact_email" required type="email" maxLength={120} className={field} value={v.contact_email || ''}
                   onChange={(e) => set('contact_email', e.target.value)} placeholder="you@yourshop.com" />
          </div>
        ) : (
          <div>
            <span className={label}>{tr('Email', 'Correo')}</span>
            <p className={`${field} truncate bg-slate-50 text-slate-500 dark:bg-slate-900`}>{v.contact_email}</p>
          </div>
        )}
        <div>
          <label className={label} htmlFor="contact_phone">{tr('Phone', 'Teléfono')}</label>
          <input id="contact_phone" type="tel" maxLength={30} className={field} value={v.contact_phone || ''}
                 onChange={(e) => set('contact_phone', e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="address">{tr('Address', 'Dirección')}</label>
          <input id="address" maxLength={140} className={field} value={v.address || ''}
                 onChange={(e) => set('address', e.target.value)} placeholder={tr('Street, city', 'Calle, ciudad')} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="website">{tr('Website', 'Sitio web')}</label>
          <input id="website" maxLength={200} className={field} value={v.website || ''}
                 onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {tr('Joining is free — there is nothing to pay, now or later. If the festival brings you new customers and you would like to support our work, you are always welcome to donate. No obligation.',
              'Participar es gratis: no hay nada que pagar, ni ahora ni después. Si el festival te trae clientes nuevos y quieres apoyar nuestro trabajo, siempre puedes donar. Sin ninguna obligación.')}
        </p>
      </div>

      {error && <p className="text-center text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>}

      <Button type="submit" size="lg" fullWidth disabled={busy}>
        <Send className="mr-2 h-5 w-5" />{busy ? tr('Sending…', 'Enviando…') : submitLabel}
      </Button>
    </form>
  );
};

export default ShopForm;
