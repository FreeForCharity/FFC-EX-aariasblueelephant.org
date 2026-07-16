import React, { useEffect, useMemo, useState } from 'react';
import { GAME_CARDS } from '../data/games';
import { tr } from '../lib/lang';

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
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">🧪 {tr('Playtest Corner', 'Rincón de Pruebas')}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {tr(
            'For grown-ups running a games table at an event. Turn Playtest Mode on, hand the tablet to the kids, and every game keeps a quiet observation journal — ',
            'Para los adultos que manejan una mesa de juegos en un evento. Activa el Modo de Pruebas, entrega la tableta a los niños, y cada juego lleva un diario de observación silencioso — '
          )}
          <b>{tr(
            'entirely on this device, nothing is ever sent anywhere',
            'completamente en este dispositivo, nada se envía a ningún lado'
          )}</b>{tr('. Come back here afterward for the summary.', '. Vuelve aquí después para ver el resumen.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={toggle}
          className={`px-6 py-3 rounded-2xl text-sm font-black text-white shadow-lg transition ${
            on ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {on ? `⏹ ${tr('Turn Playtest Mode OFF', 'Desactivar Modo de Pruebas')}` : `▶️ ${tr('Turn Playtest Mode ON', 'Activar Modo de Pruebas')}`}
        </button>
        <span className={`text-xs font-bold ${on ? 'text-emerald-600' : 'text-slate-400'}`}>
          {on ? tr('ON — games are journaling on this device (look for the 🧪 badge in games)', 'ACTIVO — los juegos están registrando en este dispositivo (busca la insignia 🧪 en los juegos)') : tr('off', 'apagado')}
        </span>
      </div>

      <div className="bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            {tr('What the kids did', 'Lo que hicieron los niños')} ({journal.length} {tr('journal entries', 'entradas de diario')})
          </h2>
          <button onClick={refresh} className="text-xs font-black text-brand-cyan">↻ {tr('Refresh', 'Actualizar')}</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
            {tr('Nothing yet — turn Playtest Mode on and let the kids play. 🎮', 'Nada todavía — activa el Modo de Pruebas y deja que los niños jueguen. 🎮')}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="py-2 pr-2">{tr('Game', 'Juego')}</th>
                <th className="py-2 px-2 text-center" title={tr('Times the game was opened', 'Veces que se abrió el juego')}>{tr('Opens', 'Aberturas')}</th>
                <th className="py-2 px-2 text-center" title={tr('Total attention time (screen visible)', 'Tiempo total de atención (pantalla visible)')}>{tr('Time', 'Tiempo')}</th>
                <th className="py-2 px-2 text-center" title={tr("Taps on things that aren't interactive — confusion signal", 'Toques en cosas que no son interactivas — señal de confusión')}>{tr('Dead taps', 'Toques muertos')}</th>
                <th className="py-2 px-2 text-center" title={tr('Rapid tap bursts in one spot — frustration signal', 'Ráfagas de toques rápidos en un lugar — señal de frustración')}>😤 {tr('Bursts', 'Ráfagas')}</th>
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
          {tr('High', 'Muchos')} <b>{tr('dead taps', 'toques muertos')}</b> {tr('= kids expected something to respond there.', '= los niños esperaban que algo respondiera ahí.')} <b>{tr('Bursts', 'Ráfagas')}</b> {tr('= same spot tapped rapidly — find that moment and ask why. Numbers guide, watching kids decides.', '= el mismo lugar tocado rápidamente — encuentra ese momento y pregunta por qué. Los números guían, observar a los niños decide.')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportFile}
          disabled={!journal.length}
          className="px-4 py-2.5 rounded-xl bg-brand-cyan text-white text-xs font-black disabled:opacity-40"
        >
          ⬇️ {tr('Export journal (JSON)', 'Exportar diario (JSON)')}
        </button>
        {confirmClear ? (
          <span className="flex items-center gap-2">
            <button onClick={clear} className="px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black">
              {tr('Really clear', '¿Borrar de verdad?')}
            </button>
            <button onClick={() => setConfirmClear(false)} className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200">
              {tr('Keep it', 'Conservarlo')}
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={!journal.length}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-200 disabled:opacity-40"
          >
            🧹 {tr('Clear before a new event', 'Borrar antes de un nuevo evento')}
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-6">
        {tr('Tip for events: turn it ON, clear the journal, load 2–3 games, and pair the numbers with a', 'Consejo para eventos: actívalo, borra el diario, carga 2-3 juegos, y combina los números con las')}{' '}
        {tr("volunteer's notes — where kids laughed, where a parent had to help, what they returned to.", 'notas de un voluntario — dónde rieron los niños, dónde un padre tuvo que ayudar, a qué volvieron.')}
      </p>
    </div>
  );
};

export default Playtest;
