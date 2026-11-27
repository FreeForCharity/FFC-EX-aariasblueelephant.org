import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Heart, HandHelping, Sparkles, Check } from 'lucide-react';
import StagedFadeIn from '../components/StagedFadeIn';
import { supabase } from '../lib/supabase';
import { tr, isEs } from '../lib/lang';
import {
  PROGRAMS, GROUPS, MONTHS, FUNDING_LABEL, PLAN_YEAR,
  type FundingSource, type PlanProgram, type L,
} from '../data/plan2027';

/**
 * /events/2027 — the tentative 2027 program plan, for families, donors and
 * grant reviewers. Totals are live from program_plan_summary() (rounded,
 * staff-edited in Dashboard → 2027 Plan); the static estimates in
 * data/plan2027.ts are the fallback.
 */

const t = (l: L) => tr(l[0], l[1]);

type Live = Record<string, { est: number; fund: FundingSource[] }>;

const FUND_ORDER: FundingSource[] = ['city_partner', 'grant', 'sponsor', 'employee_giving', 'giving_tuesday', 'in_kind', 'donations', 'own_funds'];

const FUND_HOW: Partial<Record<FundingSource, L>> = {
  city_partner: ['We’re planning our community celebrations with the City of Mountain House, which keeps our share to gifts and treats.',
                 'Estamos planeando nuestras celebraciones comunitarias con la Ciudad de Mountain House, así que nuestra parte se limita a regalos y golosinas.'],
  grant: ['Foundation and government grants for uniforms, background checks, insurance and program costs.',
          'Subvenciones de fundaciones y del gobierno para uniformes, verificación de antecedentes, seguros y costos de programas.'],
  sponsor: ['Local businesses sponsor a whole event: the picnic food, the beach shade, the camping meals.',
            'Negocios locales patrocinan un evento completo: la comida del picnic, la sombra en la playa, las comidas del campamento.'],
  employee_giving: ['We’re approved on Benevity, so many employers match their employees’ gifts.',
                    'Estamos aprobados en Benevity, así que muchas empresas igualan las donaciones de sus empleados.'],
  giving_tuesday: ['Our GivingTuesday campaign funds the Christmas gifts for every child.',
                   'Nuestra campaña de GivingTuesday financia los regalos de Navidad para cada niño.'],
  in_kind: ['Supplies instead of cash: snacks, art materials, sports gear, a venue for the day.',
            'Materiales en lugar de dinero: refrigerios, materiales de arte, equipo deportivo, un lugar por un día.'],
  donations: ['Gifts of any size from our community, through our donation page.',
              'Donaciones de cualquier tamaño de nuestra comunidad, a través de nuestra página de donaciones.'],
  own_funds: ['Until the rest comes in, our founders cover the gap from their own savings.',
              'Mientras llega lo demás, nuestros fundadores cubren la diferencia con sus propios ahorros.'],
};

const Plan2027: React.FC = () => {
  const es = isEs();
  const [live, setLive] = useState<Live | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    let gone = false;
    supabase.rpc('program_plan_summary', { p_year: PLAN_YEAR }).then(({ data, error }) => {
      if (gone || error || !Array.isArray(data) || data.length === 0) return;
      const m: Live = {};
      for (const r of data as { program_key: string; est_total: number; sources: FundingSource[] }[]) {
        m[r.program_key] = { est: Number(r.est_total) || 0, fund: r.sources || [] };
      }
      setLive(m);
    });
    return () => { gone = true; };
  }, []);

  const estOf = (p: PlanProgram) => live?.[p.key]?.est ?? p.est;
  const fundOf = (p: PlanProgram) => {
    const f = live?.[p.key]?.fund ?? p.fund;
    return FUND_ORDER.filter(k => f.includes(k));
  };
  const total = PROGRAMS.reduce((n, p) => n + estOf(p), 0);
  const money = (n: number) => n.toLocaleString(es ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  // year at a glance: which emojis land in each month (sports show by season)
  const byMonth = useMemo(() => MONTHS.map((_, i) => {
    const m = i + 1;
    const out: { emoji: string; label: string }[] = [];
    for (const p of PROGRAMS) {
      if (p.seasons) {
        for (const s of p.seasons) if (s.months.includes(m)) out.push({ emoji: s.emoji, label: t(s.name) });
      } else if (p.months.includes(m)) {
        out.push({ emoji: p.emoji, label: t(p.title) });
      }
    }
    return out;
  }), []);

  const anytime = PROGRAMS.filter(p => p.months.length === 0 && !p.seasons);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24 overflow-x-clip">
      {/* hero */}
      <section className="relative pt-24 pb-14 bg-gradient-to-b from-[#00AEEF]/15 via-amber-50/40 to-transparent dark:via-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <StagedFadeIn>
            <Link to="/events" className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-700 dark:text-sky-400 mb-6 hover:gap-2.5 transition-all">
              <ArrowLeft className="h-4 w-4" /> {tr('All events', 'Todos los eventos')}
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> {tr('Tentative plan · dates may change', 'Plan tentativo · las fechas pueden cambiar')}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#0C4A6E] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#F5C542]">
                {tr('Always 100% free for families', 'Siempre 100% gratis para las familias')}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
              {tr('Our', 'Nuestro plan')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] to-[#8b5cf6]">{tr(`${PLAN_YEAR} Plan`, `${PLAN_YEAR}`)}</span>
            </h1>
            <p className="mt-5 max-w-3xl mx-auto text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {tr(
                'Everything we hope to run next year: what each program needs, roughly what it costs, and how we plan to pay for it, so families never have to.',
                'Todo lo que esperamos hacer el próximo año: lo que necesita cada programa, cuánto cuesta aproximadamente y cómo planeamos pagarlo, para que las familias nunca tengan que hacerlo.'
              )}
            </p>
            <div className="mt-8 inline-flex flex-col items-center rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg px-8 py-5">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{tr('Approx. cost to run the whole year', 'Costo aproximado de todo el año')}</span>
              <span className="text-4xl md:text-5xl font-black text-[#0C4A6E] dark:text-sky-300 mt-1">≈ {money(total)}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tr(`${PROGRAMS.length - 1} programs · run entirely by volunteers`, `${PROGRAMS.length - 1} programas · a cargo solo de voluntarios`)}</span>
            </div>
          </StagedFadeIn>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* year at a glance */}
        <section aria-labelledby="plan-year">
          <h2 id="plan-year" className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
            <CalendarDays className="h-4 w-4" /> {tr('The year at a glance', 'El año de un vistazo')}
          </h2>
          <ol className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
            {MONTHS.map((m, i) => (
              <li key={m[0]} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-center shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-400">{t(m)}</p>
                <p className="mt-1.5 flex flex-wrap justify-center gap-0.5 text-xl leading-none min-h-[1.5rem]">
                  {byMonth[i].map((e, j) => (
                    <span key={j} title={e.label} role="img" aria-label={e.label} className="inline-block hover:scale-125 transition-transform cursor-default">{e.emoji}</span>
                  ))}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-bold">{tr('Through the year:', 'Durante el año:')}</span>
            {anytime.map(p => <span key={p.key}>{p.emoji} {t(p.title)}</span>)}
          </p>
        </section>

        {/* programs, by group */}
        {GROUPS.map(g => {
          const progs = PROGRAMS.filter(p => p.group === g.key);
          return (
            <section key={g.key} aria-labelledby={`plan-${g.key}`}>
              <div className={`rounded-3xl bg-gradient-to-br ${g.tint} p-5 sm:p-7 mb-6`}>
                <h2 id={`plan-${g.key}`} className="flex items-center gap-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  <span className="text-4xl" aria-hidden="true">{g.emoji}</span> {t(g.title)}
                </h2>
                <p className="mt-2 text-slate-700 dark:text-slate-300">{t(g.blurb)}</p>
              </div>
              <div className={`grid gap-5 ${progs.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''}`}>
                {progs.map(p => (
                  <ProgramCard key={p.key} p={p} est={estOf(p)} fund={fundOf(p)} money={money} />
                ))}
              </div>
            </section>
          );
        })}

        {/* how we'll raise it */}
        <section aria-labelledby="plan-raise" className="rounded-3xl bg-[#0C4A6E] text-white p-6 sm:p-10">
          <h2 id="plan-raise" className="text-2xl sm:text-3xl font-black">{tr('How we’ll raise it', 'Cómo lo vamos a reunir')}</h2>
          <p className="mt-2 text-sky-100 max-w-3xl">
            {tr(
              'We’re run entirely by volunteers. Every dollar goes into the next event a family walks into, and we cover the gaps ourselves until it comes in.',
              'Somos solo voluntarios. Cada dólar va al próximo evento al que llega una familia, y cubrimos lo que falte mientras llega.'
            )}
          </p>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FUND_ORDER.filter(k => FUND_HOW[k]).map(k => (
              <div key={k} className="rounded-2xl bg-white/10 border border-white/15 p-5">
                <p className="text-2xl" aria-hidden="true">{FUNDING_LABEL[k].emoji}</p>
                <p className="mt-2 font-black">{t(FUNDING_LABEL[k].label)}</p>
                <p className="mt-1 text-sm text-sky-100 leading-snug">{t(FUND_HOW[k]!)}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/donate" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F5C542] px-6 py-3 font-black text-[#0C4A6E] hover:brightness-105 transition">
              <Heart className="h-5 w-5" fill="currentColor" /> {tr('Fund a program', 'Financia un programa')}
            </Link>
            <Link to="/volunteer" className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-6 py-3 font-black text-white hover:bg-white/10 transition">
              <HandHelping className="h-5 w-5" /> {tr('Sponsor, volunteer or partner', 'Patrocina, sé voluntario o colabora')}
            </Link>
          </div>
        </section>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          {tr(
            'This is a working plan. Dates, venues and costs are rough estimates and may change as programs are confirmed. Confirmed events appear on our events page with sign-up.',
            'Este es un plan en desarrollo. Las fechas, los lugares y los costos son estimaciones y pueden cambiar a medida que se confirmen los programas. Los eventos confirmados aparecen en nuestra página de eventos con inscripción.'
          )}
        </p>
      </div>
    </div>
  );
};

const ProgramCard: React.FC<{ p: PlanProgram; est: number; fund: FundingSource[]; money: (n: number) => string }> = ({ p, est, fund, money }) => (
  <article className="group flex flex-col rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6">
    <div className="flex items-start gap-4">
      <span className="shrink-0 grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-100 to-amber-100 dark:from-sky-900/40 dark:to-amber-900/30 text-4xl group-hover:rotate-[-8deg] group-hover:scale-110 transition-transform" aria-hidden="true">
        {p.emoji}
      </span>
      <div className="min-w-0">
        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{t(p.title)}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" /> {t(p.when)}
        </p>
      </div>
    </div>
    <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">{t(p.blurb)}</p>

    {p.seasons && (
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {p.seasons.map(s => (
          <div key={s.name[0]} className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 p-3">
            <p className="text-2xl" aria-hidden="true">{s.emoji}</p>
            <p className="mt-1 text-sm font-black text-slate-900 dark:text-white leading-tight">{t(s.name)}</p>
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-400">{t(s.when)}</p>
          </div>
        ))}
      </div>
    )}

    <div className="mt-5">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{tr('What it needs', 'Lo que necesita')}</p>
      <ul className={`mt-2 space-y-1.5 ${p.seasons ? 'sm:columns-2 gap-6' : ''}`}>
        {p.needs.map(n => (
          <li key={n[0]} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 break-inside-avoid">
            <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" /> {t(n)}
          </li>
        ))}
      </ul>
    </div>

    <div className="mt-auto pt-5">
      <div className="mt-2 flex items-end justify-between gap-3 border-t border-dashed border-slate-200 dark:border-slate-700 pt-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{tr('Approx. cost', 'Costo aprox.')}</p>
          <p className="text-2xl font-black text-[#0C4A6E] dark:text-sky-300">≈ {money(est)}</p>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{tr('How we’ll fund it', 'Cómo lo financiaremos')}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {fund.map(f => (
          <span key={f} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <span aria-hidden="true">{FUNDING_LABEL[f].emoji}</span> {t(FUNDING_LABEL[f].label)}
          </span>
        ))}
      </div>
    </div>
  </article>
);

export default Plan2027;
