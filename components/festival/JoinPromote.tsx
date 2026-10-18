import React from 'react';
import { tr } from '../../lib/lang';

/**
 * "How to promote your business" — four short things to do once approved, so
 * the sign and the listing actually bring people in.
 */
const JoinPromote: React.FC<{ young: boolean }> = ({ young }) => {
  const page = young ? 'aariasblueelephant.org/InclusionFestival/youngfounders' : 'aariasblueelephant.org/InclusionFestival';
  const tips = [
    { emoji: '📍', en: 'Put your sign where people wait', es: 'Pon tu letrero donde la gente espera',
      de: young ? 'At the front of your stall or table.' : 'By the register or the door.',
      ds: young ? 'Al frente de tu puesto o mesa.' : 'Junto a la caja o la puerta.' },
    { emoji: '📸', en: 'Post a photo of your sign', es: 'Publica una foto de tu letrero',
      de: 'Tag Aaria’s Blue Elephant and say you support inclusion.',
      ds: 'Etiqueta a Aaria’s Blue Elephant y di que apoyas la inclusión.' },
    { emoji: '🔗', en: 'Share our festival page', es: 'Comparte la página del festival',
      de: page, ds: page, url: true },
    { emoji: '▶️', en: 'Add a short video', es: 'Agrega un video corto',
      de: 'It plays right on your card.', ds: 'Se reproduce en tu tarjeta.' },
  ];
  return (
    <div className="mt-8 rounded-3xl border-2 border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <h2 className="text-center text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
        📣 {tr('How to promote your business', 'Cómo promocionar tu negocio')}
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tips.map((t) => (
          <li key={t.en} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
            <span className="text-2xl leading-none" aria-hidden>{t.emoji}</span>
            {/* min-w-0 lets the long festival link wrap instead of spilling out */}
            <span className="min-w-0">
              <span className="block font-black text-slate-900 dark:text-white">{tr(t.en, t.es)}</span>
              <span className={`mt-1 block ${'url' in t ? 'break-all' : ''} text-sm leading-relaxed text-slate-600 dark:text-slate-400`}>{tr(t.de, t.ds)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JoinPromote;
