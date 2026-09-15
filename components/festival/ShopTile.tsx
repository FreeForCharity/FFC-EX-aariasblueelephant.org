import React from 'react';
import { FestivalShop } from '../../lib/festival/types';
import { isEs } from '../../lib/lang';

interface Props {
  shop: FestivalShop;
  /** the card view greys out and stamps a tile once it has been used */
  punched?: boolean;
  punchedAt?: string;
  onClick?: () => void;
}

/**
 * One square on the punch card. Shows the logo if the shop has sent one and
 * falls back to a category emoji on a tinted panel, so a missing logo looks
 * deliberate rather than broken.
 */
const ShopTile: React.FC<Props> = ({ shop, punched, punchedAt, onClick }) => {
  const offer = isEs() ? (shop.offerEs || shop.offerEn) : shop.offerEn;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative aspect-square w-full rounded-2xl border-2 p-2 text-center transition
        ${punched
          ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
          : 'border-sky-200 bg-white hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900'}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`flex h-full flex-col items-center justify-center gap-1 ${punched ? 'opacity-40 grayscale' : ''}`}>
        {shop.logoUrl
          ? <img src={shop.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain sm:h-12 sm:w-12" />
          : <span className="text-2xl sm:text-3xl" aria-hidden>{shop.emoji}</span>}
        <span className="line-clamp-2 px-1 text-[10px] font-bold leading-tight text-slate-700 dark:text-slate-200 sm:text-xs">
          {shop.name}
        </span>
        <span className="line-clamp-2 hidden px-1 text-[9px] leading-tight text-slate-500 dark:text-slate-400 sm:block">
          {offer}
        </span>
      </div>

      {punched && (
        <span className="pointer-events-none absolute inset-0 flex -rotate-12 items-center justify-center">
          <span className="rounded-lg border-4 border-sky-600/70 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600/70 sm:text-xs">
            {punchedAt || 'Punched'}
          </span>
        </span>
      )}
    </button>
  );
};

export default ShopTile;
