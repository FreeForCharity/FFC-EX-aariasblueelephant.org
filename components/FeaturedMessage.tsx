import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { tr } from '../lib/lang';
import { ALL_VIDEOS } from '../data/videos';
import VideoThumb from './VideoThumb';

const ROTATE_MS = 5000;

// Teaser on the landing page: rotates through every video so none is favored. It starts at a
// random video on each visit. The players themselves live on /videos (data/videos.ts).
const FeaturedMessage: React.FC = () => {
    const n = ALL_VIDEOS.length;
    const [index, setIndex] = useState(() => Math.floor(Math.random() * n));
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (paused || reduceMotion || n < 2) return;
        const t = setInterval(() => setIndex(i => (i + 1) % n), ROTATE_MS);
        return () => clearInterval(t);
    }, [paused, n]);

    const go = (d: number) => setIndex(i => (i + d + n) % n);
    const current = ALL_VIDEOS[index];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 py-10 sm:py-12 px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-sky-300 mb-3">
                        {tr('Watch & Learn', 'Mira y aprende')}
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">{tr('Messages and webinars from experts', 'Mensajes y seminarios web de expertos')}</h2>
                    <p className="text-base text-sky-100 leading-relaxed mb-6">
                        {tr(
                            'Hear from the people and experts who support special needs families and our community.',
                            'Escucha a las personas y los expertos que apoyan a las familias con necesidades especiales y a nuestra comunidad.'
                        )}
                    </p>
                    <Link
                        to="/videos"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-sky-800 shadow-lg hover:bg-sky-50 transition-colors"
                    >
                        {tr('Watch the videos', 'Ver los videos')} <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                >
                    <div className="group relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-black">
                        <Link
                            to="/videos"
                            className="absolute inset-0 block"
                            aria-label={`${tr('Watch the videos', 'Ver los videos')}: ${current.title}`}
                        >
                            {ALL_VIDEOS.map((v, i) => (
                                <VideoThumb
                                    key={v.id}
                                    id={v.id}
                                    loading={i === index ? 'eager' : 'lazy'}
                                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
                                />
                            ))}
                            <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
                                <Play className="h-7 w-7 text-sky-700 translate-x-0.5" fill="currentColor" />
                            </span>
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-left text-sm font-bold text-white">
                                {current.title}
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => go(-1)}
                            aria-label={tr('Previous video', 'Video anterior')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-sky-800 shadow hover:bg-white"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => go(1)}
                            aria-label={tr('Next video', 'Siguiente video')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-sky-800 shadow hover:bg-white"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                        {ALL_VIDEOS.map((v, i) => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => setIndex(i)}
                                aria-label={`${tr('Show video', 'Mostrar video')} ${i + 1}: ${v.title}`}
                                aria-current={i === index}
                                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedMessage;
