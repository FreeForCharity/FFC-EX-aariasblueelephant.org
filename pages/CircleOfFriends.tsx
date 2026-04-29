import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandHelping, BookOpen, Mountain, Stars, Users, Send, X, PlusCircle, Quote, ChevronDown, ChevronUp, Image as ImageIcon, Pencil, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import RichText from '../components/RichText';
import { db } from '../lib/database';
import { useAuth } from '../context/AuthContext';

import { FriendEntry } from '../lib/database/types';

const AWARDS = [
  { id: 'trunk', title: 'The "Trunk of Friendship" Award', subtitle: 'Connecting / Helping', icon: HandHelping, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', image: '/assets/elephants/trunk_friendship_1777051824961.webp' },
  { id: 'mindset', title: 'The "Elephant Mindset" Award', subtitle: 'Learning / Memory / Education', icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', image: '/assets/elephants/elephant_mindset_1777051837375.webp' },
  { id: 'barriers', title: 'The "Stomp Out Barriers" Award', subtitle: 'Environmental / Structural', icon: Mountain, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', image: '/assets/elephants/stomp_barriers_1777051852262.webp' },
  { id: 'leadership', title: 'The "Tusks of Leadership" Award', subtitle: 'Visionary / Action Plan', icon: Stars, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', image: '/assets/elephants/tusks_leadership_1777051868281.webp' }
];

const SCHOOLS = [
  'Altamont', 'Bethany', 'Cordes', 'Evelyn Costa', 'Hansen', 'Lammersville', 'Questa', 'Wicklund', 'Mountain House High School'
];

const GRADES = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

const CATEGORY_OPTIONS = [
  ...AWARDS.map(a => a.title),
  'General Submission'
];

const STORAGE_KEY = 'circleOfFriendsEntries';

const DB_NAME = 'ABE_FriendsDB';
const STORE_NAME = 'entries';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveEntriesToDB = async (entries: FriendEntry[]) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Clear and re-insert
    store.clear();
    entries.forEach(e => store.put(e));
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.error("IndexedDB save failed", err);
  }
};

const getEntriesFromDB = async (): Promise<FriendEntry[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB load failed", err);
    return [];
  }
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


const EntryCardItem = ({ 
  entry, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete,
  onMediaClick,
  isAdmin
}: { 
  entry: FriendEntry; 
  isExpanded: boolean; 
  onToggle: (id: string, e?: React.MouseEvent) => void;
  onEdit: (entry: FriendEntry, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onMediaClick: (images: string[], index: number) => void;
  isAdmin: boolean;
}) => {
  const { isTruncated, text } = getTruncatedContent(entry.content, isExpanded ? 50000 : 120);
  const mediaArray = Array.isArray(entry.media) ? entry.media : (entry.media ? [entry.media] : []);
  const [imgIndex, setImgIndex] = useState(0);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i + 1) % mediaArray.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i - 1 + mediaArray.length) % mediaArray.length);
  };


    return (
      <motion.div 
        initial={false} 
        animate={{ scale: isExpanded ? 1 : 0.98, y: isExpanded ? 0 : 5 }} 
        whileHover={{ scale: isExpanded ? 1 : 1.02, y: isExpanded ? 0 : -5, rotateX: isExpanded ? 0 : 2, rotateY: isExpanded ? 0 : -2 }}
        className="relative flex flex-col transition-all duration-500 group perspective-1000 h-full"
      >
        <div className="glow-iridescent" /><div className="scroll-sparkle scroll-sparkle--1" /><div className="scroll-sparkle scroll-sparkle--2" /><div className="scroll-sparkle scroll-sparkle--3" /><div className="scroll-sparkle scroll-sparkle--4" /><div className="scroll-sparkle scroll-sparkle--5" /><div className="scroll-sparkle scroll-sparkle--6" />
        
        <div className="scroll-rod h-5 w-full rounded-full relative z-20 scroll-rod-shadow">
          <div className="absolute -left-2 -top-1 h-7 w-7 rounded-full rod-cap" />
          <div className="absolute -right-2 -top-1 h-7 w-7 rounded-full rod-cap" />
        </div>
        
        <div 
          className={`parchment-bg -mt-2 -mb-2 p-6 sm:p-8 flex flex-col transition-all duration-700 cursor-pointer relative overflow-hidden flex-1 ${isExpanded ? 'max-h-[5000px] pb-12' : 'max-h-[350px]'}`} 
          onClick={(e) => onToggle(entry.id, e)}
        >
          <div className="glass-sheen" />
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_0_#e2e8f0] dark:shadow-[0_4px_0_#0f172a] border border-slate-200/50 transition-transform group-hover:scale-110">
              <Quote className="h-6 w-6 text-sky-500" />
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">{entry.school}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Grade {entry.grade}</span>
            </div>
          </div>
          
          {mediaArray.length > 0 && (
            <div className={`relative mb-6 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 transition-all duration-700 ${isExpanded ? 'min-h-[300px]' : 'h-32 opacity-80 group-hover:opacity-100'}`}>
              <div className="absolute inset-0 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onMediaClick(mediaArray, imgIndex); }} title="View Full Image"></div>
              
              <AnimatePresence initial={false}>
                <motion.img 
                  key={imgIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={mediaArray[imgIndex]} 
                  alt={`Submission media ${imgIndex + 1}`} 
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </AnimatePresence>

              {mediaArray.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 bg-black/40 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                    {mediaArray.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className={`text-slate-700 dark:text-slate-200 mb-6 italic leading-relaxed text-sm sm:text-base transition-all duration-700 overflow-hidden ${isExpanded ? 'max-h-[5000px]' : 'max-h-24'}`}>
            <RichText content={text} className="inline" />
          </div>
          
          {isTruncated && (
            <div className="text-sky-600 dark:text-sky-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mb-6 opacity-60 hover:opacity-100 transition-opacity mt-auto">
              {isExpanded ? 'Click to Roll Back' : 'Click to Unroll'} {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          )}
          
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200/50 mt-auto relative z-10">
            <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 overflow-hidden shadow-[0_3px_0_#e2e8f0] flex-shrink-0 ring-2 ring-sky-500/20 flex items-center justify-center">
              <span className="text-lg font-black text-sky-600">{entry.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-800 dark:text-white font-bold truncate text-sm">{entry.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">Teacher: {entry.teacher}</p>
            </div>
            {isAdmin && (
              <>
                <button 
                  onClick={(e) => onEdit(entry, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button 
                  onClick={(e) => onDelete(entry.id, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="scroll-rod h-5 w-full rounded-full relative z-20 scroll-rod-shadow" />
      </motion.div>
    );
  };


const CircleOfFriends: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.isBoard || false;

  const [entries, setEntries] = useState<FriendEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.includes(title) ? safePrev.filter(t => t !== title) : [...safePrev, title];
    });
  };
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ images: string[], index: number } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    school: '',
    teacher: '',
    category: 'General Submission',
    content: '',
    media: [] as string[],
    priority: 23
  });

  // Load from database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const dbEntries = await db.getFriendEntries();
        if (dbEntries && dbEntries.length > 0) {
          setEntries(dbEntries);
        } else {
          // If Supabase is empty, fall back to checking if we have local IndexedDB data that hasn't been migrated
          const localEntries = await getEntriesFromDB();
          if (localEntries && localEntries.length > 0) {
            setEntries(localEntries);
          } else {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
              setEntries(JSON.parse(saved));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load entries", e);
      }
    };
    loadData();
  }, []);

  const saveEntries = async (newEntries: FriendEntry[]) => {
    setEntries(newEntries);
    
    // Save to IndexedDB
    await saveEntriesToDB(newEntries);

    // Attempt to save to LocalStorage for fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (e) {
      console.warn("LocalStorage quota exceeded, relying purely on IndexedDB");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const processFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          };
        };
        reader.readAsDataURL(file);
      });
    };

    const compressedImages = await Promise.all(files.map(processFile));
    setFormData(prev => ({ ...prev, media: [...prev.media, ...compressedImages] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntryId) {
        await db.updateFriendEntry(editingEntryId, formData);
        const updatedEntries = entries.map(entry => 
          entry.id === editingEntryId ? { ...entry, ...formData } : entry
        );
        setEntries(updatedEntries);
      } else {
        const newEntry: FriendEntry = {
          ...formData,
          id: Math.random().toString(36).substring(2, 9),
          date: new Date().toISOString()
        };
        await db.createFriendEntry(newEntry);
        setEntries([newEntry, ...entries]);
      }
      
      setFormData({ name: '', grade: '', school: '', teacher: '', category: 'General Submission', content: '', media: [], priority: 23 });
      setEditingEntryId(null);
      setIsModalOpen(false);
    } catch (e) {
      console.error('Failed to save entry', e);
      alert('Failed to save entry. Make sure you are an admin.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await db.deleteFriendEntry(id);
        const updatedEntries = entries.filter(entry => entry.id !== id);
        setEntries(updatedEntries);
      } catch (e) {
        console.error('Failed to delete entry', e);
        alert('Failed to delete entry. Make sure you are an admin.');
      }
    }
  };

  const handleEdit = (entry: FriendEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: entry.name,
      grade: entry.grade,
      school: entry.school,
      teacher: entry.teacher,
      category: entry.category,
      content: entry.content,
      media: Array.isArray(entry.media) ? entry.media : (entry.media ? [entry.media] : []),
      priority: entry.priority || 23
    });
    setEditingEntryId(entry.id);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setFormData({ name: '', grade: '', school: '', teacher: '', category: 'General Submission', content: '', media: [], priority: 23 });
    setEditingEntryId(null);
    setIsModalOpen(true);
  };

  const toggleCard = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedCards(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };



  // Organize entries
  const awardEntries: Record<string, FriendEntry[]> = {};
  AWARDS.forEach(a => awardEntries[a.title] = []);
  
  const generalEntries: FriendEntry[] = [];

  entries.forEach(entry => {
    if (AWARDS.some(a => a.title === entry.category)) {
      if (awardEntries[entry.category].length < 2) {
        awardEntries[entry.category].push(entry);
      } else {
        generalEntries.push(entry);
      }
    } else {
      generalEntries.push(entry);
    }
  });

  const sortByPriority = (a: FriendEntry, b: FriendEntry) => {
    const pA = a.priority || 23;
    const pB = b.priority || 23;
    return pA - pB;
  };
  
  generalEntries.sort(sortByPriority);
  Object.keys(awardEntries).forEach(k => awardEntries[k].sort(sortByPriority));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-10 w-10 text-sky-500" />
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Circle of Friends</h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
              A collection of incredible ideas, actions, and stories from students making a difference in our community.
            </p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button type="button" onClick={handleOpenModal} className="inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 px-8 py-4 text-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xl shadow-sky-500/20 shrink-0 group z-10 relative cursor-pointer">
                <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                Submit an Idea
              </button>
            )}
          </div>
        </div>

        {/* Awards Accordion Section */}
        <div className="space-y-6 mb-20">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-8 flex items-center gap-3">
            <Stars className="h-6 w-6 text-amber-500" />
            Featured Awards
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {AWARDS.map((award) => {
              const awardSubs = awardEntries[award.title] || [];
              const isExpanded = expandedCategories.includes(award.id);
              
              return (
                <div key={award.id} className={`rounded-3xl border transition-all duration-500 overflow-hidden ${isExpanded ? `shadow-2xl ${award.border}` : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'}`}>
                  {/* Accordion Header */}
                  <button 
                    type="button"
                    onClick={() => toggleCategory(award.id)}
                    className={`w-full p-6 sm:p-8 flex items-center justify-between transition-colors ${isExpanded ? award.bg : 'bg-white dark:bg-slate-900'}`}
                  >
                    <div className="flex items-center gap-6 text-left">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner bg-white dark:bg-slate-800 ${award.color}`}>
                        <award.icon className="h-8 w-8" />
                      </div>
                      <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-800">
                        <img src={award.image} alt={award.title} className="h-full w-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{award.title}</h3>
                        <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${award.color}`}>{award.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {awardSubs.length > 0 && (
                        <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300">
                          {awardSubs.length} Winner{awardSubs.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <div className={`p-2 rounded-full transition-transform duration-300 bg-white dark:bg-slate-800 shadow-sm ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  </button>

                  {/* Accordion Body */}
                  <div 
                    className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className={`p-6 sm:p-8 border-t ${award.border} bg-slate-50/50 dark:bg-slate-900/50`}>
                        {awardSubs.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {awardSubs.map(entry => (
                              <EntryCardItem key={entry.id} entry={entry} isExpanded={expandedCards.includes(entry.id)} onToggle={toggleCard} onEdit={handleEdit} onDelete={handleDelete} onMediaClick={(imgs, idx) => setSelectedMedia({ images: imgs, index: idx })} isAdmin={isAdmin} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <award.icon className={`h-12 w-12 mx-auto mb-4 opacity-20 ${award.color}`} />
                            <p className="text-slate-500 dark:text-slate-400 font-medium italic">No entries for this award yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* General Submissions Section */}
        {generalEntries.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest px-4">
                Community Ideas
              </h2>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {generalEntries.map(entry => (
                <EntryCardItem key={entry.id} entry={entry} isExpanded={expandedCards.includes(entry.id)} onToggle={toggleCard} onEdit={handleEdit} onDelete={handleDelete} onMediaClick={(imgs, idx) => setSelectedMedia({ images: imgs, index: idx })} isAdmin={isAdmin} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              className="relative w-full max-w-2xl h-[90dvh] sm:h-auto sm:max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800" 
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {editingEntryId ? <Pencil className="h-5 w-5 text-sky-500" /> : <Send className="h-5 w-5 text-sky-500" />} 
                    {editingEntryId ? 'Edit Idea' : 'Share an Idea'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Submit your entry for the Circle of Friends</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-20 sm:pb-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Student Name</label>
                      <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Grade</label>
                      <select required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                        <option value="" disabled>Select Grade</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">School</label>
                      <select required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})}>
                        <option value="" disabled>Select School</option>
                        {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Class Teacher</label>
                      <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category / Award</label>
                      <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Display Priority (1 = First, Default 23)</label>
                      <input type="number" min="1" required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 23})} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Story / Idea</label>
                    <textarea required rows={5} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm resize-none" placeholder="Describe the idea..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pictures / Media (Optional)</label>
                    <div className="flex flex-col gap-4">
                      <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 self-start">
                        <ImageIcon className="h-4 w-4" /> Add Images
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                      </label>
                      
                      {formData.media.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.media.map((m, i) => (
                            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 group">
                              <img src={m} alt={`Preview ${i}`} className="h-full w-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => setFormData(p => ({ ...p, media: p.media.filter((_, idx) => idx !== i) }))}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-sky-500/20">{editingEntryId ? 'Save Changes' : 'Submit Entry'}</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md" 
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }} 
              className="relative max-w-5xl max-h-[90dvh] rounded-2xl overflow-hidden shadow-2xl w-full h-full flex items-center justify-center" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedMedia(null)} 
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-30"
              >
                <X className="h-6 w-6" />
              </button>
              
              <AnimatePresence initial={false} mode="wait">
                <motion.img 
                  key={selectedMedia.index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  src={selectedMedia.images[selectedMedia.index]} 
                  alt="Expanded media" 
                  className="w-full h-full max-h-[90dvh] object-contain" 
                />
              </AnimatePresence>

              {selectedMedia.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(s => s ? { ...s, index: (s.index - 1 + s.images.length) % s.images.length } : null);
                    }} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMedia(s => s ? { ...s, index: (s.index + 1) % s.images.length } : null);
                    }} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {selectedMedia.images.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); setSelectedMedia(s => s ? { ...s, index: i } : null); }}
                        className={`h-2 rounded-full transition-all ${i === selectedMedia.index ? 'w-6 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/40 hover:bg-white/60'}`} 
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircleOfFriends;
