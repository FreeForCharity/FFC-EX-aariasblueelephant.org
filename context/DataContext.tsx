import React, { createContext, useContext, useState, useEffect } from 'react';
import { Event, Testimonial, VolunteerApplication, EventRegistration } from '../types';
import { supabase } from '../lib/supabase';

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
  registerForEvent: (registration: Omit<EventRegistration, 'id' | 'date' | 'status'>) => Promise<MutationResult>;
  approveRegistration: (id: string) => Promise<MutationResult>;
  deleteRegistration: (id: string) => Promise<MutationResult>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplication[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [eventsRes, testsRes, volsRes, regsRes] = await Promise.all([
          supabase.from('events').select('*').order('date', { ascending: true }),
          supabase.from('testimonials').select('*').order('rank', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
          supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false }),
          supabase.from('event_registrations').select('*').order('created_at', { ascending: false })
        ]);

        if (eventsRes.data) {
          setEvents(eventsRes.data.map((e: any) => ({
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
            image: e.image
          })));
        }

        if (testsRes.data) {
          setTestimonials(testsRes.data.map((t: any) => ({
            id: t.id,
            author: t.author,
            role: t.role,
            title: t.title,
            content: t.content,
            date: t.date,
            avatar: t.avatar,
            status: t.status,
            rank: t.rank
          })));
        }

        if (volsRes.data) {
          setVolunteerApplications(volsRes.data.map((v: any) => ({
            id: v.id,
            name: v.name,
            email: v.email,
            interest: v.interest,
            status: v.status
          })));
        }

        if (regsRes.data) {
          setEventRegistrations(regsRes.data.map((r: any) => ({
            id: r.id,
            eventId: r.event_id,
            userId: r.user_id,
            userName: r.user_name,
            userEmail: r.user_email,
            status: r.status,
            date: r.date
          })));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
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
      initial_likes: 0
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
        image: data.image
      }]);
    }
    return { success: true };
  };

  const updateEvent = async (id: string, eventData: Partial<Event>): Promise<MutationResult> => {
    const updatePayload: any = { ...eventData };
    if (eventData.initialLikes !== undefined) updatePayload.initial_likes = eventData.initialLikes;
    delete updatePayload.initialLikes;

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
        status: resData.status
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
    }
    return { success: true };
  };

  const approveVolunteer = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('volunteer_applications').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
      setVolunteerApplications(volunteerApplications.map(app => app.id === id ? { ...app, status: 'Approved' } : app));
      return { success: true };
    } else {
      console.error("Approve volunteer error:", error.message, error.details);
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
        status: resData.status,
        date: resData.date
      }, ...eventRegistrations]);

      // Find local event and optimistic update
      const evt = events.find(e => e.id === data.eventId);
      if (evt) {
        updateEvent(evt.id, { registered: evt.registered + 1 });
      }
    }
    return { success: true };
  };

  const approveRegistration = async (id: string): Promise<MutationResult> => {
    const { error } = await supabase.from('event_registrations').update({ status: 'Approved' }).eq('id', id);
    if (!error) {
      setEventRegistrations(eventRegistrations.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
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
      registerForEvent,
      approveRegistration,
      deleteRegistration,
      isLoading
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