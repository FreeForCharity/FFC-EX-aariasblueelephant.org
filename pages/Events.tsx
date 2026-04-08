
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Clock, Users, ChevronLeft, ChevronRight, Heart, Share2, Check, HeartHandshake, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';
import StagedFadeIn from '../components/StagedFadeIn';
import StickerIcon from '../components/StickerIcon';
import EventCalendarModal from '../components/EventCalendarModal';
import RichText from '../components/RichText';
import { parseDateLocal, formatDateLocal } from '../lib/utils';
import { Event } from '../types';

type Tab = 'upcoming' | 'all' | 'past';

interface CardContentProps {
  activeEvent: Event;
  activeTab: Tab;
  likedEvents: Record<string, boolean>;
  likeCounts: Record<string, number>;
  toggleLike: (e: React.MouseEvent, id: string) => void;
  handleShare: (e: React.MouseEvent, id: string) => void;
  copiedId: string | null;
  isPast: boolean;
  onNavigate: (path: string) => void;
  userRegistration: any;
}

const EventCardShort: React.FC<{ 
  event: Event; 
  onNavigate: (id: string) => void;
  priority?: boolean;
}> = ({ 
  event, 
  onNavigate,
  priority = false 
}) => {
  const { user } = useAuth();
  const { eventRegistrations, registerForEvent } = useData();
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const showAccommodationQuestion = event.type === 'Event' || event.type === 'Class';
  
  // Memoized defensive lookup prioritizing UUID
  const userRegistration = React.useMemo(() => {
    if (!user || !eventRegistrations) return null;
    return [...eventRegistrations].reverse().find(r => 
      r.eventId === event.id && 
      (
        r.userId === user.id || 
        r.userEmail === user.email ||
        (r.userId && user.email && r.userId.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (r.userEmail && user.email && r.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      )
    );
  }, [user, eventRegistrations, event.id]);
  
  const isRegistered = !!userRegistration;


  const handleRegister = async (e: React.MouseEvent, pref: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      localStorage.setItem('pendingEventId', event.id);
      localStorage.setItem('pendingAccommodation', String(pref));
      onNavigate(`/login?returnTo=/events/${event.id}`);
      return;
    }
    
    try {
      const result = await registerForEvent({
        eventId: event.id,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        specialNeeds: pref,
      });

      if (result.success) {
        setRegistrationSubmitted(true);
      } else {
        alert("Registration failed: " + result.error);
      }
    } catch (err) {
      console.error("Registration crash prevented (Short Card):", err);
      alert("A temporary error occurred during registration. Please try refreshing or contact support if this persists.");
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const basePath = window.location.pathname.replace(/\/events\/?$/, '');
    const shareUrl = `${window.location.origin}${basePath}/events/${event.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-500/50 transition-all duration-300 flex flex-col md:flex-row relative group mb-4 min-h-[140px]"
    >
      {/* Copy Toast - Center Floating */}
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black py-2 px-6 rounded-full shadow-2xl flex items-center gap-2 border border-sky-500/30 animate-in fade-in zoom-in duration-300">
          <Check className="w-3 h-3 text-sky-400 dark:text-sky-600" />
          LINK COPIED!
        </div>
      )}

      {/* Left: Image */}
      <div 
        onClick={() => onNavigate(`/events/${event.id}`)}
        className="relative h-40 md:h-auto md:w-56 overflow-hidden shrink-0 cursor-pointer"
      >
        <img
          src={event.image || DEFAULT_EVENT_IMAGE}
          alt={event.title}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setImageLoaded(true)}
          className={`h-full w-full object-cover transition-all duration-1000 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
        )}
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-md
            ${event.type === 'Class' ? 'bg-blue-500 text-white' :
              event.type === 'Fundraiser' ? 'bg-green-500 text-white' :
                event.type === 'Outreach' ? 'bg-orange-500 text-white' :
                  event.type === 'Advocacy' ? 'bg-emerald-600 text-white' :
                    'bg-brand-purple text-white'}`}>
            {event.type}
          </span>
        </div>
      </div>

      {/* Center: Details */}
      <div className="p-6 flex flex-col flex-grow md:justify-center">
        <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-[9px] mb-2 uppercase tracking-widest opacity-80">
          <Calendar className="w-3 h-3" />
          <span>{formatDateLocal(event.date)}</span>
          <span className="text-slate-200 dark:text-slate-700 mx-1">•</span>
          <Clock className="w-3 h-3" />
          <span>{event.time}</span>
        </div>
        
        <h3 
          onClick={() => onNavigate(`/events/${event.id}`)}
          className="text-lg font-black text-slate-900 dark:text-white mb-2 cursor-pointer hover:text-sky-600 transition-colors leading-tight tracking-tight capitalize"
        >
          {event.title}
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-1 max-w-xl opacity-90">
          {event.description}
        </p>
      </div>

      {/* Right: Actions Area (The 'Tab' end) */}
      <div className="p-4 md:px-6 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center md:items-end gap-3 shrink-0 min-w-[240px] bg-slate-50/30 dark:bg-slate-800/10">
        
        {!isRegistered && !registrationSubmitted && showAccommodationQuestion && (
          <div className="w-full flex flex-col gap-2 mb-1">
            <span className="text-[11px] font-[900] text-brand-purple dark:text-brand-purple uppercase tracking-tight flex items-center justify-center md:justify-end gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></span>
              SUPPORT SELECTION REQUIRED TO SIGN UP
            </span>
            
            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={(e) => handleRegister(e, false)}
                className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-cyan hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                SIGN UP (NO SUPPORT)
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={(e) => handleRegister(e, true)}
                className="w-full py-3 px-4 bg-white dark:bg-slate-800 border-2 border-brand-purple text-brand-purple rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                SIGN UP (WITH SUPPORT)
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {!isRegistered && !registrationSubmitted && !showAccommodationQuestion && (
           <div className="flex w-full gap-2 items-stretch">
             <button 
              onClick={(e) => handleRegister(e, false)}
              className="flex-grow py-3 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] shadow-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-sky-600 dark:hover:bg-sky-400"
            >
              SIGN UP NOW
              <ChevronRight className="h-4 w-4" />
            </button>
           </div>
        )}

        {(isRegistered || registrationSubmitted) && (
          <div className="flex w-full gap-2 items-stretch">
            {isRegistered ? (
              <button 
                onClick={() => onNavigate(`/events/${event.id}`)}
                className={`flex-grow py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border shadow-sm ${
                  userRegistration?.status === 'Approved' 
                  ? "bg-green-500 text-white border-green-600 shadow-green-500/20" 
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-amber-500/10"
                }`}
              >
                {userRegistration?.status === 'Approved' ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> JOINED
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-pulse" /> PENDING APPROVAL
                  </>
                )}
              </button>
            ) : (
              <div className="flex-grow bg-emerald-500 text-white py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-center animate-pulse shadow-lg shadow-emerald-500/20">
                SUCCESS!
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleShare}
          className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 hover:text-sky-500 transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" /> SHARE EVENT
        </button>
      </div>
    </div>
  );
};




const CardContent: React.FC<CardContentProps> = ({
  activeEvent,
  likedEvents,
  toggleLike,
  handleShare,
  copiedId,
  isPast,
  onNavigate,
  userRegistration
}) => {
  const { user } = useAuth();
  const { registerForEvent, eventRegistrations } = useData();
  const [needsAccommodation, setNeedsAccommodation] = useState<boolean | null>(null);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Only ask for accommodations for Events and Classes
  const showAccommodationQuestion = activeEvent.type === 'Event' || activeEvent.type === 'Class';
  const isRegistered = !!userRegistration;
  const registrationStatus = userRegistration?.status;

  const handleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      if (needsAccommodation !== null) {
        localStorage.setItem('pendingEventId', activeEvent.id);
        localStorage.setItem('pendingAccommodation', String(needsAccommodation));
      }
      onNavigate(`/login?returnTo=/events/${activeEvent.id}`);
      return;
    }
    try {
      if (activeEvent) {
        const result = await registerForEvent({
          eventId: activeEvent.id,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          specialNeeds: needsAccommodation === true,
        });

        if (result.success) {
          setRegistrationSubmitted(true);
        } else {
          alert("Registration failed: " + result.error);
        }
      }
    } catch (err) {
      console.error("Registration crash prevented (Carousel):", err);
      alert("A temporary error occurred during registration. Please try refreshing or contact support if this persists.");
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out ${!isPast ? 'hover:scale-[1.02] hover:border-sky-500/50 hover:shadow-sky-500/10 cursor-pointer' : ''}`}>
      <div className={`grid grid-cols-1 ${activeEvent.mediaLink ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <div className="relative h-64 lg:h-auto overflow-hidden lg:col-span-1 bg-slate-100 dark:bg-slate-800">
          <img
            src={activeEvent.image || DEFAULT_EVENT_IMAGE}
            alt={activeEvent.title}
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-1000 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${!isPast ? 'group-hover:scale-105' : ''} ${isPast ? 'grayscale-[50%]' : ''}`}
            loading="lazy"
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
          )}
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

        <div className={`p-8 flex flex-col justify-between h-full lg:min-h-[600px] bg-white dark:bg-slate-900 relative z-30 ${activeEvent.mediaLink ? 'lg:col-span-2' : ''}`}>
          <div className={`flex-1 min-h-0 overflow-y-auto pr-2 pb-4 slim-scrollbar ${activeEvent.mediaLink ? 'lg:flex lg:gap-8' : ''}`}>
            <div className={activeEvent.mediaLink ? 'lg:flex-1 lg:max-w-[50%]' : ''}>
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
              <div className="flex-1 mb-8 lg:mb-0 lg:max-w-[50%] h-full flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Event Media</h3>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl overflow-y-auto slim-scrollbar flex-1 relative min-h-[200px]">
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
                    <Button fullWidth size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate(`/events/${activeEvent.id}`); }}>View Details</Button>
                  </div>
                ) : isRegistered ? (
                  <Button 
                    fullWidth 
                    size="lg" 
                    variant={userRegistration?.status === 'Approved' ? "primary" : "secondary"}
                    className={userRegistration?.status === 'Approved' ? "bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-500/20" : "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate(`/events/${activeEvent.id}`); }}
                  >
                    {userRegistration?.status === 'Approved' ? (
                      <span className="flex items-center gap-2 justify-center"><Check className="h-5 w-5" /> JOINED</span>
                    ) : (
                      <span className="flex items-center gap-2 justify-center"><Clock className="h-5 w-5 animate-pulse" /> PENDING APPROVAL</span>
                    )}
                  </Button>
                ) : activeEvent.registered < activeEvent.capacity ? (
                  <div className="space-y-4 w-full">
                    {showAccommodationQuestion && (
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-black text-brand-purple dark:text-brand-purple block mb-2 text-center uppercase tracking-tight flex items-center justify-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></span>
                          Required: Support Needed? (Helps us Prepare)
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
                    )}
                    <Button fullWidth size="lg" className="shadow-lg shadow-brand-cyan/20" onClick={handleRegister} disabled={needsAccommodation === null}>
                      {needsAccommodation === null ? 'Selection Required to Sign Up' : user ? 'Register Now' : 'Sign in to Register'}
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
                  onNavigate(`/events/${activeEvent.id}`);
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


export default function Events() {
  const { events, isLoading, eventRegistrations } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedEvents, setLikedEvents] = useState<Record<string, boolean>>({});
  const [, setLikeCounts] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Filter and sort events based on active tab - memoized to prevent lag during carousel transitions
  const filteredEvents = React.useMemo(() => {
    return events.filter(event => {
      const eventDate = parseDateLocal(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!eventDate) return activeTab === 'all';
      if (activeTab === 'upcoming') return eventDate >= today;
      if (activeTab === 'past') return eventDate < today;
      return true;
    }).sort((a, b) => {
      const dateA = parseDateLocal(a.date)?.getTime() || 0;
      const dateB = parseDateLocal(b.date)?.getTime() || 0;
      return activeTab === 'past' ? dateB - dateA : dateA - dateB;
    });
  }, [events, activeTab]);

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

    const basePath = window.location.pathname.replace(/\/events\/?$/, '');
    const shareUrl = `${window.location.origin}${basePath}/events/${event.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const safeActiveIndex = activeIndex >= filteredEvents.length ? 0 : activeIndex;
  const activeEvent = filteredEvents[safeActiveIndex];

  const activeEventRegistration = React.useMemo(() => {
    if (!user || !eventRegistrations || !activeEvent) return null;
    return [...eventRegistrations].reverse().find(r => 
      r.eventId === activeEvent.id && 
      (
        r.userId === user.id || 
        r.userEmail === user.email ||
        (r.userId && user.email && r.userId.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (r.userEmail && user.email && r.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      )
    );
  }, [user, eventRegistrations, activeEvent]);

  return (
    <div className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[80vh] flex flex-col pt-32">
      <StagedFadeIn>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Upcoming Events & Classes</h1>
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

      {isLoading && events.length === 0 ? (
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
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          {activeTab === 'upcoming' ? (
            /* Upcoming Vertical List View */
            <div className="flex flex-col gap-6 mb-12">
              {filteredEvents.map((event, index) => (
                <EventCardShort 
                  key={event.id} 
                  event={event} 
                  onNavigate={(path) => navigate(path)}
                  priority={index < 2} // Prioritize first two for LCP
                />
              ))}
            </div>
          ) : (
            /* All / Past Carousel View */
            <div
              className={`relative w-full ${activeEvent.mediaLink ? 'max-w-7xl' : 'max-w-5xl'} mx-auto transition-all duration-500 mb-12`}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {(() => {
                const evDate = activeEvent ? parseDateLocal(activeEvent.date) : null;
                const isPastEvent = evDate && evDate < new Date(new Date().setHours(0, 0, 0, 0));
                
                return (
                  <Link to={`/events/${activeEvent.id}`} className="block group cursor-pointer">
                    <CardContent
                      activeEvent={activeEvent}
                      activeTab={activeTab}
                      likedEvents={likedEvents}
                      likeCounts={{}}
                      toggleLike={toggleLike}
                      handleShare={handleShare}
                      copiedId={copiedId}
                      isPast={!!isPastEvent}
                      onNavigate={(p) => navigate(p)}
                      userRegistration={activeEventRegistration}
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
          )}

          {/* Load More Button */}
          {useData().hasMoreEvents && (
            <div className="flex justify-center mb-12">
              <Button 
                variant="ghost" 
                onClick={() => useData().fetchMoreEvents()}
                className="text-sky-600 dark:text-sky-400 border border-sky-400/20 hover:bg-sky-50 dark:hover:bg-sky-500/10 font-black uppercase tracking-widest text-[11px] px-10 py-4 rounded-full shadow-sm"
              >
                Load More Events
              </Button>
            </div>
          )}
        </div>
      )}


      {/* Host CTA */}
      <StagedFadeIn delay={0.3}>
        <div className="mt-16 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl p-10 text-center border border-sky-100 dark:border-slate-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="h-24 w-24 text-sky-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase">Become an Event Host</h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 text-lg font-medium">Interested in facilitating inclusive play in your neighborhood? We provide all materials and guidance.</p>
          <Button size="lg" className="px-10" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
            Inquire to Host <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </StagedFadeIn>

      {/* Guarantee Banner */}
      <StagedFadeIn delay={0.4}>
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
}
