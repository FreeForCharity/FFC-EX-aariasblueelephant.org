import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, X, Clock, Printer, Pencil, Trash2, Plus, Download, Copy, Users, Store, BarChart3, Settings2, ImagePlus,
} from 'lucide-react';
import Button from '../Button';
import Dialog from './Dialog';
import { QrSign, PrintTarget, printSign } from './QrSign';
import { festivalDb, Registration, ShopReport } from '../../lib/festival/db';
import { DEFAULT_SETTINGS, fmtShortDay, fmtDay } from '../../lib/festival/store';
import {
  AdminShop, FestivalSettings, ShopCategory, ShopStatus, CATEGORY_LABEL, CATEGORY_EMOJI, isFestivalAdmin,
} from '../../lib/festival/types';
import { useAuth } from '../../context/AuthContext';
import { tr, isEs } from '../../lib/lang';

const field = 'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const label = 'mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300';
const card = 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900';

const STATUS_STYLE: Record<ShopStatus, string> = {
  pending: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  waitlist: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  declined: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  withdrawn: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
const STATUS_LABEL: Record<ShopStatus, [string, string]> = {
  pending: ['Waiting for approval', 'Esperando aprobación'],
  approved: ['On the card', 'En la tarjeta'],
  waitlist: ['Waiting list', 'Lista de espera'],
  declined: ['Declined', 'Rechazada'],
  withdrawn: ['Withdrawn', 'Retirada'],
};

/** a spreadsheet anyone can open — Excel and Google Sheets both read this */
const downloadCsv = (name: string, rows: (string | number | null | undefined)[][]) => {
  const csv = rows.map((r) => r.map((v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

type Draft = {
  id?: string; name: string; category: ShopCategory; offer_en: string; offer_es: string;
  detail_en: string; detail_es: string; address: string; website: string;
  contact_name: string; contact_email: string; contact_phone: string;
  pledge_pct: string; spot: string; logo_url: string | null;
};
const emptyDraft = (): Draft => ({
  name: '', category: 'restaurant', offer_en: '', offer_es: '', detail_en: '', detail_es: '',
  address: '', website: '', contact_name: '', contact_email: '', contact_phone: '',
  pledge_pct: '', spot: '', logo_url: null,
});
const draftFrom = (s: AdminShop): Draft => ({
  id: s.id, name: s.name, category: s.category, offer_en: s.offerEn, offer_es: s.offerEs || '',
  detail_en: s.detailEn || '', detail_es: s.detailEs || '', address: s.address || '', website: s.website || '',
  contact_name: s.contactName || '', contact_email: s.contactEmail || '', contact_phone: s.contactPhone || '',
  pledge_pct: s.pledgePct != null ? String(s.pledgePct) : '', spot: s.spot ? String(s.spot) : '', logo_url: s.logoUrl || null,
});

const slug = (s: string) =>
  (s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shop').slice(0, 28);

/**
 * Dashboard → Inclusion Festival. Everything runs off Supabase; there is no
 * file to edit and nothing to publish. Approving a shop puts it on the card and
 * emails the owner a link to print their QR sign.
 */
const FestivalAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const es = isEs();
  const allowed = isFestivalAdmin(user?.email);

  const [settings, setSettings] = useState<FestivalSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<FestivalSettings>(DEFAULT_SETTINGS);
  const [shops, setShops] = useState<AdminShop[] | null>(null);
  const [report, setReport] = useState<Awaited<ReturnType<typeof festivalDb.report>>>(null);
  const [regs, setRegs] = useState<Registration[] | null>(null);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<'open' | 'approved' | 'all'>('open');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [signFor, setSignFor] = useState<AdminShop | null>(null);
  const [copied, setCopied] = useState('');
  const closeDraft = useCallback(() => setDraft(null), []);
  const closeSign = useCallback(() => setSignFor(null), []);

  const load = useCallback(async () => {
    const [s, sh, rp, rg] = await Promise.all([
      festivalDb.settings(), festivalDb.allShops(), festivalDb.report(), festivalDb.registrations(),
    ]);
    setSettings(s); setSavedSettings(s); setShops(sh); setReport(rp); setRegs(rg);
  }, []);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  if (!allowed) {
    return (
      <div className={card}>
        <p className="font-bold text-slate-900 dark:text-white">{tr('Inclusion Festival', 'Festival de Inclusión')}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {tr('Sign in with an @aariasblueelephant.org account to run the festival.',
              'Inicia sesión con una cuenta @aariasblueelephant.org para administrar el festival.')}
        </p>
      </div>
    );
  }

  const fail = (e: string | null) => {
    setMsg(e === 'not_permitted'
      ? tr('Nothing changed — the database did not accept this account as a festival admin.',
           'No cambió nada: la base de datos no aceptó esta cuenta como administradora del festival.')
      : e || '');
  };

  const approvedSpots = new Set((shops || []).filter((s) => s.status === 'approved' && s.spot).map((s) => s.spot));
  const nextSpot = () => { for (let i = 1; i <= 999; i++) if (!approvedSpots.has(i)) return i; return 1; };

  /* ── actions ───────────────────────────────────────────────────────── */
  const approve = async (s: AdminShop) => {
    const err = await festivalDb.approve(s.id, s.spot && !approvedSpots.has(s.spot) ? s.spot : nextSpot(), user?.email || '', !!s.ownerId);
    fail(err);
    if (!err) setMsg(s.ownerId
      ? tr(`${s.name} is on the card. We emailed ${s.contactEmail} a link to print their sign.`,
           `${s.name} está en la tarjeta. Enviamos a ${s.contactEmail} un enlace para imprimir su letrero.`)
      : tr(`${s.name} is on the card. Print their sign with the Sign button.`,
           `${s.name} está en la tarjeta. Imprime su letrero con el botón Letrero.`));
    load();
  };
  const setStatus = async (s: AdminShop, status: ShopStatus) => {
    fail(await festivalDb.updateShop(s.id, { status, ...(status !== 'approved' ? { spot: null } : {}) }));
    load();
  };
  const remove = async (s: AdminShop) => {
    if (!window.confirm(tr(
      `Delete “${s.name}” for good?\n\nThe shop, its contact details and every redemption made there are removed. Its QR sign stops working. This cannot be undone.`,
      `¿Eliminar «${s.name}» para siempre?\n\nSe borran la tienda, sus datos de contacto y todos sus canjes. Su letrero QR deja de funcionar. No se puede deshacer.`))) return;
    fail(await festivalDb.deleteShop(s.id));
    load();
  };

  const saveDraft = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.offer_en.trim()) {
      setMsg(tr('A shop needs at least a name and an offer.', 'Una tienda necesita al menos nombre y oferta.'));
      return;
    }
    setSaving(true);
    const row = {
      name: draft.name.trim(), category: draft.category,
      offer_en: draft.offer_en.trim(), offer_es: draft.offer_es.trim() || null,
      detail_en: draft.detail_en.trim() || null, detail_es: draft.detail_es.trim() || null,
      address: draft.address.trim() || null, website: draft.website.trim() || null,
      contact_name: draft.contact_name.trim() || '—', contact_email: draft.contact_email.trim() || '—',
      contact_phone: draft.contact_phone.trim() || null,
      pledge_pct: draft.pledge_pct ? Math.min(100, Math.max(0, Number(draft.pledge_pct))) : null,
      spot: draft.spot ? Number(draft.spot) : null,
      logo_url: draft.logo_url,
      redeem_from: settings.redeemFrom, redeem_to: settings.redeemTo,
    };
    let err: string | null;
    if (draft.id) {
      err = await festivalDb.updateShop(draft.id, row);
    } else {
      // added by hand: straight onto the card, no owner, no email
      let id = slug(draft.name), n = 1;
      const taken = new Set((shops || []).map((s) => s.id));
      while (taken.has(id)) id = `${slug(draft.name)}-${++n}`;
      err = await festivalDb.addShop({
        ...row, id, status: 'approved', spot: row.spot || nextSpot(),
        approved_by: user?.email, approved_at: new Date().toISOString(),
      });
    }
    setSaving(false);
    fail(err);
    if (!err) { setDraft(null); load(); }
  };

  const onLogo = async (file?: File) => {
    if (!file || !draft) return;
    const url = await festivalDb.uploadLogo(file, 'admin');
    if (url) setDraft({ ...draft, logo_url: url });
    else setMsg(tr('That image did not upload.', 'Esa imagen no se subió.'));
  };

  const saveSettings = async () => {
    fail(await festivalDb.setSettings(settings));
    load();
  };
  const setStage = async (state: FestivalSettings['state']) => {
    if (state === 'live' && !window.confirm(tr(
      'Open the festival?\n\nFamilies can make cards, and QR signs start redeeming from the first offer day.',
      '¿Abrir el festival?\n\nLas familias pueden crear tarjetas y los letreros QR canjean desde el primer día de ofertas.'))) return;
    fail(await festivalDb.setSettings({ state }));
    load();
  };

  const deleteReg = async (r: Registration) => {
    if (!window.confirm(tr(
      `Delete ${r.display_name || r.short_code}'s card?\n\nTheir redemptions stay counted, so offers cannot be reused.`,
      `¿Eliminar la tarjeta de ${r.display_name || r.short_code}?\n\nSus canjes siguen contando, así las ofertas no se reutilizan.`))) return;
    fail(await festivalDb.deletePass(r.id));
    load();
  };

  /* ── reports ───────────────────────────────────────────────────────── */
  const shopName = (id: string) => shops?.find((s) => s.id === id)?.name || id;
  const totalRedemptions = report?.shops.reduce((n, s) => n + s.redemptions, 0) || 0;
  const totalNew = report?.shops.reduce((n, s) => n + s.new_cards, 0) || 0;

  const thankYou = (s: ShopReport) => {
    const days = (report?.daily || []).filter((d) => d.shop_id === s.id).sort((a, b) => b.redemptions - a.redemptions);
    const best = days.slice(0, 3).map((d) => fmtShortDay(d.local_date, false)).join(', ');
    return [
      `Hi ${s.contact_name && s.contact_name !== '—' ? s.contact_name.split(' ')[0] : 'there'},`,
      '',
      `Thank you for being part of the Inclusion Festival! Here is what your offer did in November:`,
      '',
      `• ${s.redemptions} ${s.redemptions === 1 ? 'family' : 'families'} redeemed your offer at ${s.name}`,
      s.new_cards ? `• ${s.new_cards} of them joined the festival right at your counter, by scanning your sign` : '',
      best ? `• Your busiest days: ${best}` : '',
      '',
      `Families who visited without scanning are not in that count, so the real number is likely higher.`,
      '',
      `Thank you for welcoming them. If you would like to support inclusive programs for Mountain House kids, you can give here: https://aariasblueelephant.org/give`,
      '',
      `With gratitude,`,
      `Aaria's Blue Elephant`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  };
  const copyThanks = async (s: ShopReport) => {
    try { await navigator.clipboard.writeText(thankYou(s)); setCopied(s.id); setTimeout(() => setCopied(''), 2000); }
    catch { window.prompt(tr('Copy this:', 'Copia esto:'), thankYou(s)); }
  };

  const csvShops = () => downloadCsv('festival-shops.csv', [
    ['Status', 'Spot', 'Shop', 'Category', 'Offer', 'Offer (ES)', 'Conditions', 'Address', 'Website',
     'Contact', 'Email', 'Phone', 'Pledge %', 'Signed up', 'Approved by'],
    ...(shops || []).map((s) => [s.status, s.spot, s.name, s.category, s.offerEn, s.offerEs, s.detailEn, s.address, s.website,
      s.contactName, s.contactEmail, s.contactPhone, s.pledgePct, s.createdAt?.slice(0, 10), s.approvedBy]),
  ]);
  const csvReport = () => downloadCsv('festival-redemptions-by-shop.csv', [
    ['Shop', 'Redemptions', 'Joined at their counter', 'First', 'Last', 'Pledge %', 'Contact', 'Email', 'Phone'],
    ...(report?.shops || []).map((s) => [s.name, s.redemptions, s.new_cards,
      s.first_at?.slice(0, 10), s.last_at?.slice(0, 10), s.pledge_pct, s.contact_name, s.contact_email, s.contact_phone]),
  ]);
  const csvDaily = () => downloadCsv('festival-redemptions-by-day.csv', [
    ['Date', 'Shop', 'Redemptions'],
    ...(report?.daily || []).map((d) => [d.local_date, shopName(d.shop_id), d.redemptions]),
  ]);
  const csvFamilies = () => downloadCsv('festival-cards.csv', [
    ['Card', 'Name', 'Email', 'Wants event emails', 'Party size', 'Joined via', 'Created', 'Offers used'],
    ...(regs || []).map((r) => [r.short_code, r.display_name, r.email, r.email_optin ? 'yes' : 'no', r.party_size,
      r.source === 'card' ? 'card page' : `QR sign: ${shopName(r.source)}`, r.created_at.slice(0, 10), r.redemptions]),
  ]);

  /* ── render ────────────────────────────────────────────────────────── */
  const counts = {
    open: (shops || []).filter((s) => s.status === 'pending' || s.status === 'waitlist').length,
    approved: (shops || []).filter((s) => s.status === 'approved').length,
    all: (shops || []).length,
  };
  const visible = (shops || [])
    .filter((s) => filter === 'all' || (filter === 'approved' ? s.status === 'approved' : s.status === 'pending' || s.status === 'waitlist'))
    .sort((a, b) => (a.spot ?? 999) - (b.spot ?? 999) || a.createdAt.localeCompare(b.createdAt));
  const settingsDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{tr('Inclusion Festival', 'Festival de Inclusión')}</h2>
        <p className="text-sm text-slate-500">
          {fmtDay(savedSettings.festivalDate, es, true)} · {savedSettings.eventTime} · {savedSettings.venue}
        </p>
      </div>

      {msg && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-sky-50 p-3 text-sm font-semibold text-sky-900 dark:bg-sky-900/30 dark:text-sky-200">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} aria-label={tr('Dismiss', 'Cerrar')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── stage & settings ─────────────────────────────────────────── */}
      <div className={card}>
        <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Settings2 className="h-4 w-4" />{tr('Stage', 'Etapa')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['recruiting', 'live', 'ended'] as const).map((st) => (
            <Button key={st} size="sm" variant={savedSettings.state === st ? 'primary' : 'secondary'} onClick={() => setStage(st)}>
              {st === 'recruiting' ? tr('Signing up shops', 'Inscribiendo tiendas')
                : st === 'live' ? tr('Live — families redeem', 'En vivo: las familias canjean')
                : tr('Ended', 'Terminado')}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {savedSettings.state === 'recruiting'
            ? tr('Shops can sign up. Families cannot make cards yet, and signs do not redeem.', 'Las tiendas se inscriben. Las familias aún no crean tarjetas y los letreros no canjean.')
            : savedSettings.state === 'live'
              ? tr('Families make cards. Signs redeem between the offer dates (Mountain House time).', 'Las familias crean tarjetas. Los letreros canjean entre las fechas de oferta (hora de Mountain House).')
              : tr('Nothing redeems. Reports stay available.', 'Nada se canjea. Los informes siguen disponibles.')}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div><label className={label}>{tr('Festival day', 'Día del festival')}</label>
            <input type="date" className={field} value={settings.festivalDate} onChange={(e) => setSettings({ ...settings, festivalDate: e.target.value })} /></div>
          <div><label className={label}>{tr('Time', 'Horario')}</label>
            <input className={field} value={settings.eventTime} onChange={(e) => setSettings({ ...settings, eventTime: e.target.value })} /></div>
          <div><label className={label}>{tr('Venue', 'Lugar')}</label>
            <input className={field} value={settings.venue} onChange={(e) => setSettings({ ...settings, venue: e.target.value })} /></div>
          <div><label className={label}>{tr('Offers from', 'Ofertas desde')}</label>
            <input type="date" className={field} value={settings.redeemFrom} onChange={(e) => setSettings({ ...settings, redeemFrom: e.target.value })} /></div>
          <div><label className={label}>{tr('Offers until (inclusive)', 'Ofertas hasta (inclusive)')}</label>
            <input type="date" className={field} value={settings.redeemTo} onChange={(e) => setSettings({ ...settings, redeemTo: e.target.value })} /></div>
          <div><label className={label}>{tr('Spots on the card', 'Lugares en la tarjeta')}</label>
            <input type="number" min={1} max={64} className={field} value={settings.spots} onChange={(e) => setSettings({ ...settings, spots: Number(e.target.value) || 1 })} /></div>
        </div>
        {settingsDirty && (
          <div className="mt-3 flex items-center gap-3">
            <Button size="sm" onClick={saveSettings}>{tr('Save settings', 'Guardar ajustes')}</Button>
            <p className="text-xs text-slate-500">
              {tr('Offer dates apply to every shop, including ones already on the card.',
                  'Las fechas de oferta aplican a todas las tiendas, incluidas las que ya están en la tarjeta.')}
            </p>
          </div>
        )}
      </div>

      {/* ── shops ────────────────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Store className="h-4 w-4" />{tr('Shops', 'Tiendas')}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={csvShops}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
            <Button size="sm" onClick={() => setDraft({ ...emptyDraft(), spot: String(nextSpot()) })}>
              <Plus className="mr-1.5 h-4 w-4" />{tr('Add a shop myself', 'Agregar una tienda yo')}
            </Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {([['open', tr('To review', 'Por revisar')], ['approved', tr('On the card', 'En la tarjeta')], ['all', tr('All', 'Todas')]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${filter === k ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {l} ({counts[k]})
            </button>
          ))}
        </div>

        {shops === null ? (
          <p className="mt-4 text-sm text-rose-600">{tr('Could not load shops. Has supabase/create_festival.sql been run?', 'No se pudieron cargar las tiendas. ¿Se ejecutó supabase/create_festival.sql?')}</p>
        ) : visible.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{filter === 'open' ? tr('Nothing waiting for review.', 'Nada pendiente de revisión.') : tr('No shops yet.', 'Todavía no hay tiendas.')}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {visible.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  {s.logoUrl
                    ? <img src={s.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 object-contain" />
                    : <span className="flex h-12 w-12 shrink-0 items-center justify-center text-3xl">{s.emoji}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {s.spot && s.status === 'approved' && <span className="text-xs font-black text-slate-400">#{s.spot}</span>}
                      <p className="font-black text-slate-900 dark:text-white">{s.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[s.status]}`}>
                        {tr(...STATUS_LABEL[s.status])}
                      </span>
                      {!s.ownerId && <span className="text-[10px] font-bold uppercase text-slate-400">{tr('added by hand', 'agregada a mano')}</span>}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-sky-800 dark:text-sky-300">{s.offerEn}</p>
                    {s.offerEs && <p className="text-xs italic text-slate-500">{s.offerEs}</p>}
                    {s.detailEn && <p className="text-xs text-slate-500">{s.detailEn}</p>}
                    <p className="mt-1 text-xs text-slate-500">
                      {es ? CATEGORY_LABEL[s.category].es : CATEGORY_LABEL[s.category].en}
                      {' · '}{s.contactName} · {s.contactEmail}{s.contactPhone ? ` · ${s.contactPhone}` : ''}
                      {s.pledgePct ? ` · ${tr('pledge', 'donación')} ${s.pledgePct}%` : ''}
                      {' · '}{tr('signed up', 'inscrita')} {fmtShortDay(s.createdAt, es)}
                    </p>
                    {!s.offerEs && s.status !== 'declined' && (
                      <p className="mt-1 text-xs font-bold text-amber-600">{tr('No Spanish offer yet — add one with Edit.', 'Aún sin oferta en español: agrégala con Editar.')}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.status !== 'approved' && (
                    <Button size="sm" onClick={() => approve(s)}><Check className="mr-1 h-4 w-4" />{tr('Approve', 'Aprobar')}</Button>
                  )}
                  {s.status === 'approved' && (
                    <Button size="sm" onClick={() => setSignFor(s)}><Printer className="mr-1 h-4 w-4" />{tr('Sign', 'Letrero')}</Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setDraft(draftFrom(s))}><Pencil className="mr-1 h-4 w-4" />{tr('Edit', 'Editar')}</Button>
                  {s.status !== 'waitlist' && s.status !== 'approved' && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(s, 'waitlist')}><Clock className="mr-1 h-4 w-4" />{tr('Waiting list', 'Lista de espera')}</Button>
                  )}
                  {s.status !== 'declined' && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(s, 'declined')}>
                      <X className="mr-1 h-4 w-4" />{s.status === 'approved' ? tr('Take off the card', 'Quitar de la tarjeta') : tr('Decline', 'Rechazar')}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(s)} aria-label={tr('Delete', 'Eliminar')}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── reports ──────────────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><BarChart3 className="h-4 w-4" />{tr('How it is going', 'Cómo va')}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={csvReport}><Download className="mr-1.5 h-4 w-4" />{tr('By shop', 'Por tienda')}</Button>
            <Button size="sm" variant="secondary" onClick={csvDaily}><Download className="mr-1.5 h-4 w-4" />{tr('By day', 'Por día')}</Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { n: regs?.length || 0, l: tr('family cards', 'tarjetas de familias') },
            { n: totalRedemptions, l: tr('offers redeemed', 'ofertas canjeadas') },
            { n: report?.shops.filter((s) => s.redemptions > 0).length || 0, l: tr('shops with visits', 'tiendas con visitas') },
            { n: totalNew, l: tr('joined at a shop’s sign', 'se unieron en un letrero') },
            { n: regs?.filter((r) => r.email_optin).length || 0, l: tr('want event emails', 'quieren correos de eventos') },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
              <p className="text-2xl font-black text-slate-900 dark:text-white">{x.n}</p>
              <p className="text-[11px] font-bold text-slate-500">{x.l}</p>
            </div>
          ))}
        </div>

        {report && report.shops.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-3">{tr('Shop', 'Tienda')}</th>
                  <th className="py-2 pr-3 text-right">{tr('Redeemed', 'Canjes')}</th>
                  <th className="py-2 pr-3 text-right">{tr('At their sign', 'En su letrero')}</th>
                  <th className="py-2 pr-3">{tr('Last', 'Último')}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {report.shops.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="py-2 pr-3 text-right font-black">{s.redemptions}</td>
                    <td className="py-2 pr-3 text-right">{s.new_cards}</td>
                    <td className="py-2 pr-3 text-slate-500">{s.last_at ? fmtShortDay(s.last_at, es) : '—'}</td>
                    <td className="py-2 text-right">
                      <button onClick={() => copyThanks(s)} className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline dark:text-sky-400">
                        <Copy className="h-3.5 w-3.5" />{copied === s.id ? tr('Copied', 'Copiado') : tr('Thank-you note', 'Nota de agradecimiento')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              {tr('“At their sign” = families who made their card by scanning that shop’s sign — people the shop brought in. Shops only ever get counts, never names.',
                  '“En su letrero” = familias que crearon su tarjeta al escanear el letrero de esa tienda. Las tiendas solo reciben números, nunca nombres.')}
            </p>
          </div>
        )}
      </div>

      {/* ── families ─────────────────────────────────────────────────── */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Users className="h-4 w-4" />{tr('Family cards', 'Tarjetas de familias')} ({regs?.length || 0})</p>
          <Button size="sm" variant="secondary" onClick={csvFamilies}><Download className="mr-1.5 h-4 w-4" />CSV</Button>
        </div>
        {regs && regs.length > 0 ? (
          <div className="mt-4 max-h-96 space-y-1 overflow-y-auto">
            {regs.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900 dark:text-white">{r.display_name || '—'}</span>
                  <span className="ml-2 text-xs text-slate-500">{r.email}{r.email_optin ? ' ✉️' : ''} · {r.party_size}👤 · {r.redemptions} {tr('used', 'usadas')}
                    {r.source !== 'card' && ` · ${tr('via', 'vía')} ${shopName(r.source)}`}</span>
                </div>
                <button onClick={() => deleteReg(r)} className="shrink-0 text-slate-400 hover:text-rose-600" aria-label={tr('Delete card', 'Eliminar tarjeta')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">{tr('No family cards yet.', 'Todavía no hay tarjetas de familias.')}</p>
        )}
      </div>

      {/* ── edit / add dialog ────────────────────────────────────────── */}
      {draft && (
        <Dialog label={draft.id ? tr('Edit shop', 'Editar tienda') : tr('Add a shop', 'Agregar una tienda')} onClose={closeDraft}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 dark:bg-slate-900">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {draft.id ? tr('Edit shop', 'Editar tienda') : tr('Add a shop myself', 'Agregar una tienda yo')}
          </h3>
          {!draft.id && (
            <p className="mt-1 text-sm text-slate-500">
              {tr('For a shop that signed up in person. It goes straight onto the card; print its sign with the Sign button. No email is sent.',
                  'Para una tienda que se inscribió en persona. Va directo a la tarjeta; imprime su letrero con el botón Letrero. No se envía correo.')}
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><label className={label}>{tr('Business name', 'Nombre del negocio')} *</label>
              <input className={field} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div><label className={label}>{tr('Type', 'Tipo')}</label>
              <select className={field} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ShopCategory })}>
                {(Object.keys(CATEGORY_LABEL) as ShopCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_EMOJI[c]} {es ? CATEGORY_LABEL[c].es : CATEGORY_LABEL[c].en}</option>
                ))}
              </select></div>
            <div><label className={label}>{tr('Offer', 'Oferta')} *</label>
              <input className={field} value={draft.offer_en} onChange={(e) => setDraft({ ...draft, offer_en: e.target.value })} /></div>
            <div><label className={label}>{tr('Offer in Spanish', 'Oferta en español')}</label>
              <input className={field} value={draft.offer_es} onChange={(e) => setDraft({ ...draft, offer_es: e.target.value })} /></div>
            <div><label className={label}>{tr('Conditions', 'Condiciones')}</label>
              <input className={field} value={draft.detail_en} onChange={(e) => setDraft({ ...draft, detail_en: e.target.value })} /></div>
            <div><label className={label}>{tr('Conditions in Spanish', 'Condiciones en español')}</label>
              <input className={field} value={draft.detail_es} onChange={(e) => setDraft({ ...draft, detail_es: e.target.value })} /></div>
            <div><label className={label}>{tr('Address', 'Dirección')}</label>
              <input className={field} value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></div>
            <div><label className={label}>{tr('Website', 'Sitio web')}</label>
              <input className={field} value={draft.website} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></div>
            <div><label className={label}>{tr('Contact name', 'Nombre de contacto')}</label>
              <input className={field} value={draft.contact_name} onChange={(e) => setDraft({ ...draft, contact_name: e.target.value })} /></div>
            <div><label className={label}>{tr('Contact email', 'Correo de contacto')}</label>
              <input type="email" className={field} value={draft.contact_email} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} /></div>
            <div><label className={label}>{tr('Phone', 'Teléfono')}</label>
              <input className={field} value={draft.contact_phone} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>{tr('Pledge %', 'Donación %')}</label>
                <input type="number" min={0} max={100} className={field} value={draft.pledge_pct} onChange={(e) => setDraft({ ...draft, pledge_pct: e.target.value })} /></div>
              <div><label className={label}>{tr('Spot #', 'Lugar #')}</label>
                <input type="number" min={1} className={field} value={draft.spot} onChange={(e) => setDraft({ ...draft, spot: e.target.value })} /></div>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>{tr('Logo', 'Logo')}</label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 p-2 text-sm font-semibold text-slate-600 dark:border-slate-600 dark:text-slate-300">
                {draft.logo_url ? <img src={draft.logo_url} alt="" className="h-10 w-10 rounded object-contain" /> : <ImagePlus className="h-5 w-5" />}
                {draft.logo_url ? tr('Change logo', 'Cambiar logo') : tr('Upload logo', 'Subir logo')}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeDraft}>{tr('Cancel', 'Cancelar')}</Button>
            <Button onClick={saveDraft} disabled={saving}>{saving ? tr('Saving…', 'Guardando…') : tr('Save', 'Guardar')}</Button>
          </div>
        </Dialog>
      )}

      {/* ── a shop's sign ────────────────────────────────────────────── */}
      {signFor && (
        <Dialog label={tr('QR sign', 'Letrero QR')} onClose={closeSign}
                className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 dark:bg-slate-900">
          <PrintTarget id="admin-sign">
            <QrSign token={signFor.qrToken} name={signFor.name} offerEn={signFor.offerEn} offerEs={signFor.offerEs}
                    logoUrl={signFor.logoUrl} redeemFrom={signFor.redeemFrom} redeemTo={signFor.redeemTo} />
          </PrintTarget>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={closeSign}>{tr('Close', 'Cerrar')}</Button>
            <Button onClick={() => printSign('admin-sign')}><Printer className="mr-2 h-4 w-4" />{tr('Print', 'Imprimir')}</Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default FestivalAdminPanel;
