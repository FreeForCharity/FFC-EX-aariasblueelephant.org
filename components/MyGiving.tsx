import React, { useCallback, useEffect, useState } from 'react';
import { Heart, Pencil, Trash2, Plus, ExternalLink } from 'lucide-react';
import Button from './Button';
import { supabase } from '../lib/supabase';
import { tr, isEs } from '../lib/lang';

/**
 * Dashboard → My Giving.
 *
 * Gifts happen on Zeffy (/give), which emails the official tax receipt but
 * never tells this site who gave. So a supporter can note their own gifts
 * here: the team sees who stands behind the work and can thank them by name.
 * Honour system — a thank-you list, never a receipt and never the books.
 */

interface Gift { id: string; amount: number; donated_on: string; campaign: string | null; note: string | null }

const CAMPAIGNS: [string, string, string][] = [
  ['general', 'General support', 'Apoyo general'],
  ['givingtuesday', 'GivingTuesday', 'GivingTuesday'],
  ['festival', 'Inclusion Festival', 'Festival de Inclusión'],
  ['209gives', '209 Gives', '209 Gives'],
  ['other', 'Other', 'Otro'],
];
const campaignLabel = (c: string | null) => {
  const hit = CAMPAIGNS.find(([k]) => k === c);
  return hit ? tr(hit[1], hit[2]) : tr('General support', 'Apoyo general');
};

const field = 'w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const today = () => new Date().toLocaleDateString('en-CA');   // YYYY-MM-DD, local

const MyGiving: React.FC = () => {
  const es = isEs();
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [form, setForm] = useState<{ id?: string; amount: string; donated_on: string; campaign: string; note: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('donation_reports')
      .select('id, amount, donated_on, campaign, note').order('donated_on', { ascending: false });
    setGifts(((data || []) as any[]).map((g) => ({ ...g, amount: Number(g.amount) })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form) return;
    const amount = Number(form.amount);
    if (!isFinite(amount) || amount <= 0) { setError(tr('Please enter the amount you gave.', 'Escribe la cantidad que donaste.')); return; }
    setBusy(true); setError('');
    const row = { amount, donated_on: form.donated_on || today(), campaign: form.campaign || 'general', note: form.note.trim() || null };
    const { error: e } = form.id
      ? await supabase.from('donation_reports').update(row).eq('id', form.id)
      : await supabase.from('donation_reports').insert(row);
    setBusy(false);
    if (e) { setError(tr('That did not save. Please try again.', 'No se guardó. Inténtalo de nuevo.')); return; }
    setForm(null);
    load();
  };

  const remove = async (g: Gift) => {
    if (!window.confirm(tr('Remove this gift from your list?', '¿Quitar esta donación de tu lista?'))) return;
    await supabase.from('donation_reports').delete().eq('id', g.id);
    load();
  };

  const total = (gifts || []).reduce((n, g) => n + g.amount, 0);
  const money = (n: number) => n.toLocaleString(es ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n % 1 ? 2 : 0 });
  const day = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* the ask, warmly, first */}
      <div className="rounded-3xl bg-[#0C4A6E] p-6 text-center text-white shadow-sm sm:p-8">
        <Heart className="mx-auto h-10 w-10 text-[#F5C542]" fill="currentColor" />
        <h2 className="mt-3 text-2xl font-black">{tr('Help keep it free for every family', 'Ayuda a que siga siendo gratis para cada familia')}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sky-100">
          {tr('Every playgroup, festival and resource fair we host is free. A gift of any size goes straight into the next event a family walks into.',
              'Cada grupo de juego, festival y feria de recursos que organizamos es gratis. Una donación de cualquier tamaño va directo al próximo evento al que llegue una familia.')}
        </p>
        <a href="/give?utm_source=dashboard&utm_campaign=my_giving" className="mt-5 inline-block">
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#F5C542] px-7 py-3 text-lg font-black text-[#0C4A6E] shadow hover:brightness-105">
            {tr('Donate', 'Donar')} <ExternalLink className="h-4 w-4" />
          </span>
        </a>
        <p className="mt-3 text-xs text-sky-200">{tr('Tax-deductible · 501(c)(3) · EIN 39-4799956', 'Deducible de impuestos · 501(c)(3) · EIN 39-4799956')}</p>
      </div>

      {/* their own record */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{tr('My Giving', 'Mis donaciones')}</h3>
            {gifts && gifts.length > 0 && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {tr(`Thank you — ${money(total)} given so far 💙`, `Gracias: ${money(total)} donados hasta ahora 💙`)}
              </p>
            )}
          </div>
          {!form && (
            <Button size="sm" onClick={() => setForm({ amount: '', donated_on: today(), campaign: 'general', note: '' })}>
              <Plus className="mr-1 h-4 w-4" />{tr('Already gave? Add it', '¿Ya donaste? Agrégalo')}
            </Button>
          )}
        </div>

        {form && (
          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="gift-amount">{tr('Amount (USD)', 'Cantidad (USD)')}<span className="text-rose-600">*</span></label>
              <input id="gift-amount" inputMode="decimal" className={field} value={form.amount} placeholder="50"
                     onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, '') })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="gift-date">{tr('Date', 'Fecha')}</label>
              <input id="gift-date" type="date" max={today()} className={field} value={form.donated_on}
                     onChange={(e) => setForm({ ...form, donated_on: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="gift-for">{tr('What for', 'Para qué')}</label>
              <select id="gift-for" className={field} value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })}>
                {CAMPAIGNS.map(([k, en, esLabel]) => <option key={k} value={k}>{es ? esLabel : en}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="gift-note">{tr('Note', 'Nota')} <span className="font-medium text-slate-400">({tr('optional', 'opcional')})</span></label>
              <input id="gift-note" maxLength={300} className={field} value={form.note}
                     placeholder={tr('e.g. In honor of…', 'ej. En honor a…')}
                     onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            {error && <p className="text-sm font-bold text-rose-600 sm:col-span-2">{error}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button size="sm" onClick={save} disabled={busy}>{busy ? tr('Saving…', 'Guardando…') : tr('Save', 'Guardar')}</Button>
              <Button size="sm" variant="secondary" onClick={() => { setForm(null); setError(''); }}>{tr('Cancel', 'Cancelar')}</Button>
            </div>
          </div>
        )}

        {gifts === null ? (
          <p className="mt-4 text-sm text-slate-500">{tr('Loading…', 'Cargando…')}</p>
        ) : gifts.length === 0 && !form ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {tr('After you donate, add it here so our team can thank you personally.', 'Después de donar, agrégalo aquí para que nuestro equipo pueda agradecerte personalmente.')}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {gifts.map((g) => (
              <li key={g.id} className="flex items-center gap-3 py-3">
                <span className="w-24 shrink-0 text-lg font-black text-slate-900 dark:text-white">{money(g.amount)}</span>
                <span className="min-w-0 flex-1 text-sm text-slate-600 dark:text-slate-300">
                  {campaignLabel(g.campaign)} · {day(g.donated_on)}
                  {g.note && <span className="block truncate text-xs text-slate-400">{g.note}</span>}
                </span>
                <button aria-label={tr('Edit', 'Editar')} className="text-slate-400 hover:text-sky-600"
                        onClick={() => setForm({ id: g.id, amount: String(g.amount), donated_on: g.donated_on, campaign: g.campaign || 'general', note: g.note || '' })}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button aria-label={tr('Remove', 'Quitar')} className="text-slate-400 hover:text-rose-600" onClick={() => remove(g)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
          {tr('This list is for our thank-you records. Your official tax receipt is emailed by Zeffy, our donation platform, when you give.',
              'Esta lista es para nuestros agradecimientos. Tu recibo fiscal oficial te lo envía por correo Zeffy, nuestra plataforma de donaciones, cuando donas.')}
        </p>
      </div>
    </div>
  );
};

export default MyGiving;
