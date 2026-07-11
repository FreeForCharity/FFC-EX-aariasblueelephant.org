import React from 'react';
import { GAME_CARDS } from '../data/games';

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

const Games: React.FC = () => (
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
      {GAME_CARDS.map((g) => {
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
    </p>
  </div>
);

export default Games;
