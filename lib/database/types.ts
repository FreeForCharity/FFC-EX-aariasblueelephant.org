import { Event, Testimonial, VolunteerApplication, EventRegistration, User } from '../../types';

export interface IDatabaseProvider {
  // Auth
  getSession(userId?: string, secret?: string): Promise<any>;
  onAuthStateChange(callback: (session: any) => void): { unsubscribe: () => void };
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  updateUser(data: { full_name?: string }): Promise<void>;
  getUserCount(): Promise<number>;
  getUserAvatar(name: string): string;

  // Events
  getEvents(): Promise<Event[]>;
  createEvent(event: Partial<Event>): Promise<void>;
  updateEvent(id: string, data: Partial<Event>): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  getEventById(id: string): Promise<Event | null>;

  // Testimonials
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: Partial<Testimonial>): Promise<void>;
  updateTestimonial(id: string, data: Partial<Testimonial>): Promise<void>;
  deleteTestimonial(id: string): Promise<void>;
  getTestimonialMedia(id: string): Promise<string | null>;

  // Applications
  getVolunteerApplications(userId?: string): Promise<VolunteerApplication[]>;
  createVolunteerApplication(app: Partial<VolunteerApplication>): Promise<void>;
  updateVolunteerApplication(id: string, data: Partial<VolunteerApplication>): Promise<void>;
  deleteVolunteerApplication(id: string): Promise<void>;

  // Registrations
  getEventRegistrations(userId?: string): Promise<EventRegistration[]>;
  createEventRegistration(reg: Partial<EventRegistration>): Promise<void>;
  updateEventRegistration(id: string, data: Partial<EventRegistration>): Promise<void>;
  deleteEventRegistration(id: string): Promise<void>;

  // Storage
  getMediaUrl(path: string): Promise<string>;
}
