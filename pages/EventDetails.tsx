import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Share2, Heart, Check, HeartHandshake, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { events, eventRegistrations, registerForEvent, isLoading } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const event = events.find((e) => e.id === id);
  const isPastEvent = event ? new Date(event.date) < new Date(new Date().setHours(0, 0, 0, 0)) : false;

  const userRegistration = user && event ? eventRegistrations.find(r => r.eventId === event.id && r.userId === user.email) : null;
  const isRegistered = !!userRegistration;
  const registrationStatus = userRegistration?.status;

  const handleRegister = () => {
    if (!user) {
      window.scrollTo(0, 0);
      navigate('/login', { state: { returnTo: `/events/${event?.id}` } });
      return;
    }
    if (event) {
      registerForEvent({
        eventId: event.id,
        userId: user.email,
        userName: user.name,
        userEmail: user.email,
      });
      setRegistrationSubmitted(true);
      window.scrollTo(0, 0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="h-12 w-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event Not Found</h1>
        <p className="mb-6 text-slate-500 dark:text-slate-400">The event you are looking for does not exist or has been removed.</p>
        <Link to="/events">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const handleShare = async () => {
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
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-brand-dark">
      {/* Hero Image with Overlay */}
      <div className="relative h-[40vh] w-full overflow-hidden lg:h-[50vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-brand-dark/50 dark:to-brand-dark z-10" />
        <img
          src={event.image || DEFAULT_EVENT_IMAGE}
          alt={event.title}
          className="h-full w-full object-cover"
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
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-20 mx-auto -mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
        {registrationSubmitted ? (
          <div className="bg-white dark:bg-brand-card rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500 max-w-2xl mx-auto mb-10">
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
                Your support helps us keep our playgroups and events free for all families.
              </p>
              <a
                href="/#join-herd"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cyan text-white rounded-full font-bold hover:bg-sky-500 transition-all shadow-lg hover:shadow-sky-500/25"
                onClick={() => setRegistrationSubmitted(false)}
              >
                Signify Impact with a Donation <HeartHandshake className="h-4 w-4" />
              </a>
            </div>
            <Button variant="ghost" onClick={() => setRegistrationSubmitted(false)} className="text-slate-500 dark:text-slate-400">
              Back to Event Details
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-brand-card border border-slate-200 dark:border-slate-700 shadow-2xl">
            {/* Header Section */}
            <div className="border-b border-slate-200 dark:border-slate-700 p-6 sm:p-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                      ${event.type === 'Class' ? 'bg-blue-500/20 text-blue-400' :
                        event.type === 'Fundraiser' ? 'bg-green-500/20 text-green-400' : 'bg-brand-purple/20 text-brand-purple'}`}>
                      {event.type}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">{event.title}</h1>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-slate-500 dark:text-slate-400 transition-all hover:border-brand-pink hover:text-brand-pink"
                  >
                    <Heart className={`h-6 w-6 ${isLiked ? 'fill-brand-pink text-brand-pink' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-3 text-slate-500 dark:text-slate-400 transition-all hover:border-brand-cyan hover:text-brand-cyan"
                  >
                    {isCopied ? <Check className="h-6 w-6 text-green-500 dark:text-green-400" /> : <Share2 className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              {/* Left Column: Details */}
              <div className="col-span-2 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About this Event</h2>
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 mb-8 whitespace-pre-line">
                  {event.description}
                </p>

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
              <div className="bg-slate-50 dark:bg-slate-800/30 p-6 sm:p-10">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-200 dark:bg-slate-700 p-2">
                      <Calendar className="h-6 w-6 text-brand-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Date</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
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

                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    {!user ? (
                      <Button
                        fullWidth
                        size="lg"
                        className="shadow-xl shadow-brand-cyan/10"
                        onClick={() => navigate('/login', { state: { returnTo: `/events/${event.id}` } })}
                      >
                        Sign in to Register
                      </Button>
                    ) : isRegistered ? (
                      registrationStatus === 'Pending' ? (
                        <Button fullWidth size="lg" variant="secondary" disabled>
                          Waiting for Approval
                        </Button>
                      ) : (
                        <Button fullWidth size="lg" variant="secondary" disabled>
                          Already Registered
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
                      <Button fullWidth size="lg" className="shadow-xl shadow-brand-cyan/10" onClick={handleRegister}>
                        Register Now
                      </Button>
                    ) : (
                      <Button fullWidth size="lg" variant="secondary" disabled>
                        Event Full
                      </Button>
                    )}

                    {/* Free Event Notice */}
                    <div className="mt-4 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-colors duration-300 shadow-sm group">
                      <div className="flex items-center gap-3 mb-2 justify-center">
                        <HeartHandshake className="h-5 w-5 text-sky-600 dark:text-sky-400 group-hover:text-sky-500 transition-colors" />
                        <strong className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors uppercase tracking-wide">100% Free & Inclusive</strong>
                      </div>
                      <p className="text-xs text-center text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        Children of all abilities are welcome to play and learn side-by-side. All materials are provided at no cost. Donations are never required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;