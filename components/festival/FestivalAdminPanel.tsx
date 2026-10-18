import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, X, Clock, Printer, Pencil, Trash2, Plus, Download, Copy, Users, Store, BarChart3, Settings2, ImagePlus, Link2, Table, List,
} from 'lucide-react';
import Button from '../Button';
import Dialog from './Dialog';
import { QrSign, PrintTarget, printSign } from './QrSign';
import { festivalDb, Registration, ShopReport } from '../../lib/festival/db';
import { DEFAULT_SETTINGS, fmtShortDay, fmtDay, shopPageUrl, youtubeId, youtubeLink } from '../../lib/festival/store';
import {
  AdminShop, FestivalSettings, ShopCategory, ShopStatus, CATEGORY_LABEL, CATEGORY_EMOJI, isFestivalAdmin,
} from '../../lib/festival/types';
import { useAuth } from '../../context/AuthContext';
import { tr, isEs } from '../../lib/lang';

const field = 'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const label = 'mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300';
const card = 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900';

const STATUS_STYLE: Record<ShopStatus, string> = {
  unconfirmed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pending: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  waitlist: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  declined: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  withdrawn: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
/** waiting on an admin: a new sign-up, the waiting list, or a change to a live card */
const needsReview = (s: AdminShop) => s.status === 'pending' || s.status === 'waitlist' || !!s.pendingChanges;

const STATUS_LABEL: Record<ShopStatus, [string, string]> = {
  unconfirmed: ['Email not confirmed yet', 'Correo sin confirmar'],
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
  instore: boolean; online: boolean; online_link: string; online_note: string;
  young_founder: boolean; video_url: string; public_contact: string;
};
const emptyDraft = (): Draft => ({
  name: '', category: 'restaurant', offer_en: '', offer_es: '', detail_en: '', detail_es: '',
  address: '', website: '', contact_name: '', contact_email: '', contact_phone: '',
  pledge_pct: '', spot: '', logo_url: null,
  instore: true, online: false, online_link: '', online_note: '',
  young_founder: false, video_url: '', public_contact: '',
});
const draftFrom = (s: AdminShop): Draft => ({
  id: s.id, name: s.name, category: s.category, offer_en: s.offerEn, offer_es: s.offerEs || '',
  detail_en: s.detailEn || '', detail_es: s.detailEs || '', address: s.address || '', website: s.website || '',
  contact_name: s.contactName || '', contact_email: s.contactEmail || '', contact_phone: s.contactPhone || '',
  pledge_pct: s.pledgePct != null ? String(s.pledgePct) : '', spot: s.spot ? String(s.spot) : '', logo_url: s.logoUrl || null,
  instore: s.instore, online: s.online, online_link: s.onlineLink || '', online_note: s.onlineNote || '',
  young_founder: !!s.youngFounder, video_url: s.videoId ? youtubeLink(s.videoId) : '', public_contact: s.publicContact || '',
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
  const [filter, setFilter] = useState<'open' | 'approved' | 'unconfirmed' | 'local' | 'young' | 'all'>('open');
  // until someone picks a filter: "To review" when there is something to review, otherwise everything
  const picked = useRef(false);
  const pickFilter = (f: typeof filter) => { picked.current = true; setFilter(f); };
  // quick view: one row per shop, contacts at a glance; details: the full cards with every action
  const [view, setView] = useState<'quick' | 'details'>('quick');
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
    if (!picked.current) setFilter((sh || []).some(needsReview) ? 'open' : 'all');
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

  const approvedSpots = new Set((shops || []).filter((s) => s.status === 'approved' && s.spot && !s.youngFounder).map((s) => s.spot));
  const nextSpot = () => { for (let i = 1; i <= 999; i++) if (!approvedSpots.has(i)) return i; return 1; };

  /* ── actions ───────────────────────────────────────────────────────── */
  const approve = async (s: AdminShop) => {
    const err = await festivalDb.approve(s.id, s.youngFounder ? null : s.spot && !approvedSpots.has(s.spot) ? s.spot : nextSpot(), user?.email || '', s.contactEmail || '');
    fail(err);
    if (!err) setMsg((s.contactEmail || '').includes('@')
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
    if (draft.video_url.trim() && !youtubeId(draft.video_url)) {
      setMsg(tr('That does not look like a YouTube link.', 'Eso no parece un enlace de YouTube.'));
      return;
    }
    setSaving(true);
    const wasYoung = !!(shops || []).find((x) => x.id === draft.id)?.youngFounder;
    const row = {
      name: draft.name.trim(), category: draft.category,
      offer_en: draft.offer_en.trim(), offer_es: draft.offer_es.trim() || null,
      detail_en: draft.detail_en.trim() || null, detail_es: draft.detail_es.trim() || null,
      address: draft.address.trim() || null, website: draft.website.trim() || null,
      contact_name: draft.contact_name.trim() || '—', contact_email: draft.contact_email.trim() || '—',
      contact_phone: draft.contact_phone.trim() || null,
      pledge_pct: draft.pledge_pct ? Math.min(100, Math.max(0, Number(draft.pledge_pct))) : null,
      // a young founder never holds one of the limited spots
      spot: draft.young_founder ? null : draft.spot ? Number(draft.spot) : null,
      young_founder: draft.young_founder,
      video_id: youtubeId(draft.video_url),
      public_contact: draft.public_contact.trim().slice(0, 120) || null,
      // entered in person with the parent; keep the first date if there already is one
      ...(draft.young_founder && !wasYoung ? { guardian_consent_at: new Date().toISOString() } : {}),
      logo_url: draft.logo_url,
      instore: draft.instore || !draft.online,
      online: draft.online,
      online_link: draft.online ? (draft.online_link.trim() ? (/^https?:\/\//i.test(draft.online_link.trim()) ? draft.online_link.trim() : 'https://' + draft.online_link.trim()) : null) : null,
      online_note: draft.online ? (draft.online_note.trim() || null) : null,
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
        ...row, id, status: 'approved', spot: row.young_founder ? null : row.spot || nextSpot(),
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
      `Thank you for welcoming them. If you would like to support inclusive programs for kids in our community, you can give here: https://aariasblueelephant.org/give`,
      '',
      `With gratitude,`,
      `Aaria's Blue Elephant`,
    ].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
  };
  /** the shop's private page — hand it to a shop that signed up in person */
  const copyLink = async (s: AdminShop) => {
    const url = shopPageUrl(s.manageToken);
    try { await navigator.clipboard.writeText(url); setCopied('link:' + s.id); setTimeout(() => setCopied(''), 2000); }
    catch { window.prompt(tr('Copy this:', 'Copia esto:'), url); }
  };

  const copyThanks = async (s: ShopReport) => {
    try { await navigator.clipboard.writeText(thankYou(s)); setCopied(s.id); setTimeout(() => setCopied(''), 2000); }
    catch { window.prompt(tr('Copy this:', 'Copia esto:'), thankYou(s)); }
  };

  const csvShops = () => downloadCsv('festival-shops.csv', [
    ['Status', 'Spot', 'Shop', 'Category', 'In store', 'Online', 'Online booking', 'Offer', 'Offer (ES)', 'Conditions', 'Address', 'Website',
     'Contact', 'Email', 'Phone', 'Pledge %', 'Signed up', 'Approved by', 'Young founder', 'Video', 'Public contact'],
    ...(shops || []).map((s) => [s.status, s.spot, s.name, s.category, s.instore ? 'yes' : 'no', s.online ? 'yes' : 'no', s.onlineLink, s.offerEn, s.offerEs, s.detailEn, s.address, s.website,
      s.contactName, s.contactEmail, s.contactPhone, s.pledgePct, s.createdAt?.slice(0, 10), s.approvedBy, s.youngFounder ? 'yes' : 'no', s.videoId ? youtubeLink(s.videoId) : '', s.publicContact]),
  ]);
  const csvReport = () => downloadCsv('festival-redemptions-by-shop.csv', [
    ['Shop', 'Redemptions', 'New families via them', 'Online codes', 'Online codes used', 'First', 'Last', 'Pledge %', 'Contact', 'Email', 'Phone'],
    ...(report?.shops || []).map((s) => [s.name, s.redemptions, s.new_cards, s.online_codes, s.codes_used,
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
    open: (shops || []).filter(needsReview).length,
    approved: (shops || []).filter((s) => s.status === 'approved').length,
    unconfirmed: (shops || []).filter((s) => s.status === 'unconfirmed').length,
    local: (shops || []).filter((s) => !s.youngFounder && s.status !== 'withdrawn' && s.status !== 'declined').length,
    young: (shops || []).filter((s) => s.youngFounder && s.status !== 'withdrawn' && s.status !== 'declined').length,
    all: (shops || []).length,
  };
  const visible = (shops || [])
    .filter((s) => filter === 'all' || (filter === 'open' ? needsReview(s) : filter === 'young' || filter === 'local'
      ? (filter === 'young') === !!s.youngFounder && s.status !== 'withdrawn' && s.status !== 'declined' : s.status === filter))
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
              ? tr('Families make cards. Signs redeem between the offer dates (Pacific time).', 'Las familias crean tarjetas. Los letreros canjean entre las fechas de oferta (hora del Pacífico).')
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
          {([['open', tr('To review', 'Por revisar')], ['approved', tr('On the card', 'En la tarjeta')],
             ['unconfirmed', tr('Email not confirmed', 'Sin confirmar')], ['local', tr('Local businesses', 'Negocios locales')], ['young', tr('Young Founders', 'Jóvenes Emprendedores')],
             ['all', tr('All', 'Todas')]] as const).map(([k, l]) => (
            <button key={k} onClick={() => pickFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${filter === k ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {l} ({counts[k]})
            </button>
          ))}
          <div className="ml-auto flex overflow-hidden rounded-full border border-slate-200 text-xs font-bold dark:border-slate-700">
            {([['quick', Table, tr('Quick view', 'Vista rápida')], ['details', List, tr('Details', 'Detalles')]] as const).map(([k, Icon, l]) => (
              <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
                className={`inline-flex items-center gap-1 px-3 py-1 ${view === k ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'text-slate-600 dark:text-slate-300'}`}>
                <Icon className="h-3.5 w-3.5" />{l}
              </button>
            ))}
          </div>
        </div>

        {shops === null ? (
          <p className="mt-4 text-sm text-rose-600">{tr('Could not load shops. Has supabase/create_festival.sql been run?', 'No se pudieron cargar las tiendas. ¿Se ejecutó supabase/create_festival.sql?')}</p>
        ) : visible.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{filter === 'open' ? tr('Nothing waiting for review.', 'Nada pendiente de revisión.') : tr('No shops yet.', 'Todavía no hay tiendas.')}</p>
        ) : view === 'quick' ? (
          /* every shop on one line — who, how to reach them, where they stand */
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-3">{tr('Shop', 'Tienda')}</th>
                  <th className="py-2 pr-3">{tr('Status', 'Estado')}</th>
                  <th className="py-2 pr-3">{tr('Contact', 'Contacto')}</th>
                  <th className="py-2 pr-3">{tr('Email', 'Correo')}</th>
                  <th className="py-2 pr-3">{tr('Phone', 'Teléfono')}</th>
                  <th className="py-2 pr-3">{tr('Shown to families', 'Visible para familias')}</th>
                  <th className="py-2 pr-3">{tr('Video', 'Video')}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              {/* two groups, like the public page: local businesses, then the kids */}
              {([['local', `🏪 ${tr('Local businesses', 'Negocios locales')}`, visible.filter((s) => !s.youngFounder)],
                 ['young', `🌟 ${tr('Young Founders', 'Jóvenes Emprendedores')}`, visible.filter((s) => s.youngFounder)]] as const)
                .filter(([, , rows]) => rows.length > 0 || filter === 'all')
                .map(([g, heading, rows]) => (
              <tbody key={g}>
                <tr>
                  <td colSpan={8} className="pb-1 pt-4 text-sm font-black text-slate-900 dark:text-white">
                    {heading} <span className="font-semibold text-slate-400">({rows.length})</span>
                  </td>
                </tr>
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="border-b border-slate-100 pb-3 text-sm text-slate-400 dark:border-slate-800">{tr('None yet.', 'Ninguno todavía.')}</td></tr>
                )}
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                    <td className="py-2.5 pr-3">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {s.spot && s.status === 'approved' && <span className="mr-1 text-xs text-slate-400">#{s.spot}</span>}
                        {s.youngFounder && <span title={tr('Young Founder', 'Joven Emprendedor')}>🌟 </span>}{s.name}
                      </p>
                      <p className="text-xs text-slate-500">{es ? CATEGORY_LABEL[s.category].es : CATEGORY_LABEL[s.category].en}</p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[s.status]}`}>{tr(...STATUS_LABEL[s.status])}</span>
                      {s.pendingChanges && <p className="mt-1 text-[11px] font-bold text-amber-600">{tr('Change to review', 'Cambio por revisar')}</p>}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-200">{s.contactName}</td>
                    <td className="py-2.5 pr-3">
                      {s.contactEmail?.includes('@')
                        ? <a href={`mailto:${s.contactEmail}`} className="whitespace-nowrap text-sky-700 hover:underline dark:text-sky-400">{s.contactEmail}</a>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {s.contactPhone ? <a href={`tel:${s.contactPhone.replace(/[^\d+]/g, '')}`} className="text-sky-700 hover:underline dark:text-sky-400">{s.contactPhone}</a> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2.5 pr-3 break-all text-slate-600 dark:text-slate-300">{s.publicContact || <span className="text-slate-400">—</span>}</td>
                    <td className="py-2.5 pr-3">
                      {s.videoId ? <a href={youtubeLink(s.videoId)} target="_blank" rel="noopener noreferrer" className="font-bold text-sky-700 hover:underline dark:text-sky-400">▶</a> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => { setView('details'); setTimeout(() => document.getElementById(`shop-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }}
                              className="whitespace-nowrap text-xs font-bold text-sky-700 hover:underline dark:text-sky-400">
                        {needsReview(s) ? tr('Review →', 'Revisar →') : tr('Open →', 'Abrir →')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
                ))}
            </table>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visible.map((s) => (
              <div key={s.id} id={`shop-${s.id}`} className="scroll-mt-24 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-start gap-3">
                  {s.logoUrl
                    ? <img src={s.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 object-contain" />
                    : <span className="flex h-12 w-12 shrink-0 items-center justify-center text-3xl">{s.emoji}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {s.spot && s.status === 'approved' && <span className="text-xs font-black text-slate-400">#{s.spot}</span>}
                      <p className="font-black text-slate-900 dark:text-white">{s.name}</p>
                      {s.youngFounder && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">🌟 {tr('Young Founder', 'Joven Emprendedor')}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${STATUS_STYLE[s.status]}`}>
                        {tr(...STATUS_LABEL[s.status])}
                      </span>
                      {s.online && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">{tr('Online', 'En línea')}</span>}
                      {s.online && s.instore && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black uppercase text-green-700 dark:bg-green-900/40 dark:text-green-300">{tr('In store', 'En tienda')}</span>}
                      {!s.ownerId && !s.emailConfirmedAt && s.status !== 'unconfirmed' && <span className="text-[10px] font-bold uppercase text-slate-400">{tr('added by hand', 'agregada a mano')}</span>}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-sky-800 dark:text-sky-300">{s.offerEn}</p>
                    {s.offerEs && <p className="text-xs italic text-slate-500">{s.offerEs}</p>}
                    {s.detailEn && <p className="text-xs text-slate-500">{s.detailEn}</p>}
                    {s.online && (s.onlineLink || s.onlineNote) && (
                      <p className="text-xs text-violet-700 dark:text-violet-300">💻 {[s.onlineLink, s.onlineNote].filter(Boolean).join(' · ')}</p>
                    )}
                    {/* public on the card — check it before approving, especially for a kid's business */}
                    {s.publicContact && <p className="text-xs text-slate-600 dark:text-slate-300">💬 {tr('Shown to families:', 'Visible para las familias:')} {s.publicContact}</p>}
                    {s.videoId && (
                      <a href={youtubeLink(s.videoId)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-sky-700 underline dark:text-sky-400">
                        ▶ {s.status === 'approved' ? tr('Watch video', 'Ver video') : tr('Watch video before approving', 'Ver el video antes de aprobar')}
                      </a>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      {es ? CATEGORY_LABEL[s.category].es : CATEGORY_LABEL[s.category].en}
                      {' · '}{s.contactName} · {s.contactEmail}{s.contactPhone ? ` · ${s.contactPhone}` : ''}
                      {s.pledgePct ? ` · ${tr('pledge', 'donación')} ${s.pledgePct}%` : ''}
                      {' · '}{tr('signed up', 'inscrita')} {fmtShortDay(s.createdAt, es)}
                    </p>
                    {s.pendingChanges && (
                      <div className="mt-2 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                        <p className="font-black uppercase">{tr('Change requested', 'Cambio solicitado')}</p>
                        {(['offer_en', 'offer_es', 'detail_en', 'name', 'address', 'online_link', 'online_note', 'public_contact'] as const).map((k) => {
                          const now = ({ offer_en: s.offerEn, offer_es: s.offerEs, detail_en: s.detailEn, name: s.name, address: s.address, online_link: s.onlineLink, online_note: s.onlineNote } as any)[k] || '';
                          const next = s.pendingChanges![k] ?? '';
                          return next !== now ? (
                            <p key={k} className="mt-1"><span className="font-bold">{k.replace('_en', '').replace('_', ' ')}:</span> <s className="opacity-60">{now || '—'}</s> → <strong>{next || '—'}</strong></p>
                          ) : null;
                        })}
                        {s.pendingChanges.video_id && s.pendingChanges.video_id !== s.videoId && (
                          <p className="mt-1"><span className="font-bold">{tr('video', 'video')}:</span>{' '}
                            <a href={youtubeLink(s.pendingChanges.video_id)} target="_blank" rel="noopener noreferrer" className="font-bold underline">▶ {tr('Watch new video', 'Ver video nuevo')}</a></p>
                        )}
                        {s.pendingChanges.logo_url && (
                          <p className="mt-1 flex items-center gap-2"><span className="font-bold">{tr('logo', 'logo')}:</span>
                            <img src={s.pendingChanges.logo_url} alt="" className="h-8 w-8 rounded bg-white object-contain" /></p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" onClick={async () => { fail(await festivalDb.reviewChange(s.id, true)); load(); }}>
                            <Check className="mr-1 h-4 w-4" />{tr('Approve change', 'Aprobar cambio')}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={async () => { fail(await festivalDb.reviewChange(s.id, false)); load(); }}>
                            {tr('Turn down', 'Rechazar')}
                          </Button>
                        </div>
                      </div>
                    )}
                    {!s.offerEs && s.status !== 'declined' && (
                      <p className="mt-1 text-xs font-bold text-amber-600">{tr('No Spanish offer yet — add one with Edit.', 'Aún sin oferta en español: agrégala con Editar.')}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.status !== 'approved' && (
                    <Button size="sm" onClick={() => approve(s)}><Check className="mr-1 h-4 w-4" />{tr('Approve', 'Aprobar')}</Button>
                  )}
                  {s.status === 'approved' && s.instore && (
                    <Button size="sm" onClick={() => setSignFor(s)}><Printer className="mr-1 h-4 w-4" />{tr('Sign', 'Letrero')}</Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setDraft(draftFrom(s))}><Pencil className="mr-1 h-4 w-4" />{tr('Edit', 'Editar')}</Button>
                  <Button size="sm" variant="secondary" onClick={() => copyLink(s)}>
                    <Link2 className="mr-1 h-4 w-4" />{copied === 'link:' + s.id ? tr('Copied', 'Copiado') : tr('Shop link', 'Enlace de la tienda')}
                  </Button>
                  {s.status !== 'waitlist' && s.status !== 'approved' && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(s, 'waitlist')}><Clock className="mr-1 h-4 w-4" />{tr('Waiting list', 'Lista de espera')}</Button>
                  )}
                  {/* a young founder ending early chose to stop — withdrawn, not declined */}
                  {s.youngFounder && s.status === 'approved' && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(s, 'withdrawn')}>
                      <X className="mr-1 h-4 w-4" />{tr('End offer (they asked)', 'Terminar oferta (lo pidieron)')}
                    </Button>
                  )}
                  {s.status !== 'declined' && !(s.youngFounder && s.status === 'approved') && (
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
            { n: totalNew, l: tr('new families via shops', 'familias nuevas por tiendas') },
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
                  <th className="py-2 pr-3 text-right">{tr('New families via them', 'Familias nuevas por ellos')}</th>
                  <th className="py-2 pr-3 text-right">{tr('Online codes (used)', 'Códigos en línea (usados)')}</th>
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
                    <td className="py-2 pr-3 text-right">{s.online_codes ? `${s.online_codes} (${s.codes_used})` : '—'}</td>
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
              {tr('“New families via them” = families whose first festival card came from that shop’s sign or code — people the shop brought in. Shops only ever get counts and codes, never names.',
                  '“Familias nuevas por ellos” = familias cuya primera tarjeta vino del letrero o código de esa tienda. Las tiendas solo reciben números y códigos, nunca nombres.')}
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
              {tr('For a shop that signed up in person. It goes straight onto the card. With their email, they get the approval email and their shop link; without one, print their sign with the Sign button.',
                  'Para una tienda que se inscribió en persona. Va directo a la tarjeta. Con su correo, reciben el correo de aprobación y el enlace de su tienda; sin él, imprime su letrero con el botón Letrero.')}
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
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={draft.young_founder} onChange={(e) => setDraft({ ...draft, young_founder: e.target.checked })} />
                🌟 {tr('Young Founder', 'Joven Emprendedor')}
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={draft.instore} onChange={(e) => setDraft({ ...draft, instore: e.target.checked || !draft.online })} />
                {tr('In store (QR sign)', 'En tienda (letrero QR)')}
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <input type="checkbox" checked={draft.online} onChange={(e) => setDraft({ ...draft, online: e.target.checked, instore: draft.instore || !e.target.checked })} />
                {tr('Online (personal codes)', 'En línea (códigos personales)')}
              </label>
            </div>
            <div className="sm:col-span-2"><label className={label}>{tr('Public contact for families', 'Contacto público para las familias')}</label>
              <input className={field} value={draft.public_contact} onChange={(e) => setDraft({ ...draft, public_contact: e.target.value })} placeholder={tr('shop email, phone or @handle', 'correo, teléfono o @usuario del negocio')} /></div>
            <div className="sm:col-span-2"><label className={label}>{tr('YouTube link', 'Enlace de YouTube')}</label>
              <input className={field} value={draft.video_url} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} placeholder="https://youtu.be/…" /></div>
            {draft.online && (
              <>
                <div><label className={label}>{tr('Where families book', 'Dónde reservan')}</label>
                  <input className={field} value={draft.online_link} onChange={(e) => setDraft({ ...draft, online_link: e.target.value })} placeholder="https://" /></div>
                <div><label className={label}>{tr('How to use the code', 'Cómo usar el código')}</label>
                  <input className={field} value={draft.online_note} onChange={(e) => setDraft({ ...draft, online_note: e.target.value })} /></div>
              </>
            )}
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
                    logoUrl={signFor.logoUrl} redeemFrom={signFor.redeemFrom} redeemTo={signFor.redeemTo} youngFounder={signFor.youngFounder} />
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
