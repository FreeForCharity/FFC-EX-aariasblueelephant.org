import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { tr, isEs } from '../lib/lang';

// Featured video at the top of the landing page. To feature a different video,
// change VIDEO_ID (the part after "watch?v=") and the copy below.
const VIDEO_ID = '95Acjx-ZdCo';

const FeaturedMessage: React.FC = () => {
    // Click-to-play: show the thumbnail first so the page stays fast, and only
    // load YouTube's player when the visitor asks for it.
    const [playing, setPlaying] = useState(false);

    return (
        // -mt-24 cancels Layout's pt-24 (the navbar is sticky, so that padding is just empty space)
        <section className="relative -mt-24 overflow-hidden bg-gradient-to-b from-sky-900 via-sky-800 to-indigo-900 py-10 sm:py-14 px-4">
            <div className="max-w-5xl mx-auto text-center">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-sky-300 mb-3">
                    {tr('A special message for our herd', 'Un mensaje especial para nuestra manada')}
                </p>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                    Dr. Shashi Tharoor
                </h2>
                <p className="text-base sm:text-lg text-sky-100 max-w-3xl mx-auto leading-relaxed mb-8">
                    {tr(
                        'Former United Nations Under-Secretary-General and award-winning author of more than twenty books. He shares why inclusion and community support matter for special needs families.',
                        'Exsubsecretario general de las Naciones Unidas y autor galardonado de más de veinte libros. Nos comparte por qué la inclusión y el apoyo comunitario son importantes para las familias con necesidades especiales.'
                    )}
                </p>

                <div className="relative mx-auto w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-black">
                    {playing ? (
                        <iframe
                            className="absolute inset-0 h-full w-full"
                            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
                            title={tr('Message from Dr. Shashi Tharoor', 'Mensaje del Dr. Shashi Tharoor')}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setPlaying(true)}
                            className="group absolute inset-0 h-full w-full"
                            aria-label={tr('Play the message from Dr. Shashi Tharoor', 'Reproducir el mensaje del Dr. Shashi Tharoor')}
                        >
                            <img
                                src={`https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform group-hover:scale-110">
                                <Play className="h-9 w-9 sm:h-11 sm:w-11 text-sky-700 translate-x-0.5" fill="currentColor" />
                            </span>
                        </button>
                    )}
                </div>

                {isEs() && (
                    <p className="mt-3 text-sm text-sky-200">Video en inglés</p>
                )}
            </div>
        </section>
    );
};

export default FeaturedMessage;
