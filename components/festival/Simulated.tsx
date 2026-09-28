import React from 'react';
import { FlaskConical } from 'lucide-react';
import { tr } from '../../lib/lang';

/**
 * Marking for shops that are not real businesses.
 *
 * The festival opened for testing before the first Mountain House shops had
 * signed up, so the card is seeded with worked examples. They look exactly
 * like real entries — same tiles, same offers, same punch codes — which is the
 * point, and also the risk: a visitor could walk into a shop that does not
 * exist and ask for a biryani. So every place a simulated shop can be seen
 * says so, in both languages:
 *
 *   SimBadge   a ribbon across the tile on the card
 *   SimNote    a panel inside the offer dialog
 *   SimBanner  a line above the card when any simulated shop is on it
 *
 * Clearing the flag is one edit: drop "simulated": true from the shop in
 * data/festival.json and it becomes an ordinary entry everywhere at once.
 */

export const SimBadge: React.FC = () => (
  <span
    className="pointer-events-none absolute inset-x-0 top-0 rounded-t-xl bg-amber-400/95 py-0.5
               text-[8px] font-black uppercase tracking-wider text-amber-950 sm:text-[9px]"
  >
    {tr('Simulated', 'Simulada')}
  </span>
);

export const SimNote: React.FC = () => (
  <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 dark:bg-amber-900/25">
    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
    <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
      <span className="font-black">{tr('Simulated shop.', 'Tienda simulada.')}</span>{' '}
      {tr('This is a worked example while we sign up real Mountain House businesses. The shop and the offer are not real — please do not visit or ask for it.',
          'Es un ejemplo mientras inscribimos negocios reales de Mountain House. Ni la tienda ni la oferta existen: por favor no vayas ni la pidas.')}
    </p>
  </div>
);

export const SimBanner: React.FC<{ count: number }> = ({ count }) => (
  <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 dark:border-amber-700/60 dark:bg-amber-900/25">
    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
    <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
      <span className="font-black">
        {count === 1
          ? tr('1 shop on this card is simulated.', '1 tienda de esta tarjeta es simulada.')
          : tr(`${count} shops on this card are simulated.`, `${count} tiendas de esta tarjeta son simuladas.`)}
      </span>{' '}
      {tr('They are worked examples for testing, marked in amber. Real Mountain House businesses are signing up now.',
          'Son ejemplos de prueba, marcados en ámbar. Los negocios reales de Mountain House se están inscribiendo ahora.')}
    </p>
  </div>
);
