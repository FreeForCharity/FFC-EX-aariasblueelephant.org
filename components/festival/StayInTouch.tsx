import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Mail, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { festivalDb } from '../../lib/festival/db';
import { fmtDay } from '../../lib/festival/store';
import { tr, isEs } from '../../lib/lang';

/**
 * "While you're here" — the next few Aaria's Blue Elephant events, and an
 * unticked box to hear about more. A family who walked in for a free cookie
 * leaves knowing what we do next, and we only email the ones who said yes.
 */
const StayInTouch: React.FC<{ optin?: boolean; dark?: boolean }> = ({ optin, dark }) => {
  const { events } = useData();
  const es = isEs();
  const [on, setOn] = useState(!!optin);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setOn(!!optin); }, [optin]);

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const upcoming = (events || [])
    .filter((e) => e.date && e.date.slice(0, 10) >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    const ok = await festivalDb.setOptin(next);
    if (!ok) setOn(!next);
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className={`w-full max-w-sm rounded-3xl p-5 text-left ${dark ? 'bg-white text-slate-900' : 'border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-sky-700">
        <CalendarDays className="h-4 w-4" />{tr('Coming up at Aaria’s Blue Elephant', 'Próximamente en Aaria’s Blue Elephant')}
      </p>
      {upcoming.length ? (
        <ul className="mt-3 space-y-2">
          {upcoming.map((e) => (
            <li key={e.id}>
              <Link to={`/events/${e.id}`} className="block rounded-xl bg-sky-50 px-3 py-2 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">{e.title}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {fmtDay(e.date, es)}{e.time ? ` · ${e.time}` : ''}{e.location ? ` · ${e.location}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {tr('New events are added all the time.', 'Agregamos eventos nuevos todo el tiempo.')}
        </p>
      )}
      <Link to="/events" className="mt-3 inline-block text-xs font-bold text-sky-700 underline dark:text-sky-400">
        {tr('All events', 'Todos los eventos')}
      </Link>

      <button type="button" role="checkbox" aria-checked={on} onClick={toggle}
        className="mt-4 flex w-full items-start gap-3 rounded-xl border-2 border-slate-200 p-3 text-left dark:border-slate-700">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${on ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'}`}>
          {on && <Check className="h-3.5 w-3.5" />}
        </span>
        <span className="text-sm text-slate-700 dark:text-slate-200">
          <Mail className="mr-1 inline h-4 w-4 text-sky-700" />
          {tr('Email me about future Aaria’s Blue Elephant events', 'Envíame correos sobre futuros eventos de Aaria’s Blue Elephant')}
          {saved && <span className="ml-2 text-xs font-bold text-green-600">{tr('Saved', 'Guardado')}</span>}
        </span>
      </button>
    </div>
  );
};

export default StayInTouch;
