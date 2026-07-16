import React, { useEffect, useState } from 'react';
import { GAME_CARDS, GameCard } from '../data/games';
import { tr, isEs } from '../lib/lang';

// In the NATIVE APP, the launcher refreshes itself from the live site's
// /games-catalog.json — a game shipped to the website appears here the same
// day, no store update. Unknown games play from the live site (the WebView is
// allowed to navigate to aariasblueelephant.org; analytics stay app-disabled).
// Offline, or on the website itself, the bundled list is used as-is.
const LIVE_CATALOG = 'https://aariasblueelephant.org/games-catalog.json';
const CACHE_KEY = 'abe.app.catalog';

function useLiveCatalog(): GameCard[] {
  const [cards, setCards] = useState<GameCard[]>(() => {
    if (!(window as any).Capacitor) return GAME_CARDS;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return Array.isArray(cached) && cached.length ? mergeCatalog(cached) : GAME_CARDS;
    } catch { return GAME_CARDS; }
  });
  useEffect(() => {
    if (!(window as any).Capacitor) return;
    fetch(LIVE_CATALOG, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((live) => {
        if (!Array.isArray(live) || !live.length) return;
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(live)); } catch { /* full */ }
        setCards(mergeCatalog(live));
      })
      .catch(() => { /* offline — bundled list is fine */ });
  }, []);
  return cards;
}

// bundled games keep their local (offline) entries; anything new plays from the live site
function mergeCatalog(live: GameCard[]): GameCard[] {
  const bundledIds = new Set(GAME_CARDS.map((g) => g.id));
  const extras = live
    .filter((g) => g && g.id && !bundledIds.has(g.id) && (g.path || g.view))
    .map((g) => ({
      ...g,
      img: /^https?:/.test(g.img) ? g.img : `https://aariasblueelephant.org${g.img}`,
      path: `https://aariasblueelephant.org${g.path ?? VIEW_ROUTES[g.view!] ?? ''}`,
      view: undefined,
    }))
    .filter((g) => g.path !== 'https://aariasblueelephant.org');
  return [...GAME_CARDS, ...extras];
}

// Public games catalog — no account needed. Same cards the dashboard shows,
// so new games registered in data/games.ts appear here automatically.
const VIEW_ROUTES: Record<string, string> = {
  'elly-tubbies': '/1',
  blockcraft: '/2',
  roadsafety: '/4',
  doughlab: '/5',
  magnetblocks: '/6',
  helpinghands: '/7',
  wheel: '/wheel',
};

/* 🐘💌 Nilu's Postcard — a weekly recap of everything the child did across
   ALL the games, read from the same on-device saves the games keep. Shows
   this week's growth (vs. a weekly snapshot); first visit shows totals.
   Nothing leaves the device — it's a postcard from Nilu, not analytics. */
const METRICS: Array<{ key: string; emoji: string; line: (n: number) => string; read?: () => number }> = [
  { key: 'abe.rhythm.garden', emoji: '🌸', line: (n) => tr(`${n} flowers grew in your Music Meadow`, `${n} flores crecieron en tu Prado Musical`) },
  { key: 'abe.flying.stars', emoji: '⭐', line: (n) => tr(`${n} star rings flown with Nilu`, `${n} anillos de estrellas volados con Nilu`) },
  { key: 'abe.flying.friends', emoji: '🐋', line: (n) => tr(`${n} flights with sky friends`, `${n} vuelos con amigos del cielo`) },
  { key: 'abe.feelings.made', emoji: '🎭', line: (n) => tr(`${n} feeling faces built`, `${n} caras de sentimientos armadas`) },
  { key: 'abe.grocery.trips', emoji: '🛒', line: (n) => tr(`${n} shopping trips finished`, `${n} viajes de compras terminados`) },
  { key: 'abe.dayplanner.days', emoji: '🏠', line: (n) => tr(`${n} days planned and lived`, `${n} días planeados y vividos`) },
  { key: 'abe.rhythm.songs', emoji: '🎶', line: (n) => tr(`${n} little songs echoed back` , `${n} cancioncitas resonaron de vuelta`) },
  // the two big worlds keep their own save formats — read them directly
  { key: 'bc.blocks', emoji: '🧱', line: (n) => tr(`${n} blocks built in Block Craft`, `${n} bloques construidos en Block Craft`),
    read: () => { try { return Number(JSON.parse(localStorage.getItem('aariasBlockCraft3') || '{}')?.metrics?.blocksPlaced) || 0; } catch { return 0; } } },
  { key: 'bc.stars', emoji: '🌟', line: (n) => tr(`${n} stars earned in Block Craft`, `${n} estrellas ganadas en Block Craft`),
    read: () => { try { return Number(JSON.parse(localStorage.getItem('aariasBlockCraft3') || '{}')?.stars) || 0; } catch { return 0; } } },
  { key: 'elly.sparks', emoji: '✨', line: (n) => tr(`${n} sparkles collected in Trunkland`, `${n} chispitas juntadas en Trunkland`),
    read: () => { try { return Number(JSON.parse(localStorage.getItem('ellyTubbies.v3') || '{}')?.sparks) || 0; } catch { return 0; } } },
];
const weekId = () => {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-w${Math.floor((d.getTime() - jan1.getTime()) / 604800000)}`;
};
const NiluPostcard: React.FC = () => {
  const [rows, setRows] = useState<Array<{ emoji: string; text: string }>>([]);
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    try {
      const now: Record<string, number> = {};
      for (const m of METRICS) now[m.key] = m.read ? m.read() : Number(JSON.parse(localStorage.getItem(m.key) || '0')) || 0;
      const snapRaw = localStorage.getItem('abe.postcard');
      const snap = snapRaw ? JSON.parse(snapRaw) : null;
      const isNewWeek = !snap || snap.week !== weekId();
      const base: Record<string, number> = isNewWeek && snap ? snap.values : (snap ? snap.base : {});
      if (isNewWeek) localStorage.setItem('abe.postcard', JSON.stringify({ week: weekId(), values: now, base: snap ? snap.values : {} }));
      const out: Array<{ emoji: string; text: string }> = [];
      for (const m of METRICS) {
        const delta = snap ? now[m.key] - (base[m.key] || 0) : now[m.key];
        if (delta > 0) out.push({ emoji: m.emoji, text: m.line(delta) });
      }
      setFresh(!snap);
      setRows(out.slice(0, 5));
    } catch { /* private mode */ }
  }, []);
  if (!rows.length) return null;
  return (
    <div className="max-w-md mx-auto mb-8 rounded-2xl border-4 border-dashed border-sky-300 dark:border-sky-700 bg-amber-50 dark:bg-slate-800/70 p-5 text-left shadow-lg rotate-[-1deg]">
      <div className="flex items-start justify-between">
        <h2 className="font-black text-slate-900 dark:text-white">💌 A postcard from Nilu</h2>
        <span className="text-2xl" aria-hidden>🐘</span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{fresh ? tr('Everything so far…', 'Todo hasta ahora…') : tr('This week…', 'Esta semana…')}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.text} className="text-sm font-bold text-slate-700 dark:text-slate-200">{r.emoji} {r.text}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{tr("I'm so proud of you! 💙 — Nilu", '¡Estoy muy orgullosa de ti! 💙 — Nilu')}</p>
    </div>
  );
};

const Games: React.FC = () => {
  const cards = useLiveCatalog();
  return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div className="text-center pt-6 pb-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
        🎮 {tr('Our Games', 'Nuestros Juegos')}
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        {tr(
          'Free browser games built for Aaria and Her Friends 💖 — calm, kind, and safe. No accounts, no ads, and nothing leaves your device. Collect a passport stamp in every one!',
          'Juegos de navegador gratis creados para Aaria y sus Amigos 💖 — tranquilos, amables y seguros. Sin cuentas, sin anuncios, y nada sale de tu dispositivo. ¡Colecciona un sello de pasaporte en cada uno!'
        )}
      </p>
    </div>
    <NiluPostcard />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {cards.map((g) => {
        const href = g.path ?? (g.view ? VIEW_ROUTES[g.view] : undefined);
        if (!href) return null;
        return (
          <a
            key={g.id}
            href={href}
            className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-brand-card shadow-lg hover:scale-[1.03] hover:shadow-2xl transition-all duration-300"
          >
            <img src={g.img} alt={g.title} className="w-full aspect-video object-cover" loading="lazy" />
            <div className="p-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {g.emoji} {g.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{isEs() && g.oneLiner_es ? g.oneLiner_es : g.oneLiner}</p>
              <p className="text-xs font-bold text-brand-cyan mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                ▶️ {tr('Play now', 'Jugar ahora')}
              </p>
            </div>
          </a>
        );
      })}
    </div>
    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-10">
      {tr('Grown-ups: our games collect no personal information — see our', 'Adultos: nuestros juegos no recopilan información personal — consulta nuestra')}{' '}
      <a href="/privacy-policy" className="underline">{tr('privacy policy', 'política de privacidad')}</a> {tr('and', 'y')}{' '}
      <a href="/legal/disclosure.html" className="underline">{tr('general disclosure', 'divulgación general')}</a>.
      {' '}{tr('Running a games table at an event?', '¿Tienes una mesa de juegos en un evento?')}{' '}
      <a href="/playtest" className="underline">{tr('Playtest Corner', 'Rincón de Pruebas')}</a>.
    </p>
  </div>
  );
};

export default Games;
