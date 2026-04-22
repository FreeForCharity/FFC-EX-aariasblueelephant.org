import React, { createContext, useContext, useState, useEffect } from 'react';
import { Event, Testimonial, VolunteerApplication, EventRegistration } from '../types';
import { db } from '../lib/database';

interface MutationResult {
  success: boolean;
  error?: string;
}

interface DataContextType {
  events: Event[];
  testimonials: Testimonial[];
  volunteerApplications: VolunteerApplication[];
  eventRegistrations: EventRegistration[];
  addEvent: (event: Omit<Event, 'id' | 'initialLikes'>) => Promise<MutationResult>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<MutationResult>;
  deleteEvent: (id: string) => Promise<MutationResult>;
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'date' | 'status'>) => Promise<MutationResult>;
  approveTestimonial: (id: string) => Promise<MutationResult>;
  deleteTestimonial: (id: string) => Promise<MutationResult>;
  updateTestimonial: (id: string, metadata: Partial<Testimonial>) => Promise<MutationResult>;
  submitVolunteerApp: (app: Omit<VolunteerApplication, 'id' | 'status'>) => Promise<MutationResult>;
  approveVolunteer: (id: string) => Promise<MutationResult>;
  deleteVolunteerApplication: (id: string) => Promise<MutationResult>;
  registerForEvent: (registration: Omit<EventRegistration, 'id' | 'date' | 'status'>) => Promise<MutationResult>;
  approveRegistration: (id: string) => Promise<MutationResult>;
  deleteRegistration: (id: string) => Promise<MutationResult>;
  updateUserDonation: (email: string, amount: number) => Promise<MutationResult>;
  getUserDonation: (email: string) => number;
  fetchEventDetails: (id: string) => Promise<Event | null>;
  fetchTestimonialMedia: (id: string) => Promise<string | null>;
  isLoading: boolean;
  hasInitialFetch: boolean;
  isNetworkBlocked: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplication[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [isNetworkBlocked, setIsNetworkBlocked] = useState(false);

  const fetchEventsData = async () => {
    try {
      const data = await db.getEvents();
      setEvents(data);
      
      // Cache management
      try {
        localStorage.setItem('abe_cache_events', JSON.stringify(data));
      } catch (e) {}

      return data;
    } catch (error) {
      console.error("Fetch events error:", error);
      return [];
    }
  };

  const fetchTestimonialsData = async () => {
    try {
      const data = await db.getTestimonials();
      setTestimonials(data);
      return data;
    } catch (error) {
      console.error("Fetch testimonials error:", error);
      return [];
    }
  };

  const fetchEventDetails = async (id: string): Promise<Event | null> => {
    const existing = events.find(e => e.id === id);
    if (existing && existing.image) return existing;
    return await db.getEventById(id);
  };

  const fetchTestimonialMedia = async (id: string): Promise<string | null> => {
    return await db.getTestimonialMedia(id);
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      // Local cache management
      const cachedEvents = localStorage.getItem('abe_cache_events');
      const cachedTests = localStorage.getItem('abe_cache_testimonials');
      const cacheTime = localStorage.getItem('abe_cache_time');
      const CACHE_TTL_MS = 1000 * 60 * 15; // 15 Stale-While-Revalidate TTL to save Supabase Egress

      const isFresh = cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_TTL_MS);

      if (cachedEvents && cachedTests) {
          try {
              setEvents(JSON.parse(cachedEvents));
              setTestimonials(JSON.parse(cachedTests));
              setIsLoading(false); 
          } catch (e) {}
      }

      if (!cachedEvents) setIsLoading(true);
      
      try {
        const session = await db.getSession();
        const email = session?.user?.email || "";
        const userId = session?.user?.id || session?.$id;
        const isBoard = email.toLowerCase().endsWith('@aariasblueelephant.org');
        
        // 1. Fetch user specific, lightweight things always
        const userAppsPromise = isBoard 
            ? db.getVolunteerApplications() 
            : (session ? db.getVolunteerApplications(userId) : Promise.resolve([]));
        const userRegsPromise = isBoard 
            ? db.getEventRegistrations() 
            : db.getEventRegistrations(userId);

        // 2. Conditionally fetch Heavy collections only if cache is stale
        let evts = events;
        let tests = testimonials;

        if (!isFresh || events.length === 0) {
           const heavyData = await Promise.all([
             db.getEvents(),
             db.getTestimonials()
           ]);
           evts = heavyData[0];
           tests = heavyData[1];

           // Leakage Diagnostic: Track Payload size!
           const payloadSize = JSON.stringify(evts).length + JSON.stringify(tests).length;
           const payloadKB = payloadSize / 1024;
           if (payloadKB > 800) {
             console.warn(`🚨 [EGRESS LEAK WARNING] High DB Payload detected: ${payloadKB.toFixed(2)} KB!. Suspected Base64 string injection instead of Storage URLs. This will rapidly consume database egress quota.`);
           }

           localStorage.setItem('abe_cache_events', JSON.stringify(evts));
           localStorage.setItem('abe_cache_testimonials', JSON.stringify(tests));
           localStorage.setItem('abe_cache_time', Date.now().toString());
        }

        const [apps, regs] = await Promise.all([userAppsPromise, userRegsPromise]);

        setEvents(evts);
        setTestimonials(tests);
        setVolunteerApplications(apps);
        setEventRegistrations(regs);

      } catch (error) {
        console.error("Fetch data error. Falling back to static offline resilience data:", error);
        setIsNetworkBlocked(true); // Flag that we are operating in offline/degraded mode
        
        try {
          // Ultimate Offline Fallback: Import the statically generated resilience data
          const { RESILIENCE_EVENTS, RESILIENCE_TESTIMONIALS } = await import('../data/resilience_data');
          
          if (events.length === 0) setEvents(RESILIENCE_EVENTS);
          if (testimonials.length === 0) setTestimonials(RESILIENCE_TESTIMONIALS);
          
        } catch (fallbackError) {
           console.error("Resilience fallback failed:", fallbackError);
        }
      } finally {
        setIsLoading(false);
        setHasInitialFetch(true);
      }
    };

    fetchData();
  }, []);

  // Mutations
  const addEvent = async (eventData: Omit<Event, 'id' | 'initialLikes'>): Promise<MutationResult> => {
    try {
      await db.createEvent(eventData);
      await fetchEventsData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>): Promise<MutationResult> => {
    try {
      await db.updateEvent(id, eventData);
      setEvents(events.map(evt => evt.id === id ? { ...evt, ...eventData } : evt));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteEvent = async (id: string): Promise<MutationResult> => {
    try {
      await db.deleteEvent(id);
      setEvents(events.filter(evt => evt.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const addTestimonial = async (data: Omit<Testimonial, 'id' | 'date' | 'status'>): Promise<MutationResult> => {
    try {
      await db.createTestimonial({ ...data, date: new Date().toISOString().split('T')[0], status: 'Pending' });
      await fetchTestimonialsData();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const approveTestimonial = async (id: string): Promise<MutationResult> => {
    try {
      await db.updateTestimonial(id, { status: 'Approved' });
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: 'Approved' } : t));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteTestimonial = async (id: string): Promise<MutationResult> => {
    try {
      await db.deleteTestimonial(id);
      setTestimonials(testimonials.filter(t => t.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateTestimonial = async (id: string, metadata: Partial<Testimonial>): Promise<MutationResult> => {
    try {
      await db.updateTestimonial(id, metadata);
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, ...metadata } : t));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const submitVolunteerApp = async (data: Omit<VolunteerApplication, 'id' | 'status'>): Promise<MutationResult> => {
    try {
      await db.createVolunteerApplication({ ...data, status: 'Pending' });
      const session = await db.getSession();
      const email = session?.user?.email || "";
      const isBoard = email.toLowerCase().endsWith('@aariasblueelephant.org');
      const userId = session?.user?.id || session?.$id;
      const apps = await db.getVolunteerApplications(isBoard ? undefined : userId);
      setVolunteerApplications(apps);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const approveVolunteer = async (id: string): Promise<MutationResult> => {
    try {
      await db.updateVolunteerApplication(id, { status: 'Approved' });
      setVolunteerApplications(volunteerApplications.map(app => app.id === id ? { ...app, status: 'Approved' } : app));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteVolunteerApplication = async (id: string): Promise<MutationResult> => {
    try {
      await db.deleteVolunteerApplication(id);
      setVolunteerApplications(volunteerApplications.filter(app => app.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const registerForEvent = async (data: Omit<EventRegistration, 'id' | 'date' | 'status'>): Promise<MutationResult> => {
    try {
      await db.createEventRegistration({ ...data, date: new Date().toISOString().split('T')[0], status: 'Pending' });
      const session = await db.getSession();
      const regs = await db.getEventRegistrations(session?.user?.id || session?.$id);
      setEventRegistrations(regs);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const approveRegistration = async (id: string): Promise<MutationResult> => {
    try {
      await db.updateEventRegistration(id, { status: 'Approved' });
      setEventRegistrations(eventRegistrations.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteRegistration = async (id: string): Promise<MutationResult> => {
    try {
      try {
        await db.deleteEventRegistration(id);
      } catch (err: any) {
        // [RESILIENCE FALLBACK]: Supabase PostgREST drops the connection (Failed to fetch) 
        // when attempting to delete untouched 'Pending' rows due to strict unconfigured constraints.
        // As the user outlined, changing state to 'Approved' unlocks deletion.
        const msg = err.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
          console.warn("Caught Supabase Network Exception on Pending Delete. Executing Pre-Flight Update Workaround.");
          await db.updateEventRegistration(id, { status: 'Approved' });
          await db.deleteEventRegistration(id); // Re-attempt deletion
        } else {
          throw err;
        }
      }
      
      setEventRegistrations(eventRegistrations.filter(r => r.id !== id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUserDonation = async (email: string, amount: number): Promise<MutationResult> => {
      return { success: true };
  };

  const getUserDonation = (email: string) => {
    if (email === 'user1@example.com') return 350;
    if (email.endsWith('@blueelephant.org')) return 1250;
    return 0;
  };

  return (
    <DataContext.Provider value={{
      events,
      testimonials,
      volunteerApplications,
      eventRegistrations,
      addEvent,
      updateEvent,
      deleteEvent,
      addTestimonial,
      approveTestimonial,
      deleteTestimonial,
      updateTestimonial,
      submitVolunteerApp,
      approveVolunteer,
      deleteVolunteerApplication,
      registerForEvent,
      approveRegistration,
      deleteRegistration,
      updateUserDonation,
      getUserDonation,
      fetchEventDetails,
      fetchTestimonialMedia,
      isLoading,
      hasInitialFetch,
      isNetworkBlocked
    }}>
      {children}
    </DataContext.Provider>
  );
};
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
