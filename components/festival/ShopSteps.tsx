import React from 'react';
import { PencilLine, MailCheck, BadgeCheck, LucideIcon } from 'lucide-react';
import { tr } from '../../lib/lang';

/**
 * What happens after a business presses the button, as five pictures a busy
 * owner can take in at a glance. Steps 4 and 5 draw the actual sign and the actual green
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

/** young: the same steps in a kid's words — a stall, not a register */
const ShopSteps: React.FC<{ young?: boolean }> = ({ young }) => {

  const steps = [
    { art: <IconDisc icon={PencilLine} color="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" />,
      en: 'Sign up', es: 'Inscríbete',
      de: 'Two minutes: your offer, your logo, your email. No account, no password.',
      ds: 'Dos minutos: tu oferta, tu logo y tu correo. Sin cuenta ni contraseña.' },
    { art: <IconDisc icon={MailCheck} color="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" />,
      en: 'Confirm your email', es: 'Confirma tu correo',
      de: young ? 'A parent clicks the link we email. It is also your business page from then on.' : 'Click the link we email you. It is also your shop page from then on.',
      ds: young ? 'Un padre o madre hace clic en el enlace que enviamos. Desde entonces es también la página de tu negocio.' : 'Haz clic en el enlace que te enviamos. Desde entonces es también la página de tu tienda.' },
    { art: <IconDisc icon={BadgeCheck} color="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" />,
      en: 'We approve', es: 'Te aprobamos',
      de: young ? 'Within 48 hours. You are featured on our Young Founders page.' : 'Within 48 hours. Your logo and offer go up on our festival page.',
      ds: young ? 'En 48 horas. Apareces en nuestra página de Jóvenes Emprendedores.' : 'En 48 horas. Tu logo y tu oferta aparecen en la página del festival.' },
    { art: <MiniSign />,
      en: 'Print your QR sign', es: 'Imprime tu letrero QR',
      de: young ? 'One page from your business page. Put it on your stall or table.' : 'One page from your shop page. Put it by the register.',
      ds: young ? 'Una hoja desde la página de tu negocio. Ponla en tu puesto o mesa.' : 'Una hoja desde la página de tu tienda. Ponla junto a la caja.' },
    { art: <MiniPhone />,
      en: 'Families redeem', es: 'Las familias canjean',
      de: 'They scan, tap Redeem and show a green screen. You give the offer.',
      ds: 'Escanean, tocan Canjear y muestran una pantalla verde. Tú das la oferta.' },
  ];


  return (
    <div className="space-y-6">
      <div className="rounded-3xl border-2 border-sky-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <h2 className="text-center text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
          {tr('What happens next', 'Qué pasa después')}
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
    </div>
  );
};

export default ShopSteps;
