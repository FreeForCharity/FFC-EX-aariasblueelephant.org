import React, { createContext, useContext, useState, useEffect } from 'react';
import { Event, Testimonial, VolunteerApplication } from '../types';
import { ALL_EVENTS } from '../constants';

interface DataContextType {
  events: Event[];
  testimonials: Testimonial[];
  volunteerApplications: VolunteerApplication[];
  addEvent: (event: Omit<Event, 'id' | 'registered' | 'initialLikes'>) => void;
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'date' | 'status'>) => void;
  approveTestimonial: (id: string) => void;
  deleteTestimonial: (id: string) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  submitVolunteerApp: (app: Omit<VolunteerApplication, 'id' | 'status'>) => void;
  approveVolunteer: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    author: "Sarah Jenkins",
    role: "Parent",
    content: "Finding Aaria's Blue Elephant was a turning point for our family. My son finally has a place where he feels he belongs.",
    date: "2023-10-15",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
    status: 'Approved'
  },
  {
    id: 't2',
    author: "David Chen",
    role: "Donor",
    content: "I support this cause because I've seen the direct impact on the community. Transparency and heart are at the core here.",
    date: "2023-09-22",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
    status: 'Approved'
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplication[]>([]);

  useEffect(() => {
    // Load from localStorage or fall back to constants
    const storedEvents = localStorage.getItem('abe_events');
    const storedTestimonials = localStorage.getItem('abe_testimonials');
    const storedApps = localStorage.getItem('abe_volunteers');

    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      setEvents(ALL_EVENTS);
    }

    if (storedTestimonials) {
      setTestimonials(JSON.parse(storedTestimonials));
    } else {
      setTestimonials(INITIAL_TESTIMONIALS);
    }

    if (storedApps) {
      setVolunteerApplications(JSON.parse(storedApps));
    } else {
      // Mock initial pending app
      setVolunteerApplications([{
        id: 'v1', name: 'Emily Blunt', email: 'emily@example.com', interest: 'Art Class Helper', status: 'Pending'
      }]);
    }
  }, []);

  // Persistence helpers
  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem('abe_events', JSON.stringify(newEvents));
  };

  const saveTestimonials = (newTests: Testimonial[]) => {
    setTestimonials(newTests);
    localStorage.setItem('abe_testimonials', JSON.stringify(newTests));
  };

  const saveApps = (newApps: VolunteerApplication[]) => {
    setVolunteerApplications(newApps);
    localStorage.setItem('abe_volunteers', JSON.stringify(newApps));
  };

  const addEvent = (eventData: Omit<Event, 'id' | 'registered' | 'initialLikes'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
      registered: 0,
      initialLikes: 0
    };
    saveEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, eventData: Partial<Event>) => {
    const updated = events.map(evt =>
      evt.id === id ? { ...evt, ...eventData } : evt
    );
    saveEvents(updated);
  };

  const deleteEvent = (id: string) => {
    const updated = events.filter(evt => evt.id !== id);
    saveEvents(updated);
  };

  const addTestimonial = (data: Omit<Testimonial, 'id' | 'date' | 'status'>) => {
    const newTestimonial: Testimonial = {
      ...data,
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    saveTestimonials([newTestimonial, ...testimonials]);
  };

  const approveTestimonial = (id: string) => {
    const updated = testimonials.map(t =>
      t.id === id ? { ...t, status: 'Approved' as const } : t
    );
    saveTestimonials(updated);
  };

  const deleteTestimonial = (id: string) => {
    const updated = testimonials.filter(t => t.id !== id);
    saveTestimonials(updated);
  };

  const submitVolunteerApp = (data: Omit<VolunteerApplication, 'id' | 'status'>) => {
    const newApp: VolunteerApplication = {
      ...data,
      id: Date.now().toString(),
      status: 'Pending'
    };
    saveApps([...volunteerApplications, newApp]);
  };

  const approveVolunteer = (id: string) => {
    const updated = volunteerApplications.map(app =>
      app.id === id ? { ...app, status: 'Approved' as const } : app
    );
    saveApps(updated);
  };

  return (
    <DataContext.Provider value={{
      events,
      testimonials,
      volunteerApplications,
      addEvent,
      updateEvent,
      deleteEvent,
      addTestimonial,
      approveTestimonial,
      deleteTestimonial,
      submitVolunteerApp,
      approveVolunteer
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