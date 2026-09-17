import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Lock, Plus, Trash2, Store, ImageOff, FileJson, Github, UploadCloud, BarChart3, KeyRound, Heart, Link2, UserMinus } from 'lucide-react';
import Button from '../Button';
import SpotMeter from './SpotMeter';
import Dialog from './Dialog';
import { festival, SETTINGS, slugify } from '../../lib/festival/store';
import {
  ShopCategory, CATEGORY_LABEL, CATEGORY_EMOJI,
  FESTIVAL_ADMINS, isFestivalAdmin,
} from '../../lib/festival/types';
import { festivalDb, Pledge, Registration } from '../../lib/festival/db';
import { useAuth } from '../../context/AuthContext';
import { tr, isEs } from '../../lib/lang';

/** the exact shape of a row in data/festival.json */
interface Row {
  id: string; name: string; category: ShopCategory; spot?: number;
  offerEn: string; offerEs?: string; detailEn?: string; detailEs?: string;
  address?: string; website?: string; logo?: string;
  pledgePct?: number; status: string;
  contactName?: string; contactEmail?: string;
}

const README = [
  'Inclusion Festival & Resource Fair — the shop list.',
  'This file IS the database. To add or change a shop, edit it here and commit;',
  'the site picks it up on the next deploy. The admin page at /InclusionFestival/admin',
  'will generate the whole file for you so you never have to hand-edit JSON.',
  'Logos live in public/festival/logos/<id>.webp — run scripts/festival-logos.mjs',
  'after dropping new ones in, to keep them small and square.',
];

const card = 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900';
const field = 'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const lbl = 'mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ShopCategory[];

const FestivalAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const canApprove = isFestivalAdmin(user?.email);

  const [rows, setRows] = useState<Row[]>(() =>
    festival.allShops().map((s) => ({
      id: s.id, name: s.name, category: s.category, spot: s.spot,
      offerEn: s.offerEn, offerEs: s.offerEs || undefined,
      detailEn: s.detailEn, detailEs: s.detailEs,
      address: s.address, website: s.website,
      logo: s.logoUrl ? s.logoUrl.split('/').pop() : undefined,
      pledgePct: s.pledgePct, status: s.status,
      contactName: s.contactName || undefined, contactEmail: s.contactEmail || undefined,
    })),
  );
  const [settings, setSettings] = useState({ ...SETTINGS });
  const [copied, setCopied] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [backend, setBackend] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState('');
  const [metrics, setMetrics] = useState<{ passes: number; punches: number; perShop: { id: string; name: string; punches: number; sales: number }[] } | null>(null);
  const [pledges, setPledges] = useState<Pledge[] | null>(null);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, { name: string; email: string }>>({});
  const [copiedLinks, setCopiedLinks] = useState(false);
  const [regs, setRegs] = useState<Registration[] | null>(null);
  const [regMsg, setRegMsg] = useState('');

  useEffect(() => {
    if (!canApprove) return;
    (async () => {
      const ready = await festivalDb.ready();
      setBackend(ready);
      if (!ready) return;
      // read the live settings, or a stage click would push stale local state
      // over an already-live festival
      const remote = await festivalDb.settings();
      if (remote) setSettings((cur) => ({ ...cur, ...remote }));
      setCodes((await festivalDb.shopCodes()) || {});
      setMetrics(await festivalDb.metrics());
      setPledges(await festivalDb.pledges());
      setTokens((await festivalDb.consoleTokens()) || {});
      setContacts((await festivalDb.shopContacts()) || {});
      setRegs(await festivalDb.registrations());
    })();
  }, [canApprove]);

  /**
   * The bin used to drop the shop out of this list and nothing more — publish
   * then marked it 'released', and its row, with the contact name and email on
   * it, stayed in the table for good. A shop that was never published is still
   * just a list edit; one that was gets deleted properly, once you confirm.
   */
  const removeShop = async (i: number) => {
    const r = rows[i];
    if (codes[r.id]) {
      const ok = window.confirm(tr(
        `Delete \u201C${r.name}\u201D permanently?\n\nThis removes the shop, its punch code, its contact details and every stamp made against it. It cannot be undone.`,
        `\u00BFEliminar \u00AB${r.name}\u00BB definitivamente?\n\nSe borran la tienda, su c\u00F3digo, sus datos de contacto y todos los sellos hechos en ella. No se puede deshacer.`));
      if (!ok) return;
      const res = await festivalDb.deleteShop(r.id);
      if (res.error) { setRegMsg(deleteErr(res.error)); return; }
      setCodes((c) => { const n = { ...c }; delete n[r.id]; return n; });
      setRegs(await festivalDb.registrations());
      setMetrics(await festivalDb.metrics());
    }
    setRows((x) => x.filter((_, j) => j !== i));
  };

  /** RLS filters rows out rather than raising, so "nothing happened" needs saying */
  const deleteErr = (e: string) => e === 'not_permitted'
    ? tr('Nothing was deleted — run supabase/add_festival_delete.sql once, then try again.',
         'No se elimin\u00F3 nada: ejecuta supabase/add_festival_delete.sql una vez y vuelve a intentar.')
    : e;

  const deleteReg = async (reg: Registration) => {
    const who = reg.display_name || reg.short_code;
    if (!window.confirm(tr(
      `Delete ${who}'s registration?\n\nTheir punch card and all ${reg.punches} of their stamps go with it. It cannot be undone.`,
      `\u00BFEliminar la inscripci\u00F3n de ${who}?\n\nSu tarjeta y sus ${reg.punches} sellos se van con ella. No se puede deshacer.`))) return;
    const res = await festivalDb.deletePass(reg.id);
    if (res.error) { setRegMsg(deleteErr(res.error)); return; }
    setRegMsg('');
    setRegs(await festivalDb.registrations());
    setMetrics(await festivalDb.metrics());
  };

  const clearRegs = async () => {
    if (!window.confirm(tr(
      `Delete ALL ${regs?.length || 0} registrations?\n\nEvery punch card and every stamp on it goes. Shops, offers and punch codes are left alone. It cannot be undone.`,
      `\u00BFEliminar TODAS las ${regs?.length || 0} inscripciones?\n\nSe van todas las tarjetas y sus sellos. Las tiendas, ofertas y c\u00F3digos no se tocan. No se puede deshacer.`))) return;
    const res = await festivalDb.clearRegistrations();
    setRegMsg(res.error ? deleteErr(res.error) : tr(`${res.deleted} deleted.`, `${res.deleted} eliminadas.`));
    setRegs(await festivalDb.registrations());
    setMetrics(await festivalDb.metrics());
  };

  const publish = async () => {
    setPublishing(true); setPublishMsg('');
    const r = await festivalDb.publishShops(rows, settings.redeemFrom, settings.redeemTo);
    if (r.error) {
      setPublishMsg(r.error === 'no_backend'
        ? tr('The festival tables do not exist yet — run supabase/create_festival.sql first.',
             'Las tablas del festival aún no existen: ejecuta supabase/create_festival.sql primero.')
        : r.error);
    } else {
      setCodes(r.codes || {});
      setPublishMsg(tr('Published. Every shop now has a punch code.', 'Publicado. Cada tienda ya tiene su código.'));
      setMetrics(await festivalDb.metrics());
      setTokens((await festivalDb.consoleTokens()) || {});
      setContacts((await festivalDb.shopContacts()) || {});
    }
    setPublishing(false);
  };
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Row | null>(null);

  const counts = useMemo(() => {
    const taken = rows.filter((r) => r.status === 'approved' || r.status === 'held').length;
    return {
      taken, spots: settings.spots, free: Math.max(0, settings.spots - taken),
      waitlist: rows.filter((r) => r.status === 'waitlist').length,
      full: taken >= settings.spots,
    };
  }, [rows, settings.spots]);

  const fileText = useMemo(() => {
    // strip the contact details: this file is committed and served to every
    // visitor, so an applicant's name and email would become public
    const publicRows = rows.map(({ contactName, contactEmail, ...rest }) => rest);
    return JSON.stringify({ _readme: README, settings, shops: publicRows }, null, 2) + '\n';
  }, [rows, settings]);

  const nextSpot = () => {
    const used = new Set(rows.map((r) => r.spot).filter(Boolean));
    for (let i = 1; i <= settings.spots; i++) if (!used.has(i)) return i;
    return settings.spots + 1;
  };
  const startAdd = () => {
    const spot = nextSpot();
    const full = spot > settings.spots;
    setDraft({
      // past capacity a shop goes on the waiting list — marking it approved
      // created a tile number the 4x4 card has no square for
      id: '', name: '', category: 'restaurant',
      spot: full ? undefined : spot,
      offerEn: '', offerEs: '', pledgePct: 20,
      status: full ? 'waitlist' : 'approved',
    });
    setAdding(true);
  };

  const [draftError, setDraftError] = useState('');
  const commitDraft = () => {
    if (!draft) return;
    const id = (draft.id || slugify(draft.name)).trim();
    if (!draft.name.trim() || !draft.offerEn.trim()) {
      setDraftError(tr('A name and an offer are required.', 'Se requiere un nombre y una oferta.')); return;
    }
    // two shops whose names slugify the same would silently overwrite each
    // other in the file and collide on the logo filename
    if (!id) { setDraftError(tr('That name does not make a usable id.', 'Ese nombre no genera un id utilizable.')); return; }
    if (rows.some((r) => r.id === id)) {
      setDraftError(tr(`There is already a shop with the id "${id}". Change the name slightly.`,
                       `Ya existe una tienda con el id «${id}». Cambia un poco el nombre.`));
      return;
    }
    setDraftError('');
    setRows((r) => [...r, { ...draft, id }].sort((a, b) => (a.spot ?? 999) - (b.spot ?? 999)));
    setDraft(null); setAdding(false);
  };

  const copyFile = async () => {
    try {
      await navigator.clipboard.writeText(fileText);
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked; the textarea is selectable */ }
  };

  if (!canApprove) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Lock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
          {tr('Only the festival admin can approve shops', 'Solo el administrador del festival puede aprobar tiendas')}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {tr('Businesses send their details, but getting onto the card has to be approved by',
              'Los negocios envían sus datos, pero entrar a la tarjeta debe ser aprobado por')}{' '}
          <span className="font-bold text-slate-900 dark:text-white">{FESTIVAL_ADMINS[0]}</span>.
        </p>
        {user && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {tr('You are signed in as', 'Iniciaste sesión como')} <span className="font-semibold">{user.email}</span>.
          </p>
        )}
      </div>
    );
  }

  const missingLogos = rows.filter((r) => r.status === 'approved' && !r.logo);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">
        {tr('Festival shop manager', 'Gestor de tiendas del festival')}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {tr('Add the shops that email you, then copy the file and commit it. That commit is the approval.',
            'Agrega las tiendas que te escriban, copia el archivo y haz commit. Ese commit es la aprobación.')}
      </p>

      <div className="mt-6"><SpotMeter counts={counts} /></div>

      {missingLogos.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
          <ImageOff className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{missingLogos.length}</strong>{' '}
            {tr('shops still owe you a logo:', 'tiendas aún te deben un logo:')}{' '}
            {missingLogos.map((r) => r.name).join(', ')}
          </span>
        </div>
      )}

      {/* ── the shops ─────────────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <Store className="h-5 w-5 text-sky-600" />{tr('On the card', 'En la tarjeta')} ({rows.length})
          </h2>
          <Button size="sm" onClick={startAdd}><Plus className="mr-1.5 h-4 w-4" />{tr('Add a shop', 'Agregar tienda')}</Button>
        </div>

        <div className={`mt-3 ${card}`}>
          {rows.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">{tr('No shops yet.', 'Aún no hay tiendas.')}</p>
          )}
          {rows.map((r, i) => (
            <div key={r.id + i} className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg dark:bg-slate-800">
                {CATEGORY_EMOJI[r.category]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900 dark:text-white">{r.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">#{r.spot}</span>
                  {codes[r.id]
                  ? <span className="rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">{codes[r.id]}</span>
                  : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-400 dark:bg-slate-800">{tr('no code yet', 'sin código')}</span>}
                  {!r.logo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{tr('no logo', 'sin logo')}</span>}
                </div>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">{isEs() ? (r.offerEs || r.offerEn) : r.offerEn}</p>
                <p className="truncate text-xs text-slate-400">
                  {isEs() ? CATEGORY_LABEL[r.category].es : CATEGORY_LABEL[r.category].en}
                  {r.pledgePct ? ` · ${r.pledgePct}% ${tr('pledged', 'prometido')}` : ` · ${tr('no pledge', 'sin donación')}`}
                </p>
              </div>
              <button onClick={() => removeShop(i)}
                      title={codes[r.id] ? tr('Delete permanently', 'Eliminar definitivamente') : tr('Remove', 'Quitar')}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── add ───────────────────────────────────────────────────────── */}
      {adding && draft && (
        <Dialog label={tr('Add a shop', 'Agregar tienda')}
                onClose={() => { setAdding(false); setDraft(null); }}
                className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 dark:bg-slate-900">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{tr('Add a shop', 'Agregar tienda')}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tr('Copy the details straight out of their email.', 'Copia los datos directo de su correo.')}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className={lbl}>{tr('Business name', 'Nombre del negocio')}</label>
                <input className={field} value={draft.name}
                       onChange={(e) => setDraft({ ...draft, name: e.target.value, id: slugify(e.target.value) })} />
                {draft.id && <p className="mt-1 text-[11px] text-slate-400">id: {draft.id} · {tr('logo file', 'archivo de logo')}: {draft.id}.png</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>{tr('Type', 'Tipo')}</label>
                  <select className={field} value={draft.category}
                          onChange={(e) => setDraft({ ...draft, category: e.target.value as ShopCategory })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {isEs() ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>{tr('Spot', 'Lugar')}</label>
                  <input className={field} inputMode="numeric" value={draft.spot ?? ''}
                         onChange={(e) => setDraft({ ...draft, spot: Number(e.target.value) || undefined })} />
                </div>
              </div>
              <div>
                <label className={lbl}>{tr('Offer (English)', 'Oferta (inglés)')}</label>
                <input className={field} value={draft.offerEn} onChange={(e) => setDraft({ ...draft, offerEn: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{tr('Offer (Spanish)', 'Oferta (español)')}</label>
                <input className={field} value={draft.offerEs || ''} onChange={(e) => setDraft({ ...draft, offerEs: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{tr('Conditions', 'Condiciones')}</label>
                <input className={field} value={draft.detailEn || ''} onChange={(e) => setDraft({ ...draft, detailEn: e.target.value })} />
              </div>
              <div>
                <label className={lbl}>{tr('Address', 'Dirección')}</label>
                <input className={field} value={draft.address || ''} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>{tr('Contact name', 'Nombre de contacto')}</label>
                  <input className={field} value={draft.contactName || ''}
                         onChange={(e) => setDraft({ ...draft, contactName: e.target.value })} />
                </div>
                <div>
                  <label className={lbl}>{tr('Contact email', 'Correo de contacto')}</label>
                  <input className={field} type="email" value={draft.contactEmail || ''}
                         onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })} />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                {tr('Contacts are stored in Supabase only — they are stripped from the public file.',
                    'Los contactos se guardan solo en Supabase: se eliminan del archivo público.')}
              </p>
              <div>
                <label className={lbl}>{tr('Pledge %', 'Donación %')}</label>
                <input className={field} inputMode="numeric" value={draft.pledgePct ?? ''}
                       onChange={(e) => setDraft({ ...draft, pledgePct: Number(e.target.value) || undefined })} />
                <p className="mt-1 text-[11px] text-slate-400">
                  {tr('The punch code is minted when you publish, and never stored in the public file.',
                      'El código se genera al publicar y nunca se guarda en el archivo público.')}
                </p>
              </div>
            </div>
            {draftError && (
              <p className="mt-3 text-sm font-bold text-rose-600 dark:text-rose-400">{draftError}</p>
            )}
            <div className="mt-6 flex gap-2">
              <Button fullWidth onClick={commitDraft}>{tr('Add', 'Agregar')}</Button>
              <Button fullWidth variant="secondary" onClick={() => { setAdding(false); setDraft(null); }}>
                {tr('Cancel', 'Cancelar')}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── settings ──────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{tr('Settings', 'Ajustes')}</h2>
        <div className={`mt-3 ${card} space-y-4`}>
          <div>
            <p className={lbl}>{tr('How many spots', 'Cuántos lugares')}</p>
            <div className="flex gap-2">
              {[16, 32].map((n) => (
                <Button key={n} size="sm" variant={settings.spots === n ? 'primary' : 'secondary'}
                        onClick={() => setSettings({ ...settings, spots: n })}>{n}</Button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {tr('Sixteen makes a perfect 4×4 card.', 'Dieciséis hacen una tarjeta perfecta de 4×4.')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {([['festivalDate', tr('Festival day', 'Día del festival')],
               ['redeemFrom', tr('Offers from', 'Ofertas desde')],
               ['redeemTo', tr('Offers until', 'Ofertas hasta')]] as const).map(([k, t]) => (
              <div key={k}>
                <p className={lbl}>{t}</p>
                <input type="date" className={field} value={(settings as any)[k]}
                       onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── going live ────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <UploadCloud className="h-5 w-5 text-sky-600" />{tr('Punch cards', 'Tarjetas de sellos')}
        </h2>

        {backend === false && (
          <div className={`mt-3 ${card} border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20`}>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              {tr('Punch cards are not switched on yet.', 'Las tarjetas aún no están activadas.')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-800/90 dark:text-amber-300/90">
              {tr('Open the Supabase SQL editor, paste supabase/create_festival.sql and press Run. It only creates new festival_* tables and touches nothing that exists. Then come back and press Publish.',
                  'Abre el editor SQL de Supabase, pega supabase/create_festival.sql y presiona Run. Solo crea tablas festival_* nuevas y no toca nada existente. Luego vuelve y presiona Publicar.')}
            </p>
          </div>
        )}

        {backend && (
          <div className={`mt-3 ${card} space-y-4`}>
            <div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {tr('Publishing copies the shops above into Supabase and mints a 4-digit punch code for each new one. They appear on the site immediately — no commit, no rebuild. Codes never go in the public file; email each shop its own.',
                    'Publicar copia las tiendas de arriba a Supabase y genera un código de 4 dígitos para cada nueva. Aparecen en el sitio de inmediato: sin commit ni reconstrucción. Los códigos nunca van en el archivo público: envía a cada tienda el suyo por correo.')}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={publish} disabled={publishing}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {publishing ? tr('Publishing…', 'Publicando…') : tr('Publish shops', 'Publicar tiendas')}
                </Button>
                {publishMsg && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{publishMsg}</span>}
              </div>
            </div>

            {Object.keys(tokens).length > 0 && (
              <div>
                <p className={lbl}><Link2 className="mr-1 inline h-3 w-3" />{tr('Welcome emails, ready to send', 'Correos de bienvenida, listos para enviar')}</p>
                <Button size="sm" variant="secondary" onClick={async () => {
                  const origin = window.location.origin;
                  const text = rows.filter((r) => tokens[r.id]).map((r) =>
                    [`${r.name}`,
                     `  ${tr('Code', 'Código')}:    ${codes[r.id] || '—'}`,
                     `  ${tr('Till screen', 'Pantalla de caja')}: ${origin}/InclusionFestival/shop#${tokens[r.id]}`,
                     `  ${tr('Contact', 'Contacto')}: ${contacts[r.id]?.name || r.contactName || '—'}`,
                     `  ${tr('Email', 'Correo')}:   ${contacts[r.id]?.email || r.contactEmail || '—'}`,
                     ''].join('\n')).join('\n');
                  try { await navigator.clipboard.writeText(text); setCopiedLinks(true); setTimeout(() => setCopiedLinks(false), 2500); } catch { /* ignore */ }
                }}>
                  {copiedLinks ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copiedLinks ? tr('Copied', 'Copiado') : tr('Copy every code + till link', 'Copiar códigos y enlaces')}
                </Button>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {tr('Each shop gets its own till-screen link. Send it only to them — it shows their punch code.',
                      'Cada tienda recibe su propio enlace de caja. Envíaselo solo a ellos: muestra su código.')}
                </p>
              </div>
            )}

            {Object.keys(codes).length > 0 && (
              <div>
                <p className={lbl}><KeyRound className="mr-1 inline h-3 w-3" />{tr('Punch codes', 'Códigos')}</p>
                <div className="grid gap-1 sm:grid-cols-2">
                  {rows.filter((r) => codes[r.id]).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm dark:bg-slate-800">
                      <span className="truncate text-slate-700 dark:text-slate-200">{r.name}</span>
                      <span className="ml-2 font-mono font-black text-sky-700 dark:text-sky-400">{codes[r.id]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className={lbl}>{tr('Festival stage', 'Etapa del festival')}</p>
              <div className="flex flex-wrap gap-2">
                {(['recruiting', 'live', 'ended'] as const).map((st) => (
                  <Button key={st} size="sm"
                          variant={settings.state === st ? 'primary' : 'secondary'}
                          disabled={st === 'live' && Object.keys(codes).length === 0}
                          onClick={async () => {
                            setSettings({ ...settings, state: st });
                            await festivalDb.setSettings({ state: st });
                          }}>
                    {st === 'recruiting' ? tr('Recruiting', 'Reclutando')
                      : st === 'live' ? tr('Live', 'En vivo')
                      : tr('Ended', 'Terminado')}
                  </Button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {Object.keys(codes).length === 0
                  ? tr('Publish the shops before going live — without codes nobody can punch anything.',
                       'Publica las tiendas antes de ir en vivo: sin códigos nadie puede sellar nada.')
                  : tr('“Live” opens registration and turns punching on.',
                       '«En vivo» abre la inscripción y activa los sellos.')}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── how it is going ───────────────────────────────────────────── */}
      {metrics && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <BarChart3 className="h-5 w-5 text-sky-600" />{tr('How it is going', 'Cómo va')}
          </h2>
          <div className={`mt-3 ${card}`}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.passes}</p>
                <p className="text-xs font-bold text-slate-500">{tr('Punch cards', 'Tarjetas')}</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{metrics.punches}</p>
                <p className="text-xs font-bold text-slate-500">{tr('Offers redeemed', 'Ofertas canjeadas')}</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  {metrics.passes ? Math.round((metrics.perShop.filter((s) => s.punches > 0).length / Math.max(1, rows.length)) * 100) : 0}%
                </p>
                <p className="text-xs font-bold text-slate-500">{tr('Shops used', 'Tiendas usadas')}</p>
              </div>
            </div>
            {metrics.perShop.length > 0 && (
              <div className="mt-5 space-y-1.5">
                {metrics.perShop.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm text-slate-700 dark:text-slate-200">{s.name}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-sky-600"
                           style={{ width: `${Math.round((s.punches / Math.max(1, metrics.perShop[0].punches)) * 100)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-black text-slate-700 dark:text-slate-200">{s.punches}</span>
                  </div>
                ))}
                <p className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                  {tr('Shops with no punches are the ones to nudge people towards.',
                      'Las tiendas sin sellos son a las que conviene dirigir a la gente.')}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── pledges ───────────────────────────────────────────────────── */}
      {pledges && pledges.some((p) => p.punches > 0) && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <Heart className="h-5 w-5 text-rose-500" />{tr('Pledges', 'Donaciones')}
          </h2>
          <div className={`mt-3 ${card}`}>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              ${pledges.reduce((n, p) => n + p.pledgeEstimate, 0).toFixed(2)}
            </p>
            <p className="text-xs font-bold text-slate-500">
              {tr('estimated, from the sales shops chose to enter', 'estimado, según las ventas que las tiendas quisieron registrar')}
            </p>
            <div className="mt-4 space-y-1.5">
              {pledges.filter((p) => p.punches > 0).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {p.salesEntered}/{p.punches} {tr('entered', 'registradas')} · {p.pledgePct}%
                  </span>
                  <span className="w-20 shrink-0 text-right font-black text-slate-900 dark:text-white">
                    ${p.pledgeEstimate.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {tr('Honour system. This is an estimate to thank people with, never an invoice — most shops will not enter every sale, and that is fine.',
                  'Sistema de honor. Esto es un estimado para agradecer, nunca una factura: la mayoría de las tiendas no registrará cada venta, y está bien.')}
            </p>
          </div>
        </section>
      )}

      {/* ── registrations ─────────────────────────────────────────────── */}
      {backend && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
            <UserMinus className="h-5 w-5 text-sky-600" />{tr('Registrations', 'Inscripciones')}
          </h2>
          <div className={`mt-3 ${card}`}>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {tr('Every punch card issued. Deleting one takes its stamps with it — use this to clear a test run, or when somebody asks to be removed.',
                  'Cada tarjeta emitida. Al eliminar una se van sus sellos: úsalo para limpiar una prueba, o cuando alguien pida que le borren sus datos.')}
            </p>

            {regs === null && (
              <p className="mt-4 text-sm text-slate-400">{tr('Loading…', 'Cargando…')}</p>
            )}

            {regs && regs.length === 0 && (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                {tr('No registrations yet.', 'Todavía no hay inscripciones.')}
              </p>
            )}

            {regs && regs.length > 0 && (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {regs.length === 1
                      ? tr('1 registration', '1 inscripción')
                      : tr(`${regs.length} registrations`, `${regs.length} inscripciones`)}
                  </span>
                  <Button size="sm" variant="secondary" onClick={clearRegs}>
                    <Trash2 className="mr-2 h-4 w-4" />{tr('Delete all', 'Eliminar todas')}
                  </Button>
                </div>

                <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {regs.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold text-slate-900 dark:text-white">
                            {r.display_name || tr('(no name)', '(sin nombre)')}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {r.short_code}
                          </span>
                          {r.status !== 'active' && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              {tr('void', 'anulada')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {r.punches === 1 ? tr('1 stamp', '1 sello') : tr(`${r.punches} stamps`, `${r.punches} sellos`)}
                          {' · '}
                          {r.party_size === 1
                            ? tr('1 person', '1 persona')
                            : tr(`${r.party_size} people`, `${r.party_size} personas`)}
                          {' · '}
                          {new Date(r.created_at).toLocaleDateString(isEs() ? 'es-US' : 'en-US',
                            { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <button onClick={() => deleteReg(r)}
                              title={tr('Delete this registration', 'Eliminar esta inscripción')}
                              className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {regMsg && (
              <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">{regMsg}</p>
            )}
            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {tr('Bulk clean-ups live in supabase/clear_festival_test_data.sql — clear stamps only, clear one person by card code, or drop the simulated shops.',
                  'Las limpiezas masivas están en supabase/clear_festival_test_data.sql: borrar solo los sellos, borrar a una persona por su código, o quitar las tiendas simuladas.')}
            </p>
          </div>
        </section>
      )}

      {/* ── the snapshot ──────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <FileJson className="h-5 w-5 text-sky-600" />{tr('Offline snapshot', 'Copia sin conexión')}
        </h2>
        <div className={`mt-3 ${card}`}>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('You do not need this to put a shop on the site. Press Publish above and it is live straight away, here and on every card.',
                'No necesitas esto para poner una tienda en el sitio. Presiona Publicar arriba y queda en vivo enseguida, aquí y en cada tarjeta.')}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tr('This file is the copy the site paints with before it has heard from the database — so the page opens instantly and still works in a car park with no signal. Refresh it whenever you like; a month out of date only means a heartbeat of older shops before the real list arrives.',
                'Este archivo es la copia con la que el sitio se dibuja antes de oír a la base de datos: la página abre al instante y sigue funcionando en un estacionamiento sin señal. Actualízalo cuando quieras; si tiene un mes, solo verás la lista vieja un instante antes de que llegue la real.')}
          </p>
          <ol className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>{tr('1. Copy the file below.', '1. Copia el archivo de abajo.')}</li>
            <li>{tr('2. Open data/festival.json on GitHub, press the pencil, select all, paste.', '2. Abre data/festival.json en GitHub, presiona el lápiz, selecciona todo y pega.')}</li>
            <li>{tr('3. Commit.', '3. Haz commit.')}</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={copyFile}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? tr('Copied', 'Copiado') : tr('Copy data/festival.json', 'Copiar data/festival.json')}
            </Button>
            <a href="https://github.com/FreeForCharity/FFC-EX-aariasblueelephant.org/edit/main/data/festival.json"
               target="_blank" rel="noopener">
              <Button size="sm" variant="secondary"><Github className="mr-2 h-4 w-4" />{tr('Open on GitHub', 'Abrir en GitHub')}</Button>
            </a>
          </div>
          <textarea readOnly value={fileText}
                    className="mt-4 h-64 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300" />
        </div>
      </section>
    </div>
  );
};

export default FestivalAdminPanel;
