import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandHelping, BookOpen, Mountain, Stars, Users, Send, X, PlusCircle, Quote, ChevronDown, ChevronUp, Image as ImageIcon, Pencil, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import RichText from '../components/RichText';
import { db } from '../lib/database';
import { useAuth } from '../context/AuthContext';

import { FriendEntry, Team } from '../lib/database/types';
import { SummerBuddyUpRegistration } from '../components/SummerBuddyUpRegistration';
import { SummerBuddyUpDashboard } from '../components/SummerBuddyUpDashboard';
import { DevSimulationPanel } from '../components/DevSimulationPanel';
import { tr } from '../lib/lang';

// titleEn is the stored/compared category value (entries persist it) — must stay English in both languages; title is display-only.
const AWARDS = [
  { id: 'trunk', titleEn: 'The "Trunk of Friendship" Award', title: tr('The "Trunk of Friendship" Award', 'El Premio "Trompa de la Amistad"'), subtitle: tr('Connecting / Helping', 'Conectar / Ayudar'), icon: HandHelping, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', image: '/assets/elephants/trunk_friendship_1777051824961.webp' },
  { id: 'mindset', titleEn: 'The "Elephant Mindset" Award', title: tr('The "Elephant Mindset" Award', 'El Premio "Mentalidad de Elefante"'), subtitle: tr('Learning / Memory / Education', 'Aprendizaje / Memoria / Educación'), icon: BookOpen, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', image: '/assets/elephants/elephant_mindset_1777051837375.webp' },
  { id: 'barriers', titleEn: 'The "Stomp Out Barriers" Award', title: tr('The "Stomp Out Barriers" Award', 'El Premio "Pisando Barreras"'), subtitle: tr('Environmental / Structural', 'Ambiental / Estructural'), icon: Mountain, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', image: '/assets/elephants/stomp_barriers_1777051852262.webp' },
  { id: 'leadership', titleEn: 'The "Tusks of Leadership" Award', title: tr('The "Tusks of Leadership" Award', 'El Premio "Colmillos de Liderazgo"'), subtitle: tr('Visionary / Action Plan', 'Visionario / Plan de Acción'), icon: Stars, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', image: '/assets/elephants/tusks_leadership_1777051868281.webp' }
];

const SCHOOLS = [
  'Altamont', 'Bethany', 'Cordes', 'Evelyn Costa', 'Hansen', 'Lammersville', 'Questa', 'Wicklund', 'Mountain House High School'
];

const GRADES = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

// value = stored English category; label = what the visitor sees
const CATEGORY_OPTIONS = [
  ...AWARDS.map(a => ({ value: a.titleEn, label: a.title })),
  { value: 'General Submission', label: tr('General Submission', 'Presentación General') }
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
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tr('Grade', 'Grado')} {entry.grade}</span>
            </div>
          </div>
          
          {mediaArray.length > 0 && (
            <div className={`relative mb-6 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 transition-all duration-700 ${isExpanded ? 'min-h-[300px]' : 'h-32 opacity-80 group-hover:opacity-100'}`}>
              <div className="absolute inset-0 z-10 cursor-pointer" onClick={(e) => { e.stopPropagation(); onMediaClick(mediaArray, imgIndex); }} title={tr('View Full Image', 'Ver Imagen Completa')}></div>
              
              <AnimatePresence initial={false}>
                <motion.img 
                  key={imgIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={mediaArray[imgIndex]} 
                  alt={tr(`Submission media ${imgIndex + 1}`, `Imagen de la presentación ${imgIndex + 1}`)}
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
              {isExpanded ? tr('Click to Roll Back', 'Haz Clic para Enrollar') : tr('Click to Unroll', 'Haz Clic para Desenrollar')} {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </div>
          )}
          
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200/50 mt-auto relative z-10">
            <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 overflow-hidden shadow-[0_3px_0_#e2e8f0] flex-shrink-0 ring-2 ring-sky-500/20 flex items-center justify-center">
              <span className="text-lg font-black text-sky-600">{entry.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-800 dark:text-white font-bold truncate text-sm">{entry.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">{tr('Teacher', 'Maestro/a')}: {entry.teacher}</p>
            </div>
            {isAdmin && (
              <>
                <button 
                  onClick={(e) => onEdit(entry, e)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
                >
                  <Pencil className="h-3.5 w-3.5" /> {tr('Edit', 'Editar')}
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
  const { user, loginWithGoogle } = useAuth();
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

  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    localStorage.getItem('abe_show_dev_panel') === 'true'
  );

  const handleSimulateLogin = (role: 'admin' | 'head_coach') => {
    localStorage.setItem('abe_use_simulation', 'true');
    
    let email = '';
    let name = '';
    let id = '';

    if (role === 'head_coach') {
      email = 'headcoach@aariasblueelephant.org';
      name = 'Jane Headcoach';
      id = 'hc-user-id';
    } else if (role === 'admin') {
      email = 'admin@aariasblueelephant.org';
      name = 'Board Administrator';
      id = 'admin-user-id';
    }

    const mockSession = {
      user: {
        id,
        email,
        email_confirmed_at: new Date().toISOString(),
        user_metadata: {
          full_name: name,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00AEEF&color=fff`
        }
      }
    };
    
    localStorage.setItem('abe_sim_session', JSON.stringify(mockSession));
    window.location.reload();
  };

  // Summer Buddy Up states
  const [activeTab, setActiveTab] = useState<'voices' | 'summer-buddy-up'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'voices') {
        return 'voices';
      }
    }
    return 'summer-buddy-up';
  });
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [adminTeams, setAdminTeams] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [viewAsCoach, setViewAsCoach] = useState(false);

  const loadMyTeam = async () => {
    if (!user) {
      setMyTeam(null);
      setPendingInvites([]);
      setTeamsLoading(false);
      return;
    }
    try {
      setTeamsLoading(true);
      
      let fetchedTeams: Team[] = [];
      let invites: any[] = [];

      try {
        fetchedTeams = await db.getTeams();
      } catch (e) {
        console.error('Error fetching teams (tables may not exist):', e);
      }

      try {
        invites = await db.getPendingSubCoachInvites();
      } catch (e) {
        console.error('Error fetching invites (tables may not exist):', e);
      }

      if (fetchedTeams && fetchedTeams.length > 0) {
        setMyTeam(fetchedTeams[0]);
      } else {
        setMyTeam(null);
      }
      setPendingInvites(invites || []);
    } catch (err) {
      console.error('Unexpected error in loadMyTeam:', err);
      setMyTeam(null);
      setPendingInvites([]);
    } finally {
      setTeamsLoading(false);
    }
  };

  const loadAdminTeams = async () => {
    if (!user || !user.isBoard) {
      setAdminTeams([]);
      setAdminLoading(false);
      return;
    }
    try {
      setAdminLoading(true);
      const data = await db.getAllTeamsForAdmin();
      setAdminTeams(data || []);
    } catch (err) {
      console.error('Error fetching admin cohorts data:', err);
      setAdminTeams([]);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'summer-buddy-up') {
      loadMyTeam();
      if (user?.isBoard) {
        loadAdminTeams();
      }
    }
  }, [activeTab, user]);

  const mappedUser = user ? {
    id: user.id,
    email: user.email,
    user_metadata: {
      full_name: user.name || (user as any).user_metadata?.full_name || ''
    }
  } : null;

  const renderCoachPortal = () => {
    if (!mappedUser) return null;

    if (teamsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">{tr('Loading Cohort Data...', 'Cargando Datos del Grupo...')}</p>
        </div>
      );
    }

    if (pendingInvites.length > 0 && !myTeam) {
      return (
        <div className="space-y-6">
          <div className="bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-32 h-32 text-sky-600" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{tr('Pending Invitation', 'Invitación Pendiente')}</h2>
              <p className="text-slate-600 dark:text-slate-300 font-medium max-w-xl mb-6">
                {tr('You have been invited to join', 'Has sido invitado/a a unirte a')} <strong>{pendingInvites[0].team?.team_name || tr('a team', 'un equipo')}</strong> {tr('as a Sub-Coach. Accept the invitation to join the cohort dashboard.', 'como Subentrenador/a. Acepta la invitación para unirte al panel del grupo.')}
              </p>
              <button
                onClick={async () => {
                  try {
                    await db.acceptSubCoachInvite(pendingInvites[0].id);
                    await loadMyTeam();
                  } catch (e) {
                    alert(tr('Failed to accept invite.', 'No se pudo aceptar la invitación.'));
                  }
                }}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95 shadow-md shadow-sky-500/20"
              >
                {tr('Accept Invitation', 'Aceptar Invitación')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!myTeam) {
      return (
        <SummerBuddyUpRegistration
          currentUser={mappedUser}
          onSuccess={() => loadMyTeam()}
        />
      );
    }

    return (
      <SummerBuddyUpDashboard
        team={myTeam}
        currentUser={mappedUser}
        onRefreshTeam={loadMyTeam}
      />
    );
  };

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
      alert(tr('Failed to save entry. Make sure you are an admin.', 'No se pudo guardar la presentación. Asegúrate de ser administrador.'));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(tr('Are you sure you want to delete this entry?', '¿Estás seguro de que quieres eliminar esta presentación?'))) {
      try {
        await db.deleteFriendEntry(id);
        const updatedEntries = entries.filter(entry => entry.id !== id);
        setEntries(updatedEntries);
      } catch (e) {
        console.error('Failed to delete entry', e);
        alert(tr('Failed to delete entry. Make sure you are an admin.', 'No se pudo eliminar la presentación. Asegúrate de ser administrador.'));
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
  AWARDS.forEach(a => awardEntries[a.titleEn] = []);
  
  const generalEntries: FriendEntry[] = [];

  entries.forEach(entry => {
    if (AWARDS.some(a => a.titleEn === entry.category)) {
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
        
        {/* Tab Switcher */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setActiveTab('summer-buddy-up');
                const url = new URL(window.location.href);
                url.searchParams.delete('tab');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === 'summer-buddy-up'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              <Users className="h-4 w-4" />
              {tr('Summer Buddy Up', 'Compañeros de Verano')}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('voices');
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'voices');
                window.history.replaceState({}, '', url.toString());
              }}
              className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition duration-200 cursor-pointer ${
                activeTab === 'voices'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
              }`}
            >
              {tr('Voices of the Herd', 'Voces de la Manada')}
            </button>
          </div>
        </div>

        {activeTab === 'voices' ? (
          <>
            {/* Simple Action Bar */}
        <div className="flex justify-end mb-12">
          {isAdmin && (
            <button type="button" onClick={handleOpenModal} className="inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 px-8 py-4 text-lg bg-sky-600 hover:bg-sky-700 text-white shadow-xl shadow-sky-500/20 shrink-0 group z-10 relative cursor-pointer">
              <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
              {tr('Submit an Idea', 'Enviar una Idea')}
            </button>
          )}
        </div>

        {/* Awards Accordion Section */}
        <div className="space-y-6 mb-20">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-8 flex items-center gap-3">
            <Stars className="h-6 w-6 text-amber-500" />
            {tr('Featured Awards', 'Premios Destacados')}
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            {AWARDS.map((award) => {
              const awardSubs = awardEntries[award.titleEn] || [];
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
                          {awardSubs.length} {awardSubs.length !== 1 ? tr('Winners', 'Ganadores') : tr('Winner', 'Ganador')}
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
                            <p className="text-slate-500 dark:text-slate-400 font-medium italic">{tr('No entries for this award yet.', 'Aún no hay presentaciones para este premio.')}</p>
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

        {/* Entries Section */}
        <div className="mt-8">
          <div className="flex flex-col items-center mb-16">
            <div className="flex items-center gap-6 mb-4">
              <div className="h-24 w-24 shrink-0 rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-800 p-2">
                <img src="/assets/elephants/elephant_herd_1778240839067.png" alt={tr('Elephant Herd', 'Manada de Elefantes')} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {tr('Voices of the Herd', 'Voces de la Manada')}
              </h2>
            </div>
            <div className="flex items-center gap-4 w-full">
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
              <span className="text-sm font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] px-4 whitespace-nowrap">
                {tr('Student Inclusion Visions', 'Visiones de Inclusión Estudiantil')}
              </span>
              <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {generalEntries.map(entry => (
              <EntryCardItem key={entry.id} entry={entry} isExpanded={expandedCards.includes(entry.id)} onToggle={toggleCard} onEdit={handleEdit} onDelete={handleDelete} onMediaClick={(imgs, idx) => setSelectedMedia({ images: imgs, index: idx })} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
        </>
        ) : (
          /* Summer Buddy Up Portal */
          <div className="space-y-12">
            {!user ? (
              <SummerBuddyUpPromo 
                onLogin={loginWithGoogle} 
                isLocalhost={isLocalhost}
                onSimulateLogin={handleSimulateLogin}
              />
            ) : user.isBoard ? (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewAsCoach(!viewAsCoach)}
                    className="inline-flex items-center justify-center rounded-xl font-black uppercase tracking-wider transition duration-200 px-5 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
                  >
                    {viewAsCoach ? tr('Switch to Board View', 'Cambiar a Vista de Junta') : tr('Switch to Coach View', 'Cambiar a Vista de Entrenador')}
                  </button>
                </div>
                {viewAsCoach ? renderCoachPortal() : (
                  <SummerBuddyUpAdmin
                    teams={adminTeams}
                    loading={adminLoading}
                    onRefresh={loadAdminTeams}
                    currentUser={mappedUser}
                  />
                )}
              </div>
            ) : (
              renderCoachPortal()
            )}
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
                    {editingEntryId ? tr('Edit Idea', 'Editar Idea') : tr('Share an Idea', 'Compartir una Idea')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{tr('Submit your entry for the Circle of Friends', 'Envía tu presentación para el Círculo de Amigos')}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain">
                <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-20 sm:pb-6">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Student Name', 'Nombre del Estudiante')}</label>
                      <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Grade', 'Grado')}</label>
                      <select required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})}>
                        <option value="" disabled>{tr('Select Grade', 'Selecciona el Grado')}</option>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('School', 'Escuela')}</label>
                      <select required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})}>
                        <option value="" disabled>{tr('Select School', 'Selecciona la Escuela')}</option>
                        {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Class Teacher', 'Maestro/a de Clase')}</label>
                      <input required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Category / Award', 'Categoría / Premio')}</label>
                      <select className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Display Priority (1 = First, Default 23)', 'Prioridad de Visualización (1 = Primero, Predeterminado 23)')}</label>
                      <input type="number" min="1" required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 23})} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Your Story / Idea', 'Tu Historia / Idea')}</label>
                    <textarea required rows={5} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-sm resize-none" placeholder={tr('Describe the idea...', 'Describe la idea...')} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{tr('Pictures / Media (Optional)', 'Fotos / Medios (Opcional)')}</label>
                    <div className="flex flex-col gap-4">
                      <label className="cursor-pointer px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 self-start">
                        <ImageIcon className="h-4 w-4" /> {tr('Add Images', 'Agregar Imágenes')}
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                      </label>

                      {formData.media.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.media.map((m, i) => (
                            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 group">
                              <img src={m} alt={tr(`Preview ${i}`, `Vista previa ${i}`)} className="h-full w-full object-cover" />
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
                    <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-xl shadow-sky-500/20">{editingEntryId ? tr('Save Changes', 'Guardar Cambios') : tr('Submit Entry', 'Enviar Presentación')}</Button>
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
                  alt={tr('Expanded media', 'Imagen ampliada')}
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
      
      {/* Dev Simulation Panel (only active on localhost) */}
      <DevSimulationPanel />
    </div>
  );
};

// Guest Promotion view for unauthenticated users
const SummerBuddyUpPromo: React.FC<{ 
  onLogin: () => void; 
  isLocalhost: boolean; 
  onSimulateLogin: (role: 'admin' | 'head_coach') => void;
}> = ({ onLogin, isLocalhost, onSimulateLogin }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-sky-50 dark:bg-sky-950/40 rounded-3xl text-sky-600 dark:text-sky-400 mb-4 shadow-inner">
          <Users className="h-10 w-10 animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">
          {tr('Summer Buddy Up Cohorts', 'Grupos de Compañeros de Verano')}
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-350 max-w-2xl mx-auto leading-relaxed">
          {tr('Create an inclusive summer playgroup, log your journey through milestones, and celebrate with physical certificates and awards at our end-of-summer ceremony in Tracy!', '¡Crea un grupo de juego inclusivo de verano, registra tu recorrido por los hitos, y celebra con certificados y premios físicos en nuestra ceremonia de fin de verano en Tracy!')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-sky-100 dark:bg-sky-900/35 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{tr('Cohort Team Roles', 'Roles del Equipo del Grupo')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>{tr('Head Coach', 'Entrenador Principal')}</strong> {tr('registers the cohort. Up to 3 co-parent', 'registra el grupo. Hasta 3')} <strong>{tr('Sub-Coaches', 'Subentrenadores')}</strong> {tr('join to claim profiles and execute digital consents.', 'copadres se unen para reclamar perfiles y firmar consentimientos digitales.')}
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/35 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{tr('The Inclusion Ratio', 'La Proporción de Inclusión')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {tr('Enforces structured inclusion. Each group can have up to 3 Gen Ed Students for every 1 Inclusion Buddy (Special Education/ND).', 'Aplica una inclusión estructurada. Cada grupo puede tener hasta 3 estudiantes de educación general por cada 1 Compañero de Inclusión (Educación Especial/ND).')}
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{tr('Waiver & Consent Gate', 'Puerta de Exención y Consentimiento')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {tr('Protecting safety and privacy. Sub-coaches must authenticate via Google to sign liability waivers before logs can be uploaded.', 'Protegiendo la seguridad y la privacidad. Los subentrenadores deben autenticarse con Google para firmar exenciones de responsabilidad antes de poder subir registros.')}
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-rose-100 dark:bg-rose-900/35 text-rose-600 dark:text-rose-455 flex items-center justify-center font-bold">
            4
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{tr('Physical Award Locking', 'Bloqueo de Premio Físico')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {tr('Students within LUSD and Tracy Unified school districts are automatically locked to physical attendance at the ceremony to claim their trophies.', 'Los estudiantes de los distritos escolares de LUSD y Tracy Unified deben asistir físicamente a la ceremonia para reclamar sus trofeos.')}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center p-8 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/35 shadow-inner">
        <h4 className="font-extrabold text-sky-900 dark:text-sky-300 text-lg mb-2">{tr('Ready to buddy up this summer?', '¿Listo para hacer equipo este verano?')}</h4>
        <p className="text-sm text-sky-700/80 dark:text-sky-400/80 mb-6 max-w-md mx-auto">
          {tr('Authenticate using Google Auth to start registering your student cohort or access your coach dashboard.', 'Autentícate con Google para comenzar a registrar el grupo de tu estudiante o acceder a tu panel de entrenador.')}
        </p>
        <button
          onClick={onLogin}
          className="inline-flex items-center justify-center rounded-xl font-black uppercase tracking-wider transition duration-200 px-8 py-3.5 text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-xl shadow-sky-500/20 cursor-pointer"
        >
          {tr('Continue with Google Auth', 'Continuar con Google Auth')}
        </button>

        {isLocalhost && (
          <div className="mt-6 pt-6 border-t border-sky-100 dark:border-sky-900/50">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mb-3 uppercase tracking-[0.15em] text-center">
              {tr('Local Development Bypass (Google Auth is unavailable on localhost)', 'Acceso de Desarrollo Local (Google Auth no está disponible en localhost)')}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => onSimulateLogin('admin')}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition cursor-pointer shadow-md"
              >
                {tr('Simulate Admin', 'Simular Administrador')}
              </button>
              <button
                type="button"
                onClick={() => onSimulateLogin('head_coach')}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition cursor-pointer shadow-md"
              >
                {tr('Simulate Coach', 'Simular Entrenador')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// Administrative control panel
const SummerBuddyUpAdmin: React.FC<{
  teams: any[];
  loading: boolean;
  onRefresh: () => void;
  currentUser: any;
}> = ({ teams, loading, onRefresh, currentUser }) => {
  const [updatingTeamId, setUpdatingTeamId] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    db.getBuddyUpConfig().then(setConfig);
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await db.updateBuddyUpConfig(config);
      alert(tr('Program Settings Saved!', '¡Configuración del Programa Guardada!'));
    } catch (e) {
      alert(tr('Failed to save program settings.', 'No se pudo guardar la configuración del programa.'));
    }
    setSavingConfig(false);
  };

  const handleStatusChange = async (teamId: string, newStatus: any) => {
    try {
      setUpdatingTeamId(teamId);
      await db.updateTeam(teamId, { status: newStatus });
      onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(tr('Failed to update team status.', 'No se pudo actualizar el estado del equipo.'));
    } finally {
      setUpdatingTeamId(null);
    }
  };

  const handleRatioOverrideToggle = async (teamId: string, currentStatus: boolean) => {
    try {
      setUpdatingTeamId(teamId);
      await db.updateTeam(teamId, { ratio_override: !currentStatus });
      onRefresh();
    } catch (err) {
      console.error('Error updating ratio override:', err);
      alert(tr('Failed to update ratio override', 'No se pudo actualizar la anulación de proporción'));
    } finally {
      setUpdatingTeamId(null);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm(tr('Are you sure you want to permanently delete this team? All associated sub-coaches, students, and check-ins will be deleted as well.', '¿Estás seguro de que quieres eliminar este equipo de forma permanente? También se eliminarán todos los subentrenadores, estudiantes y registros asociados.'))) return;
    try {
      setUpdatingTeamId(teamId);
      await db.deleteTeam(teamId);
      onRefresh();
    } catch (err) {
      console.error('Error deleting team:', err);
      alert(tr('Failed to delete team', 'No se pudo eliminar el equipo'));
    } finally {
      setUpdatingTeamId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px]">{tr('Loading Administrative Oversight Data...', 'Cargando Datos de Supervisión Administrativa...')}</p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800">
        <Users className="h-12 w-12 text-slate-350 dark:text-slate-600 mx-auto mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{tr('No Cohorts Registered Yet', 'Aún No Hay Grupos Registrados')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{tr('Registered playgroups and team check-ins will be listed here.', 'Los grupos de juego registrados y los registros del equipo aparecerán aquí.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            {tr('Summer Buddy Up Administration Console', 'Consola de Administración de Compañeros de Verano')}
          </h2>
          <p className="text-xs text-slate-555 dark:text-slate-450 mt-1">
            {tr('Review registered playgroups, override mentor ratios, toggle statuses, and check YouTube logs.', 'Revisa los grupos de juego registrados, anula proporciones de mentores, cambia estados y revisa los registros de YouTube.')}
          </p>
        </div>
        <div className="shrink-0 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-200/40 dark:border-slate-850 text-right">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{tr('Total Cohorts', 'Grupos Totales')}</span>
          <span className="text-lg font-black text-sky-600 dark:text-sky-400">{teams.length} {tr('Registered', 'Registrados')}</span>
        </div>
      </div>

      {config && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide border-b border-slate-100 pb-2">{tr('Program Settings', 'Configuración del Programa')}</h3>
          
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">{tr('Unlock Specific Milestones App-Wide', 'Desbloquear Hitos Específicos en Toda la App')}</span>
            <div className="flex flex-wrap gap-4">
              {['JULY_15', 'JULY_30', 'AUGUST_15', 'AUGUST_30'].map(milestone => (
                <label key={milestone} className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  <input 
                    type="checkbox" 
                    checked={(config.unlocked_milestones || []).includes(milestone) || (config.checkins_enabled && !(config.unlocked_milestones))} 
                    onChange={e => {
                      const current = config.unlocked_milestones || (config.checkins_enabled ? ['JULY_15', 'JULY_30', 'AUGUST_15', 'AUGUST_30'] : []);
                      const next = e.target.checked 
                        ? [...current, milestone] 
                        : current.filter(m => m !== milestone);
                      setConfig({...config, unlocked_milestones: next, checkins_enabled: next.length > 0});
                    }}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{milestone.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">{tr('Check-In Questions (One per line)', 'Preguntas de Registro (Una por línea)')}</label>
            <textarea
              value={config.checkin_questions.join('\n')}
              onChange={e => setConfig({...config, checkin_questions: e.target.value.split('\n').filter(q => q.trim())})}
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>

          <button 
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 font-bold text-xs px-4 py-2 rounded-xl transition hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            {savingConfig ? tr('Saving...', 'Guardando...') : tr('Save Settings', 'Guardar Configuración')}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {teams.map((teamData: any) => {
          const { team, subCoaches = [], students = [], checkIns = [] } = teamData;
          const peerMentors = students.filter((s: any) => s.classification === 'Gen Ed, without any special accommodation').length;
          const inclusionBuddies = students.filter((s: any) => s.classification === 'Inclusion Buddy').length;
          const ratioValid = inclusionBuddies >= Math.ceil(peerMentors / 3) || team.ratio_override;

          return (
            <div key={team.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Top Summary Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200/40 dark:border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-905 dark:text-white uppercase tracking-wide">
                    {team.team_name}
                  </h3>
                  <p className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mt-1">
                    {tr('Focus Area', 'Área de Enfoque')}: {team.focus_area}
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    ratioValid
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/30'
                      : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-100 dark:border-rose-900/30'
                  }`}>
                    {tr('Ratio', 'Proporción')}: {peerMentors} {tr('Mentors', 'Mentores')} / {inclusionBuddies} {tr('Inclusion', 'Inclusión')} {ratioValid ? '✓' : '⚠️'}
                  </span>

                  <button
                    onClick={() => handleRatioOverrideToggle(team.id, team.ratio_override)}
                    disabled={updatingTeamId === team.id}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                      team.ratio_override
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {team.ratio_override ? tr('Override Enabled', 'Anulación Activada') : tr('Override Ratio', 'Anular Proporción')}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">{tr('Status', 'Estado')}:</span>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                      team.status === 'PENDING_ADMIN_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      team.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      team.status === 'PENDING_CONSENT' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                      'bg-slate-100 text-slate-700 border-slate-300'
                    }`}>
                      {team.status.replace(/_/g, ' ')}
                    </span>
                    
                    {team.status === 'PENDING_ADMIN_APPROVAL' && (
                      <button
                        onClick={() => handleStatusChange(team.id, 'ACTIVE')}
                        disabled={updatingTeamId === team.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors animate-pulse hover:animate-none shadow shadow-emerald-500/20"
                      >
                        {tr('Approve Cohort', 'Aprobar Grupo')}
                      </button>
                    )}

                    {team.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(team.id, 'INACTIVE')}
                        disabled={updatingTeamId === team.id}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                      >
                        {tr('Deactivate', 'Desactivar')}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      disabled={updatingTeamId === team.id}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ml-2"
                    >
                      {tr('Delete', 'Eliminar')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Roster & logs content */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Coaches */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                    {tr('Coaches & Parents', 'Entrenadores y Padres')} ({subCoaches.length + 1})
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1 shrink-0"></div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {tr('Primary Coordinator', 'Coordinador Principal')} <span className="text-[8px] font-black bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded">{tr('HEAD COACH', 'ENTRENADOR PRINCIPAL')}</span>
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5" title={team.head_coach_id}>
                          {tr('ID', 'ID')}: {team.head_coach_id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {subCoaches.map((coach: any) => (
                      <div key={coach.id} className="flex items-start gap-2.5 text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${coach.consent_accepted ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            {coach.name} 
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                              coach.consent_accepted 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-450'
                            }`}>
                              {coach.consent_accepted ? tr('Consented', 'Consentido') : tr('Pending waiver', 'Exención pendiente')}
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">{coach.email} • {coach.phone || tr('No Phone', 'Sin Teléfono')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Students */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                    {tr('Student Roster', 'Lista de Estudiantes')} ({students.length})
                  </h4>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {students.map((student: any) => (
                      <div key={student.id} className="text-xs bg-slate-50/50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                        <div className="font-bold text-slate-850 dark:text-slate-200">{student.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-450 font-medium">
                            {tr('Grade', 'Grado')} {student.grade}
                          </span>
                          <span className={`text-[9px] px-1 py-0.5 rounded font-black uppercase tracking-wider ${
                            student.classification === 'Inclusion Buddy'
                              ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-455'
                              : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400'
                          }`}>
                            {student.classification}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-455 dark:text-slate-500 mt-1">
                          {tr('District', 'Distrito')}: {student.school_district} | {tr('Delivery', 'Entrega')}: {student.award_delivery_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Milestones */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-455 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
                    {tr('Milestone check-ins', 'Registros de hitos')} ({checkIns.length}/4)
                  </h4>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {['JULY_15', 'JULY_30', 'AUGUST_15', 'AUGUST_30'].map((milestone) => {
                      const log = checkIns.find((c: any) => c.milestone_target === milestone);

                      return (
                        <div key={milestone} className="text-xs border border-slate-150 dark:border-slate-850 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-705 dark:text-slate-350">{milestone.replace('_', ' ')}</span>
                            <span className={`px-1.5 py-0.5 rounded font-black text-[8px] tracking-wider uppercase ${
                              log 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-450' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {log ? tr('Submitted', 'Enviado') : tr('Missing', 'Faltante')}
                            </span>
                          </div>
                          {log ? (
                            <div className="mt-2 space-y-1">
                              <p className="text-slate-500 dark:text-slate-450 italic line-clamp-2">"{String(Object.values(log.answers || {})[0] || tr('Log submitted', 'Registro enviado'))}"</p>
                              <a 
                                href={log.youtube_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-sky-600 dark:text-sky-400 font-bold hover:underline inline-block mt-0.5 truncate max-w-full"
                              >
                                {tr('Watch Video Log', 'Ver Registro en Video')} ↗
                              </a>
                            </div>
                          ) : (
                            <p className="text-[9px] text-slate-455 italic mt-1">{tr('No logs uploaded.', 'No se han subido registros.')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CircleOfFriends;
