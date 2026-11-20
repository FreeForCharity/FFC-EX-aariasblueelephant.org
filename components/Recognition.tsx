import React, { useState } from 'react';
import { Award } from 'lucide-react';
import MediaLightbox from './MediaLightbox';
import { tr } from '../lib/lang';

/**
 * "Recognized by" — certificates from our elected officials.
 *
 * Shown on Home and About. Tiles show the whole certificate (contain, never
 * cropped); a tap opens the full-size scan in the lightbox. To add one: drop
 * `<name>.webp` (≤1600px) and `<name>-thumb.webp` (≤520px) into
 * public/recognition/ and add an entry below. Issuer names and titles stay as
 * printed on the certificate; only the surrounding wording is translated.
 */
const CERTS: {
  file: string;
  issuer: string;
  role: [string, string];
  forWhat: [string, string];
  date: [string, string];
}[] = [
  {
    file: 'congress-harder',
    issuer: 'Congressman Josh Harder',
    role: ['U.S. House of Representatives', 'Cámara de Representantes de EE. UU.'],
    forWhat: ['Autism & Special Needs Family Resource Fair', 'Feria de Recursos para Familias: Autismo y Necesidades Especiales'],
    date: ['November 1, 2026', '1 de noviembre de 2026'],
  },
  {
    file: 'ca-assembly-ransom',
    issuer: 'Assemblymember Rhodesia Ransom',
    role: ['California State Assembly, 13th District', 'Asamblea Estatal de California, Distrito 13'],
    forWhat: ['Inclusion Festival and Resource Fair', 'Festival de Inclusión y Feria de Recursos'],
    date: ['November 1, 2026', '1 de noviembre de 2026'],
  },
  {
    file: 'sj-county-supervisor-rickman',
    issuer: 'Supervisor Robert Rickman',
    role: ['San Joaquin County Board of Supervisors, 5th District', 'Junta de Supervisores del Condado de San Joaquín, Distrito 5'],
    forWhat: ['Inclusion Festival & Special Needs Resources Fair 2026', 'Festival de Inclusión y Feria de Recursos para Necesidades Especiales 2026'],
    date: ['November 1, 2026', '1 de noviembre de 2026'],
  },
  {
    file: 'mountain-house-city-council',
    issuer: 'Mayor Andy Su',
    role: ['Mountain House City Council', 'Concejo Municipal de Mountain House'],
    forWhat: ['Circle of Friends Inclusion Project', 'Proyecto de Inclusión Círculo de Amigos'],
    date: ['April 28, 2026', '28 de abril de 2026'],
  },
];

const full = (f: string) => `/recognition/${f}.webp`;
const thumb = (f: string) => `/recognition/${f}-thumb.webp`;

const Recognition: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const images = CERTS.map(c => full(c.file));

  return (
    <section className={className} aria-labelledby="recognition-heading">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-4">
          <Award className="h-4 w-4" aria-hidden="true" />
          {tr('Recognized by', 'Reconocidos por')}
        </div>
        <h2 id="recognition-heading" className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          {tr('Honored by our elected leaders', 'Honrados por nuestros líderes electos')}
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {tr(
            'Certificates of recognition for building a more inclusive community, from the U.S. Congress down to our own City Council.',
            'Certificados de reconocimiento por construir una comunidad más inclusiva, desde el Congreso de EE. UU. hasta nuestro propio Concejo Municipal.'
          )}
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CERTS.map((c, i) => (
          <li key={c.file}>
            <button
              type="button"
              onClick={() => { setIndex(i); setOpen(true); }}
              className="group w-full h-full text-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400"
              aria-label={tr(`View the certificate from ${c.issuer}`, `Ver el certificado de ${c.issuer}`)}
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-amber-50/60 dark:from-slate-800 dark:to-slate-900 p-4 flex items-center justify-center">
                <img
                  src={thumb(c.file)}
                  alt={tr(`Certificate of recognition from ${c.issuer}`, `Certificado de reconocimiento de ${c.issuer}`)}
                  loading="lazy"
                  decoding="async"
                  className="max-h-full max-w-full object-contain rounded shadow-md group-hover:scale-[1.03] transition-transform"
                />
              </div>
              <div className="p-5">
                <p className="font-black text-slate-900 dark:text-white leading-tight">{c.issuer}</p>
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mt-1">{tr(c.role[0], c.role[1])}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-snug">{tr(c.forWhat[0], c.forWhat[1])}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-3">{tr(c.date[0], c.date[1])}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <MediaLightbox
        isOpen={open}
        onClose={() => setOpen(false)}
        images={images}
        currentIndex={index}
        onNext={() => setIndex(p => (p + 1) % images.length)}
        onPrev={() => setIndex(p => (p - 1 + images.length) % images.length)}
      />
    </section>
  );
};

export default Recognition;
