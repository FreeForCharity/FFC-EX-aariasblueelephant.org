import React from 'react';
import { PencilLine, MailCheck, BadgeCheck, Gift, CalendarRange, Store, BarChart3, HeartHandshake, Sparkles, LucideIcon } from 'lucide-react';
import { fmtDay } from '../../lib/festival/store';
import { tr, isEs } from '../../lib/lang';

/**
 * The top of the shop sign-up page: what a business is agreeing to and what
 * happens after they press the button, as five pictures a busy owner can take
 * in at a glance. Steps 4 and 5 draw the actual sign and the actual green
 * screen, so nothing about the day surprises them.
 */

const MiniSign: React.FC = () => (
  <div className="mx-auto w-16 overflow-hidden rounded-md border-[3px] border-[#E0A526] bg-white shadow">
    <div className="bg-[#0C4A6E] px-1 py-0.5 text-[5px] font-black leading-tight text-white">Inclusion Festival</div>
    <div className="flex flex-col items-center gap-0.5 px-1 py-1">
      <div className="grid h-7 w-7 grid-cols-4 gap-[1px] rounded-sm border-2 border-[#0C4A6E] p-[1px]">
        {[1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1].map((d, i) => (
          <span key={i} className={d ? 'bg-slate-900' : 'bg-white'} />
        ))}
      </div>
      <div className="h-1 w-10 rounded-sm bg-[#FFF7DB] ring-1 ring-[#F5C542]" />
    </div>
  </div>
);

const MiniPhone: React.FC = () => (
  <div className="mx-auto flex h-20 w-11 flex-col items-center justify-center rounded-lg border-[3px] border-slate-800 bg-green-600 shadow">
    <span className="-rotate-12 rounded border-2 border-white px-0.5 text-[6px] font-black uppercase tracking-wide text-white">
      {tr('Redeemed', 'Canjeada')}
    </span>
    <span className="mt-1 font-mono text-[7px] font-bold text-white">10:42:07</span>
  </div>
);

const IconDisc: React.FC<{ icon: LucideIcon; color: string }> = ({ icon: Icon, color }) => (
  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${color}`}>
    <Icon className="h-8 w-8" />
  </div>
);

const ShopSteps: React.FC<{ redeemFrom: string; redeemTo: string }> = ({ redeemFrom, redeemTo }) => {
  const es = isEs();

  const steps = [
    { art: <IconDisc icon={PencilLine} color="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />,
      en: 'Sign up', es: 'Inscríbete',
      de: 'Two minutes: your offer, your logo, your email. No account, no password.',
      ds: 'Dos minutos: tu oferta, tu logo y tu correo. Sin cuenta ni contraseña.' },
    { art: <IconDisc icon={MailCheck} color="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" />,
      en: 'Confirm your email', es: 'Confirma tu correo',
      de: 'Click the link we email you. It is also your shop page from then on.',
      ds: 'Haz clic en el enlace que te enviamos. Desde entonces es también la página de tu tienda.' },
    { art: <IconDisc icon={BadgeCheck} color="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" />,
      en: 'We approve', es: 'Te aprobamos',
      de: 'Within 48 hours. Your logo and offer go up on our festival page.',
      ds: 'En 48 horas. Tu logo y tu oferta aparecen en la página del festival.' },
    { art: <MiniSign />,
      en: 'Print your QR sign', es: 'Imprime tu letrero QR',
      de: 'One page from your shop page. Put it by the register.',
      ds: 'Una hoja desde la página de tu tienda. Ponla junto a la caja.' },
    { art: <MiniPhone />,
      en: 'Families redeem', es: 'Las familias canjean',
      de: 'They scan, tap Redeem and show a green screen. You give the offer.',
      ds: 'Escanean, tocan Canjear y muestran una pantalla verde. Tú das la oferta.' },
  ];

  const facts = [
    { icon: Sparkles, en: 'Free to join. No fees, ever.', es: 'Participar es gratis. Sin costos, nunca.' },
    { icon: Gift, en: 'You choose the offer — a free item, a discount, a free class…', es: 'Tú eliges la oferta: un producto gratis, un descuento, una clase gratis…' },
    { icon: CalendarRange, en: `Your offer runs from the day you are approved through ${fmtDay(redeemTo, false)}.`,
      es: `Tu oferta va desde el día de tu aprobación hasta el ${fmtDay(redeemTo, true)}.` },
    { icon: Store, en: 'Your logo and offer on our festival page, shared with every family.', es: 'Tu logo y tu oferta en la página del festival, para todas las familias.' },
    { icon: BarChart3, en: 'Your own page shows how many families came, day by day.', es: 'Tu página muestra cuántas familias vinieron, día por día.' },
    { icon: HeartHandshake, en: 'Your staff need nothing: the family’s phone does the work.', es: 'Tu personal no necesita nada: el teléfono de la familia hace todo.' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-sky-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="text-center text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          {tr('How it works for your shop', 'Cómo funciona para tu negocio')}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-5 sm:gap-3">
          {steps.map((st, i) => (
            <li key={st.en} className="relative flex items-start gap-4 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-800 sm:flex-col sm:items-center sm:text-center">
              <span className="absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#F5C542] text-sm font-black text-[#0C4A6E] shadow">
                {i + 1}
              </span>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center">{st.art}</div>
              <div>
                <p className="font-black text-slate-900 dark:text-white">{tr(st.en, st.es)}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{tr(st.de, st.ds)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-3xl border-2 border-[#F5C542] bg-[#FFFBEB] p-5 dark:border-amber-700 dark:bg-amber-900/20 sm:p-6">
        <h2 className="text-lg font-black text-[#92400E] dark:text-amber-200">
          {tr('What you are signing up for', 'A qué te inscribes')}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {facts.map((f) => (
            <li key={f.en} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309] dark:text-amber-300" />
              <span>{tr(f.en, f.es)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ShopSteps;
