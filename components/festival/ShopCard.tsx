import React from 'react';
import { MapPin } from 'lucide-react';
import { FestivalShop, CATEGORY_LABEL } from '../../lib/festival/types';
import { tr, isEs } from '../../lib/lang';

/**
 * A shop as the public festival page shows it — a proper card, not a stamp
 * square: big logo, the offer in bold, where to find it. The offer is the
 * whole reason a family looks, so it gets the most weight after the logo.
 */
const ShopCard: React.FC<{ shop: FestivalShop; onClick?: () => void }> = ({ shop, onClick }) => {
  const es = isEs();
  const offer = es ? (shop.offerEs || shop.offerEn) : shop.offerEn;
  const detail = es ? (shop.detailEs || shop.detailEn) : shop.detailEn;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col items-center rounded-3xl border border-slate-200 bg-white p-3 text-center sm:p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:hover:border-sky-700"
    >
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 sm:h-28 sm:w-28">
        {shop.logoUrl
          ? <img src={shop.logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
          : <span className="text-4xl sm:text-5xl" aria-hidden>{shop.emoji}</span>}
      </div>
      <p className="mt-3 break-words text-sm font-black leading-tight text-slate-900 dark:text-white sm:mt-4 sm:text-lg">{shop.name}</p>
      <span className="mt-1.5 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] sm:px-2.5 sm:text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
        {es ? CATEGORY_LABEL[shop.category].es : CATEGORY_LABEL[shop.category].en}
      </span>
      <div className="mt-3 w-full flex-1 rounded-2xl bg-amber-50 px-2 py-2 sm:mt-4 sm:px-3 sm:py-3 dark:bg-amber-900/20">
        <p className="text-sm font-bold leading-snug text-amber-900 sm:text-base dark:text-amber-200">🎁 {offer}</p>
        {detail && <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">{detail}</p>}
      </div>
      {shop.address && (
        <p className="mt-2 inline-flex items-start gap-1 text-[11px] text-slate-500 sm:mt-3 sm:text-xs dark:text-slate-400">
          <MapPin className="mt-px h-3.5 w-3.5 shrink-0" />{shop.address}
        </p>
      )}
      <span className="sr-only">{tr('More about this offer', 'Más sobre esta oferta')}</span>
    </button>
  );
};

export default ShopCard;
