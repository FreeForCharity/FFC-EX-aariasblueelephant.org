import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Users, ChevronLeft, ChevronRight, Heart, Share2, Check, HeartHandshake, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';
import StagedFadeIn from '../components/StagedFadeIn';
import StickerIcon from '../components/StickerIcon';
import EventCalendarModal from '../components/EventCalendarModal';
import RichText from '../components/RichText';
import { parseDateLocal, formatDateLocal, formatShortDateLocal } from '../lib/utils';

type Tab = 'upcoming' | 'all' | 'past';

interface CardContentProps {
  activeEvent: any;
  activeTab: Tab;
  likedEvents: Record<string, boolean>;
  likeCounts: Record<string, number>;
  toggleLike: (e: React.MouseEvent, id: string) => void;
  handleShare: (e: React.MouseEvent, id: string) => void;
  copiedId: string | null;
  isPast: boolean;
  navigate: (path: string) => void;
}

const CardContent: React.FC<CardContentProps> = ({
  activeEvent,
  activeTab,
  likedEvents,
  likeCounts,
  toggleLike,
  handleShare,
  copiedId,
  isPast,
  navigate
}) => {
  const { user } = useAuth();
  const { eventRegistrations, registerForEvent } = useData();
  const [needsAccommodation, setNeedsAccommodation] = useState<boolean | null>(null);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const userRegistration = user && activeEvent ? eventRegistrations.find(r => r.eventId === activeEvent.id && r.userId === user.email) : null;
  const isRegistered = !!userRegistration;
  const registrationStatus = userRegistration?.status;

  const handleRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      if (needsAccommodation !== null) {
        localStorage.setItem('pendingEventId', activeEvent.id);
        localStorage.setItem('pendingAccommodation', String(needsAccommodation));
      }
      navigate('/login', { state: { returnTo: `/events/${activeEvent.id}` } });
      return;
    }
    if (activeEvent) {
      registerForEvent({
        eventId: activeEvent.id,
        userId: user.email,
        userName: user.name,
        userEmail: user.email,
        specialNeeds: needsAccommodation === true,
      });
      setRegistrationSubmitted(true);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out ${!isPast ? 'hover:scale-[1.02] hover:border-sky-500/50 hover:shadow-sky-500/10 cursor-pointer' : ''}`}>
      <div className={`grid grid-cols-1 ${activeEvent.mediaLink ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <div className="relative h-64 lg:h-auto overflow-hidden lg:col-span-1">
          <img
            src={activeEvent.image || DEFAULT_EVENT_IMAGE}
            alt={activeEvent.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${!isPast ? 'group-hover:scale-105' : ''} ${isPast ? 'grayscale-[50%]' : ''}`}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_LOCAL_FALLBACK;
            }}
          />
          <div className="absolute top-4 left-4 z-20">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md
                ${activeEvent.type === 'Class' ? 'bg-blue-500 text-white' :
                activeEvent.type === 'Fundraiser' ? 'bg-green-500 text-white' :
                  activeEvent.type === 'Outreach' ? 'bg-orange-500 text-white' :
                    activeEvent.type === 'Advocacy' ? 'bg-emerald-600 text-white' :
                      'bg-brand-purple text-white'}`}>
              {activeEvent.type}
            </span>
            {isPast && (
              <span className="ml-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md bg-slate-600 text-white">
                Past
              </span>
            )}
          </div>
          {!isPast && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hidden lg:flex items-center justify-center">
              <span className="flex items-center bg-sky-600 text-white font-bold px-6 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                View Details <ChevronRight className="ml-2 h-4 w-4" />
              </span>
            </div>
          )}
        </div>

        <div className={`p-8 flex flex-col justify-between h-full lg:h-[600px] bg-white dark:bg-slate-900 relative z-30 ${activeEvent.mediaLink ? 'lg:col-span-2' : ''}`}>
          <div className={`flex-1 min-h-0 overflow-y-auto pr-2 pb-4 slim-scrollbar ${activeEvent.mediaLink ? 'lg:flex lg:gap-8' : ''}`}>
            <div className={activeEvent.mediaLink ? 'flex-1 lg:max-w-1/2' : ''}>
              <h2 className={`text-3xl font-bold text-slate-900 dark:text-white mb-4 transition-colors ${!isPast ? 'group-hover:text-sky-600' : ''}`}>{activeEvent.title}</h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg mb-8 line-clamp-3">{activeEvent.description}</p>

              <div className="space-y-6 mb-8">
                <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold">
                  <StickerIcon icon={Calendar} size={18} color="#00AEEF" className="mr-4" />
                  <span>{formatDateLocal(activeEvent.date)}</span>
                </div>
                <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold">
                  <StickerIcon icon={Clock} size={18} color="#00AEEF" className="mr-4" />
                  <span>{activeEvent.time}</span>
                </div>
                <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold">
                  <StickerIcon icon={MapPin} size={18} color="#00AEEF" className="mr-4" />
                  <span>{activeEvent.location}</span>
                </div>
                <div className="flex items-center text-slate-700 dark:text-slate-300 font-bold">
                  <StickerIcon icon={Users} size={18} color="#00AEEF" className="mr-4" />
                  <span>{activeEvent.registered} / {activeEvent.capacity} Registered</span>
                </div>
              </div>
            </div>

            {activeEvent.mediaLink && (
              <div className="flex-1 mb-8 lg:mb-0 lg:max-w-1/2 h-full flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Event Media</h3>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl overflow-y-auto slim-scrollbar flex-1 relative">
                  <div className="absolute inset-0 p-3">
                    <RichText content={activeEvent.mediaLink} className="w-full text-slate-600 dark:text-slate-300" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 shrink-0 mt-auto">
            {!isPast && (
              <div className="w-full">
                {registrationSubmitted ? (
                  <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-200 dark:border-green-800 text-center text-sm font-bold flex flex-col gap-2">
                    <Check className="h-6 w-6 mx-auto mb-1 animate-bounce" />
                    Registration Submitted!
                    <Button fullWidth size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/events/${activeEvent.id}`); }}>View Details</Button>
                  </div>
                ) : isRegistered ? (
                  <Button fullWidth size="lg" variant="secondary" disabled onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/events/${activeEvent.id}`); }}>
                    {registrationStatus === 'Pending' ? 'Waiting for Approval' : 'Already Registered'}
                  </Button>
                ) : activeEvent.registered < activeEvent.capacity ? (
                  <div className="space-y-4 w-full">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-sm font-bold text-slate-900 dark:text-white block mb-2 text-center">
                        Need Accommodations?
                      </label>
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg border cursor-pointer transition-all ${needsAccommodation === true ? 'bg-brand-purple/10 border-brand-purple text-brand-purple dark:bg-brand-purple/20 dark:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`} onClick={(e) => e.stopPropagation()}>
                          <input type="radio" name={`acc-${activeEvent.id}`} className="hidden" checked={needsAccommodation === true} onChange={() => setNeedsAccommodation(true)} />
                          <span className="font-medium text-xs text-center">Yes</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg border cursor-pointer transition-all ${needsAccommodation === false ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan dark:bg-brand-cyan/20 dark:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400'}`} onClick={(e) => e.stopPropagation()}>
                          <input type="radio" name={`acc-${activeEvent.id}`} className="hidden" checked={needsAccommodation === false} onChange={() => setNeedsAccommodation(false)} />
                          <span className="font-medium text-xs text-center">No</span>
                        </label>
                      </div>
                    </div>
                    <Button fullWidth size="lg" className="shadow-lg shadow-brand-cyan/20" onClick={handleRegister} disabled={needsAccommodation === null}>
                      {needsAccommodation === null ? 'Select Accommodations' : user ? 'Register Now' : 'Sign in to Register'}
                    </Button>
                  </div>
                ) : (
                  <Button fullWidth size="lg" variant="secondary" disabled onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>Event Full</Button>
                )}
              </div>
            )}

            {isPast && (
              <Button fullWidth size="lg" variant="secondary" disabled onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>Event Concluded</Button>
            )}

            <div className="flex w-full gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/events/${activeEvent.id}`);
                }}
                className="flex-[2] px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sky-600 dark:text-sky-400 font-bold"
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleLike(e, activeEvent.id);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Like"
              >
                <Heart className={`h-5 w-5 ${likedEvents[activeEvent.id] ? 'fill-brand-pink text-brand-pink' : 'text-slate-400'}`} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare(e, activeEvent.id);
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Share"
              >
                {copiedId === activeEvent.id ? <Check className="h-5 w-5 text-green-400" /> : <Share2 className="h-5 w-5 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Events: React.FC = () => {
  const { events, loading } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedEvents, setLikedEvents] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    const eventDate = parseDateLocal(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!eventDate) return activeTab === 'all'; // Default for non-date strings
    if (activeTab === 'upcoming') return eventDate >= today;
    if (activeTab === 'past') return eventDate < today;
    return true;
  }).sort((a, b) => {
    const dateA = parseDateLocal(a.date)?.getTime() || 0;
    const dateB = parseDateLocal(b.date)?.getTime() || 0;
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

    const shareText = `Check out this event at Aaria's Blue Elephant: ${event.title} on ${formatDateLocal(event.date)}!`;

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
      <StagedFadeIn direction="down" trigger="mount">
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
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 self-center mx-1"></div>
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-sky-100/50 hover:bg-sky-200 dark:bg-sky-900/30 dark:hover:bg-sky-800/50 text-sky-700 dark:text-sky-300 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
        </div>
      </StagedFadeIn>

      {loading ? (
        <div className="py-20 px-4 text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-300 dark:border-slate-700/50 border-dashed animate-pulse">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-cyan border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">Loading events...</h2>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-20 px-4 text-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/30 rounded-2xl border border-slate-300 dark:border-slate-700/50 border-dashed">
          <StickerIcon icon={Calendar} size={32} color="#94a3b8" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">No events found</h2>
          <p>There are no {activeTab} events scheduled at this time.</p>
          {activeTab !== 'all' && (
            <button onClick={() => setActiveTab('all')} className="mt-4 text-brand-cyan hover:underline">View all events</button>
          )}
        </div>
      ) : (
        /* Carousel Container */
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div
            className={`relative w-full ${activeEvent.mediaLink ? 'max-w-7xl' : 'max-w-5xl'} mx-auto transition-all duration-500`}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Main Card */}
            {(() => {
              const evDate = parseDateLocal(activeEvent.date);
              const isPastEvent = evDate && evDate < new Date(new Date().setHours(0, 0, 0, 0));
              return isPastEvent ? (
                <div className="block group">
                  <CardContent
                    activeEvent={activeEvent}
                    activeTab={activeTab}
                    likedEvents={likedEvents}
                    likeCounts={likeCounts}
                    toggleLike={toggleLike}
                    handleShare={handleShare}
                    copiedId={copiedId}
                    isPast={true}
                    navigate={navigate}
                  />
                </div>
              ) : (
                <Link to={`/events/${activeEvent.id}`} className="block group cursor-pointer">
                  <CardContent
                    activeEvent={activeEvent}
                    activeTab={activeTab}
                    likedEvents={likedEvents}
                    likeCounts={likeCounts}
                    toggleLike={toggleLike}
                    handleShare={handleShare}
                    copiedId={copiedId}
                    isPast={false}
                    navigate={navigate}
                  />
                </Link>
              );
            })()}

            <button onClick={prevSlide} className="absolute top-1/2 -left-4 lg:-left-12 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 p-3 rounded-full shadow-xl z-10 hover:bg-sky-50 dark:hover:bg-sky-600 transition-colors"><ChevronLeft className="h-6 w-6" /></button>
            <button onClick={nextSlide} className="absolute top-1/2 -right-4 lg:-right-12 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 p-3 rounded-full shadow-xl z-10 hover:bg-sky-50 dark:hover:bg-sky-600 transition-colors"><ChevronRight className="h-6 w-6" /></button>

            <div className="flex justify-center gap-2 mt-6">
              {filteredEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === safeActiveIndex ? 'w-8 bg-brand-cyan' : 'w-2 bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Host CTA */}
      <StagedFadeIn delay={0.3} direction="up">
        <div className="mt-16 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl p-10 text-center border border-sky-100 dark:border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="h-24 w-24 text-sky-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase">Become a Playgroup Host</h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 text-lg font-medium">Interested in facilitating inclusive play in your neighborhood? We provide all materials and guidance.</p>
          <Button size="lg" className="px-10" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
            Inquire to Host <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </StagedFadeIn>

      {/* Guarantee Banner */}
      <StagedFadeIn delay={0.4} direction="up">
        <div className="mt-12 bg-white dark:bg-slate-800 border-2 border-dashed border-sky-100 dark:border-slate-700 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mb-6">
            <StickerIcon icon={HeartHandshake} size={32} color="#00AEEF" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase">100% Free. Fully Inclusive.</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-4xl mx-auto font-medium">We believe financial constraints should never be a barrier to joy, growth, and connection.</p>
        </div>
      </StagedFadeIn>

      <EventCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        events={events}
      />
    </div>
  );
};

export default Events;