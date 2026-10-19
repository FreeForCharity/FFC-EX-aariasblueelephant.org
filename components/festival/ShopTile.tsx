import React from 'react';
import { FestivalShop } from '../../lib/festival/types';
import { isEs, tr } from '../../lib/lang';

interface Props {
  shop: FestivalShop;
  /** set once the family has used this offer — e.g. "Nov 5" */
  usedOn?: string;
  onClick?: () => void;
}

/**
 * One square on the card. Shows the logo if the shop has sent one and falls
 * back to a category emoji, so a missing logo looks deliberate rather than broken.
 */
const ShopTile: React.FC<Props> = ({ shop, usedOn, onClick }) => {
  const offer = isEs() ? (shop.offerEs || shop.offerEn) : shop.offerEn;
  return (
    <button
      type="button"
      onClick={onClick}
      title={shop.name}
      className={`group relative aspect-square w-full rounded-2xl border-2 p-1.5 text-center transition
        ${usedOn
          ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
          : 'border-sky-200 bg-white hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900'}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`flex h-full flex-col items-center justify-center gap-1 ${usedOn ? 'opacity-40 grayscale' : shop.paused ? 'opacity-60 grayscale' : ''}`}>
        {shop.logoUrl
          ? <img src={shop.logoUrl} alt="" loading="lazy" decoding="async" className="h-12 w-12 rounded-xl bg-white object-contain p-0.5 shadow-sm sm:h-16 sm:w-16" />
          : <span className="text-3xl sm:text-4xl" aria-hidden>{shop.emoji}</span>}
        {/* wraps rather than truncating: "Spice Ro…" helps nobody */}
        <span className="line-clamp-2 break-words text-[10px] font-bold leading-tight text-slate-700 dark:text-slate-200 sm:text-xs">
          {shop.name}
        </span>
        <span className="line-clamp-2 hidden px-1 text-[9px] leading-tight text-slate-500 dark:text-slate-400 sm:block">
          {offer}
        </span>
      </div>

      {shop.paused && !usedOn && (
        <span className="pointer-events-none absolute left-1 top-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          {tr('⏸️ Paused', '⏸️ En pausa')}
        </span>
      )}

      {usedOn && (
        <span className="pointer-events-none absolute inset-0 flex -rotate-12 items-center justify-center">
          <span className="rounded-lg border-4 border-green-600/80 bg-white/70 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-green-700 dark:bg-slate-900/70 dark:text-green-400 sm:text-xs">
            {tr('Used', 'Usada')} {usedOn}
          </span>
        </span>
      )}
    </button>
  );
};

export default ShopTile;
