import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, FileText, Users, Quote, ArrowRight, ChevronLeft, ChevronRight, X, Youtube, Image as ImageIcon, Instagram, Facebook, HeartPulse, Star, Send, Share, Link as LinkIcon, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BYLAWS_HIGHLIGHTS } from '../constants';
import { useData } from '../context/DataContext';
import { Testimonial } from '../types';
import RichText, { extractMedia } from '../components/RichText';
import Logo from '../components/Logo';
import DonationQR from '../components/DonationQR';
import Button from '../components/Button';
const About: React.FC = () => {
  const { testimonials, addTestimonial } = useData();
  const { user, loginWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const approvedTestimonials = testimonials.filter(t => t.status === 'Approved');

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'Idle' | 'Submitting' | 'Success' | 'Error'>('Idle');
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  
  // Form State
  const [newStory, setNewStory] = useState({
      author: user?.name || '',
      role: '',
      content: '',
      rating: 5,
      avatar: ''
  });

  // Pre-fill author when user logs in
  useEffect(() => {
      if (user) {
          setNewStory(prev => ({ 
              ...prev, 
              author: prev.author || user.name,
              // Pre-fill Google avatar if no custom image is set yet
              avatar: prev.avatar || user.avatar || ''
          }));
      }
  }, [user]);

  // Deep-linking: check for share=story
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('share') === 'story') {
        setIsSubmittingStory(true);
        // Clean up URL parameter without page reload
        navigate('/about', { replace: true });
    }
    
    // Check for anchors
    if (location.hash) {
        const id = location.hash.slice(1);
        const element = document.getElementById(id);
        if (element) {
            setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 500);
        }
    }
  }, [location.search, location.hash, navigate]);

  const modalRef = useRef<HTMLDivElement>(null);
  const submissionModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTestimonial) {
        setSelectedTestimonial(null);
      }
    };

    if (selectedTestimonial || isSubmittingStory) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        if (selectedTestimonial) modalRef.current?.focus();
        else if (isSubmittingStory) submissionModalRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedTestimonial, isSubmittingStory]);

  const handleSubmitStory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setSubmissionStatus('Submitting');
      
      const result = await addTestimonial({
          author: newStory.author,
          role: newStory.role || 'Community Member',
          content: newStory.content,
          avatar: newStory.avatar,
          rating: newStory.rating,
          authorEmail: user.email,
          userId: user.id
      });

      if (result.success) {
          setSubmissionStatus('Success');
          setNewStory({ author: user.name, role: '', content: '', rating: 5, avatar: '' });
          setTimeout(() => {
              setIsSubmittingStory(false);
              setSubmissionStatus('Idle');
          }, 3000);
      } else {
          setSubmissionStatus('Error');
      }
  };

  const copyShareLink = (id?: string) => {
    const baseUrl = window.location.origin;
    const finalUrl = id ? `${baseUrl}/about#${id}` : `${baseUrl}/story`;
    
    navigator.clipboard.writeText(finalUrl);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStory(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl mb-4">About Us</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We are a California Nonprofit Public Benefit Corporation dedicated to fostering inclusive communities for children of all abilities.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Our Purpose</h2>
            <div className="prose prose-slate dark:prose-invert">
              <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                The specific purpose of this corporation is to foster inclusive events for neurodivergent and neurotypical kids. Through weekly classes and events, we promote equality, compassion, and community in California and beyond.
              </p>
              <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                We aim to raise public awareness about the importance of early intervention and therapy to support the developmental needs of these children, while creating inclusive spaces where specially-abled individuals are embraced and integrated into society.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-12 w-1 bg-sky-500 rounded-full"></div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-bold">Incorporated</p>
                <p className="text-slate-900 dark:text-white font-medium">September 15, 2025</p>
              </div>
              <div className="ml-8">
                <p className="text-sm text-slate-600 dark:text-slate-400 uppercase tracking-wide font-bold">Entity Type</p>
                <p className="text-slate-900 dark:text-white font-medium">501(c)(3) Nonprofit</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Leadership Team</h2>

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
              <img
                src="./liji_chalatil.png"
                alt="Liji Chalatil"
                className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-sky-400 flex-shrink-0"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Liji Chalatil</h3>
                <p className="text-sky-600 dark:text-sky-400 text-sm font-medium">Founder, President &amp; CEO</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Visionary leader advocating for neurodiversity.</p>
              </div>
            </div>

            <div className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700">
              <img
                src="./ajith_chandran.png"
                alt="Ajith Chandran"
                className="h-20 w-20 rounded-full object-cover shadow-md border-2 border-sky-500 flex-shrink-0"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ajith Chandran</h3>
                <p className="text-sky-600 dark:text-sky-400 text-sm font-medium">Secretary &amp; CTO</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Dedicated to operational excellence and community outreach.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Board Members Section */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Board of Directors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Anoop Nair",
                description: "Committed to building inclusive environments where every child belongs.",
                hasPhoto: false
              },
              {
                name: "Naveed Shaik",
                description: "Passionate about community outreach and fostering equality.",
                hasPhoto: true
              },
              {
                name: "Prasanth Thomas",
                description: "Dedicated to making a difference through compassion and community support.",
                hasPhoto: false
              },
              {
                name: "Gopal Valsan",
                description: "Advocating for neurodiversity and building bridges in our community.",
                hasPhoto: false
              }
            ].map((member, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 hover:shadow-md">
                <div className="relative mb-4">
                  {member.hasPhoto ? (
                    <img
                      src="/board_member_placeholder_naveed.jpg"
                      alt={member.name}
                      className="h-24 w-24 rounded-full object-cover shadow-md border-2 border-sky-400 mx-auto"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 mx-auto flex items-center justify-center">
                      <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{member.name}</h3>
                  <p className="text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest mt-1 mb-3">Board Member</p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm border-t border-slate-100 dark:border-slate-700/50 pt-3">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="voices" className="mb-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Quote className="h-8 w-8 text-sky-500" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Voices of our Community</h2>
            </div>
            <Button 
                onClick={() => setIsSubmittingStory(true)}
                variant="primary" 
                size="sm"
                className="group/btn"
            >
                Share Your Story <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>

          {approvedTestimonials.length > 0 ? (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {approvedTestimonials.slice(currentTestimonialIndex, currentTestimonialIndex + 3).map((item) => {
                  const { isTruncated, text } = getTruncatedContent(item.content);

                  return (
                    <div 
                        key={item.id} 
                        id={item.id}
                        className="bg-white dark:bg-slate-800 border-t-4 border-sky-500 rounded-xl shadow-sm p-8 relative flex flex-col justify-between transition-colors animate-in fade-in duration-500 group cursor-pointer hover:shadow-md border border-slate-200 dark:border-slate-700" 
                        onClick={() => setSelectedTestimonial(item)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                            <Quote className="h-8 w-8 text-sky-200 dark:text-sky-900/50" />
                            <div className="flex flex-col items-end gap-2">
                                {item.rating && (
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-3.5 w-3.5 ${i < (item.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                                        ))}
                                    </div>
                                )}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyShareLink(item.id);
                                    }}
                                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-all text-slate-400 hover:text-sky-500"
                                    title="Copy link to this story"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {(() => {
                          // Check for media in both the content AND the dedicated media/avatar field
                          let media = extractMedia(item.content) || (item.avatar ? extractMedia(item.avatar) : null);
                          
                          // If still no rich media found but we have an avatar, treat it as a direct image
                          if (!media && item.avatar) {
                            media = {
                              url: item.avatar,
                              type: 'image',
                              thumbnail: item.avatar
                            };
                          }

                          if (!media) return null;

                          const getPlatformDetails = () => {
                            switch (media.type) {
                              case 'youtube': return { icon: <Youtube className="h-6 w-6" />, color: 'bg-red-600', label: 'YouTube' };
                              case 'instagram': return { icon: <Instagram className="h-6 w-6" />, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', label: 'Instagram' };
                              case 'facebook': return { icon: <Facebook className="h-6 w-6" />, color: 'bg-blue-600', label: 'Facebook' };
                              case 'google-photos': return { icon: <ImageIcon className="h-6 w-6" />, color: 'bg-sky-500', label: 'Photo Album' };
                              default: return { icon: <ImageIcon className="h-6 w-6" />, color: 'bg-slate-500', label: 'Media' };
                            }
                          };

                          const details = getPlatformDetails();

                          return (
                            <div className="relative mb-6 rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 shadow-inner group-hover:border-sky-500/50 transition-colors">
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
                <div className="flex justify-center items-center gap-4 mt-8">
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
              <div className="bg-white dark:bg-slate-800 border-t-4 border-sky-500 shadow-sm p-8 relative flex flex-col justify-between transition-colors border border-slate-200 dark:border-slate-700 rounded-xl">
                <div>
                  <Quote className="h-8 w-8 text-sky-200 dark:text-sky-900/50 mb-4" />
                  <p className="text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed text-sm text-balance">
                    "Check back soon to hear from our wonderful families and supporters..."
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bylaws Section */}
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organization Bylaws & Standards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BYLAWS_HIGHLIGHTS.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-sky-500 flex-shrink-0" />
                <p className="text-slate-700 dark:text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <button
              onClick={() => setSelectedTestimonial(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-full backdrop-blur-sm transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shadow-sm"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

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
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-slate-900/95 to-transparent"></div>
            </div>

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
                <div className="pt-10 sm:pt-12 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                        <h4 id="modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedTestimonial.author}</h4>
                        <p className="text-sm sm:text-base text-sky-600 dark:text-sky-400 font-semibold tracking-wider uppercase">{selectedTestimonial.title || selectedTestimonial.role}</p>
                    </div>
                    {selectedTestimonial.rating && (
                        <div className="flex gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < (selectedTestimonial.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                            ))}
                        </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <Quote className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 h-12 w-12 sm:h-16 sm:w-16 text-slate-100 dark:text-slate-800 -z-10" />
                
                {/* If the avatar field holds a media link (like YouTube), render it at the top of the modal content */}
                {selectedTestimonial?.avatar && extractMedia(selectedTestimonial.avatar) && (
                  <div className="mb-6">
                    <RichText 
                      content={selectedTestimonial.avatar}
                      className="mb-0"
                    />
                  </div>
                )}
                
                <RichText
                  content={selectedTestimonial.content}
                  className="text-slate-700 dark:text-slate-300 text-base sm:text-lg font-medium pb-4"
                />
              </div>
            </div>

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

      {/* Success/Link Copy Notification Popup */}
      {showCopyFeedback && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
                  <ClipboardCheck className="h-5 w-5 text-brand-cyan" />
                  <span className="text-sm font-bold uppercase tracking-widest whitespace-nowrap">Link Copied to Clipboard!</span>
              </div>
          </div>
      )}

      {/* Story Submission Modal */}
      {isSubmittingStory && (
          <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => submissionStatus !== 'Submitting' && setIsSubmittingStory(false)}
          >
              <div 
                className="relative w-full max-w-lg h-[90dvh] sm:h-auto sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-500 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
                ref={submissionModalRef}
                tabIndex={-1}
              >
                  {submissionStatus === 'Success' ? (
                      <div className="p-12 text-center flex flex-col items-center">
                          <div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 animate-bounce">
                              <CheckCircle className="h-10 w-10" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Story Received!</h3>
                          <p className="text-slate-600 dark:text-slate-400">Thank you for sharing your experience. We will review and publish it shortly.</p>
                      </div>
                  ) : submissionStatus === 'Error' ? (
                      <div className="p-12 text-center flex flex-col items-center">
                          <div className="h-20 w-20 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6">
                              <X className="h-10 w-10" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Submission Failed</h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs">We encountered an error while saving your story. This is likely because the database needs to be updated.</p>
                          <Button 
                              onClick={() => setSubmissionStatus('Idle')}
                              className="w-full h-12 text-sm font-black uppercase tracking-widest"
                          >
                              Try Again
                          </Button>
                      </div>
                  ) : !user ? (
                      <div className="p-12 text-center flex flex-col items-center">
                          <div className="h-16 w-16 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mb-6">
                              <Quote className="h-8 w-8" />
                          </div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sign in to Share</h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xs">Please sign in with Google to share your story with our community.</p>
                          
                          <Button 
                            onClick={() => {
                                localStorage.setItem('authReturnTo', '/about?share=story');
                                loginWithGoogle();
                            }}
                            className="w-full h-12 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3"
                          >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax-loader.gif" alt="" className="hidden" />
                            Continue with Google
                          </Button>
                          <button 
                            onClick={() => setIsSubmittingStory(false)}
                            className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            Maybe later
                          </button>
                      </div>
                  ) : (
                      <>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Share Your Story</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mt-0.5">Voices of our community</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => copyShareLink()}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-sky-500"
                                    title="Copy share link for this form"
                                >
                                    <Share className="h-5 w-5" />
                                </button>
                                <button 
                                    onClick={() => setIsSubmittingStory(false)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                          <form onSubmit={handleSubmitStory} className="p-6 space-y-6 pb-20 sm:pb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
                                    <input 
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm"
                                        placeholder="e.g. Jane Doe"
                                        value={newStory.author}
                                        onChange={e => setNewStory({...newStory, author: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Role</label>
                                    <input 
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm"
                                        placeholder="e.g. Parent, Donor"
                                        value={newStory.role}
                                        onChange={e => setNewStory({...newStory, role: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Story</label>
                                <textarea 
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm resize-none"
                                    placeholder="Tell us about your experience..."
                                    value={newStory.content}
                                    onChange={e => setNewStory({...newStory, content: e.target.value})}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Add a Photo / Media Link <span className="opacity-50 font-normal ml-1">(Optional)</span></label>
                                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-cyan/50 transition-all group">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="relative group/file">
                                            <input 
                                                type="file" 
                                                id="testimonial-image"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                            <label 
                                                htmlFor="testimonial-image"
                                                className="flex flex-col items-center justify-center h-24 w-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-brand-cyan/5 dark:hover:bg-brand-cyan/10 transition-all relative overflow-hidden"
                                            >
                                                {newStory.avatar ? (
                                                    <>
                                                        <img src={newStory.avatar} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity">
                                                            <ImageIcon className="h-6 w-6 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1.5 p-2 text-center">
                                                        <ImageIcon className="h-6 w-6 text-slate-400" />
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 leading-tight uppercase tracking-wider">From Computer</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">OR PASTE URL</span>
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                                            </div>
                                            <input 
                                                type="url"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm"
                                                placeholder="Paste Image/Media URL..."
                                                value={newStory.avatar && !newStory.avatar.startsWith('data:') ? newStory.avatar : ''}
                                                onChange={e => setNewStory({...newStory, avatar: e.target.value})}
                                            />
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic leading-tight">Paste a link to any image or video thumbnail</p>
                                        </div>
                                    </div>
                                    
                                    {/* Google Profile Photo Indicator */}
                                    {user?.avatar && newStory.avatar === user.avatar && (
                                        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-100 dark:border-sky-800/50">
                                            <div className="h-5 w-5 rounded-full overflow-hidden border border-sky-200 dark:border-sky-700">
                                                <img src={user.avatar} alt="Google Profile" className="h-full w-full object-cover" />
                                            </div>
                                            <span className="text-[9px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest leading-none">Using your Google profile photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <label className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block text-center">Your Rating</label>
                                <div className="flex justify-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewStory({...newStory, rating: star})}
                                            className="transition-transform active:scale-90 hover:scale-110"
                                        >
                                            <Star 
                                                className={`h-8 w-8 transition-colors ${
                                                    star <= newStory.rating 
                                                        ? 'fill-amber-400 text-amber-400' 
                                                        : 'text-slate-200 dark:text-slate-700'
                                                }`} 
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-12 text-sm font-black uppercase tracking-widest"
                                disabled={submissionStatus === 'Submitting'}
                            >
                                {submissionStatus === 'Submitting' ? 'Sending...' : (
                                    <span className="flex items-center justify-center gap-2">
                                        Submit Story <Send className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default About;