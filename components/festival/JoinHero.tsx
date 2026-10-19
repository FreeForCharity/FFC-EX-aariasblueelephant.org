import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, Calendar, Clock, MapPin, Ticket } from 'lucide-react';
import Button from '../Button';
import SignPreview from './SignPreview';
import { fmtDay, FESTIVAL_EVENT_PATH } from '../../lib/festival/store';
import { FestivalSettings } from '../../lib/festival/types';
import { tr, isEs } from '../../lib/lang';

/** the last farmers market Sunday of the Youth Entrepreneurs Fair; the reminder hides itself after */
const MARKET_DAY = '2026-10-25';

/**
 * The top of the sign-up page, written like the post that brought them here:
 * who it's for, what they get, and why it matters — the inclusion part — so a
 * link from Facebook explains itself before the form.
 */
const JoinHero: React.FC<{ young: boolean; settings: FestivalSettings }> = ({ young, settings }) => {
  const es = isEs();
  const today = new Date().toLocaleDateString('en-CA');
  const beforeMarket = young && today <= MARKET_DAY;
  const toForm = () => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={`overflow-hidden rounded-3xl border-2 p-6 shadow-sm sm:p-8 ${young
      ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:border-amber-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'
      : 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-amber-50 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'}`}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start lg:gap-10">
      <div>
      <p className={`text-sm font-black uppercase tracking-wide ${young ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'}`}>
        {young ? `🌟 ${tr('Calling all Young Founders!', '¡Atención, Jóvenes Emprendedores!')}` : `💙 ${tr('For local businesses', 'Para negocios locales')}`}
      </p>
      <h1 className="mt-2 text-3xl font-black leading-tight text-slate-900 dark:text-white sm:text-4xl">
        {young
          ? <>{tr('Run a business and under 18?', '¿Tienes un negocio y eres menor de 18?')} <span className="text-amber-600 dark:text-amber-400">{tr('Get featured — free.', 'Aparece aquí, gratis.')}</span></>
          : <>{tr('Welcome every family —', 'Recibe a todas las familias,')} <span className="text-sky-700 dark:text-sky-400">{tr('and bring new ones through your door.', 'y atrae nuevas a tu negocio.')}</span></>}
      </h1>

      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
        {young
          ? tr('We loved the young entrepreneurs at the Mountain House Farmers Market! Now we’d love to feature YOUR business on our festival page. A parent signs you up in 2 minutes.',
               '¡Nos encantaron los jóvenes emprendedores del Mercado de Agricultores de Mountain House! Ahora queremos mostrar TU negocio en la página del festival. Un padre o madre te inscribe en 2 minutos.')
          : tr('All November, festival families get special offers from local businesses that welcome every child. You choose the offer, and new families come to you. Free, 2 minutes.',
               'Todo noviembre, las familias del festival reciben ofertas especiales de negocios locales que dan la bienvenida a todos los niños. Tú eliges la oferta y nuevas familias llegan a ti. Gratis, 2 minutos.')}
      </p>

      {/* why it matters — what signing up says to the families we serve */}
      <div className="mt-5 max-w-3xl rounded-2xl border border-sky-100 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="font-black text-[#0C4A6E] dark:text-sky-300">💙 {tr('Why it matters', 'Por qué importa')}</p>
        <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
          {young
            ? tr('Your sign tells every family “you’re welcome here,” including kids with autism and other special needs. That’s how young founders help build an inclusive community.',
                 'Tu letrero le dice a cada familia “aquí eres bienvenido”, incluidos los niños con autismo y otras necesidades especiales. Así los jóvenes emprendedores ayudan a construir una comunidad inclusiva.')
            : tr('Families of children with autism and other special needs often wonder if a place will be welcoming. Your sign answers that before anyone says a word.',
                 'Las familias de niños con autismo y otras necesidades especiales a menudo se preguntan si un lugar será acogedor. Tu letrero responde antes de que nadie diga una palabra.')}
        </p>
      </div>

      {beforeMarket && (
        <p className="mt-4 max-w-3xl rounded-2xl bg-amber-100 px-4 py-3 font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          📅 {tr('Selling at the market on Sunday, Oct 25? Sign up by Thursday, Oct 22 so you can print your QR sign in time.',
                 '¿Vendes en el mercado el domingo 25 de octubre? Inscríbete a más tardar el jueves 22 de octubre para imprimir tu letrero QR a tiempo.')}
        </p>
      )}

      <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
        <span className="font-black text-slate-800 dark:text-white">{tr('Inclusion Festival & Special Needs Resource Fair', 'Festival de Inclusión y Feria de Recursos para Necesidades Especiales')}</span>
        <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-sky-600" />{fmtDay(settings.festivalDate, es, true)}</span>
        {settings.eventTime && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-sky-600" />{settings.eventTime}</span>}
        {settings.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-sky-600" />{settings.venue}</span>}
        <span className="inline-flex items-center gap-1.5"><Ticket className="h-4 w-4 text-sky-600" />
          {tr(`Offers through ${fmtDay(settings.redeemTo, false)}`, `Ofertas hasta el ${fmtDay(settings.redeemTo, true)}`)}</span>
        {/* the day itself: workshop, panel, resource booths */}
        <Link to={FESTIVAL_EVENT_PATH} className="inline-flex items-center gap-1 font-bold text-sky-700 underline dark:text-sky-400">
          {tr('About the festival day →', 'Sobre el día del festival →')}
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button size="lg" onClick={toForm}>
          {tr('Sign up now — it’s free', 'Inscríbete ahora, es gratis')}<ArrowDown className="ml-2 h-5 w-5" />
        </Button>
        {young
          ? <Link to="/InclusionFestival/youngfounders" className="text-sm font-semibold text-amber-700 underline dark:text-amber-400">
              {tr('See the Young Founders page', 'Ver la página de Jóvenes Emprendedores')}</Link>
          : <Link to="/InclusionFestival/youngfounders/join" className="text-sm font-semibold text-amber-700 underline dark:text-amber-400">
              {tr('Signing up a kid’s business? Use the Young Founders form →', '¿Inscribes el negocio de un niño o niña? Usa el formulario de Jóvenes Emprendedores →')}</Link>}
      </div>
      </div>

      {/* what they'll actually put out: a sample of the sign, before they type a thing */}
      <figure className="mx-auto mt-8 w-full max-w-[16rem] lg:mt-0">
        <SignPreview youngFounder={young}
          name={young ? 'Sparkle Bead Bracelets' : 'Golden Crust Pizza'}
          offerEn={young ? 'Free charm with any bracelet' : 'Free garlic bread with any large pizza'}
          offerEs={young ? 'Dije gratis con cualquier pulsera' : 'Pan de ajo gratis con cualquier pizza grande'}
          redeemFrom={settings.redeemFrom} redeemTo={settings.redeemTo} />
        <figcaption className="mt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {young ? tr('A sample stall sign — yours shows your business and offer.', 'Un letrero de ejemplo para tu puesto: el tuyo muestra tu negocio y tu oferta.')
                 : tr('A sample counter sign — yours shows your business and offer.', 'Un letrero de ejemplo para tu mostrador: el tuyo muestra tu negocio y tu oferta.')}
        </figcaption>
      </figure>
      </div>
    </div>
  );
};

export default JoinHero;
