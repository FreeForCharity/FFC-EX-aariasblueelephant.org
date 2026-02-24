import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Users, ArrowLeft, Share2, Heart, Check } from 'lucide-react';
import Button from '../components/Button';
import { DEFAULT_EVENT_IMAGE, DEFAULT_LOCAL_FALLBACK } from '../constants';

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { events, eventRegistrations, registerForEvent } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const event = events.find((e) => e.id === id);

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
      alert("You have successfully registered! Your registration is waiting for approval.");
    }
  };

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
                    <Button fullWidth size="lg" className="shadow-xl shadow-brand-cyan/10" onClick={() => navigate('/login')}>
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
                  <div className="mt-4 p-4 bg-brand-cyan/5 dark:bg-sky-900/20 rounded-xl border border-brand-cyan/20 dark:border-sky-800/40">
                    <p className="text-xs text-center text-slate-700 dark:text-slate-300">
                      <strong className="block text-slate-900 dark:text-white mb-1">100% Free to attend. All materials provided.</strong>
                      We firmly believe financial constraints should never be a barrier. No donation is required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;