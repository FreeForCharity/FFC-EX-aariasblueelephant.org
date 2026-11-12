import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight } from 'lucide-react';
import { tr } from '../lib/lang';
import { FEATURED_VIDEO } from '../data/videos';

// Teaser on the landing page. The videos themselves live on /videos (data/videos.ts).
const FeaturedMessage: React.FC = () => {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 py-10 sm:py-12 px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-sky-300 mb-3">
                        {tr('A special message for our herd', 'Un mensaje especial para nuestra manada')}
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">{FEATURED_VIDEO.title}</h2>
                    <p className="text-base text-sky-100 leading-relaxed mb-6">
                        {tr(
                            'Hear why inclusion and community support matter for special needs families, plus webinars from experts who support our community.',
                            'Escucha por qué la inclusión y el apoyo comunitario son importantes para las familias con necesidades especiales, además de seminarios web de expertos que apoyan a nuestra comunidad.'
                        )}
                    </p>
                    <Link
                        to="/videos"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-sky-800 shadow-lg hover:bg-sky-50 transition-colors"
                    >
                        {tr('Watch the videos', 'Ver los videos')} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <Link
                    to="/videos"
                    className="group relative block aspect-video rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-black"
                    aria-label={`${tr('Watch', 'Ver')}: ${FEATURED_VIDEO.title}`}
                >
                    <img
                        src={`https://i.ytimg.com/vi/${FEATURED_VIDEO.id}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
                        <Play className="h-7 w-7 text-sky-700 translate-x-0.5" fill="currentColor" />
                    </span>
                </Link>
            </div>
        </section>
    );
};

export default FeaturedMessage;
