import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Quote, HeartPulse, Sparkles, HeartHandshake, Users, Calendar, ArrowRight, ChevronLeft, ChevronRight, X, Heart } from 'lucide-react';
import Button from '../components/Button';
import { useData } from '../context/DataContext';
import SocialLinks from '../components/SocialLinks';
import { Testimonial } from '../types';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';

const Home: React.FC = () => {
    const { testimonials } = useData();
    const approvedTestimonials = testimonials.filter(t => t.status === 'Approved');

    const [currentEventIndex, setCurrentEventIndex] = useState(0);
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

    // Mock Past Events Data
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
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-16 lg:py-24 transition-colors">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                        {/* Left Side: Play Without Barriers (Hero Text) */}
                        <div className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left">
                            {/* Social Media Links (Media Tag) */}
                            <div className="mb-6 flex justify-center lg:justify-start">
                                <SocialLinks />
                            </div>

                            {/* Heading */}
                            <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-slate-900 dark:text-white leading-[1.1] mb-2 tracking-tight">
                                Building a New Inclusive World
                            </h1>
                            <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-sky-600 dark:text-sky-400 mb-6 tracking-tight">
                                Fun Without Barriers for Every Child
                            </h2>

                            {/* Subtitle */}
                            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                A safe haven where neurodivergent and neurotypical children grow together.
                                We believe in early intervention, inclusive play, and building a compassionate community.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
                                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                                    <button className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 px-8 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(2,132,199,0.3)] hover:shadow-[0_8px_30px_rgb(2,132,199,0.5)] hover:-translate-y-0.5">
                                        Donate Now <HeartPulse className="h-5 w-5" />
                                    </button>
                                </a>
                                <Link to="/about" className="w-full sm:w-auto">
                                    <button className="w-full sm:w-auto bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-600 dark:hover:border-sky-400 text-sky-700 dark:text-white font-bold py-4 px-8 rounded-full transition-all flex items-center justify-center shadow-sm hover:bg-sky-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-sky-500/20">
                                        Our Mission
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
            <section className="bg-slate-50 dark:bg-slate-950 py-16 transition-colors">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
                                        <div key={item.id} className="bg-white dark:bg-slate-800 border-t-4 border-sky-500 shadow-sm p-8 relative flex flex-col justify-between transition-colors animate-in fade-in duration-500">
                                            <div>
                                                <Quote className="h-8 w-8 text-sky-200 dark:text-sky-900 mb-4" />
                                                <p className="text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed text-sm text-balance">
                                                    "{text}"
                                                    {isTruncated && (
                                                        <button
                                                            onClick={() => setSelectedTestimonial(item)}
                                                            className="ml-2 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 focus:outline-none focus:underline inline-flex items-center group"
                                                            aria-label={`Read more of ${item.author}'s story`}
                                                        >
                                                            ... Read More
                                                            <ArrowRight className="w-3 h-3 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                        </button>
                                                    )}
                                                </p>
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
                                                    <p className="text-sky-600 dark:text-sky-400 text-xs font-semibold uppercase tracking-wider">{item.role}</p>
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
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Quote className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">Our community is sharing their voices soon. Check back later!</p>
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
                            <button className="bg-sky-500 hover:bg-sky-400 text-white font-bold py-4 px-10 rounded uppercase tracking-widest text-sm shadow-xl transition-transform hover:-translate-y-1 w-full sm:w-auto">
                                Make a Donation
                            </button>
                        </a>
                        <Link to="/signup">
                            <button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-sky-900 font-bold py-4 px-10 rounded uppercase tracking-widest text-sm transition-colors w-full sm:w-auto">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Join Herd QR Code */}
                    <div className="mt-12 flex flex-col items-center">
                        <p className="text-sky-100 font-semibold mb-3 uppercase tracking-widest text-sm text-center">Scan to Signify Impact</p>
                        <div className="h-40 w-40 sm:h-48 sm:w-48 bg-white p-3 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-105 transition-all duration-300 ring-4 ring-white/10">
                            <img src="./qr-code-donate.png" alt="Donate QR Code" className="w-full h-full object-contain" />
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

                        {/* Rainbow Infinity Band Header */}
                        <div className="h-28 sm:h-32 bg-slate-50 dark:bg-slate-950 flex justify-center items-center relative overflow-hidden shrink-0 border-b border-slate-200 dark:border-slate-800/50">
                            <svg className="absolute w-[150%] h-[150%] opacity-60 dark:opacity-40" viewBox="0 0 400 100" preserveAspectRatio="none">
                                <path
                                    d="M 120 50 C 120 20, 180 20, 200 50 C 220 80, 280 80, 280 50 C 280 20, 220 20, 200 50 C 180 80, 120 80, 120 50 Z"
                                    fill="none"
                                    stroke="url(#modal-rainbow)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="modal-rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#0ea5e9" />    {/* Sky 500 */}
                                        <stop offset="25%" stopColor="#8b5cf6" />   {/* Violet 500 */}
                                        <stop offset="50%" stopColor="#ec4899" />   {/* Pink 500 */}
                                        <stop offset="75%" stopColor="#f59e0b" />   {/* Amber 500 */}
                                        <stop offset="100%" stopColor="#10b981" />  {/* Emerald 500 */}
                                    </linearGradient>
                                </defs>
                            </svg>
                            {/* Gradient fade out at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-slate-900/95 to-transparent"></div>
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
                                    <p className="text-sm sm:text-base text-sky-600 dark:text-sky-400 font-semibold tracking-wider uppercase">{selectedTestimonial.role}</p>
                                </div>
                            </div>

                            <div className="relative">
                                <Quote className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 h-12 w-12 sm:h-16 sm:w-16 text-slate-100 dark:text-slate-800 -z-10" />
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base sm:text-lg whitespace-pre-wrap font-medium pb-4">
                                    {selectedTestimonial.content}
                                </p>
                            </div>
                        </div>

                        {/* Footer with QR Code */}
                        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                            <div className="text-center sm:text-left flex-1">
                                <h5 className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl">Inspired by this story?</h5>
                                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-sm">Imprint your change and help us support more families.</p>

                                <a href="https://www.zeffy.com/en-US/donation-form/aariasblueelephant" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 w-full sm:w-auto">
                                    <button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-full transition-all text-sm shadow-md flex items-center justify-center gap-2">
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
