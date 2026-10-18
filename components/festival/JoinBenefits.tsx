import React from 'react';
import { tr } from '../../lib/lang';

/** the benefits at a glance, above the sign-up form */
const JoinBenefits: React.FC<{ young: boolean }> = ({ young }) => {
  const tiles = young ? [
    { e: '🎁', t: tr('Your offer', 'Tu oferta'), d: tr('A special deal for festival families', 'Una oferta especial para las familias del festival') },
    { e: '📱', t: tr('QR sign', 'Letrero QR'), d: tr('Print it for your market stall or table', 'Imprímelo para tu puesto o mesa en el mercado') },
    { e: '💻', t: tr('Online too', 'También en línea'), d: tr('Families get a code to use when they order, through Nov 30', 'Las familias reciben un código para usar al pedir, hasta el 30 de nov.') },
    { e: '▶️', t: tr('Your video', 'Tu video'), d: tr('Show off what you make (optional)', 'Muestra lo que haces (opcional)') },
    { e: '⭐', t: tr('Featured', 'Destacado'), d: tr('On our Young Founders page, free', 'En nuestra página de Jóvenes Emprendedores, gratis') },
  ] : [
    { e: '🎁', t: tr('Your offer', 'Tu oferta'), d: tr('Something special for festival families', 'Algo especial para las familias del festival') },
    { e: '📱', t: tr('QR sign', 'Letrero QR'), d: tr('For your counter — families scan to redeem', 'Para tu mostrador: las familias lo escanean para canjear') },
    { e: '💻', t: tr('Online too', 'También en línea'), d: tr('A personal code for online orders and bookings', 'Un código personal para pedidos y reservas en línea') },
    { e: '▶️', t: tr('Your video', 'Tu video'), d: tr('Show families your business (optional)', 'Muestra tu negocio a las familias (opcional)') },
    { e: '📊', t: tr('Your numbers', 'Tus números'), d: tr('See how many families came, free', 'Mira cuántas familias vinieron, gratis') },
  ];
  const tone = young ? 'border-amber-200 dark:border-amber-900/50' : 'border-sky-100 dark:border-sky-900/50';
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((x) => (
        <div key={x.t} className={`rounded-2xl border bg-white p-4 dark:bg-slate-900 ${tone}`}>
          <span className="text-2xl" aria-hidden>{x.e}</span>
          <p className={`mt-1 text-sm font-black ${young ? 'text-amber-800 dark:text-amber-300' : 'text-sky-800 dark:text-sky-300'}`}>{x.t}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-600 dark:text-slate-300">{x.d}</p>
        </div>
      ))}
    </div>
  );
};

export default JoinBenefits;
