import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Plus, Pencil, Trash2, Download, ExternalLink, ChevronDown, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { tr, isEs } from '../lib/lang';
import { PROGRAMS, FUNDING_LABEL, PLAN_YEAR, type FundingSource } from '../data/plan2027';

/**
 * Dashboard → 2027 Plan (board only).
 *
 * The working budget behind /events/2027: every line item with its estimate,
 * funding route, ask status and owner. Rows live in program_plan_items, which
 * only @aariasblueelephant.org accounts can read or write (RLS). The public
 * page sees per-program totals only, rounded to $50.
 */

type Status = 'planned' | 'asked' | 'committed' | 'received';
interface Item {
  id: string; program_key: string; item: string; est_cost: number;
  funding_source: FundingSource; status: Status; owner: string | null; notes: string | null; sort: number;
  updated_by: string | null; updated_at: string;
}
type Draft = { id?: string; program_key: string; item: string; est_cost: string; funding_source: FundingSource; status: Status; owner: string; notes: string };

const STATUS: Record<Status, { label: [string, string]; cls: string }> = {
  planned:   { label: ['Planned', 'Planificado'], cls: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  asked:     { label: ['Asked', 'Solicitado'], cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  committed: { label: ['Committed', 'Comprometido'], cls: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  received:  { label: ['Received', 'Recibido'], cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
};
const SOURCES = Object.keys(FUNDING_LABEL) as FundingSource[];
const field = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const isFunded = (s: Status) => s === 'committed' || s === 'received';

const BoardPlan: React.FC = () => {
  const es = isEs();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('program_plan_items')
      .select('id, program_key, item, est_cost, funding_source, status, owner, notes, sort, updated_by, updated_at')
      .eq('plan_year', PLAN_YEAR).order('sort');
    if (error) { setLoadError(error.message); setItems([]); return; }
    setLoadError('');
    setItems(((data || []) as any[]).map(r => ({ ...r, est_cost: Number(r.est_cost) })));
  }, []);
  useEffect(() => { load(); }, [load]);

  const money = (n: number) => n.toLocaleString(es ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const byProgram = useMemo(() => {
    const m: Record<string, Item[]> = {};
    for (const it of items || []) (m[it.program_key] ||= []).push(it);
    return m;
  }, [items]);

  const sum = (list: Item[], pred: (i: Item) => boolean = () => true) => list.filter(pred).reduce((n, i) => n + i.est_cost, 0);
  const all = items || [];
  const total = sum(all);
  const funded = sum(all, i => isFunded(i.status));
  const asked = sum(all, i => i.status === 'asked');
  const bySource = SOURCES.map(s => ({ s, n: sum(all, i => i.funding_source === s) })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);

  const startAdd = (program_key: string) => {
    setSaveError('');
    setOpen(o => ({ ...o, [program_key]: true }));
    setDraft({ program_key, item: '', est_cost: '', funding_source: 'donations', status: 'planned', owner: '', notes: '' });
  };
  const startEdit = (i: Item) => {
    setSaveError('');
    setDraft({ id: i.id, program_key: i.program_key, item: i.item, est_cost: String(i.est_cost), funding_source: i.funding_source, status: i.status, owner: i.owner || '', notes: i.notes || '' });
  };

  const save = async () => {
    if (!draft) return;
    const cost = Number(draft.est_cost);
    if (!draft.item.trim()) { setSaveError(tr('Describe the item.', 'Describe el concepto.')); return; }
    if (!isFinite(cost) || cost < 0) { setSaveError(tr('Enter an estimated cost (0 or more).', 'Escribe un costo estimado (0 o más).')); return; }
    setBusy(true); setSaveError('');
    const row = {
      plan_year: PLAN_YEAR, program_key: draft.program_key, item: draft.item.trim().slice(0, 200), est_cost: cost,
      funding_source: draft.funding_source, status: draft.status,
      owner: draft.owner.trim().slice(0, 80) || null, notes: draft.notes.trim().slice(0, 500) || null,
    };
    const { error } = draft.id
      ? await supabase.from('program_plan_items').update(row).eq('id', draft.id)
      : await supabase.from('program_plan_items').insert({ ...row, sort: (byProgram[draft.program_key]?.length || 0) + 1 });
    setBusy(false);
    if (error) { setSaveError(tr('That did not save. Please try again.', 'No se guardó. Inténtalo de nuevo.')); return; }
    setDraft(null);
    load();
  };

  const remove = async (i: Item) => {
    if (!window.confirm(tr(`Remove “${i.item}” from the plan?`, `¿Quitar “${i.item}” del plan?`))) return;
    await supabase.from('program_plan_items').delete().eq('id', i.id);
    load();
  };

  const exportCsv = () => {
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Program', 'Item', 'Est. cost (USD)', 'Funding route', 'Status', 'Owner', 'Notes'];
    const lines = PROGRAMS.flatMap(p => (byProgram[p.key] || []).map(i =>
      [p.title[0], i.item, i.est_cost, FUNDING_LABEL[i.funding_source].label[0], STATUS[i.status].label[0], i.owner, i.notes].map(q).join(',')));
    const blob = new Blob([[head.map(q).join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ABE_${PLAN_YEAR}_program_budget.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const editor = (
    <div className="rounded-xl border-2 border-sky-300 dark:border-sky-700 bg-sky-50/60 dark:bg-sky-900/20 p-3 space-y-2">
      {draft && <>
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
          <input className={field} placeholder={tr('What is it? e.g. Helmets for 50 kids', '¿Qué es? p. ej. Cascos para 50 niños')} value={draft.item} maxLength={200}
            onChange={e => setDraft({ ...draft, item: e.target.value })} aria-label={tr('Item', 'Concepto')} />
          <input className={field} inputMode="decimal" placeholder={tr('Est. $', 'Est. $')} value={draft.est_cost}
            onChange={e => setDraft({ ...draft, est_cost: e.target.value })} aria-label={tr('Estimated cost', 'Costo estimado')} />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className={field} value={draft.funding_source} onChange={e => setDraft({ ...draft, funding_source: e.target.value as FundingSource })} aria-label={tr('Funding route', 'Fuente de financiamiento')}>
            {SOURCES.map(s => <option key={s} value={s}>{FUNDING_LABEL[s].emoji} {tr(...FUNDING_LABEL[s].label)}</option>)}
          </select>
          <select className={field} value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Status })} aria-label={tr('Status', 'Estado')}>
            {(Object.keys(STATUS) as Status[]).map(s => <option key={s} value={s}>{tr(...STATUS[s].label)}</option>)}
          </select>
          <input className={field} placeholder={tr('Owner (who’s on it)', 'Responsable')} value={draft.owner} maxLength={80}
            onChange={e => setDraft({ ...draft, owner: e.target.value })} aria-label={tr('Owner', 'Responsable')} />
        </div>
        <textarea className={field} rows={2} placeholder={tr('Notes: who to ask, deadlines, quotes…', 'Notas: a quién pedir, fechas límite, cotizaciones…')} value={draft.notes} maxLength={500}
          onChange={e => setDraft({ ...draft, notes: e.target.value })} aria-label={tr('Notes', 'Notas')} />
        {saveError && <p className="text-sm font-semibold text-red-600">{saveError}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">
            <Check className="h-4 w-4" /> {busy ? tr('Saving…', 'Guardando…') : tr('Save', 'Guardar')}
          </button>
          <button type="button" onClick={() => setDraft(null)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <X className="h-4 w-4" /> {tr('Cancel', 'Cancelar')}
          </button>
        </div>
      </>}
    </div>
  );

  if (items === null) {
    return <div className="py-16 text-center text-slate-500">{tr('Loading the plan…', 'Cargando el plan…')}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-900/20">
        <Lock className="mx-auto h-8 w-8 text-amber-600" />
        <p className="mt-3 font-black text-slate-900 dark:text-white">{tr('Nothing to show', 'No hay nada que mostrar')}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          {tr('The budget is visible only to accounts on @aariasblueelephant.org. Sign in with your organization Google account to see and edit it.',
              'El presupuesto solo es visible para cuentas de @aariasblueelephant.org. Inicia sesión con tu cuenta de Google de la organización para verlo y editarlo.')}
        </p>
        {loadError && <p className="mt-2 text-xs text-slate-500">{loadError}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#0C4A6E] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-sky-300">
              <Lock className="h-3.5 w-3.5" /> {tr('Board only · tentative', 'Solo la junta · tentativo')}
            </p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">{tr(`${PLAN_YEAR} Program Budget`, `Presupuesto de programas ${PLAN_YEAR}`)}</h2>
            <p className="mt-1 max-w-2xl text-sm text-sky-100">
              {tr('Line items, owners and ask status stay private. The public plan page shows each program’s total (rounded to $50) and its funding routes, and updates as you edit here.',
                  'Los conceptos, responsables y el estado de cada solicitud son privados. La página pública muestra el total de cada programa (redondeado a $50) y sus fuentes de financiamiento, y se actualiza al editar aquí.')}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/events/2027" className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 px-3 py-2 text-sm font-bold hover:bg-white/10">
              <ExternalLink className="h-4 w-4" /> {tr('Public page', 'Página pública')}
            </Link>
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5C542] px-3 py-2 text-sm font-black text-[#0C4A6E] hover:brightness-105">
              <Download className="h-4 w-4" /> CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { k: tr('Estimated total', 'Total estimado'), v: money(total) },
            { k: tr('Committed + received', 'Comprometido + recibido'), v: money(funded) },
            { k: tr('Asked, waiting', 'Solicitado, en espera'), v: money(asked) },
            { k: tr('Still to raise', 'Falta reunir'), v: money(Math.max(0, total - funded)) },
          ].map(s => (
            <div key={s.k} className="rounded-2xl bg-white/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-200">{s.k}</p>
              <p className="mt-1 text-2xl font-black">{s.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15" role="img" aria-label={tr(`${Math.round(total ? funded / total * 100 : 0)}% funded`, `${Math.round(total ? funded / total * 100 : 0)}% financiado`)}>
          <div className="h-full rounded-full bg-[#F5C542] transition-all" style={{ width: `${total ? Math.min(100, funded / total * 100) : 0}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {bySource.map(({ s, n }) => (
            <span key={s} className="rounded-full bg-white/10 px-2.5 py-1 font-bold">
              {FUNDING_LABEL[s].emoji} {tr(...FUNDING_LABEL[s].label)} · {money(n)}
            </span>
          ))}
        </div>
      </div>

      {PROGRAMS.map(p => {
        const list = byProgram[p.key] || [];
        const sub = sum(list), got = sum(list, i => isFunded(i.status));
        const isOpen = open[p.key] ?? false;
        return (
          <div key={p.key} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-brand-card">
            <button type="button" onClick={() => setOpen(o => ({ ...o, [p.key]: !isOpen }))} aria-expanded={isOpen}
              className="flex w-full items-center gap-4 p-4 text-left sm:p-5">
              <span className="text-3xl" aria-hidden="true">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-slate-900 dark:text-white">{tr(...p.title)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{tr(...p.when)} · {tr(`${list.length} items`, `${list.length} conceptos`)}</p>
                <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${sub ? Math.min(100, got / sub * 100) : 0}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-900 dark:text-white">{money(sub)}</p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{tr(`${money(got)} funded`, `${money(got)} financiado`)}</p>
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-slate-100 p-4 dark:border-slate-800 sm:p-5">
                {list.map(i => draft?.id === i.id ? <div key={i.id}>{editor}</div> : (
                  <div key={i.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 rounded-xl px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{i.item}</p>
                      {(i.owner || i.notes) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {i.owner && <span className="font-bold">{i.owner}</span>}{i.owner && i.notes && ' · '}{i.notes}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {FUNDING_LABEL[i.funding_source].emoji} {tr(...FUNDING_LABEL[i.funding_source].label)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STATUS[i.status].cls}`}>{tr(...STATUS[i.status].label)}</span>
                    <span className="w-20 text-right text-sm font-black text-slate-900 dark:text-white">{money(i.est_cost)}</span>
                    <span className="flex gap-1">
                      <button type="button" onClick={() => startEdit(i)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-sky-600 dark:hover:bg-slate-700" aria-label={tr('Edit', 'Editar')}><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => remove(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30" aria-label={tr('Remove', 'Quitar')}><Trash2 className="h-4 w-4" /></button>
                    </span>
                  </div>
                ))}
                {draft && !draft.id && draft.program_key === p.key ? editor : (
                  <button type="button" onClick={() => startAdd(p.key)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30">
                    <Plus className="h-4 w-4" /> {tr('Add item', 'Agregar concepto')}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BoardPlan;
