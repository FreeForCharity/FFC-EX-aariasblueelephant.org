import React, { useEffect, useState } from 'react';
import { GAME_CARDS, GameCard } from '../data/games';
import { useAuth } from '../context/AuthContext';
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
  // Softball Stars keeps a rep count per skill and a tally of times the child
  // asked a coach for what they needed — both are wins worth reporting home.
  { key: 'sb.reps', emoji: '🥎', line: (n) => tr(`${n} softball reps with Coach AJ's team`, `${n} repeticiones de softbol con el equipo del Coach AJ`),
    read: () => { try { return Object.values(JSON.parse(localStorage.getItem('abe.softball.reps') || '{}') as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0); } catch { return 0; } } },
  { key: 'sb.needs', emoji: '🙋', line: (n) => tr(`${n} times you asked for what you needed`, `${n} veces que pediste lo que necesitabas`),
    read: () => { try { return Object.values(JSON.parse(localStorage.getItem('abe.softball.needs') || '{}') as Record<string, number>).reduce((a, b) => a + (Number(b) || 0), 0); } catch { return 0; } } },
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

/* Signed-out nudge toward an account. Deliberately NOT "sign in to play" — the
   games are genuinely free and account-free, and the promise right above says so.
   The honest reason is staying reachable, so that's what it says. Hidden in the
   native app, where OAuth has nowhere sensible to redirect. Sized and styled to
   match the Home page sign-in card so the same pitch feels consistent everywhere
   it appears. */
const SignInNudge: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (user || isLoading || (window as any).Capacitor) return null;
  return (
    <div
      className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-sky-200 dark:border-sky-800 p-6 sm:p-8 text-center shadow-sm mb-8 sm:flex-row sm:text-left"
      style={{ background: 'linear-gradient(120deg,#eaf6ff,#fef6e4)' }}
    >
      <div className="text-5xl shrink-0 transition-transform group-hover:scale-110" aria-hidden>📬</div>
      <div className="flex-1">
        <h3 className="text-xl font-black text-sky-700">
          {tr("Don't miss what's next", 'No te pierdas lo que viene')}
        </h3>
        <p className="mt-1 text-slate-600">
          {tr(
            'Sign in with Google so we can reach you about new events, activities, and games — and keep everything in one place.',
            'Inicia sesión con Google para que podamos avisarte sobre nuevos eventos, actividades y juegos — y tener todo en un solo lugar.'
          )}
        </p>
      </div>
      <a
        href="/login"
        className="flex-none rounded-full bg-sky-600 hover:bg-sky-700 px-8 py-3 text-base sm:text-lg font-bold text-white shadow-lg transition group-hover:scale-105"
      >
        {tr('Sign in with Google', 'Iniciar sesión con Google')}
      </a>
    </div>
  );
};

/* One-time acknowledgment that the games are educational, not therapy or
   medical advice, and that a grown-up should stay involved — summarized from
   /legal/disclosure.html. Deliberately NOT tied to an account: it is a
   disclaimer checkpoint, not an access gate, so it only blocks the landing
   page once per device (localStorage), never individual game URLs. */
const DISCLAIMER_KEY = 'abe.games.disclaimerAck';
const DisclaimerGate: React.FC = () => {
  const [accepted, setAccepted] = useState(() => {
    try { return localStorage.getItem(DISCLAIMER_KEY) === '1'; } catch { return true; }
  });
  const [checked, setChecked] = useState(false);

  if (accepted) return null;

  const acknowledge = () => {
    try { localStorage.setItem(DISCLAIMER_KEY, '1'); } catch { /* private mode */ }
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4 py-8">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8">
        <div className="text-3xl mb-2" aria-hidden>🛡️</div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
          {tr('Before you play', 'Antes de jugar')}
        </h2>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4 list-disc pl-5">
          <li>{tr('These games are for learning through play — not therapy, medical, or professional advice.', 'Estos juegos son para aprender jugando — no son terapia, asesoría médica ni profesional.')}</li>
          <li>{tr('Please stay involved: play alongside your child and talk about what they see.', 'Por favor mantente involucrado: juega junto a tu hijo o hija y conversa sobre lo que ve.')}</li>
          <li>{tr('No accounts needed and nothing leaves your device — some content is AI-assisted or AI-translated.', 'No se necesitan cuentas y nada sale de tu dispositivo — parte del contenido está creado o traducido con IA.')}</li>
        </ul>
        <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <span>{tr("I understand, and I'll stay involved as my child plays.", 'Entiendo, y me mantendré involucrado/a mientras mi hijo o hija juega.')}</span>
        </label>
        <button
          onClick={acknowledge}
          disabled={!checked}
          className="w-full py-3 rounded-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors shadow-sm"
        >
          {tr('Continue to the games', 'Continuar a los juegos')}
        </button>
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-3">
          <a href="/legal/disclosure.html" target="_blank" rel="noopener" className="underline">
            {tr('Read the full disclosure', 'Leer el aviso completo')}
          </a>
        </p>
      </div>
    </div>
  );
};

const Games: React.FC = () => {
  const cards = useLiveCatalog();
  return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
    <DisclaimerGate />
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
    <SignInNudge />
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
