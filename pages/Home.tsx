import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Quote, HeartPulse, Sparkles, HeartHandshake, Users, Calendar, ArrowRight, ChevronLeft, ChevronRight, X, Heart, BookOpen, Youtube, Image as ImageIcon, Instagram, Facebook } from 'lucide-react';
import Button from '../components/Button';
import Logo from '../components/Logo';
import { useData } from '../context/DataContext';
import SocialLinks from '../components/SocialLinks';
import { Testimonial } from '../types';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';
import DonationQR from '../components/DonationQR';
import RichText, { extractMedia } from '../components/RichText';

// Move static data outside to allow random initialization
const pastEvents = [
    {
        id: 4,
        title: 'Advocacy efforts',
        date: 'Ongoing Initiative',
        image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800&h=500',
        description: 'Advocacy efforts to partner with cities and organizations on large-scale inclusion.'
    },
    {
        id: 1,
        title: 'Weekly Play Group',
        date: 'Weekly Initiative',
        image: 'https://images.unsplash.com/photo-1540479859555-17af45c78602?auto=format&fit=crop&q=80&w=800&h=500',
        description: 'A sensory-friendly environment where neurodivergent and neurotypical kids learn to play and communicate together.'
    },
    {
        id: 2,
        title: 'Monthly Art and Craft Meetup',
        date: 'Monthly Session',
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800&h=500',
        description: 'Creative expression sessions designed to build fine motor skills and encourage imagination through collaborative art projects.'
    },
    {
        id: 3,
        title: 'Outreach Workshop',
        date: 'Community Centers',
        image: '/outreach_workshop_photo.png',
        description: 'Educational programs for parents and educators on early intervention strategies and building inclusive spaces.'
    }
];

const Home: React.FC = () => {
    const { testimonials } = useData();
    const approvedTestimonials = testimonials.filter(t => t.status === 'Approved');

    // Randomize initial event on load
    const [currentEventIndex, setCurrentEventIndex] = useState(() => Math.floor(Math.random() * pastEvents.length));
    const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
    const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedTestimonial) {
                setSelectedTestimonial(null);
            }
        };

        if (selectedTestimonial) {
            document.addEventListener('keydown', handleKeyDown);
            // Accessibility focus shift
            setTimeout(() => {
                modalRef.current?.focus();
            }, 100);

            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [selectedTestimonial]);

    // Smart Truncation Function
    const getTruncatedContent = (text: string, maxLimit = 120) => {
        if (text.length <= maxLimit) return { isTruncated: false, text };

        let truncated = text.slice(0, maxLimit);
        const lastPunct = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));

        if (lastPunct > 50) {
            truncated = truncated.slice(0, lastPunct + 1);
        } else {
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > 50) {
                truncated = truncated.slice(0, lastSpace);
            }
        }
        return { isTruncated: true, text: truncated };
    };



    const nextEvent = () => {
        setCurrentEventIndex((prevIndex) => (prevIndex + 1) % pastEvents.length);
    };

    const prevEvent = () => {
        setCurrentEventIndex((prevIndex) => (prevIndex - 1 + pastEvents.length) % pastEvents.length);
    };

    const nextTestimonialPage = () => {
        setCurrentTestimonialIndex((prevIndex) =>
            (prevIndex + 3 >= approvedTestimonials.length) ? 0 : prevIndex + 3
        );
    };

    const prevTestimonialPage = () => {
        setCurrentTestimonialIndex((prevIndex) =>
            (prevIndex - 3 < 0) ? Math.max(0, approvedTestimonials.length - 3) : prevIndex - 3
        );
    };

    return (
        <div className="flex flex-col min-h-screen pt-0 bg-slate-50 dark:bg-slate-950 font-sans transition-colors">

            {/* Combined Hero & Track Record Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 lg:py-12 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                        {/* Left Side: Play Without Barriers (Hero Text) */}
                        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
                            {/* Social Media Links (Media Tag) */}
                            <div className="mb-4 flex justify-center lg:justify-start">
                                <SocialLinks />
                            </div>

                            {/* Heading with Infinity Band and Logo */}
                            <div className="relative mb-6 mt-4 inline-flex items-center justify-center lg:justify-start w-full lg:w-auto">
                                {/* Branding section */}
                                <div className="relative z-10 flex flex-row items-center justify-center lg:justify-start gap-4">
                                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white p-1.5 shadow-md border border-slate-100 dark:border-slate-800 shrink-0">
                                        <Logo src="./hero-logo.jpg" className="h-full w-full" alt="Aaria's Blue Elephant Logo" />
                                    </div>
                                    <div className="flex flex-col items-start min-w-0">
                                        <h1 className="text-[22px] xs:text-2xl sm:text-4xl lg:text-[52px] font-black text-sky-600 dark:text-sky-400 leading-[1.1] tracking-tight whitespace-nowrap overflow-visible">
                                            Aaria's Blue Elephant
                                        </h1>
                                        <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight text-left">
                                            Building a New Inclusive World
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Subtitle */}
                            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                A safe haven where neurodivergent and neurotypical children grow together.
                                We believe in early intervention, inclusive play, and building a compassionate community.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 w-full">
                                <Link to="/events" className="w-full sm:flex-1">
                                    <button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-full transition-transform flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5 text-base sm:text-lg whitespace-nowrap">
                                        Join Now <Users className="h-5 w-5 shrink-0" />
                                    </button>
                                </Link>
                                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="w-full sm:flex-1">
                                    <button className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 text-sky-700 dark:text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 text-base sm:text-lg whitespace-nowrap">
                                        Donate <HeartPulse className="h-5 w-5 shrink-0" />
                                    </button>
                                </a>
                                <Link to="/about" className="w-full sm:flex-1">
                                    <button className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 text-sky-700 dark:text-white font-bold py-3.5 sm:py-4 px-4 sm:px-6 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-sky-500/20 text-base sm:text-lg whitespace-nowrap">
                                        Our Story <BookOpen className="h-5 w-5 shrink-0" />
                                    </button>
                                </Link>
                            </div>

                            {/* Social Proof */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <div className="flex -space-x-4">
                                    <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64" alt="Supporter" />
                                    <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64" alt="Supporter" />
                                    <img className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 object-cover shadow-sm" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64" alt="Supporter" />
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
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Built by and for our community.</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 w-full sm:w-auto text-center lg:text-left">
                                <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 tracking-wide">
                                    <span className="text-sky-600 dark:text-sky-400 font-black text-lg">12+</span> playgroups hosted <span className="mx-2 text-slate-300 dark:text-slate-600">&bull;</span> <span className="text-sky-600 dark:text-sky-400 font-black text-lg">45+</span> children embraced in 2025–2026
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Our Track Record */}
                        <div className="w-full lg:w-1/2 relative mt-10 lg:mt-0 px-2 sm:px-0">
                            {/* Decorative background shape */}
                            <div className="absolute inset-0 bg-sky-600/10 dark:bg-sky-900/40 rounded-3xl transform rotate-2 scale-[1.02] -z-10 transition-transform"></div>
                            <div className="absolute inset-0 bg-sky-100 dark:bg-sky-900/20 rounded-3xl transform -rotate-2 scale-[1.02] -z-10 transition-transform"></div>

                            {/* Track Record Label top right */}
                            <div className="absolute -top-4 -right-2 sm:-top-5 sm:-right-4 bg-white dark:bg-slate-800 shadow-lg px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 z-20">
                                <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Our Track Record
                                </p>
                            </div>

                            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] sm:aspect-[16/10] lg:aspect-square xl:aspect-[4/3] group border-[6px] border-white/50 dark:border-slate-800/50">
                                <img
                                    src={pastEvents[currentEventIndex]?.image || DEFAULT_EVENT_IMAGE}
                                    alt={pastEvents[currentEventIndex]?.title || 'Event'}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (target.src === DEFAULT_EVENT_IMAGE) {
                                            target.src = DEFAULT_LOCAL_FALLBACK;
                                        } else {
                                            target.src = DEFAULT_EVENT_IMAGE;
                                        }
                                    }}
                                />

                                {/* Floating Track Record Badge matching template */}
                                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-sky-600 flex items-center justify-center shrink-0 relative">
                                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                            {/* Online/Active indicator dot */}
                                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900"></span>
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                                                {pastEvents[currentEventIndex].title}
                                            </p>
                                            <p className="text-[10px] sm:text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mt-0.5 truncate">
                                                {pastEvents[currentEventIndex].date}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation buttons on the sides */}
                                <button onClick={prevEvent} aria-label="Previous event" className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition-all focus:outline-none z-20 flex items-center justify-center hover:scale-110 opacity-80 hover:opacity-100">
                                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                                <button onClick={nextEvent} aria-label="Next event" className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition-all focus:outline-none z-20 flex items-center justify-center hover:scale-110 opacity-80 hover:opacity-100">
                                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Free Events Guarantee Banner */}
            <section className="bg-slate-50 dark:bg-slate-950 py-8 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 sm:p-12 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group">
                        <div className="h-20 w-20 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-8 group-hover:bg-sky-600 transition-colors duration-300 shadow-sm border border-sky-200 dark:border-sky-800">
                            <HeartHandshake className="h-10 w-10 text-sky-600 dark:text-sky-400 group-hover:text-white transition-colors duration-300" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-wide group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors duration-300">
                            100% Free. Fully Inclusive. All Are Welcome.
                        </h2>
                        <div className="w-24 h-1 bg-sky-200 dark:bg-sky-800 mb-8 rounded-full group-hover:bg-sky-500 transition-colors duration-300"></div>
                        <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl leading-relaxed font-medium max-w-4xl">
                            We believe financial constraints should never be a barrier to joy, growth, and connection. While thoughtfully designed for children with special needs, we foster a truly inclusive environment where siblings, friends, and children of all abilities play and learn side-by-side. For over two years, our events and materials have been provided completely free of charge. Donations support our mission, but are never required.
                        </p>
                    </div>
                </div>
            </section>

            {/* Intro Text */}
            <section className="py-16 bg-white dark:bg-slate-900 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                    <h3 className="text-3xl font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4">Our Focus Areas</h3>
                    <div className="h-1 w-16 bg-sky-600 mb-8"></div>
                    <p className="max-w-4xl text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                        Our commitment to compassion, inclusivity, and community drives us to make a positive impact on the lives of those we serve.
                        Creating safe, non-judgmental spaces where every child is celebrated for exactly who they are.
                    </p>
                </div>
            </section>

            {/* Mission Highlights Grid */}
            <section className="pb-20 bg-white dark:bg-slate-900 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-sm shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                            <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-6 group-hover:bg-sky-600 transition-colors duration-300">
                                <Users className="h-8 w-8 text-sky-600 dark:text-sky-400 group-hover:text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">Inclusive Community</h4>
                            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-600 mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Bridging the gap between neurodivergent and neurotypical peers through shared experiences and understanding.</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-sm shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                            <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-6 group-hover:bg-sky-600 transition-colors duration-300">
                                <HeartPulse className="h-8 w-8 text-sky-600 dark:text-sky-400 group-hover:text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">Early Intervention</h4>
                            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-600 mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Raising awareness about the critical importance of early therapy and developmental support for holistic growth.</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-sm shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                            <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-6 group-hover:bg-sky-600 transition-colors duration-300">
                                <HeartHandshake className="h-8 w-8 text-sky-600 dark:text-sky-400 group-hover:text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">Compassionate Care</h4>
                            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-600 mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Creating safe, non-judgmental spaces where every child is celebrated for exactly who they are.</p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-sm shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                            <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-6 group-hover:bg-sky-600 transition-colors duration-300">
                                <Sparkles className="h-8 w-8 text-sky-600 dark:text-sky-400 group-hover:text-white" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 uppercase">Therapy Play</h4>
                            <div className="w-12 h-0.5 bg-slate-200 dark:bg-slate-600 mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Utilizing structured, evidence-based play sessions to build critical life and social skills in an engaging environment.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Voices of our Community */}
            <section className="py-20 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 flex flex-col items-center">
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white uppercase tracking-wide mb-4">Voices of our Community</h3>
                        <div className="h-1 w-16 bg-sky-600 mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-400">Hear from the families and supporters who make us who we are.</p>
                    </div>

                    {approvedTestimonials.length > 0 ? (
                        <div className="relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {approvedTestimonials.slice(currentTestimonialIndex, currentTestimonialIndex + 3).map((item) => {
                                    const { isTruncated, text } = getTruncatedContent(item.content);

                                    return (
                                        <div key={item.id} className="bg-white dark:bg-slate-800 border-t-4 border-sky-500 shadow-sm p-8 relative flex flex-col justify-between transition-colors animate-in fade-in duration-500 group cursor-pointer hover:shadow-md" onClick={() => setSelectedTestimonial(item)}>
                                            <div>
                                                <Quote className="h-8 w-8 text-sky-200 dark:text-sky-900 mb-4" />

                                                {/* Media Preview Thumbnail */}
                                                {(() => {
                                                    const media = extractMedia(item.content);
                                                    if (!media) return null;

                                                    const getPlatformDetails = () => {
                                                        switch (media.type) {
                                                            case 'youtube': return { icon: <Youtube className="h-6 w-6" />, color: 'bg-red-600', label: 'YouTube' };
                                                            case 'instagram': return { icon: <Instagram className="h-6 w-6" />, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', label: 'Instagram' };
                                                            case 'tiktok': return { icon: <img src="https://www.tiktok.com/favicon.ico" className="h-6 w-6 invert" alt="TikTok" />, color: 'bg-black', label: 'TikTok' };
                                                            case 'facebook': return { icon: <Facebook className="h-6 w-6" />, color: 'bg-blue-600', label: 'Facebook' };
                                                            case 'google-photos': return { icon: <ImageIcon className="h-6 w-6" />, color: 'bg-sky-500', label: 'Photo Album' };
                                                            default: return { icon: <ImageIcon className="h-6 w-6" />, color: 'bg-slate-500', label: 'Media' };
                                                        }
                                                    };

                                                    const details = getPlatformDetails();

                                                    return (
                                                        <div className="relative mb-6 rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner group-hover:border-sky-500/50 transition-colors">
                                                            {media.thumbnail ? (
                                                                <img
                                                                    src={media.thumbnail}
                                                                    alt={`Media from ${item.author}`}
                                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                                                />
                                                            ) : (
                                                                <div className={`w-full h-full flex flex-col items-center justify-center ${details.color} opacity-40 group-hover:opacity-60 transition-opacity`}>
                                                                    {media.type === 'google-photos' ? (
                                                                        <div className="relative w-16 h-12 mb-2">
                                                                            <div className="absolute top-1 left-2 w-full h-full bg-white/20 rounded shadow-sm rotate-3"></div>
                                                                            <div className="absolute top-2 left-1 w-full h-full bg-white/30 rounded shadow-sm -rotate-2"></div>
                                                                            <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded flex items-center justify-center text-white border border-white/20">
                                                                                {details.icon}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-2">
                                                                            {details.icon}
                                                                        </div>
                                                                    )}
                                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{details.label}</span>
                                                                </div>
                                                            )}

                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                <div className={`h-12 w-12 rounded-full ${details.color} text-white flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform`}>
                                                                    {details.icon}
                                                                </div>
                                                            </div>

                                                            {media.type === 'image' && (
                                                                <div className="absolute top-2 right-2">
                                                                    <div className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-white shadow-sm">
                                                                        <ImageIcon className="h-4 w-4" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                <div className="text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed text-sm text-balance">
                                                    <RichText content={text} className="inline italic" />
                                                    {isTruncated && (
                                                        <span
                                                            className="ml-2 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 inline-flex items-center group/more"
                                                        >
                                                            ... Read More
                                                            <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover/more:opacity-100 group-hover/more:translate-x-0 transition-all" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
                                                <div className="h-12 w-12 rounded-full bg-sky-100 overflow-hidden shadow-sm flex-shrink-0">
                                                    {item.avatar ? (
                                                        <img src={item.avatar} alt={item.author} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-sky-700 font-bold bg-sky-100 dark:bg-sky-900/50 dark:text-sky-300">
                                                            {item.author.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-slate-800 dark:text-white font-bold">{item.author}</p>
                                                    <p className="text-sky-600 dark:text-sky-400 text-xs font-semibold uppercase tracking-wider">{item.title || item.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {approvedTestimonials.length > 3 && (
                                <div className="flex justify-center items-center gap-4 mt-12">
                                    <button onClick={prevTestimonialPage} aria-label="Previous testimonials" className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition-all focus:outline-none hover:scale-110">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Showing {currentTestimonialIndex + 1}-{Math.min(currentTestimonialIndex + 3, approvedTestimonials.length)} of {approvedTestimonials.length}
                                    </span>
                                    <button onClick={nextTestimonialPage} aria-label="Next testimonials" className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 transition-all focus:outline-none hover:scale-110">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { author: "Sarah M.", role: "Tracy Parent", content: "Aaria's Blue Elephant has been a lighthouse for our family. The playgroups are organized beautifully and provide a safe space where my child can finally just be themselves." },
                                { author: "David T.", role: "Mountain House Parent", content: "Before finding this community, weekends were isolating. Now we have friends, resources, and genuine support. The compassion here is unmatched." },
                                { author: "Elena R.", role: "Early Intervention Specialist", content: "The inclusive environment this organization builds is exactly what children need for healthy social development. It's an extraordinary initiative that truly changes lives." }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 border-t-4 border-sky-500 shadow-sm p-8 relative flex flex-col justify-between transition-colors">
                                    <div>
                                        <Quote className="h-8 w-8 text-sky-200 dark:text-sky-900 mb-4" />
                                        <p className="text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed text-sm text-balance">
                                            "{item.content}"
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
                                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-sky-700 font-bold bg-sky-100 dark:bg-sky-900/50 dark:text-sky-300 shadow-sm shrink-0">
                                            {item.author.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-slate-800 dark:text-white font-bold">{item.author}</p>
                                            <p className="text-sky-600 dark:text-sky-400 text-xs font-semibold uppercase tracking-wider">{item.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Donation CTA Banner */}
            <section id="join-herd" className="relative py-24 bg-sky-900 border-t-8 border-sky-500 overflow-hidden">
                <div className="absolute inset-0 bg-black/40 mix-blend-multiply z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 z-0"></div>

                <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center bg-white/10 backdrop-blur-md p-10 rounded-xl border border-white/20 shadow-2xl">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 uppercase tracking-wider">Ready to Join Our Herd?</h2>
                    <p className="text-sky-50 mb-10 text-lg max-w-2xl mx-auto">
                        Whether you're looking for support, want to volunteer, or can help us grow with a donation, there's a place for you at <strong>Aaria's Blue Elephant</strong>. To support your records, your donations are <strong>100% tax-deductible</strong>; we ensure financial transparency by issuing official tax receipts and progress statements on a quarterly basis.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                        <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer">
                            <button className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 px-10 rounded uppercase tracking-widest text-sm shadow-xl transition-transform hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2">
                                Donate for the Cause <HeartPulse className="h-4 w-4" />
                            </button>
                        </a>
                        <Link to="/signup">
                            <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-sky-900 font-bold py-4 px-10 rounded uppercase tracking-widest text-sm transition-colors w-full sm:w-auto">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Trust Elements & QR */}
                    <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16">
                        {/* Candid Seal */}
                        <a aria-label="Candid Profile" href="https://app.candid.org/profile/16447686/aarias-blue-elephant-39-4799956/?pkId=b8a47feb-927d-4adc-9e4e-794677415e6c" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 bg-white/10 backdrop-blur rounded-2xl p-4 shadow-lg border border-white/20">
                            <img alt="Candid Platinum Seal" src="https://widgets.guidestar.org/prod/v1/pdp/transparency-seal/16447686/svg" className="h-20 sm:h-24 w-auto drop-shadow-lg" />
                        </a>

                        {/* Join Herd QR Code */}
                        <div className="flex flex-col items-center">
                            <div className="h-[250px] w-[250px] rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.1)] transition-all duration-300 ring-4 ring-white/10 overflow-hidden relative">
                                <DonationQR />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Full Story Modal */}
            {selectedTestimonial && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                    onClick={() => setSelectedTestimonial(null)}
                >
                    <div
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900/95 dark:backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 fade-in duration-300 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                        tabIndex={-1}
                        ref={modalRef}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedTestimonial(null)}
                            className="absolute top-4 right-4 z-20 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-full backdrop-blur-sm transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shadow-sm"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header Branding Area (Matches Hero Style) */}
                        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-6 border-b border-slate-200 dark:border-slate-800/50 relative overflow-hidden shrink-0">
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white p-1.5 shadow-md border border-slate-100 dark:border-slate-800 shrink-0">
                                    <Logo className="h-full w-full" alt="Aaria's Blue Elephant Logo" />
                                </div>
                                <div className="flex flex-col items-start min-w-0">
                                    <h2 className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 leading-tight whitespace-nowrap overflow-visible">
                                        Aaria's Blue Elephant
                                    </h2>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest -mt-0.5">
                                        Building a New Inclusive World
                                    </p>
                                </div>
                            </div>
                            {/* Subtitle transition gradient */}
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-900/95 to-transparent"></div>
                        </div>

                        {/* Content Scrollable Area */}
                        <div className="p-6 sm:p-8 pt-0 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="flex items-center gap-4 mb-6 sm:mb-8 -mt-10 sm:-mt-12 relative z-10">
                                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-xl shrink-0">
                                    <div className="h-full w-full rounded-full bg-sky-100 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                                        {selectedTestimonial.avatar ? (
                                            <img src={selectedTestimonial.avatar} alt={selectedTestimonial.author} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-sky-700 font-bold bg-sky-100 dark:bg-sky-900/60 dark:text-sky-300 text-3xl">
                                                {selectedTestimonial.author.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-10 sm:pt-12">
                                    <h4 id="modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedTestimonial.author}</h4>
                                    <p className="text-sm sm:text-base text-sky-600 dark:text-sky-400 font-semibold tracking-wider uppercase">{selectedTestimonial.title || selectedTestimonial.role}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <Quote className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 h-12 w-12 sm:h-16 sm:w-16 text-slate-100 dark:text-slate-800 -z-10" />
                                <RichText
                                    content={selectedTestimonial.content}
                                    className="text-slate-700 dark:text-slate-300 text-base sm:text-lg font-medium pb-4"
                                />
                            </div>
                        </div>

                        {/* Footer with QR Code */}
                        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                            <div className="text-center sm:text-left flex-1">
                                <h5 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl">Inspired by this story?</h5>
                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-sm">Imprint your change and help us support more families.</p>

                                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 w-full sm:w-auto">
                                    <button id="donate-button" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-full transition-all text-sm shadow-md flex items-center justify-center gap-2">
                                        Donate Now <HeartPulse className="h-4 w-4" />
                                    </button>
                                </a>
                            </div>

                            <div className="flex flex-col items-center shrink-0">
                                <div className="h-32 w-32 bg-white p-3 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 ring-4 ring-white/50 dark:ring-slate-800/50">
                                    <img src="./qr-code-donate.png" alt="Donate QR Code" className="w-full h-full object-contain" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-3">Scan to Donate</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
