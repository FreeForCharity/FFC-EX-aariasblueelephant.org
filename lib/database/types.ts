import { Event, Testimonial, VolunteerApplication, EventRegistration, User } from '../../types';

export interface FriendEntry {
  id: string;
  name: string;
  grade: string;
  school: string;
  teacher: string;
  category: string;
  content: string;
  media: string | string[];
  priority?: number;
  date?: string;
}

export interface IDatabaseProvider {
  // Auth
  getSession(): Promise<any>;
  onAuthStateChange(callback: (session: any) => void): { unsubscribe: () => void };
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  updateUser(data: { full_name?: string }): Promise<void>;
  getUserCount(): Promise<number>;
  getUserAvatar(name: string): string;
  
  // JWT Support for Incognito/Safari resilience
  setJWT(jwt: string | null): void;
  createJWT(): Promise<string | null>;

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

  // Circle of Friends
  getFriendEntries(): Promise<FriendEntry[]>;
  createFriendEntry(entry: Partial<FriendEntry>): Promise<void>;
  updateFriendEntry(id: string, data: Partial<FriendEntry>): Promise<void>;
  deleteFriendEntry(id: string): Promise<void>;
}
