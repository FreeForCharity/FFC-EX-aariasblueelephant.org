import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Users, ChevronLeft, ChevronRight, Heart, Share2, Check, Info, HeartHandshake } from 'lucide-react';
import { useData } from '../context/DataContext';
import Button from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';

type Tab = 'upcoming' | 'all' | 'past';

const Events: React.FC = () => {
  const { events } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedEvents, setLikedEvents] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    // Reset hours to compare dates only
    today.setHours(0, 0, 0, 0);

    if (activeTab === 'upcoming') return eventDate >= today;
    if (activeTab === 'past') return eventDate < today;
    return true;
  }).sort((a, b) => {
    // Sort upcoming/all ascending, past descending
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return activeTab === 'past' ? dateB - dateA : dateA - dateB;
  });

  // Reset active index when tab changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeTab]);

  // Initialize like counts
  useEffect(() => {
    const initialCounts: Record<string, number> = {};
    if (events.length > 0) {
      events.forEach(evt => {
        initialCounts[evt.id] = evt.initialLikes;
      });
      setLikeCounts(initialCounts);
    }
  }, [events]);

  const nextSlide = useCallback(() => {
    if (filteredEvents.length === 0) return;
    setActiveIndex((current) => (current === filteredEvents.length - 1 ? 0 : current + 1));
  }, [filteredEvents.length]);

  const prevSlide = () => {
    if (filteredEvents.length === 0) return;
    setActiveIndex((current) => (current === 0 ? filteredEvents.length - 1 : current - 1));
  };

  // Auto-rotation
  useEffect(() => {
    if (isPaused || filteredEvents.length === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, filteredEvents.length]);

  const toggleLike = (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const isLiked = likedEvents[eventId];
    setLikedEvents(prev => ({ ...prev, [eventId]: !isLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [eventId]: isLiked ? prev[eventId] - 1 : prev[eventId] + 1
    }));
  };

  const handleShare = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const shareText = `Check out this event at Aaria's Blue Elephant: ${event.title} on ${event.date}!`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const safeActiveIndex = activeIndex >= filteredEvents.length ? 0 : activeIndex;
  const activeEvent = filteredEvents[safeActiveIndex];

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[80vh] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Playgroups & Classes</h1>
          <p className="text-slate-600 dark:text-slate-400">Join our inclusive sessions designed for all abilities.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {(['upcoming', 'all', 'past'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab
                ? 'bg-sky-700 text-white shadow-lg'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
            >
              {tab} Events
            </button>
          ))}
        </div>
      </div>

      {/* Free Events Guarantee Banner */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 md:p-8 mb-12 text-center shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-4 group-hover:bg-sky-600 transition-colors duration-300 shadow-sm border border-sky-200 dark:border-sky-800">
          <HeartHandshake className="h-8 w-8 text-sky-600 dark:text-sky-400 group-hover:text-white transition-colors duration-300" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-wide group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors duration-300 uppercase">
          100% Free. Fully Inclusive. All Are Welcome.
        </h2>
        <div className="w-16 h-1 bg-sky-200 dark:bg-sky-800 mb-5 rounded-full group-hover:bg-sky-500 transition-colors duration-300"></div>
        <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base max-w-4xl mx-auto font-medium leading-relaxed">
          We believe financial constraints should never be a barrier to joy, growth, and connection. While thoughtfully designed for children with special needs, we foster a truly inclusive environment where siblings, friends, and children of all abilities play and learn side-by-side. For over two years, our events and materials have been provided completely free of charge. Donations support our mission, but are never required.
        </p>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="py-20 px-4 text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-300 dark:border-slate-700/50 border-dashed">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No events found</h2>
          <p>There are no {activeTab} events scheduled at this time.</p>
          {activeTab !== 'all' && (
            <button onClick={() => setActiveTab('all')} className="mt-4 text-brand-cyan hover:underline">View all events</button>
          )}
        </div>
      ) : (
        /* Carousel Container */
        <div
          className="relative w-full max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Card - Now Clickable */}
          <Link to={`/events/${activeEvent.id}`} className="block group cursor-pointer">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out hover:scale-[1.02] hover:border-sky-500/50 hover:shadow-sky-500/10 hover:shadow-3xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Image Section */}
                <div className="relative h-64 lg:h-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-card/80 to-transparent z-10 lg:hidden" />
                  <img
                    src={activeEvent.image || DEFAULT_EVENT_IMAGE}
                    alt={activeEvent.title}
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${activeTab === 'past' ? 'grayscale-[50%]' : ''}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src === DEFAULT_EVENT_IMAGE) {
                        target.src = DEFAULT_LOCAL_FALLBACK;
                      } else {
                        target.src = DEFAULT_EVENT_IMAGE;
                      }
                    }}
                  />
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md
                        ${activeEvent.type === 'Class' ? 'bg-blue-500 text-white' :
                        activeEvent.type === 'Fundraiser' ? 'bg-green-500 text-white' : 'bg-brand-purple text-white'}`}>
                      {activeEvent.type}
                    </span>
                    {activeTab === 'past' && (
                      <span className="ml-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md bg-slate-600 text-white">
                        Past
                      </span>
                    )}
                  </div>

                  {/* View Details Overlay on Image (Desktop) */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hidden lg:flex items-center justify-center">
                    <span className="flex items-center bg-sky-600 text-white font-bold px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      View Details <ChevronRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col justify-between h-full bg-white dark:bg-slate-900 relative z-30">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 leading-tight group-hover:text-sky-600 dark:group-hover:text-brand-cyan transition-colors">{activeEvent.title}</h2>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 leading-relaxed line-clamp-3">
                      {activeEvent.description}
                    </p>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <div className="w-8 flex justify-center mr-3"><Calendar className="h-5 w-5 text-sky-600 dark:text-brand-cyan" /></div>
                        <span className="font-medium">{new Date(activeEvent.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <div className="w-8 flex justify-center mr-3"><Clock className="h-5 w-5 text-sky-600 dark:text-brand-cyan" /></div>
                        <span className="font-medium">{activeEvent.time}</span>
                      </div>
                      <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <div className="w-8 flex justify-center mr-3"><MapPin className="h-5 w-5 text-sky-600 dark:text-brand-cyan" /></div>
                        <span className="font-medium">{activeEvent.location}</span>
                      </div>
                      <div className="flex items-center text-slate-700 dark:text-slate-300">
                        <div className="w-8 flex justify-center mr-3"><Users className="h-5 w-5 text-sky-600 dark:text-brand-cyan" /></div>
                        <span className="font-medium">{activeEvent.registered} / {activeEvent.capacity} Registered</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                    {activeTab !== 'past' ? (
                      <Button fullWidth size="lg" className="shadow-brand-cyan/20 relative z-30" onClick={(e) => {
                        e.preventDefault();
                        navigate(`/events/${activeEvent.id}`);
                      }}>
                        View Details
                      </Button>
                    ) : (
                      <Button fullWidth size="lg" variant="secondary" disabled>
                        Event Concluded
                      </Button>
                    )}

                    <div className="flex w-full sm:w-auto gap-2 justify-between sm:justify-start relative z-30">
                      <button
                        onClick={(e) => toggleLike(e, activeEvent.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Heart className={`h-5 w-5 transition-colors ${likedEvents[activeEvent.id] ? 'fill-brand-pink text-brand-pink' : 'text-slate-400 hover:text-brand-pink'}`} />
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{likeCounts[activeEvent.id] || 0}</span>
                      </button>

                      <button
                        onClick={(e) => handleShare(e, activeEvent.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group min-w-[100px]"
                      >
                        {copiedId === activeEvent.id ? (
                          <>
                            <Check className="h-5 w-5 text-green-400" />
                            <span className="text-green-400 font-medium text-sm">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="h-5 w-5 text-slate-400 group-hover:text-brand-cyan" />
                            <span className="text-slate-300 font-medium text-sm">Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute top-1/2 -left-4 lg:-left-12 transform -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-sky-600 text-slate-700 dark:text-white p-3 rounded-full backdrop-blur-sm border border-slate-200 dark:border-slate-700 transition-all shadow-xl z-10"
            aria-label="Previous event"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 -right-4 lg:-right-12 transform -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-sky-600 text-slate-700 dark:text-white p-3 rounded-full backdrop-blur-sm border border-slate-200 dark:border-slate-700 transition-all shadow-xl z-10"
            aria-label="Next event"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {filteredEvents.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === safeActiveIndex ? 'w-8 bg-brand-cyan' : 'w-2 bg-slate-700 hover:bg-slate-600'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Host CTA */}
      <div className="mt-16 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 text-center border border-slate-300 dark:border-slate-700 shadow-lg">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Host a Playgroup?</h3>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6">
          We are always looking for volunteers and venues to expand our reach in Tracy and Mountain House.
        </p>
        <Button variant="outline" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Contact Us</Button>
      </div>
    </div>
  );
};

export default Events;