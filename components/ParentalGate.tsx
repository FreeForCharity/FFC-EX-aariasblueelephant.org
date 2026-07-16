import React, { useEffect, useState, useCallback } from 'react';
import { tr } from '../lib/lang';

// Kids-Category parental gate — ACTIVE ONLY IN THE NATIVE APP (window.Capacitor).
// Intercepts taps on external links and the donate flow; a grown-up answers a
// spoken-style multiplication question to continue. On the website this
// component renders nothing and intercepts nothing.
const isApp = () => typeof window !== 'undefined' && !!(window as any).Capacitor;

const ParentalGate: React.FC = () => {
  const [pending, setPending] = useState<string | null>(null);
  const [q, setQ] = useState<{ a: number; b: number }>({ a: 3, b: 4 });
  const [answer, setAnswer] = useState('');
  const [wrong, setWrong] = useState(false);

  const newQuestion = useCallback(() => {
    setQ({ a: 3 + Math.floor(Math.random() * 6), b: 4 + Math.floor(Math.random() * 6) });
    setAnswer('');
    setWrong(false);
  }, []);

  useEffect(() => {
    if (!isApp()) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      // gate: external links, and the donate flow (leads to payment pages).
      // Our own domain is exempt — live-catalog games play from there.
      const external = /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?aariasblueelephant\.org(\/|$)/i.test(href);
      if (external || href === '/donate' || href.startsWith('/donate?')) {
        e.preventDefault();
        e.stopPropagation();
        newQuestion();
        setPending(href);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [newQuestion]);

  if (!pending) return null;

  const submit = () => {
    if (parseInt(answer, 10) === q.a * q.b) {
      const target = pending;
      setPending(null);
      if (/^https?:\/\//i.test(target)) window.open(target, '_blank');
      else window.location.href = target;
    } else {
      setWrong(true);
      setAnswer('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="text-4xl mb-2">🧑‍🧒</div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">{tr('Ask a grown-up!', '¡Pregúntale a un adulto!')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {tr('This leaves the games. A grown-up can answer to continue:', 'Esto sale de los juegos. Un adulto puede responder para continuar:')}
        </p>
        <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          {q.a} × {q.b} = ?
        </p>
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-28 text-center text-xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 mb-1"
          aria-label={tr('Answer', 'Respuesta')}
        />
        {wrong && <p className="text-xs font-bold text-rose-500 mb-1">{tr('Not quite — try again!', '¡No es correcto — inténtalo de nuevo!')}</p>}
        <div className="flex gap-3 justify-center mt-3">
          <button
            onClick={() => setPending(null)}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-black"
          >
            {tr('Back to games', 'Volver a los juegos')}
          </button>
          <button
            onClick={submit}
            className="px-5 py-2.5 rounded-xl bg-brand-cyan text-white text-sm font-black"
          >
            {tr('Continue', 'Continuar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentalGate;
