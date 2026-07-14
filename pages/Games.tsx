import React, { useEffect, useState } from 'react';
import { GAME_CARDS, GameCard } from '../data/games';

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

const Games: React.FC = () => {
  const cards = useLiveCatalog();
  return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <div className="text-center pt-6 pb-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white">
        🎮 Our Games
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Free browser games built for Aaria and Her Friends 💖 — calm, kind, and safe.
        No accounts, no ads, and nothing leaves your device. Collect a passport stamp in every one!
      </p>
    </div>
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{g.oneLiner}</p>
              <p className="text-xs font-bold text-brand-cyan mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                ▶️ Play now
              </p>
            </div>
          </a>
        );
      })}
    </div>
    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-10">
      Grown-ups: our games collect no personal information — see our{' '}
      <a href="/privacy-policy" className="underline">privacy policy</a> and{' '}
      <a href="/legal/disclosure.html" className="underline">general disclosure</a>.
      {' '}Running a games table at an event?{' '}
      <a href="/playtest" className="underline">Playtest Corner</a>.
    </p>
  </div>
  );
};

export default Games;
