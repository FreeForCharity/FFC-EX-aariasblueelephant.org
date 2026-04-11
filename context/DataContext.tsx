'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Event, Testimonial, VolunteerApplication, EventRegistration } from '../types';
import { supabase } from '../lib/supabase';
import { MOCK_DONATIONS, MOCK_TESTIMONIALS, SUPABASE_OVERRIDE_EVENTS } from '../constants';

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
  deleteVolunteer: (id: string) => Promise<MutationResult>;
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

  const invokeEmailFunction = async (record: any, type: string) => {
    // TEMPORARILY DISABLED BY USER REQUEST to stabilize registration flow
    console.log(`Email function suppressed for type: ${type}`, record);
    return;

    try {
      console.log("Invoking sending email edge function for:", type, record);
      const { data, error } = await supabase.functions.invoke('send-registration-email', {
        body: { record, type }
      });
      console.log("Email function response:", data);
      if (error) {
        console.error("Email function returned error:", error);
      }
    } catch (e) {
      console.error("Failed to trigger email function exception:", e);
    }
  };

  const performNetworkDiagnostic = async () => {
    // If the browser thinks it's offline, don't trigger the block warning
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    try {
      // Try to reach a highly reliable external asset to confirm internet connectivity
      // We use no-cors because we just want to know if the network request resolves
      await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors', 
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) 
      });
      
      // If we got here, internet is basically up, but Supabase is failing
      console.warn("ABE Diagnostic: Internet is reachable, but Supabase connection is failing. Connection likely intercepted by local DNS/SSL filter.");
      setIsNetworkBlocked(true);
    } catch (e) {
      // Internet check also failed, likely a general connection problem
      console.log("ABE Diagnostic: Internet check also failed. Likely a general network outage.");
    }
  };

  const fetchEventsData = async () => {
    // We only fetch metadata here. The heavy 'image' column is deferred to LazySupabaseImage
    // or the detail view to maintain low egress while ensuring all events are visible for filtering.
    const { data, error } = await supabase.from('events')
      .select('id, title, date, time, location, description, type, capacity, registered, initial_likes, media_link, duration')
      .order('date', { ascending: true });

    if (error) {
      console.error("Fetch events error:", error);
      performNetworkDiagnostic();
      return [];
    }

    if (data) {
      const mapped = data.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        description: e.description,
        type: e.type,
        capacity: e.capacity,
        registered: e.registered || 0,
        initialLikes: e.initial_likes || 0,
        image: undefined, // Image fetched on demand via LazySupabaseImage
        mediaLink: e.media_link,
        hours: e.duration || e.hours || 0
      }));


      // Apply local overrides
      const overrideMap = new Map(SUPABASE_OVERRIDE_EVENTS.map(e => [e.id, e]));
      const finalEvents = mapped.map(evt => overrideMap.get(evt.id) || evt);
      
      // Add any overrides that aren't in the fetched list (e.g. if fetch failed or event is new/missing)
      SUPABASE_OVERRIDE_EVENTS.forEach(override => {
        if (!finalEvents.find(e => e.id === override.id)) {
          finalEvents.push(override);
        }
      });

      setEvents(finalEvents);
      
      // Cache management
      try {
        const cacheEvents = finalEvents.map(evt => ({ 
          ...evt, 
          image: null // Don't cache huge base64 strings
        }));
        localStorage.setItem('abe_cache_events', JSON.stringify(cacheEvents));
      } catch (e) {}

      return finalEvents;
    }

    // Handle complete fetch failure but still apply overrides
    if (SUPABASE_OVERRIDE_EVENTS.length > 0) {
      setEvents(SUPABASE_OVERRIDE_EVENTS);
      return SUPABASE_OVERRIDE_EVENTS;
    }

    return [];
  };

  const fetchTestimonialsData = async () => {
    const { data, error } = await supabase.from('testimonials')
      .select('id, author, author_email, role, title, content, date, avatar, status, rating, rank, user_id')
      .order('rank', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) {
        console.error("Fetch testimonials error, using mocks:", error);
        performNetworkDiagnostic();
      } else {
        console.log("No testimonials in DB, using mocks");
      }
      
      setTestimonials(MOCK_TESTIMONIALS);
      return MOCK_TESTIMONIALS;
    }

    const mapped = data.map((t: any) => ({
        id: t.id,
        author: t.author,
        authorEmail: t.author_email || t.authorEmail,
        role: t.role,
        title: t.title,
        content: t.content,
        date: t.date,
        avatar: t.avatar,
        status: t.status,
        rating: t.rating,
        rank: t.rank,
        media: undefined, // Fetched on demand via LazySupabaseImage
        userId: t.user_id
      }));

      setTestimonials(mapped);
      return mapped;
  };

  const fetchEventDetails = async (id: string): Promise<Event | null> => {
    // Check local state first
    const existing = events.find(e => e.id === id);
    if (existing && existing.image) return existing;

    // Check overrides
    const override = SUPABASE_OVERRIDE_EVENTS.find(e => e.id === id);
    if (override) return override;

    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error || !data) return null;
    
    return {
      id: data.id,
      title: data.title,
      date: data.date,
      time: data.time,
      location: data.location,
      description: data.description,
      type: data.type,
      capacity: data.capacity,
      registered: data.registered || 0,
      initialLikes: data.initial_likes || 0,
      image: data.image,
      mediaLink: data.media_link,
      hours: data.duration || data.hours || 0
    };
  };

  const fetchTestimonialMedia = async (id: string): Promise<string | null> => {
    const { data, error } = await supabase.from('testimonials').select('media').eq('id', id).single();
    if (error || !data) return null;
    return data.media;
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      // Try to load from cache first for instant UI
      const cachedEvents = localStorage.getItem('abe_cache_events');
      if (cachedEvents) {
          try {
              setEvents(JSON.parse(cachedEvents));
              setIsLoading(false); 
          } catch (e) {
              console.error("Cache parse error:", e);
          }
      }

      if (!cachedEvents) setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const fetchApplications = session ? supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) {
              setVolunteerApplications(data.map((v: any) => ({
                id: v.id,
                name: v.name,
                email: v.email,
                interest: v.interest,
                status: v.status
              })));
            }
          }) : Promise.resolve();

        const fetchRegistrations = session ? supabase.from('event_registrations').select('*').order('created_at', { ascending: false })
          .then(({ data }) => {
            if (data) {
              setEventRegistrations(data.map((r: any) => ({
                id: r.id,
                eventId: r.event_id,
                userId: r.user_id,
                userName: r.user_name,
                userEmail: r.user_email,
                specialNeeds: r.special_needs,
                status: r.status,
                date: r.date
              })));
            }
          }) : Promise.resolve();

        await Promise.all([
          fetchEventsData(), 
          fetchTestimonialsData(), 
          fetchApplications, 
          fetchRegistrations
        ]);
      } catch (error) {
        console.error("Fetch data error:", error);
      } finally {
        setIsLoading(false);
        setHasInitialFetch(true);
      }
    };

    fetchData();
  }, []);

  // Events
  const addEvent = async (eventData: Omit<Event, 'id' | 'initialLikes'>): Promise<MutationResult> => {
    const { data, error } = await supabase.from('events').insert([{
      title: eventData.title,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      description: eventData.description,
      type: eventData.type,
      capacity: eventData.capacity,
      image: eventData.image,
      registered: eventData.registered !== undefined ? eventData.registered : 0,
      initial_likes: 0,
      media_link: eventData.mediaLink,
      duration: eventData.hours || 0
    }]).select().single();

    if (error) {
      console.error("Add event error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }

    if (data) {
      setEvents([...events, {
        id: data.id,
        title: data.title,
        date: data.date,
        time: data.time,
        location: data.location,
        description: data.description,
        type: data.type,
        capacity: data.capacity,
        registered: data.registered,
        initialLikes: data.initial_likes,
        image: data.image,
        mediaLink: data.media_link,
        hours: data.duration
      }]);
    }
    return { success: true };
  };

  const updateEvent = async (id: string, eventData: Partial<Event>): Promise<MutationResult> => {
    const updatePayload: any = { ...eventData };
    if (eventData.initialLikes !== undefined) updatePayload.initial_likes = eventData.initialLikes;
    if (eventData.mediaLink !== undefined) updatePayload.media_link = eventData.mediaLink;
    if (eventData.hours !== undefined) updatePayload.duration = eventData.hours;
    
    delete updatePayload.initialLikes;
    delete updatePayload.mediaLink;
    delete updatePayload.hours;

    const { error } = await supabase.from('events').update(updatePayload).eq('id', id);
    if (!error) {
      setEvents(events.map(evt => evt.id === id ? { ...evt, ...eventData } : evt));
      return { success: true };
    } else {
      console.error("Update event error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  const deleteEvent = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      setEvents(events.filter(evt => evt.id !== id));
      return { success: true };
    } else {
      console.error("Delete event error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  // Testimonials
  const addTestimonial = async (data: Omit<Testimonial, 'id' | 'date' | 'status'>): Promise<MutationResult> => {
    const dateStr = new Date().toISOString().split('T')[0];
    const { data: resData, error } = await supabase.from('testimonials').insert([{
      author: data.author,
      role: data.role,
      content: data.content,
      avatar: data.avatar,
      media: data.media,
      rating: data.rating,
      author_email: data.authorEmail,
      user_id: data.userId,
      date: dateStr,
      status: 'Pending'
    }]).select().single();

    if (error) {
      console.error("Add testimonial error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }

    if (resData) {
      setTestimonials([{
        id: resData.id,
        author: resData.author,
        role: resData.role,
        content: resData.content,
        date: resData.date,
        avatar: resData.avatar,
        media: resData.media,
        status: resData.status,
        rating: resData.rating,
        rank: resData.rank,
        userId: resData.user_id
      }, ...testimonials]);
    }
    return { success: true };
  };

  const approveTestimonial = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('testimonials').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, status: 'Approved' } : t));
      return { success: true };
    } else {
      console.error("Approve testimonial error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  const deleteTestimonial = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (!error) {
      setTestimonials(testimonials.filter(t => t.id !== id));
      return { success: true };
    } else {
      console.error("Delete testimonial error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  const updateTestimonial = async (id: string, metadata: Partial<Testimonial>): Promise<MutationResult> => {
    const { error } = await supabase.from('testimonials').update(metadata).eq('id', id);
    if (!error) {
      setTestimonials(testimonials.map(t => t.id === id ? { ...t, ...metadata } : t));
      return { success: true };
    } else {
      console.error("Update testimonial metadata error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  // Volunteers
  const submitVolunteerApp = async (data: Omit<VolunteerApplication, 'id' | 'status'>): Promise<MutationResult> => {
    const { data: resData, error } = await supabase.from('volunteer_applications').insert([{
      name: data.name,
      email: data.email,
      interest: data.interest,
      status: 'Pending'
    }]).select().single();

    if (error) {
      console.error("Submit volunteer app error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }

    if (resData) {
      setVolunteerApplications([{
        id: resData.id,
        name: resData.name,
        email: resData.email,
        interest: resData.interest,
        status: resData.status
      }, ...volunteerApplications]);

      // Trigger Volunteer Received Email
      invokeEmailFunction(resData, 'VOLUNTEER_RECEIVED');
    }
    return { success: true };
  };

  const approveVolunteer = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('volunteer_applications').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
      const app = volunteerApplications.find(v => v.id === id);
      setVolunteerApplications(volunteerApplications.map(app => app.id === id ? { ...app, status: 'Approved' } : app));

      // Trigger Volunteer Approved Email
      if (app) {
        invokeEmailFunction({ ...app, status: 'Approved' }, 'VOLUNTEER_APPROVED');
      }

      return { success: true };
    } else {
      console.error("Approve volunteer error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  const deleteVolunteer = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('volunteer_applications').delete().eq('id', id);
    if (!error) {
      setVolunteerApplications(volunteerApplications.filter(app => app.id !== id));
      return { success: true };
    } else {
      console.error("Delete volunteer error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  // Registrations
  const registerForEvent = async (data: Omit<EventRegistration, 'id' | 'date' | 'status'>): Promise<MutationResult> => {
    const dateStr = new Date().toISOString().split('T')[0];
    const { data: resData, error } = await supabase.from('event_registrations').insert([{
      event_id: data.eventId,
      user_id: data.userId,
      user_name: data.userName,
      user_email: data.userEmail,
      special_needs: data.specialNeeds || false,
      date: dateStr,
      status: 'Pending'
    }]).select().single();

    if (error) {
      console.error("Registration error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }

    if (resData) {
      setEventRegistrations([{
        id: resData.id,
        eventId: resData.event_id,
        userId: resData.user_id,
        userName: resData.user_name,
        userEmail: resData.user_email,
        specialNeeds: resData.special_needs,
        status: resData.status,
        date: resData.date
      }, ...eventRegistrations]);

      // Find local event and optimistic update
      const evt = events.find(e => e.id === data.eventId);
      if (evt) {
        updateEvent(evt.id, { registered: evt.registered + 1 });
      }

      // Trigger Registration Received Email (pass event title directly to avoid race conditions)
      invokeEmailFunction({ ...resData, event_title: evt?.title || 'Upcoming Event' }, 'REGISTRATION_RECEIVED');
    }
    return { success: true };
  };

  const approveRegistration = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('event_registrations').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
      const reg = eventRegistrations.find(r => r.id === id);
      setEventRegistrations(eventRegistrations.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      
      // Trigger Registration Approved Email (pass event title directly if we have it)
      if (reg) {
        const evt = events.find(e => e.id === reg.eventId);
        invokeEmailFunction({ ...reg, status: 'Approved', event_title: evt?.title || 'Upcoming Event' }, 'REGISTRATION_APPROVED');
      }
      
      return { success: true };
    } else {
      console.error("Approve registration error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  const deleteRegistration = async (id: string): Promise<MutationResult> => {
    const reg = eventRegistrations.find(r => r.id === id);
    if (!reg) return { success: false, error: "Registration not found" };

    const { error } = await supabase.from('event_registrations').delete().eq('id', id);
    if (!error) {
      setEventRegistrations(eventRegistrations.filter(r => r.id !== id));

      const evt = events.find(e => e.id === reg.eventId);
      if (evt) {
        updateEvent(evt.id, { registered: Math.max(0, evt.registered - 1) });
      }
      return { success: true };
    } else {
      console.error("Delete registration error:", error.message, error.details);
      return { success: false, error: `${error.message}: ${error.details || ''}` };
    }
  };

  const updateUserDonation = async (email: string, amount: number): Promise<MutationResult> => {
      // For now, this is a local stub since we don't have a donations table yet or it's managed via mock
      console.log(`Updating donation for ${email} to ${amount}`);
      return { success: true };
  };

  const getUserDonation = (email: string) => {
    // Mike Smith has some mock donations
    if (email === 'user1@example.com') return 350;
    
    // Board members might have some too
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
      deleteVolunteer,
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