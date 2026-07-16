import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { HeartPulse, Sparkles, HeartHandshake, Users, Calendar, ChevronLeft, ChevronRight, Cloud, Smile, Gift, Palette, Music, Star } from 'lucide-react';
import Logo from '../components/Logo';
import SocialLinks from '../components/SocialLinks';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';
import DonationQR from '../components/DonationQR';
import StickerIcon from '../components/StickerIcon';
import CardStack from '../components/ui/card-stack';
import TestimonialSection from '../components/TestimonialSection';
import { formatShortDateLocal, parseDateLocal } from '../lib/utils';
import MediaLightbox from '../components/MediaLightbox';
import { tr } from '../lib/lang';

// Move static data outside to allow random initialization
const pastEvents = [
    {
        id: 4,
        title: tr('Advocacy efforts', 'Esfuerzos de incidencia'),
        date: tr('Ongoing Initiative', 'Iniciativa continua'),
        image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=60&w=400&h=300',
        description: tr('Advocacy efforts to partner with cities and organizations on large-scale inclusion.', 'Esfuerzos de incidencia para asociarnos con ciudades y organizaciones en la inclusión a gran escala.')
    },
    {
        id: 1,
        title: tr('Weekly Play Group', 'Grupo de juego semanal'),
        date: tr('Weekly Initiative', 'Iniciativa semanal'),
        image: 'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=60&w=400&h=300',
        description: tr('A sensory-friendly environment where neurodivergent and neurotypical kids learn to play and communicate together.', 'Un ambiente sensorialmente amigable donde niños neurodivergentes y neurotípicos aprenden a jugar y comunicarse juntos.')
    },
    {
        id: 2,
        title: tr('Monthly Art and Craft Meetup', 'Encuentro mensual de arte y manualidades'),
        date: tr('Monthly Session', 'Sesión mensual'),
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=60&w=400&h=300',
        description: tr('Creative expression sessions designed to build fine motor skills and encourage imagination through collaborative art projects.', 'Sesiones de expresión creativa diseñadas para desarrollar la motricidad fina y fomentar la imaginación a través de proyectos de arte colaborativos.')
    },
    {
        id: 3,
        title: tr('Outreach Workshop', 'Taller de alcance comunitario'),
        date: tr('Community Centers', 'Centros comunitarios'),
        image: '/outreach_workshop_photo.png',
        description: tr('Educational programs for parents and educators on early intervention strategies and building inclusive spaces.', 'Programas educativos para padres y educadores sobre estrategias de intervención temprana y la creación de espacios inclusivos.')
    }
];

// Pre-define images to preload
const imagesToPreload = [
    ...pastEvents.map(e => e.image),
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64'
];

// Track initial app load to allow animations on refresh but skip on internal navigation
// Track initial app load to allow random initialization on refresh but skip on internal navigation
let isAppInitialLoad = true;

// The games kids can play — used to power the smart "Play" button on Home.
// Aaria's Helping Hands is excluded from the random "surprise me" pool since
// it's password-gated safety-ed content, not open-ended free play.
type PlayGame = { url: string; name: string; emoji: string; isReactRoute?: boolean; sampler?: boolean };
const RANDOM_GAMES: PlayGame[] = [
    { url: '/elly-tubbies/index.html', name: "Aaria's Elly-Tubbies", emoji: '🐘', sampler: true },
    { url: '/blockcraft/index.html', name: 'Block Craft 3D', emoji: '🧱', sampler: true },
    { url: '/roadsafety/index.html', name: "Aaria's Road Safety Heroes", emoji: '🚴', sampler: true },
    { url: '/doughlab/index.html', name: "Aaria's Dough Lab", emoji: '🌈', sampler: true },
    { url: '/magnetblocks/index.html', name: 'Magnet Blocks', emoji: '🧲', sampler: true },
    { url: '/grocery/index.html', name: "Aaria's Grocery Store", emoji: '🛒' },
    { url: '/dayplanner/index.html', name: "Aaria's Day Planner", emoji: '📅' },
    { url: '/feelings/index.html', name: "Aaria's Feelings Faces", emoji: '🎭' },
    { url: '/rhythm/index.html', name: "Aaria's Rhythm & Calm", emoji: '🎵' },
    { url: '/flying/index.html', name: "Aaria's Flying Elephant", emoji: '🐘' },
];

type LastGame = { url: string; name: string; emoji: string; at: number };

function pickRandomGame(): PlayGame {
    return RANDOM_GAMES[Math.floor(Math.random() * RANDOM_GAMES.length)];
}

const Home: React.FC = () => {
    // Animations play on full refresh (isAppInitialLoad is true)
    // but skip on internal navigation (isAppInitialLoad becomes false after first mount)
    const shouldAnimate = useRef(isAppInitialLoad).current;
    const { events: dbEvents, isLoading, mediaAlbumUrl, carouselMode } = useData();
    const navigate = useNavigate();
    
    // Media Album State
    const [albumImages, setAlbumImages] = useState<string[]>([]);
    const [isFetchingMedia, setIsFetchingMedia] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    
    // Parse Media Outreach images — stored as newline-separated direct image URLs
    useEffect(() => {
        if (carouselMode === 'media' && mediaAlbumUrl) {
            const urls = mediaAlbumUrl
                .split('\n')
                .map(u => u.trim())
                .filter(u => u.startsWith('http'));
            setAlbumImages(urls);
        } else {
            setAlbumImages([]);
        }
    }, [mediaAlbumUrl, carouselMode]);

    const upcomingEvents = dbEvents
        .filter((e) => {
            const evDate = parseDateLocal(e.date);
            // Hide events happened today or in the past (only show from tomorrow onwards)
            const tomorrow = new Date();
            tomorrow.setHours(23, 59, 59, 999);
            return evDate && evDate > tomorrow;
        })
        .sort((a, b) => {
            const dateA = parseDateLocal(a.date);
            const dateB = parseDateLocal(b.date);
            return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
        })
        .map(e => ({
            id: e.id,
            title: e.title,
            date: formatShortDateLocal(e.date),
            image: e.image || DEFAULT_EVENT_IMAGE,
            description: e.description,
            isRealEvent: true
        }));

    // Select the cards to show in the carousel
    // If in media mode, we prioritize album images, but ONLY if we have them.
    // If albumImages is empty (still fetching or failed), we fallback to events so the user doesn't see a grey box.
    const allEvents = (carouselMode === 'media' && albumImages.length > 0)
        ? albumImages.map((img, i) => ({
            id: `media-${i}`,
            title: tr('Media Outreach', 'Alcance en medios'),
            date: tr('Community Highlight', 'Destacado comunitario'),
            image: img,
            description: tr('Aaria\'s Blue Elephant Impact', 'El impacto de Aaria\'s Blue Elephant'),
            isRealEvent: false
        }))
        : [...upcomingEvents, ...pastEvents];

    const a = (cls: string) => shouldAnimate ? cls : '';

    const [isHydrated, setIsHydrated] = useState(false);
    const [lastGame, setLastGame] = useState<LastGame | null>(null);

    // Read the "last game played" stamp (written by each game on mount) so
    // we can offer a one-tap "keep playing" button on first paint.
    useEffect(() => {
        try {
            const raw = localStorage.getItem('abe_last_game');
            if (raw) setLastGame(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    // "Surprise me" — picks a random static game and appends ?sampler=1 so
    // it can show a lightweight taste of the game to a first-time visitor.
    const goToRandomGame = () => {
        const game = pickRandomGame();
        const dest = game.sampler ? `${game.url}?sampler=1` : game.url;
        window.location.href = dest;
    };

    useEffect(() => {
        setIsHydrated(true);

        // Mark as loaded so subsequent internal navigation skips animations
        isAppInitialLoad = false;

        // Preload images for the card stack
        const imagesToPreload = allEvents.map(e => e.image);
        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });

        return () => { };
    }, []);

    return (
        <div className="flex flex-col min-h-screen pt-0 bg-slate-50 dark:bg-slate-950 font-sans transition-colors">

            {/* Combined Hero & Track Record Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 lg:py-12 transition-colors">
                <div className="max-w-[1600px] px-4 sm:px-6 lg:px-12 xl:pl-24 xl:pr-12">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-24">

                        {/* Left Side: Play Without Barriers (Hero Text) */}
                        <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-center text-center lg:text-left shrink-0">
                            {/* Social Media Links (Media Tag) */}
                            <div className={a("anim-bounce-left anim-delay-100")}>
                                <div className="mb-4 flex justify-center lg:justify-start">
                                    <SocialLinks />
                                </div>
                            </div>

                            {/* Heading with Infinity Band and Logo */}
                            <div className={`relative mb-6 mt-4 inline-flex items-center justify-center lg:justify-start w-full lg:w-auto ${a("anim-bounce-left anim-delay-200")}`}>
                                {/* Branding section */}
                                <div className="relative z-10 flex flex-row items-center justify-center lg:justify-start gap-6">
                                    <div className={`h-12 w-12 sm:h-16 sm:w-16 lg:h-28 lg:w-28 rounded-[2rem] bg-white p-3 sm:p-4 flex items-center justify-center shadow-xl border border-slate-200 dark:border-none shrink-0 group transition-transform hover:rotate-3 ${a("anim-rubber-pop anim-delay-300")}`}>
                                        <Logo id="hero-logo-static" src="./hero-logo.jpg" className="h-full w-full" alt={tr("Aaria's Blue Elephant Logo", "Logo de Aaria's Blue Elephant")} />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <h1 className={`text-lg xs:text-xl sm:text-[30px] lg:text-[38px] xl:text-[48px] font-black text-sky-600 dark:text-sky-400 leading-[1.1] tracking-tight whitespace-nowrap overflow-visible drop-shadow-sm ${a("anim-bounce-right anim-delay-400")}`}>
                                            Aaria's Blue Elephant
                                        </h1>
                                        <h2 className={`text-xl sm:text-2xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight text-left ${a("anim-bounce-left anim-delay-500")}`}>
                                            {tr('Building a New Inclusive World', 'Construyendo un Nuevo Mundo Inclusivo')}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Subtitle */}
                            <p className={`text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium ${a("anim-wobble-in anim-delay-600")}`}>
                                {tr('A safe haven where neurodivergent and neurotypical children grow together. We believe in early intervention, inclusive play, and building a compassionate community.', 'Un refugio seguro donde niños neurodivergentes y neurotípicos crecen juntos. Creemos en la intervención temprana, el juego inclusivo y la construcción de una comunidad compasiva.')}
                            </p>

                            {/* CTA Buttons */}
                            <div className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 w-full ${a("anim-bounce-up anim-delay-700")}`}>
                                <Link to="/events" className="w-full sm:flex-1">
                                    <button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-full transition-transform flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 hover:-translate-y-1 active:scale-95 text-base sm:text-lg whitespace-nowrap uppercase tracking-widest">
                                        {tr('Join Now', 'Únete Ahora')} <Users className="h-5 w-5" />
                                    </button>
                                </Link>
                                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="w-full sm:flex-1">
                                    <button className="w-full bg-white dark:bg-slate-800 border-2 border-sky-600 dark:border-slate-700 text-sky-600 dark:text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700 hover:-translate-y-1 active:scale-95 text-base sm:text-lg whitespace-nowrap uppercase tracking-widest">
                                        {tr('Donate', 'Donar')} <HeartPulse className="h-5 w-5 text-sky-600" />
                                    </button>
                                </a>
                            </div>

                            {/* Social Proof */}
                            <div className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 ${a("anim-bounce-right anim-delay-800")}`}>
                                <div className="flex -space-x-4">
                                    <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt={tr('Supporter', 'Colaborador')} />
                                    <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt={tr('Supporter', 'Colaborador')} />
                                    <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt={tr('Supporter', 'Colaborador')} />
                                    <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-xs font-bold text-sky-700 dark:text-sky-300 shadow-sm">
                                        +50
                                    </div>
                                </div>
                                <div className="text-center sm:text-left">
                                    <div className="flex items-center text-amber-500 text-sm justify-center sm:justify-start gap-0.5 mb-1">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tr('Built by and for our community.', 'Creado por y para nuestra comunidad.')}</p>
                                </div>
                            </div>

                            <div className={`mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 w-full lg:w-fit text-center lg:text-left ${a("anim-bounce-left anim-delay-900")}`}>
                                <div className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                                    <span className="text-sky-600 dark:text-sky-400 font-black text-lg">12+</span> {tr('events hosted', 'eventos realizados')} <span className="mx-2 text-slate-300 dark:text-slate-600">&bull;</span> <span className="text-sky-600 dark:text-sky-400 font-black text-lg">45+</span> {tr('children embraced in 2025–2026', 'niños acompañados en 2025–2026')}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Our Track Record */}
                        <div className={`w-full lg:w-[52%] xl:w-[55%] relative mt-12 lg:mt-0 px-2 sm:px-0 lg:pl-4 flex justify-center lg:justify-end ${a("anim-spring-right anim-delay-500")}`}>
                            {/* Decorative background shape - tighter rotation */}
                            <div className="absolute inset-0 bg-sky-600/10 dark:bg-sky-900/40 rounded-3xl transform rotate-1 -z-10 transition-transform"></div>
                            <div className="absolute inset-0 bg-sky-100 dark:bg-sky-900/20 rounded-3xl transform -rotate-1 -z-10 transition-transform"></div>

                            {/* Track Record Label top right */}
                            <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-4 bg-white dark:bg-slate-800 shadow-lg px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 z-20 transition-transform hover:-rotate-3">
                                <div className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <StickerIcon icon={Sparkles} size={14} color="#f59e0b" bgColor="bg-transparent shadow-none border-none p-0" />
                                    {tr('Our Track Record', 'Nuestra Trayectoria')}
                                </div>
                            </div>

                            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] sm:aspect-[16/10] lg:aspect-[1.2] xl:aspect-[1.1] group border-4 border-white/90 dark:border-slate-800/90 sticker-shadow hover:sticker-shadow-purple transition-all duration-500 bg-slate-100 dark:bg-slate-900 w-full lg:max-w-[500px] xl:max-w-[650px]">
                                <CardStack 
                                    isSkeleton={isLoading && dbEvents.length === 0}
                                    onCardClick={(card) => {
                                        if (carouselMode === 'media') {
                                            const idx = albumImages.findIndex(img => img === card.src);
                                            if (idx !== -1) {
                                                setLightboxIndex(idx);
                                                setLightboxOpen(true);
                                            }
                                        }
                                    }}
                                    initialCards={
                                        allEvents.map((evt) => ({
                                            id: evt.id,
                                            src: evt.image || DEFAULT_EVENT_IMAGE,
                                            alt: evt.title || tr('Event', 'Evento'),
                                            title: evt.title,
                                            description: `${(evt as any).isRealEvent ? tr('Upcoming: ', 'Próximo: ') : ''}${formatShortDateLocal(evt.date)}`,
                                            isRealEvent: (evt as any).isRealEvent,
                                            dbCoords: (evt as any).isRealEvent ? {
                                                id: String(evt.id),
                                                table: 'events',
                                                column: 'image'
                                            } : undefined
                                        }))
                                    } 
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Free Events Guarantee Banner */}
            <section className="bg-slate-50 dark:bg-slate-950 py-8 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
                    {/* Decorative background icons for the section */}
                    <div className="absolute -top-10 -left-6 opacity-20 sm:opacity-100 z-0">
                        <motion.div
                            animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                            <StickerIcon icon={Cloud} size={56} color="#00AEEF" bgColor="bg-sky-50" />
                        </motion.div>
                    </div>
                    <div className="absolute -bottom-10 -right-6 opacity-20 sm:opacity-100 z-0">
                        <motion.div
                            animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                        >
                            <StickerIcon icon={Star} size={48} color="#f59e0b" bgColor="bg-amber-50" />
                        </motion.div>
                    </div>

                    <div className={`bg-white dark:bg-slate-800 border-[3px] border-dashed border-sky-100 dark:border-slate-700 p-8 sm:p-12 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group sticker-shadow relative overflow-hidden ${a("anim-bounce-up anim-delay-300")}`}>
                        {/* Inner decorative floating icons */}
                        <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <motion.div
                                animate={{ y: [0, -8, 0], rotate: [12, 20, 12] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                                <StickerIcon icon={Gift} size={24} color="#ec4899" bgColor="bg-pink-50" />
                            </motion.div>
                        </div>
                        <div className="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <motion.div
                                animate={{ y: [0, 8, 0], rotate: [-12, -20, -12] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                            >
                                <StickerIcon icon={Smile} size={24} color="#10b981" bgColor="bg-emerald-50" />
                            </motion.div>
                        </div>

                        <div className={`mb-8 ${a("anim-rubber-pop anim-delay-500")}`}>
                            <StickerIcon icon={HeartHandshake} size={40} color="#00AEEF" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wide group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors duration-300 flex items-center justify-center gap-3 flex-wrap">
                            <StickerIcon icon={Music} size={20} color="#8b5cf6" bgColor="bg-purple-50" className="hidden sm:flex" />
                            {tr('100% Free. Fully Inclusive. All Are Welcome.', '100% Gratis. Totalmente Inclusivo. Todos Son Bienvenidos.')}
                            <StickerIcon icon={Palette} size={20} color="#f43f5e" bgColor="bg-rose-50" className="hidden sm:flex" />
                        </div>
                        <div className="w-24 h-1.5 bg-sky-100 dark:bg-sky-900 mb-8 rounded-full group-hover:bg-sky-500 transition-colors duration-300"></div>
                        <div className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl leading-relaxed font-medium max-w-4xl relative">
                            <span className="absolute -left-6 -top-2 opacity-40"><Sparkles className="h-4 w-4 text-amber-400" /></span>
                            {tr('We believe financial constraints should never be a barrier to joy, growth, and connection. While thoughtfully designed for children with special needs, we foster a truly inclusive environment where siblings, friends, and children of all abilities play and learn side-by-side. For over two years, our events and materials have been provided completely free of charge. Donations support our mission, but are never required.', 'Creemos que las limitaciones económicas nunca deben ser un obstáculo para la alegría, el crecimiento y la conexión. Aunque está pensado especialmente para niños con necesidades especiales, fomentamos un ambiente verdaderamente inclusivo donde hermanos, amigos y niños de todas las capacidades juegan y aprenden lado a lado. Desde hace más de dos años, nuestros eventos y materiales se ofrecen completamente gratis. Las donaciones apoyan nuestra misión, pero nunca son obligatorias.')}
                            <span className="absolute -right-6 -bottom-2 opacity-40"><Sparkles className="h-4 w-4 text-amber-400" /></span>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Voices of our Community - Testimonials */}
            <TestimonialSection />

            {/* Intro Text */}
            <section className="py-16 bg-white dark:bg-slate-900 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                    <h3 className={`text-3xl font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4 ${a("anim-drop-bounce anim-delay-100")}`}>{tr('Our Focus Areas', 'Nuestras Áreas de Enfoque')}</h3>
                    <div className="h-1 w-16 bg-sky-600 mb-8"></div>
                    <div className="max-w-4xl text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                        {tr('Our commitment to compassion, inclusivity, and community drives us to make a positive impact on the lives of those we serve. Creating safe, non-judgmental spaces where every child is celebrated for exactly who they are.', 'Nuestro compromiso con la compasión, la inclusión y la comunidad nos impulsa a generar un impacto positivo en la vida de quienes servimos. Creamos espacios seguros y libres de juicio donde cada niño es celebrado exactamente por quien es.')}
                    </div>
                </div>
            </section>

            {/* Mission Highlights Grid */}
            <section className="pb-20 bg-white dark:bg-slate-900 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        <div className={`bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group hover:-translate-y-2 ${a("anim-bounce-left anim-delay-200")}`}>
                            <div className={`mb-6 ${a("anim-rubber-pop anim-delay-400")}`}>
                                <Users className="h-8 w-8 text-sky-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">{tr('Inclusive Community', 'Comunidad Inclusiva')}</h4>
                            <div className="w-12 h-1 bg-sky-100 dark:bg-sky-900 mb-4 rounded-full group-hover:bg-sky-500 transition-colors"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{tr('Bridging the gap between neurodivergent and neurotypical peers through shared experiences and understanding.', 'Cerrando la brecha entre pares neurodivergentes y neurotípicos a través de experiencias compartidas y comprensión mutua.')}</p>
                        </div>

                        <div className={`bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group hover:-translate-y-2 ${a("anim-bounce-right anim-delay-400")}`}>
                            <div className={`mb-6 ${a("anim-rubber-pop anim-delay-600")}`}>
                                <HeartPulse className="h-8 w-8 text-sky-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">{tr('Early Intervention', 'Intervención Temprana')}</h4>
                            <div className="w-12 h-1 bg-sky-100 dark:bg-sky-900 mb-4 rounded-full group-hover:bg-sky-500 transition-colors"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{tr('Raising awareness about the critical importance of early therapy and developmental support for holistic growth.', 'Creando conciencia sobre la importancia crítica de la terapia temprana y el apoyo al desarrollo para un crecimiento integral.')}</p>
                        </div>

                        <div className={`bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group hover:-translate-y-2 ${a("anim-bounce-left anim-delay-600")}`}>
                            <div className={`mb-6 ${a("anim-rubber-pop anim-delay-800")}`}>
                                <HeartHandshake className="h-8 w-8 text-sky-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">{tr('Compassionate Care', 'Cuidado Compasivo')}</h4>
                            <div className="w-12 h-1 bg-sky-100 dark:bg-sky-900 mb-4 rounded-full group-hover:bg-sky-500 transition-colors"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{tr('Creating safe, non-judgmental spaces where every child is celebrated for exactly who they are.', 'Creamos espacios seguros y libres de juicio donde cada niño es celebrado exactamente por quien es.')}</p>
                        </div>

                        <div className={`bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group hover:-translate-y-2 ${a("anim-bounce-right anim-delay-800")}`}>
                            <div className={`mb-6 ${a("anim-rubber-pop anim-delay-1000")}`}>
                                <Sparkles className="h-8 w-8 text-sky-500" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">{tr('Therapy Play', 'Juego Terapéutico')}</h4>
                            <div className="w-12 h-1 bg-sky-100 dark:bg-sky-900 mb-4 rounded-full group-hover:bg-sky-500 transition-colors"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{tr('Utilizing structured, evidence-based play sessions to build critical life and social skills in an engaging environment.', 'Utilizamos sesiones de juego estructuradas y basadas en evidencia para desarrollar habilidades sociales y de vida esenciales en un ambiente atractivo.')}</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Play — free, kid-facing games built for Aaria & friends.
                Kept simple/warm rather than matching the marketing sections above,
                since this card is for kids and parents to click through and play.
                Smart: offers to resume the last game played, or picks a random
                one for first-time visitors. */}
            <section className="pb-20 bg-white dark:bg-slate-900 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <div
                        className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-sky-100 dark:border-sky-900 p-10 text-center shadow-sm transition-all sm:flex-row sm:text-left"
                        style={{ background: 'linear-gradient(120deg,#eaf6ff,#fef6e4)' }}
                    >
                        <div className="text-6xl transition-transform group-hover:scale-110">
                            {lastGame ? lastGame.emoji : '🎲'}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-sky-700">
                                {lastGame ? `${tr('Keep playing', 'Sigue jugando')} ${lastGame.name}` : tr('Play — surprise me!', '¡Juega — sorpréndeme!')}
                            </h3>
                            <p className="mt-1 text-slate-600 dark:text-slate-500">
                                {lastGame
                                    ? `${tr('Jump back into', 'Vuelve a')} ${lastGame.name} ${tr('right where you left off.', 'justo donde lo dejaste.')}`
                                    : tr('Free, no-fail games built for Aaria and her friends — pick a game at random and see what you get. No login needed.', 'Juegos gratuitos y sin fallos hechos para Aaria y sus amigos — elige un juego al azar y descubre qué te toca. No necesitas iniciar sesión.')}
                            </p>
                        </div>
                        <div className="flex flex-none flex-col items-center gap-3 sm:items-end">
                            {lastGame ? (
                                lastGame.url === '/nelus-world' ? (
                                    <Link
                                        to="/nelus-world"
                                        className="rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-sky-400"
                                    >
                                        ▶️ {tr('Keep playing', 'Sigue jugando')} {lastGame.name} {lastGame.emoji}
                                    </Link>
                                ) : (
                                    <a
                                        href={lastGame.url}
                                        className="rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-sky-400"
                                    >
                                        ▶️ {tr('Keep playing', 'Sigue jugando')} {lastGame.name} {lastGame.emoji}
                                    </a>
                                )
                            ) : (
                                <button
                                    type="button"
                                    onClick={goToRandomGame}
                                    className="rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-sky-400"
                                >
                                    ▶️ {tr('Play — surprise me!', '¡Juega — sorpréndeme!')}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={goToRandomGame}
                                className="rounded-full bg-white/80 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800 px-5 py-2 text-sm font-bold text-sky-600 dark:text-sky-300 shadow transition hover:bg-white"
                            >
                                🎲 {tr('Surprise me!', '¡Sorpréndeme!')}
                            </button>
                        </div>
                    </div>

                    <Link
                        to="/nelus-world"
                        className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl border border-sky-100 dark:border-sky-900 p-10 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl sm:flex-row sm:text-left"
                        style={{ background: 'linear-gradient(120deg,#eaf6ff,#fef6e4)' }}
                    >
                        <div className="text-6xl transition-transform group-hover:scale-110">🐘🌈</div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-sky-700">{tr("Play Aaria's Floating Islands 🐘🌈", "Juega Islas Flotantes de Aaria 🐘🌈")}</h3>
                            <p className="mt-1 text-slate-600 dark:text-slate-500">
                                {tr('A free, no-fail 3D adventure built for Aaria and her friends — explore sky islands, meet gentle friends, and help Nilu grow. No login needed.', 'Una aventura 3D gratuita y sin fallos hecha para Aaria y sus amigos — explora islas en el cielo, conoce amigos gentiles y ayuda a Nilu a crecer. No necesitas iniciar sesión.')}
                            </p>
                        </div>
                        <span className="flex-none rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white shadow-lg transition group-hover:bg-sky-400">
                            {tr('Play now ▶', 'Jugar ahora ▶')}
                        </span>
                    </Link>
                </div>
            </section>

            {/* Join Herd QR Code */}
            <section id="join-herd" className="relative py-24 bg-sky-900 border-t-8 border-sky-500 overflow-hidden">
                <div className="absolute inset-0 bg-black/40 mix-blend-multiply z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 z-0"></div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 xl:pl-24">
                    <div className="bg-white/10 backdrop-blur-md p-10 rounded-xl border border-white/20 shadow-2xl max-w-4xl lg:ml-0 lg:text-left text-center">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 uppercase tracking-wider">{tr('Ready to Join Our Herd?', '¿Listo para Unirte a Nuestra Manada?')}</h2>
                        <p className="text-sky-50 mb-10 text-lg max-w-2xl mx-auto lg:mx-0">
                        {tr("Whether you're looking for support, want to volunteer, or can help us grow with a donation, there's a place for you at", 'Ya sea que busques apoyo, quieras ser voluntario o puedas ayudarnos a crecer con una donación, hay un lugar para ti en')} <strong>Aaria's Blue Elephant</strong>. {tr('To support your records, your donations are', 'Para tus registros, tus donaciones son')} <strong>{tr('100% tax-deductible', '100% deducibles de impuestos')}</strong>; {tr('we ensure financial transparency by issuing official tax receipts and progress statements on a quarterly basis.', 'garantizamos transparencia financiera emitiendo recibos fiscales oficiales e informes de progreso de manera trimestral.')}
                    </p>

                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-6">
                            <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                <button id="donate-button" className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 px-10 rounded uppercase tracking-widest text-sm shadow-xl transition-transform hover:-translate-y-1 w-full flex items-center justify-center gap-2">
                                    {tr('Donate', 'Donar')} <HeartPulse className="h-4 w-4" />
                                </button>
                            </a>
                            <Link to="/signup" className="w-full sm:w-auto">
                                <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-sky-900 font-bold py-4 px-10 rounded uppercase tracking-widest text-sm transition-colors w-full">
                                    {tr('Get Started', 'Comenzar')}
                                </button>
                            </Link>
                        </div>

                        {/* Trust Elements & QR */}
                        <div className="mt-12 flex flex-col md:flex-row items-center justify-center lg:justify-start gap-8 lg:gap-16">
                            {/* Candid Seal */}
                            <a aria-label={tr('Candid Profile', 'Perfil de Candid')} href="https://app.candid.org/profile/16447686/aarias-blue-elephant-39-4799956/?pkId=b8a47feb-927d-4adc-9e4e-794677415e6c" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 bg-white/10 backdrop-blur rounded-2xl p-4 shadow-lg border border-white/20">
                                <img alt={tr('Candid Platinum Seal', 'Sello Platino de Candid')} src="https://widgets.guidestar.org/prod/v1/pdp/transparency-seal/16447686/svg" className="h-20 sm:h-24 w-auto drop-shadow-lg" />
                            </a>

                            {/* Join Herd QR Code */}
                            <div className="flex flex-col items-center">
                                <div className="h-[250px] w-[250px] rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-all duration-300 ring-4 ring-white/10 overflow-hidden relative">
                                    <DonationQR />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Media Lightbox */}
            <MediaLightbox 
                isOpen={lightboxOpen} 
                onClose={() => setLightboxOpen(false)} 
                images={albumImages} 
                currentIndex={lightboxIndex}
                onNext={() => setLightboxIndex((prev) => (prev + 1) % albumImages.length)}
                onPrev={() => setLightboxIndex((prev) => (prev - 1 + albumImages.length) % albumImages.length)}
            />
        </div>
    );
};

export default Home;
