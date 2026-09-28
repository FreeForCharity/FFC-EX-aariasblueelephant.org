import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, CheckCircle, School, Palette, Trophy, Siren,
  Sparkles, Store, MonitorPlay, Wind, HeartHandshake,
} from 'lucide-react';
import { BYLAWS_HIGHLIGHTS } from '../constants';
import Button from '../components/Button';
import { tr } from '../lib/lang';

/**
 * What we actually do.
 *
 * The purpose statement above is the legal one, filed with the State — it says
 * what the corporation exists for, not what a family would meet on a Saturday.
 * This is the second half of that answer, and every entry is a program that
 * has actually run or is scheduled. Adding one here is a single object below;
 * link it if it has a page of its own.
 */
const PROGRAMS: {
  icon: React.ComponentType<{ className?: string }>;
  to?: string; en: string; es: string;
}[] = [
  { icon: Users,
    en: 'Inclusive events where kids of all abilities play together',
    es: 'Eventos inclusivos donde juegan juntos niños de todas las capacidades' },
  { icon: Sparkles,
    en: 'Sensory-friendly versions of much-loved community events',
    es: 'Versiones amigables con los sentidos de eventos muy queridos' },
  { icon: HeartHandshake, to: '/circle-of-friends',
    en: 'Friendship and buddy programs in our local schools',
    es: 'Programas de amistad y compañeros en nuestras escuelas' },
  { icon: School,
    en: 'Classroom awareness, and support for families navigating services',
    es: 'Concientización en el aula y apoyo a las familias con los servicios' },
  { icon: Palette,
    en: 'Art, craft and creative workshops, including at the library',
    es: 'Talleres de arte, manualidades y creatividad, incluso en la biblioteca' },
  { icon: Trophy,
    en: 'Sports and games, with Special Olympics Northern California',
    es: 'Deportes y juegos, junto a Special Olympics Northern California' },
  { icon: Siren,
    en: 'Meet-ups with first responders and community services',
    es: 'Encuentros con servicios de emergencia y comunitarios' },
  { icon: Wind,
    en: 'Community partnerships with the City of Mountain House',
    es: 'Alianzas comunitarias con la Ciudad de Mountain House' },
  { icon: MonitorPlay, to: '/events',
    en: 'Awareness webinars and family learning sessions with specialists',
    es: 'Seminarios de concientización y aprendizaje familiar con especialistas' },
  { icon: Store, to: '/InclusionFestival',
    en: 'Connecting families to local businesses, resources and support',
    es: 'Conectamos a las familias con negocios, recursos y apoyo locales' },
];

const About: React.FC = () => {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl mb-4">{tr('About Us', 'Sobre Nosotros')}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {tr(
              'We are a California Nonprofit Public Benefit Corporation dedicated to fostering inclusive communities for children of all abilities.',
              'Somos una Corporación de Beneficio Público sin fines de lucro de California dedicada a fomentar comunidades inclusivas para niños de todas las capacidades.'
            )}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{tr('Our Purpose', 'Nuestro Propósito')}</h2>
            <div className="prose prose-slate dark:prose-invert">
              <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                {tr(
                  'The specific purpose of this corporation is to foster inclusive events for neurodivergent and neurotypical kids. Through weekly classes and events, we promote equality, compassion, and community in California and beyond.',
                  'El propósito específico de esta corporación es fomentar eventos inclusivos para niños neurodivergentes y neurotípicos. A través de clases y eventos semanales, promovemos la igualdad, la compasión y la comunidad en California y más allá.'
                )}
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                {tr(
                  'We aim to raise public awareness about the importance of early intervention and therapy to support the developmental needs of these children, while creating inclusive spaces where specially-abled individuals are embraced and integrated into society.',
                  'Buscamos crear conciencia pública sobre la importancia de la intervención temprana y la terapia para apoyar las necesidades de desarrollo de estos niños, mientras creamos espacios inclusivos donde las personas con capacidades especiales son aceptadas e integradas en la sociedad.'
                )}
              </p>
            </div>

            {/* The filed purpose says what we exist for; this says what we
                actually run, so the two are never read apart. Adding a
                category is one entry in PROGRAMS at the top of this file. */}
            <div className="mt-7 border-t border-slate-200 dark:border-slate-700 pt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                {tr('What that looks like in practice', 'Cómo se ve en la práctica')}
              </p>
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {PROGRAMS.map((prog) => {
                  const Icon = prog.icon;
                  const inner = (
                    <>
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600 dark:text-sky-400" />
                      <span className="text-sm leading-snug text-slate-700 dark:text-slate-300">
                        {tr(prog.en, prog.es)}
                      </span>
                    </>
                  );
                  return (
                    <li key={prog.en}>
                      {prog.to ? (
                        <Link to={prog.to} className="flex items-start gap-2.5 rounded-lg transition hover:opacity-70">
                          {inner}
                        </Link>
                      ) : (
                        <span className="flex items-start gap-2.5">{inner}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {tr('Nearly everything we run is free to families, and this list keeps growing. If your family needs something that isn’t here yet, tell us — that is usually how the next one starts.',
                    'Casi todo lo que hacemos es gratuito para las familias, y esta lista sigue creciendo. Si tu familia necesita algo que todavía no está aquí, dínoslo: así suele empezar lo siguiente.')}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-1 bg-sky-500 rounded-full"></div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-bold">{tr('Incorporated', 'Incorporada')}</p>
                <p className="text-slate-900 dark:text-white font-medium">September 15, 2025</p>
              </div>
              <div className="ml-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-bold">{tr('Entity Type', 'Tipo de Entidad')}</p>
                <p className="text-slate-900 dark:text-white font-medium">{tr('501(c)(3) Nonprofit', 'Sin fines de lucro 501(c)(3)')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{tr('Leadership Team', 'Equipo de Liderazgo')}</h2>

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
              <img
                src="/liji_chalatil.webp"
                alt="Liji Chalatil"
                className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-sky-400 flex-shrink-0"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Liji Chalatil</h3>
                <p className="text-sky-600 dark:text-sky-400 text-sm font-medium">{tr('Founder, President & CEO', 'Fundadora, Presidenta y directora ejecutiva')}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{tr('Visionary leader advocating for neurodiversity.', 'Líder visionaria que aboga por la neurodiversidad.')}</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
              <img
                src="/ajith_chandran.webp"
                alt="Ajith Chandran"
                className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-sky-500 flex-shrink-0"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ajith Chandran</h3>
                <p className="text-sky-600 dark:text-sky-400 text-sm font-medium">{tr('Secretary & CTO', 'Secretario y director de tecnología')}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{tr('Dedicated to operational excellence and community outreach.', 'Dedicado a la excelencia operativa y al acercamiento comunitario.')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Board Members Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">{tr('Board of Directors', 'Junta Directiva')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Anoop Nair",
                description: tr('Committed to building inclusive environments where every child belongs.', 'Comprometido con crear ambientes inclusivos donde cada niño pertenece.'),
                photo: "/anoop_nair.jpeg"
              },
              {
                name: "Naveed Shaik",
                description: tr('Passionate about community outreach and fostering equality.', 'Apasionado por el acercamiento comunitario y el fomento de la igualdad.'),
                photo: "/board_member_placeholder_naveed.jpg"
              },
              {
                name: "Prasanth Thomas",
                description: tr('Dedicated to making a difference through compassion and community support.', 'Dedicado a hacer la diferencia a través de la compasión y el apoyo comunitario.'),
                photo: "/prasanth_thomas.jpeg"
              },
              {
                name: "Gopal Valsan",
                description: tr('Advocating for neurodiversity and building bridges in our community.', 'Defensor de la neurodiversidad y constructor de puentes en nuestra comunidad.'),
                photo: "/gopal_valsan.jpeg"
              }
            ].map((member, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 hover:shadow-md">
                <div className="relative mb-4">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-sky-400 mx-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 mx-auto flex items-center justify-center">
                      <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{member.name}</h3>
                  <p className="text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest mt-1 mb-3">{tr('Board Member', 'Miembro de la Junta')}</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm border-t border-slate-100 dark:border-slate-700/50 pt-3">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bylaws Section */}
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{tr('Organization Bylaws & Standards', 'Estatutos y Normas de la Organización')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BYLAWS_HIGHLIGHTS.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-sky-500 flex-shrink-0" />
                <p className="text-slate-700 dark:text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;