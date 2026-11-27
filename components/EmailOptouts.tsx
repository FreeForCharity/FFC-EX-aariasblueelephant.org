import React, { useCallback, useEffect, useState } from 'react';
import { MailX, Plus, Trash2, Lock, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tr, isEs } from '../lib/lang';

/**
 * Dashboard → Email opt-outs (board only).
 *
 * People who replied "unsubscribe" to a bulk email (cards, newsletters,
 * GivingTuesday). Rows live in public.email_optouts — staff-only RLS, never
 * readable by the public. Every bulk recipient list is exported with these
 * addresses removed, so adding someone here is all it takes.
 * Automatic emails (event registration confirmations) are not affected.
 */

interface Optout { email: string; reason: string | null; created_at: string; added_by: string | null }

const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailOptouts: React.FC = () => {
  const es = isEs();
  const [rows, setRows] = useState<Optout[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('email_optouts')
      .select('email, reason, created_at, added_by').order('created_at', { ascending: false });
    if (error) { setLoadError(error.message); setRows([]); return; }
    setLoadError('');
    setRows((data || []) as Optout[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) {
      setMsg({ ok: false, text: tr('That doesn’t look like an email address.', 'Eso no parece un correo electrónico.') });
      return;
    }
    if (rows?.some(r => r.email === clean)) {
      setMsg({ ok: true, text: tr(`${clean} is already on the list.`, `${clean} ya está en la lista.`) });
      setEmail('');
      return;
    }
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('email_optouts')
      .insert({ email: clean, reason: reason.trim().slice(0, 300) || null });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: tr(`Done. ${clean} won’t get our bulk emails.`, `Listo. ${clean} no recibirá nuestros correos masivos.`) });
    setEmail(''); setReason('');
    load();
  };

  const remove = async (addr: string) => {
    if (!window.confirm(tr(
      `Remove ${addr} from the opt-out list? They will get bulk emails again. Only do this if they asked to be added back.`,
      `¿Quitar ${addr} de la lista? Volverá a recibir correos masivos. Hazlo solo si pidió volver a recibirlos.`))) return;
    const { error } = await supabase.from('email_optouts').delete().eq('email', addr);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: tr(`${addr} removed.`, `${addr} eliminado.`) });
    load();
  };

  const shown = (rows || []).filter(r => !q || r.email.includes(q.trim().toLowerCase()));
  const when = (iso: string) => new Date(iso).toLocaleDateString(es ? 'es-US' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
          <MailX className="h-6 w-6 text-rose-500" /> {tr('Email opt-outs', 'Bajas de correo')}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          {tr(
            'When someone replies “unsubscribe” to a card, newsletter or appeal, add their email here. Every bulk email list leaves them out automatically. Event confirmations they sign up for still reach them.',
            'Cuando alguien responda “unsubscribe” a una tarjeta, boletín o campaña, agrega su correo aquí. Todas las listas de correos masivos lo excluyen automáticamente. Las confirmaciones de eventos a los que se inscriba le seguirán llegando.'
          )}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          {tr('Private: only @aariasblueelephant.org accounts can see this list.', 'Privado: solo las cuentas @aariasblueelephant.org pueden ver esta lista.')}
        </p>
      </div>

      <form onSubmit={add} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-brand-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{tr('Email', 'Correo')}</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={field}
              placeholder={tr('name@example.com', 'nombre@ejemplo.com')} aria-label={tr('Email to opt out', 'Correo para dar de baja')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">{tr('Note (optional)', 'Nota (opcional)')}</span>
            <input value={reason} onChange={e => setReason(e.target.value)} maxLength={300} className={field}
              placeholder={tr('e.g. replied to the Thanksgiving card', 'p. ej., respondió a la tarjeta de Acción de Gracias')} />
          </label>
          <button type="submit" disabled={busy}
            className="flex items-center justify-center gap-1.5 self-end rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">
            <Plus className="h-4 w-4" /> {busy ? tr('Adding…', 'Agregando…') : tr('Add opt-out', 'Agregar baja')}
          </button>
        </div>
        {msg && (
          <p role="status" className={`mt-3 text-sm font-medium ${msg.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>{msg.text}</p>
        )}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-brand-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {rows === null ? tr('Loading…', 'Cargando…') : tr(`${rows.length} on the list`, `${rows.length} en la lista`)}
          </span>
          {(rows?.length || 0) > 5 && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input value={q} onChange={e => setQ(e.target.value)} className={`${field} pl-8`}
                placeholder={tr('Search', 'Buscar')} aria-label={tr('Search opt-outs', 'Buscar bajas')} />
            </div>
          )}
        </div>
        {loadError ? (
          <p className="p-4 text-sm text-rose-700 dark:text-rose-400">
            {tr('Couldn’t load the list: ', 'No se pudo cargar la lista: ')}{loadError}
          </p>
        ) : rows && rows.length === 0 ? (
          <p className="p-4 text-sm italic text-slate-500">{tr('No one has opted out.', 'Nadie se ha dado de baja.')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {shown.map(r => (
              <li key={r.email} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="break-all font-semibold text-slate-900 dark:text-white">{r.email}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {when(r.created_at)}{r.added_by ? ` · ${tr('added by', 'agregado por')} ${r.added_by}` : ''}
                  </p>
                  {r.reason && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.reason}</p>}
                </div>
                <button onClick={() => remove(r.email)} title={tr('Remove from list', 'Quitar de la lista')}
                  aria-label={tr(`Remove ${r.email}`, `Quitar ${r.email}`)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmailOptouts;
