import React, { useMemo, useState } from 'react';
import { Copy, Check, Lock, Plus, Trash2, Store, ImageOff, FileJson, Github } from 'lucide-react';
import Button from '../components/Button';
import SpotMeter from '../components/festival/SpotMeter';
import { festival, SETTINGS, slugify } from '../lib/festival/store';
import {
  ShopCategory, CATEGORY_LABEL, CATEGORY_EMOJI,
  FESTIVAL_ADMINS, isFestivalAdmin,
} from '../lib/festival/types';
import { useAuth } from '../context/AuthContext';
import { tr, isEs } from '../lib/lang';

/** the exact shape of a row in data/festival.json */
interface Row {
  id: string; name: string; category: ShopCategory; spot?: number;
  offerEn: string; offerEs?: string; detailEn?: string; detailEs?: string;
  address?: string; website?: string; logo?: string;
  punchCode: string; pledgePct?: number; status: string;
}

const README = [
  'Inclusion Festival & Resource Fair — the shop list.',
  'This file IS the database. To add or change a shop, edit it here and commit;',
  'the site picks it up on the next deploy. The admin page at /InclusionFestival/admin',
  'will generate the whole file for you so you never have to hand-edit JSON.',
  'Logos live in public/festival/logos/<id>.png — run scripts/festival-logos.mjs',
  'after dropping new ones in, to keep them small and square.',
];

const card = 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900';
const field = 'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const lbl = 'mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300';

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ShopCategory[];

const FestivalAdmin: React.FC = () => {
  const { user } = useAuth();
  const canApprove = isFestivalAdmin(user?.email);

  const [rows, setRows] = useState<Row[]>(() =>
    festival.allShops().map((s) => ({
      id: s.id, name: s.name, category: s.category, spot: s.spot,
      offerEn: s.offerEn, offerEs: s.offerEs || undefined,
      detailEn: s.detailEn, detailEs: s.detailEs,
      address: s.address, website: s.website,
      logo: s.logoUrl ? s.logoUrl.split('/').pop() : undefined,
      punchCode: s.punchCode, pledgePct: s.pledgePct, status: s.status,
    })),
  );
  const [settings, setSettings] = useState({ ...SETTINGS });
  const [copied, setCopied] = useState(false);
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

  const fileText = useMemo(
    () => JSON.stringify({ _readme: README, settings, shops: rows }, null, 2) + '\n',
    [rows, settings],
  );

  const nextSpot = () => {
    const used = new Set(rows.map((r) => r.spot).filter(Boolean));
    for (let i = 1; i <= settings.spots; i++) if (!used.has(i)) return i;
    return settings.spots + 1;
  };
  const nextCode = () => {
    const used = new Set(rows.map((r) => r.punchCode));
    for (let i = 0; i < 500; i++) {
      const c = String(1000 + Math.floor(Math.random() * 9000));
      if (!used.has(c)) return c;
    }
    return String(1000 + used.size);
  };

  const startAdd = () => {
    setDraft({
      id: '', name: '', category: 'restaurant', spot: nextSpot(),
      offerEn: '', offerEs: '', punchCode: nextCode(), pledgePct: 20, status: 'approved',
    });
    setAdding(true);
  };

  const commitDraft = () => {
    if (!draft || !draft.name.trim() || !draft.offerEn.trim()) return;
    const id = draft.id || slugify(draft.name);
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
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
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
    <div className="mx-auto max-w-4xl px-4 py-10">
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
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">{r.punchCode}</span>
                  {!r.logo && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{tr('no logo', 'sin logo')}</span>}
                </div>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">{isEs() ? (r.offerEs || r.offerEn) : r.offerEn}</p>
                <p className="truncate text-xs text-slate-400">
                  {isEs() ? CATEGORY_LABEL[r.category].es : CATEGORY_LABEL[r.category].en}
                  {r.pledgePct ? ` · ${r.pledgePct}% ${tr('pledged', 'prometido')}` : ` · ${tr('no pledge', 'sin donación')}`}
                </p>
              </div>
              <button onClick={() => setRows((x) => x.filter((_, j) => j !== i))}
                      title={tr('Remove', 'Quitar')}
                      className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── add ───────────────────────────────────────────────────────── */}
      {adding && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
             onClick={() => { setAdding(false); setDraft(null); }}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 dark:bg-slate-900"
               onClick={(e) => e.stopPropagation()}>
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
                  <label className={lbl}>{tr('Punch code', 'Código')}</label>
                  <input className={`${field} font-mono`} value={draft.punchCode}
                         onChange={(e) => setDraft({ ...draft, punchCode: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                </div>
                <div>
                  <label className={lbl}>{tr('Pledge %', 'Donación %')}</label>
                  <input className={field} inputMode="numeric" value={draft.pledgePct ?? ''}
                         onChange={(e) => setDraft({ ...draft, pledgePct: Number(e.target.value) || undefined })} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button fullWidth onClick={commitDraft}>{tr('Add', 'Agregar')}</Button>
              <Button fullWidth variant="secondary" onClick={() => { setAdding(false); setDraft(null); }}>
                {tr('Cancel', 'Cancelar')}
              </Button>
            </div>
          </div>
        </div>
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

      {/* ── the file ──────────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
          <FileJson className="h-5 w-5 text-sky-600" />{tr('Publish', 'Publicar')}
        </h2>
        <div className={`mt-3 ${card}`}>
          <ol className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li>{tr('1. Copy the file below.', '1. Copia el archivo de abajo.')}</li>
            <li>{tr('2. Open data/festival.json on GitHub, press the pencil, select all, paste.', '2. Abre data/festival.json en GitHub, presiona el lápiz, selecciona todo y pega.')}</li>
            <li>{tr('3. Commit. The site rebuilds in about a minute and the shops are live.', '3. Haz commit. El sitio se reconstruye en un minuto y las tiendas quedan en vivo.')}</li>
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

export default FestivalAdmin;
