import React, { useEffect, useMemo, useState } from 'react';
import { GAME_CARDS } from '../data/games';

// Playtest Corner — grown-ups' tooling for family events. A volunteer flips
// Playtest Mode ON, hands the tablet to kids, and every game quietly keeps an
// ON-DEVICE observation journal (opens, attention time, dead taps, frustration
// bursts). This page shows the summary and exports it. Nothing is transmitted.
type Entry = { t: number; g: string; ev: string; n: number };

const KEY = 'abe.playtest.journal';
const FLAG = 'abe.playtest';

const readJournal = (): Entry[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const gameName = (slug: string) =>
  GAME_CARDS.find((g) => g.id === slug || (slug === 'nilus-world' && g.id === 'belus-world'))?.title ?? slug;
const fmtMin = (s: number) => (s < 60 ? `${s}s` : `${Math.round(s / 60)}m ${s % 60}s`);

const Playtest: React.FC = () => {
  const [on, setOn] = useState(false);
  const [journal, setJournal] = useState<Entry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  const refresh = () => {
    try { setOn(localStorage.getItem(FLAG) === '1'); } catch { /* private mode */ }
    setJournal(readJournal());
  };
  useEffect(refresh, []);

  const toggle = () => {
    try { localStorage.setItem(FLAG, on ? '0' : '1'); } catch { /* private mode */ }
    refresh();
  };
  const clear = () => {
    try { localStorage.removeItem(KEY); } catch { /* private mode */ }
    setConfirmClear(false);
    refresh();
  };
  const exportFile = () => {
    const blob = new Blob([JSON.stringify(journal, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `playtest-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const rows = useMemo(() => {
    const per = new Map<string, { opens: number; secs: number; dead: number; rage: number }>();
    for (const e of journal) {
      const r = per.get(e.g) ?? { opens: 0, secs: 0, dead: 0, rage: 0 };
      if (e.ev === 'open') r.opens++;
      else if (e.ev === 'dur') r.secs += e.n;
      else if (e.ev === 'dead') r.dead += e.n;
      else if (e.ev === 'rage') r.rage += e.n;
      per.set(e.g, r);
    }
    return [...per.entries()].sort((a, b) => b[1].secs - a[1].secs);
  }, [journal]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
      <div className="pt-6 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">🧪 Playtest Corner</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          For grown-ups running a games table at an event. Turn Playtest Mode on, hand the tablet to
          the kids, and every game keeps a quiet observation journal — <b>entirely on this device,
          nothing is ever sent anywhere</b>. Come back here afterward for the summary.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={toggle}
          className={`px-6 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition ${
            on ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {on ? '⏹ Turn Playtest Mode OFF' : '▶️ Turn Playtest Mode ON'}
        </button>
        <span className={`text-xs font-bold ${on ? 'text-emerald-600' : 'text-slate-400'}`}>
          {on ? 'ON — games are journaling on this device (look for the 🧪 badge in games)' : 'off'}
        </span>
      </div>

      <div className="bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            What the kids did ({journal.length} journal entries)
          </h2>
          <button onClick={refresh} className="text-xs font-black text-brand-cyan">↻ Refresh</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            Nothing yet — turn Playtest Mode on and let the kids play. 🎮
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-2">Game</th>
                <th className="py-2 px-2 text-center" title="Times the game was opened">Opens</th>
                <th className="py-2 px-2 text-center" title="Total attention time (screen visible)">Time</th>
                <th className="py-2 px-2 text-center" title="Taps on things that aren't interactive — confusion signal">Dead taps</th>
                <th className="py-2 px-2 text-center" title="Rapid tap bursts in one spot — frustration signal">😤 Bursts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([slug, r]) => (
                <tr key={slug} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                  <td className="py-2 pr-2 font-bold text-slate-900 dark:text-white">{gameName(slug)}</td>
                  <td className="py-2 px-2 text-center">{r.opens}</td>
                  <td className="py-2 px-2 text-center font-black text-brand-purple">{fmtMin(r.secs)}</td>
                  <td className={`py-2 px-2 text-center ${r.dead > 20 ? 'font-black text-amber-500' : ''}`}>{r.dead || '·'}</td>
                  <td className={`py-2 px-2 text-center ${r.rage > 0 ? 'font-black text-rose-500' : ''}`}>{r.rage || '·'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-[11px] text-slate-400 mt-3">
          High <b>dead taps</b> = kids expected something to respond there. <b>Bursts</b> = same spot
          tapped rapidly — find that moment and ask why. Numbers guide, watching kids decides.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportFile}
          disabled={!journal.length}
          className="px-4 py-2.5 rounded-xl bg-brand-cyan text-white text-xs font-black disabled:opacity-40"
        >
          ⬇️ Export journal (JSON)
        </button>
        {confirmClear ? (
          <span className="flex items-center gap-2">
            <button onClick={clear} className="px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black">
              Really clear
            </button>
            <button onClick={() => setConfirmClear(false)} className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200">
              Keep it
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={!journal.length}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 disabled:opacity-40"
          >
            🧹 Clear before a new event
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-6">
        Tip for events: turn it ON, clear the journal, load 2–3 games, and pair the numbers with a
        volunteer's notes — where kids laughed, where a parent had to help, what they returned to.
      </p>
    </div>
  );
};

export default Playtest;
