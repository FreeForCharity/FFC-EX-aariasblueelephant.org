
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Share2, Heart, Check, HeartHandshake } from 'lucide-react';
import Button from '../components/Button';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';
import RichText from '../components/RichText';
import { formatDateLocal } from '../lib/utils';
import { Event } from '../types';
import ResilientImage from '../components/ResilientImage';


export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { events, eventRegistrations, registerForEvent, isLoading, hasInitialFetch } = useData();
  
  const eventFromContext = events.find(e => e.id === id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullEvent, setFullEvent] = useState<Event | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const { fetchEventDetails } = useData();

  useEffect(() => {
    const getDetails = async () => {
      if (!id) return;
      
      // If we have the image already, no need to fetch
      if (eventFromContext?.image) {
        setFullEvent(eventFromContext);
        return;
      }

      setIsFetchingDetails(true);
      try {
        const details = await fetchEventDetails(id);
        if (details) {
          setFullEvent(details);
        }
      } catch (err) {
        console.error("Failed to fetch event details:", err);
      } finally {
        setIsFetchingDetails(false);
      }
    };

    getDetails();
  }, [id, eventFromContext, fetchEventDetails]);

  // Use fullEvent if available, fallback to context version
  const event = fullEvent || eventFromContext;
  
  if (isLoading || (isFetchingDetails && !event)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-dark">
        <div className="h-12 w-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event && !registrationSubmitted) {
    if (!hasInitialFetch) {
       return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-dark">
          <div className="h-12 w-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    return <Navigate to="/events" replace />;
  }

  const eventDate = new Date(event.date.replace(/-/g, '/'));
  const isPastEvent = eventDate < new Date(new Date().setHours(0, 0, 0, 0));
  
  const userRegistration = React.useMemo(() => {
    if (!user || !eventRegistrations) return null;
    return [...eventRegistrations].reverse().find(r => 
      r.eventId === (event?.id || id) && 
      (
        r.userId === user.id || 
        r.userEmail === user.email ||
        (r.userId && user.email && r.userId.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
        (r.userEmail && user.email && r.userEmail.toLowerCase().trim() === user.email.toLowerCase().trim())
      )
    );
  }, [user, eventRegistrations, event?.id, id]);
  
  const isRegistered = !!userRegistration;
  const registrationStatus = userRegistration?.status;

  const handleRegister = async (pref: boolean) => {
    if (!user) {
      localStorage.setItem('pendingEventId', event.id);
      localStorage.setItem('pendingAccommodation', String(pref));
      window.scrollTo(0, 0);
      navigate(`/login?returnTo=/events/${event.id}`);
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
        window.scrollTo(0, 0);
      } else {
        alert("Registration failed: " + result.error);
      }
    } catch (err) {
      console.error("Registration crash prevented:", err);
      alert("A temporary error occurred during registration. Please try refreshing or contact support if this persists.");
    }
  };

  const showAccommodationQuestion = event.type === 'Event' || event.type === 'Class';

  useEffect(() => {
    const handleAutoRegister = async (pendingEventId: string, pendingAccommodation: string | null) => {
      if (user && event && !isLoading && !isRegistered) {
        if (pendingEventId === event.id && pendingAccommodation !== null) {
          // Clear pending items
          localStorage.removeItem('pendingEventId');
          localStorage.removeItem('pendingAccommodation');
          
          // Auto-register
          const result = await registerForEvent({
            eventId: event.id,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            specialNeeds: pendingAccommodation === 'true',
          });
          
          if (result.success) {
            setRegistrationSubmitted(true);
          } else {
            console.error("Auto-registration failed:", result.error);
          }
        }
      }
    };

    const pendingEventId = localStorage.getItem('pendingEventId');
    const pendingAccommodation = localStorage.getItem('pendingAccommodation');
    if (pendingEventId) {
      handleAutoRegister(pendingEventId, pendingAccommodation);
    }
  }, [user, event, isLoading, isRegistered, registerForEvent]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-brand-dark pt-20">
      {/* Hero Image with Overlay */}
      <div className="relative h-[40vh] w-full overflow-hidden lg:h-[50vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-brand-dark/50 dark:to-brand-dark z-10" />
        <ResilientImage
          id={event.id}
          table="events"
          column="image"
          alt={event.title}
          className="h-full w-full"
          fallbackImage={DEFAULT_EVENT_IMAGE}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute top-4 left-4 z-20">
          <Link to="/events"
            className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-20 mx-auto -mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        {registrationSubmitted ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500 max-w-2xl mx-auto mb-10">
            <div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400 animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Registration Successful!
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-8">
              Thank you for registering for <span className="font-bold text-brand-cyan">{event.title}</span>. Your registration is currently <span className="font-bold text-amber-500">Pending Approval</span>. You will receive an update once our team reviews your request.
            </p>
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-6 mb-8 border border-sky-100 dark:border-sky-800/50">
              <p className="text-sky-800 dark:text-sky-300 font-medium mb-3">Want to amplify your impact right now?</p>
              <p className="text-sky-600 dark:text-sky-400 text-sm mb-4">
                Your support helps us keep our events and events free for all families.
              </p>
              <Link to="/#join-herd"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cyan text-white rounded-full font-bold hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-500/25"
                onClick={() => setRegistrationSubmitted(false)}
              >
                Signify Impact with a Donation <HeartHandshake className="h-4 w-4" />
              </Link>
            </div>
            <Button variant="ghost" onClick={() => setRegistrationSubmitted(false)} className="text-slate-500 dark:text-slate-400">
              Back to Event Details
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header Section */}
            <div className="border-b border-slate-200 dark:border-slate-800 p-6 sm:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${event.type === 'Class' ? 'bg-blue-500/20 text-blue-400' :
                        event.type === 'Fundraiser' ? 'bg-green-500/20 text-green-400' :
                          event.type === 'Outreach' ? 'bg-orange-500/20 text-orange-500 dark:text-orange-400' :
                            event.type === 'Advocacy' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                              'bg-brand-purple/20 text-brand-purple'}`}>
                      {event.type}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">{event.title}</h1>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-500 dark:text-slate-400 transition-all hover:border-brand-pink hover:text-brand-pink"
                  >
                    <Heart className={`h-6 w-6 ${isLiked ? 'fill-brand-pink text-brand-pink' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-500 dark:text-slate-400 transition-all hover:border-brand-cyan hover:text-brand-cyan"
                  >
                    {isCopied ? <Check className="h-6 w-6 text-green-500 dark:text-green-400" /> : <Share2 className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Left Column: Details */}
              <div className="col-span-2 p-6 sm:p-10 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800 order-last lg:order-none">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About this Event</h2>
                <div className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 mb-8 whitespace-pre-line">
                  {event.description}
                </div>

                {event.mediaLink && (
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Event Media</h3>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                      <RichText content={event.mediaLink} className="text-slate-600 dark:text-slate-300" />
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">What to expect</h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-8">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-cyan"></div>
                    <span>Inclusive environment for all abilities</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-cyan"></div>
                    <span>Small group sizes for better engagement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-cyan"></div>
                    <span>Materials and sensory tools provided</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Logistics sidebar */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-6 sm:p-10 order-first lg:order-none border-b lg:border-b-0 border-slate-200 dark:border-slate-800 shadow-inner lg:shadow-none">
                <div className="space-y-6">

                  {/* Registration Action Block - Moved to Top */}
                  <div className="pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
                    {isRegistered ? (
                      registrationStatus === 'Pending' ? (
                        <Button fullWidth size="lg" variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm" disabled>
                          <div className="flex items-center gap-2 justify-center">
                            <Clock className="h-5 w-5 animate-pulse" /> PENDING APPROVAL
                          </div>
                        </Button>
                      ) : (
                        <Button fullWidth size="lg" variant="primary" className="bg-green-600 hover:bg-green-700 text-white border-none shadow-lg shadow-green-500/20" disabled>
                          <div className="flex items-center gap-2 justify-center">
                            <Check className="h-5 w-5" /> JOINED
                          </div>
                        </Button>
                      )
                    ) : isPastEvent ? (
                      <div className="space-y-4">
                        <Button fullWidth size="lg" variant="secondary" disabled>
                          Event Concluded
                        </Button>
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-center">
                          <p className="text-amber-800 dark:text-amber-400 font-medium">
                            Missed the event? No worries!
                          </p>
                          <Link to="/events" className="text-sm text-amber-600 dark:text-amber-300 hover:underline mt-1 inline-block">
                            Check out our upcoming events here →
                          </Link>
                        </div>
                      </div>
                    ) : event.registered < event.capacity ? (
                       <div className="space-y-4">
                         {showAccommodationQuestion && (
                           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-brand-purple/20 dark:border-brand-purple/30 shadow-xl overflow-hidden relative">
                             {/* Decorative accent */}
                             <div className="absolute top-0 left-0 w-full h-1 bg-brand-purple"></div>
                             
                             <label className="text-lg font-[900] text-brand-purple dark:text-brand-purple block mb-2 uppercase tracking-tight flex items-center gap-2">
                               <span className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-pulse"></span>
                               SUPPORT SELECTION REQUIRED TO SIGN UP
                             </label>
                             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                               To help us provide the best experience, please select your support level below to complete your registration.
                             </p>
                             
                             <div className="flex flex-col gap-3">
                               <Button
                                 fullWidth
                                 size="lg"
                                 className="py-6 shadow-lg shadow-slate-200 dark:shadow-none font-black text-sm tracking-widest"
                                 onClick={() => handleRegister(false)}
                               >
                                 SIGN UP (NO SUPPORT)
                               </Button>
                               <Button
                                 fullWidth
                                 size="lg"
                                 variant="outline"
                                 className="py-6 border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white font-black text-sm tracking-widest"
                                 onClick={() => handleRegister(true)}
                               >
                                 SIGN UP (WITH SUPPORT)
                               </Button>
                             </div>
                           </div>
                         )}

                         {!showAccommodationQuestion && (
                           <Button
                            fullWidth
                            size="lg"
                            className="py-6 shadow-xl shadow-brand-cyan/20 transform transition hover:-translate-y-1 font-black tracking-widest"
                            onClick={() => handleRegister(false)}
                          >
                            REGISTER NOW
                          </Button>
                         )}
                       </div>
                    ) : (
                      <Button fullWidth size="lg" variant="secondary" disabled>
                        Event Full
                      </Button>
                    )}
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-200 dark:bg-slate-700 p-2">
                      <Calendar className="h-6 w-6 text-brand-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Date</p>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatDateLocal(event.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-200 dark:bg-slate-700 p-2">
                      <Clock className="h-6 w-6 text-brand-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Time</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{event.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-200 dark:bg-slate-700 p-2">
                      <MapPin className="h-6 w-6 text-brand-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Location</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{event.location}</p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-cyan hover:underline mt-1 block"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-200 dark:bg-slate-700 p-2">
                      <Users className="h-6 w-6 text-brand-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Availability</p>
                      <div className="mt-1 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple"
                          style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                        ></div>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {event.capacity - event.registered} spots remaining
                      </p>
                    </div>
                  </div>

                  {/* Free Event Notice */}
                  <div className="mt-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-colors duration-300 shadow-sm group text-center">
                    <div className="flex items-center gap-3 mb-2 justify-center">
                      <HeartHandshake className="h-5 w-5 text-sky-600 dark:text-sky-400 group-hover:text-sky-500 transition-colors" />
                      <strong className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors uppercase tracking-wide">100% Free & Inclusive</strong>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Children of all abilities are welcome to play and learn side-by-side. All materials are provided at no cost. Donations are never required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
