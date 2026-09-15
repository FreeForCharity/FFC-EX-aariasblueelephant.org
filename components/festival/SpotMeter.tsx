import React from 'react';
import { SpotCount } from '../../lib/festival/store';
import { tr } from '../../lib/lang';

/**
 * The scarcity counter. Shown to businesses on the sign-up page — urgency that
 * nobody can see is not urgency, so the number is deliberately the largest
 * thing on the screen.
 */
const SpotMeter: React.FC<{ counts: SpotCount; compact?: boolean }> = ({ counts, compact }) => {
  const pct = counts.spots ? Math.min(100, Math.round((counts.taken / counts.spots) * 100)) : 0;
  const nearlyFull = counts.free > 0 && counts.free <= 3;

  return (
    <div className={compact ? '' : 'rounded-2xl border border-sky-100 bg-sky-50 p-6 dark:border-sky-900/50 dark:bg-sky-900/20'}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={`font-black text-slate-900 dark:text-white ${compact ? 'text-lg' : 'text-3xl'}`}>
          {counts.taken} <span className="text-slate-400 dark:text-slate-500">/ {counts.spots}</span>
        </p>
        <p className={`font-bold ${nearlyFull ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} ${compact ? 'text-xs' : 'text-sm'}`}>
          {counts.full
            ? tr('All spots taken', 'Todos los lugares ocupados')
            : nearlyFull
              ? tr(`Only ${counts.free} left`, `Solo quedan ${counts.free}`)
              : tr(`${counts.free} spots left`, `Quedan ${counts.free} lugares`)}
        </p>
      </div>

      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${counts.full ? 'bg-amber-500' : 'bg-sky-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!compact && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {counts.full
            ? tr('Every spot is claimed. Join the waiting list and we will be in touch if one opens up — or if we open a second round.',
                 'Todos los lugares están tomados. Únete a la lista de espera y te avisamos si se libera uno, o si abrimos una segunda ronda.')
            : tr('Spots are first come, first served. Your place is held for 48 hours while we confirm your offer.',
                 'Los lugares se asignan por orden de llegada. Tu lugar se aparta por 48 horas mientras confirmamos tu oferta.')}
          {counts.waitlist > 0 && ' ' + tr(`${counts.waitlist} on the waiting list.`, `${counts.waitlist} en lista de espera.`)}
        </p>
      )}
    </div>
  );
};

export default SpotMeter;
