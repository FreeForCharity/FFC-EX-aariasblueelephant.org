import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Quote, ArrowRight, ChevronLeft, ChevronRight, X, Youtube, Image as ImageIcon, Instagram, Facebook, Star, Send, Link as LinkIcon, ClipboardCheck, MessageSquare, ChevronDown, ChevronUp, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import RichText, { extractMedia } from './RichText';
import Logo from './Logo';
import Button from './Button';

const TestimonialSection: React.FC = () => {
  const { testimonials, addTestimonial } = useData();
  const { user, loginWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const pendingTestimonial = testimonials.find(t => t.authorEmail === user?.email && t.status === 'Pending');
  const approvedTestimonials = testimonials.filter(t => t.status === 'Approved');

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [selectedTestimonial, setSelectedTestimonial] = useState<any | null>(null);
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'Idle' | 'Submitting' | 'Success' | 'Error'>('Idle');
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]); 

  const toggleExpand = (index: number) => {
    setExpandedIndices(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };
  
  const [newStory, setNewStory] = useState({
      author: user?.name || '',
      role: '',
      content: '',
      rating: 5,
      avatar: user?.avatar || '',
      media: ''
  });

  useEffect(() => {
    if (user) {
      setNewStory(prev => ({ ...prev, author: prev.author || user.name, avatar: user.avatar || prev.avatar || '' }));
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('share') === 'story') {
        setIsSubmittingStory(true);
        navigate('/', { replace: true });
    }
    if (location.hash === '#voices') {
        const el = document.getElementById('voices');
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 500);
    }
  }, [location.search, location.hash, navigate]);

  const modalRef = useRef<HTMLDivElement>(null);
  const submissionModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTestimonial) setSelectedTestimonial(null);
        else if (isSubmittingStory && submissionStatus !== 'Submitting') setIsSubmittingStory(false);
      }
    };

    if (selectedTestimonial || isSubmittingStory) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => (selectedTestimonial ? modalRef.current : submissionModalRef.current)?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedTestimonial, isSubmittingStory, submissionStatus]);

  const handleSubmitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmissionStatus('Submitting');
    const result = await addTestimonial({ ...newStory, authorEmail: user.email, userId: user.id });
    if (result.success) {
      setSubmissionStatus('Success');
      setNewStory({ author: user.name, role: '', content: '', rating: 5, avatar: user.avatar || '', media: '' });
      setTimeout(() => { setIsSubmittingStory(false); setSubmissionStatus('Idle'); }, 3000);
    } else {
      setSubmissionStatus('Error');
    }
  };

  const copyShareLink = (id?: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(id ? `${baseUrl}/#${id}` : `${baseUrl}/story`);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  const getTruncatedContent = (text: string, maxLimit = 120) => {
    if (text.length <= maxLimit) return { isTruncated: false, text };
    let truncated = text.slice(0, maxLimit);
    const lastPunct = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
    if (lastPunct > 50) truncated = truncated.slice(0, lastPunct + 1);
    else {
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 50) truncated = truncated.slice(0, lastSpace);
    }
    return { isTruncated: true, text: truncated };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewStory(prev => ({ ...prev, media: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <section id="voices" className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div className="flex items-center gap-3">
            <Quote className="h-8 w-8 text-sky-500" />
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Voices of our Community</h2>
          </div>
          <Button onClick={() => setIsSubmittingStory(true)} variant="primary" size="lg" className="group/btn shadow-lg shadow-sky-500/20">
            Share Your Story <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>

        {approvedTestimonials.length > 0 ? (
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {approvedTestimonials.slice(currentTestimonialIndex, currentTestimonialIndex + 3).map((item, localIndex) => {
                const globalIndex = currentTestimonialIndex + localIndex;
                const isExpanded = expandedIndices.includes(globalIndex);
                const { isTruncated, text } = getTruncatedContent(item.content, isExpanded ? 5000 : 120);
                let media = item.media ? extractMedia(item.media) : null;
                if (!media && item.media) media = { url: item.media, type: 'image', thumbnail: item.media };
                const mediaDetails = media?.type === 'youtube' ? { icon: <Youtube />, color: 'bg-red-600' } :
                                   media?.type === 'instagram' ? { icon: <Instagram />, color: 'bg-pink-600' } :
                                   media?.type === 'facebook' ? { icon: <Facebook />, color: 'bg-blue-600' } :
                                   { icon: <ImageIcon />, color: 'bg-sky-500' };

                return (
                  <motion.div key={item.id} id={item.id} initial={false} animate={{ scale: isExpanded ? 1 : 0.98, y: isExpanded ? 0 : 5 }} 
                    whileHover={{ scale: isExpanded ? 1 : 1.02, y: isExpanded ? 0 : -5, rotateX: isExpanded ? 0 : 2, rotateY: isExpanded ? 0 : -2 }}
                    className="relative flex flex-col transition-all duration-500 group perspective-1000" style={{ zIndex: 10 - localIndex }}>
                    <div className="glow-iridescent" /><div className="scroll-sparkle scroll-sparkle--1" /><div className="scroll-sparkle scroll-sparkle--2" /><div className="scroll-sparkle scroll-sparkle--3" /><div className="scroll-sparkle scroll-sparkle--4" /><div className="scroll-sparkle scroll-sparkle--5" /><div className="scroll-sparkle scroll-sparkle--6" />
                    <div className="scroll-rod h-5 w-full rounded-full relative z-20 scroll-rod-shadow" />
                    <div className={`parchment-bg -mt-2 -mb-2 p-6 sm:p-8 flex flex-col transition-all duration-700 cursor-pointer relative overflow-hidden ${isExpanded ? 'min-h-[400px]' : 'max-h-[320px]'}`} onClick={() => toggleExpand(globalIndex)}>
                      <div className="glass-sheen" />
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_0_#e2e8f0] dark:shadow-[0_4px_0_#0f172a] border border-slate-200/50 transition-transform group-hover:scale-110">
                          <Quote className="h-6 w-6 text-sky-500" />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-0.5 p-1 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/30 shadow-inner">
                            {[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < (item.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); copyShareLink(item.id); }} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded-md transition-all text-slate-400 hover:text-sky-500" title="Copy link"><LinkIcon className="h-4 w-4" /></button>
                        </div>
                      </div>
                      {media && (
                        <div 
                          className={`relative mb-6 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 transition-all duration-700 ${isExpanded ? 'aspect-video' : 'h-24 opacity-60'}`}
                          onClick={(e) => isExpanded && e.stopPropagation()}
                        >
                          {isExpanded ? (
                            <RichText content={item.media || ''} className="w-full h-full" />
                          ) : (
                            <>
                              {media.thumbnail && <img src={media.thumbnail} alt="" className="w-full h-full object-cover" />}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className={`h-10 w-10 rounded-full ${mediaDetails.color} text-white flex items-center justify-center shadow-lg`}>
                                  {mediaDetails.icon}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <div className={`text-slate-600 dark:text-slate-300 mb-6 italic leading-relaxed text-sm transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[1000px]' : 'max-h-20'}`}>
                        <RichText content={text} className="inline italic" />
                      </div>
                      {isTruncated && <div className="text-sky-600 dark:text-sky-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mb-6 opacity-60 hover:opacity-100 transition-opacity">
                        {isExpanded ? 'Click to Roll Back' : 'Click to Unroll'} {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </div>}
                      <div className="flex items-center gap-4 pt-4 border-t border-slate-200/50 mt-auto relative z-10 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 overflow-hidden shadow-[0_3px_0_#e2e8f0] flex-shrink-0 ring-2 ring-sky-500/20 transition-transform group-hover:scale-105">
                          {item.avatar ? <img src={item.avatar} alt={item.author} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-sky-600 font-extrabold bg-sky-50">{item.author.charAt(0)}</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-800 dark:text-white font-bold truncate text-sm">{item.author}</p>
                          <p className="text-sky-600 dark:text-sky-400 text-[9px] font-black uppercase tracking-[0.2em] truncate">{item.title || item.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="scroll-rod h-5 w-full rounded-full relative z-20 scroll-rod-shadow" />
                  </motion.div>
                );
              })}
            </div>
            {approvedTestimonials.length > 3 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button onClick={() => setCurrentTestimonialIndex(prev => Math.max(0, prev - 3))} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-sky-50 text-sky-600 transition-all hover:scale-110"><ChevronLeft className="w-5 h-5" /></button>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"> {currentTestimonialIndex + 1}-{Math.min(currentTestimonialIndex + 3, approvedTestimonials.length)} / {approvedTestimonials.length} </span>
                <button onClick={() => setCurrentTestimonialIndex(prev => (prev + 3 >= approvedTestimonials.length ? 0 : prev + 3))} className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-sky-50 text-sky-600 transition-all hover:scale-110"><ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Quote className="h-12 w-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" /><p className="text-slate-500 dark:text-slate-400 font-medium italic">"Check back soon..."</p>
          </div>
        )}

        {/* Copy Feedback */}
        <AnimatePresence>
          {showCopyFeedback && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
              <ClipboardCheck className="h-5 w-5 text-sky-400" /><span className="text-sm font-bold uppercase tracking-widest leading-none">Link Copied!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Story Submission Modal */}
        <AnimatePresence>
          {isSubmittingStory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => submissionStatus !== 'Submitting' && setIsSubmittingStory(false)}>
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-lg h-[90dvh] sm:h-auto sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()} ref={submissionModalRef} tabIndex={-1}>
                {submissionStatus === 'Success' ? (
                  <div className="p-12 text-center flex flex-col items-center"><div className="h-20 w-20 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 animate-bounce"><Send className="h-10 w-10" /></div><h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Story Received!</h3><p className="text-slate-600 dark:text-slate-400">Thank you for sharing your experience.</p></div>
                ) : pendingTestimonial ? (
                  <div className="p-12 text-center flex flex-col items-center"><div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-50"><MessageSquare className="h-10 w-10" /></div><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Review in Progress</h2><p className="text-slate-600 dark:text-slate-400 max-w-sm mb-6">You currently have a story waiting for approval.</p><Button variant="ghost" onClick={() => setIsSubmittingStory(false)} className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Close</Button></div>
                ) : submissionStatus === 'Error' ? (
                  <div className="p-12 text-center flex flex-col items-center"><div className="h-20 w-20 bg-red-100 dark:bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mb-6"><X className="h-10 w-10" /></div><h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Submission Failed</h3><Button onClick={() => setSubmissionStatus('Idle')} className="w-full h-12 text-sm font-black uppercase tracking-widest">Try Again</Button></div>
                ) : !user ? (
                  <div className="p-12 text-center flex flex-col items-center"><div className="h-16 w-16 bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center mb-6"><Quote className="h-8 w-8" /></div><h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sign in to Share</h3><Button onClick={() => { localStorage.setItem('authReturnTo', '/?share=story'); loginWithGoogle(); }} className="w-full h-12 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3">Continue with Google</Button></div>
                ) : (
                  <>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center"><div><h3 className="text-xl font-bold text-slate-900 dark:text-white">Share Your Story</h3><p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold mt-0.5">Community Impact</p></div><button onClick={() => setIsSubmittingStory(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="h-5 w-5 text-slate-400" /></button></div>
                    <div className="flex-1 overflow-y-auto overscroll-contain">
                      <form onSubmit={handleSubmitStory} className="p-6 space-y-6 pb-20 sm:pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Name</label><input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" placeholder="Jane Doe" value={newStory.author} onChange={e => setNewStory({...newStory, author: e.target.value})} /></div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Role</label><input className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" placeholder="e.g. Parent, Donor" value={newStory.role} onChange={e => setNewStory({...newStory, role: e.target.value})} /></div>
                        </div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Story</label><textarea required rows={4} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm resize-none" placeholder="Tell us about..." value={newStory.content} onChange={e => setNewStory({...newStory, content: e.target.value})} /></div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Media (Optional)</label>
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-500 transition-all group text-center"><input type="text" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 rounded-xl outline-none text-sm" placeholder="Paste a link (YouTube, Instagram, etc.)" value={newStory.media} onChange={e => setNewStory({...newStory, media: e.target.value})} /></div>
                        </div>
                        <div className="space-y-3 p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center"><label className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">Rating</label><div className="flex justify-center gap-1.5">{[1, 2, 3, 4, 5].map(star => <button key={star} type="button" onClick={() => setNewStory({...newStory, rating: star})} className="transition-transform active:scale-90"><Star className={`h-8 w-8 ${star <= newStory.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} /></button>)}</div></div>
                        <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-sky-500/20" disabled={submissionStatus === 'Submitting'}>{submissionStatus === 'Submitting' ? 'Submitting...' : 'Post Story'}</Button>
                      </form>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default TestimonialSection;
