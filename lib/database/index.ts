import { ACTIVE_DB } from './config';
import { AppwriteProvider } from './AppwriteProvider';
import { SupabaseProvider } from './SupabaseProvider';
import { IDatabaseProvider } from './types';
import { ALL_EVENTS, STATIC_REGISTRATIONS } from '../../constants';
import { RESILIENCE_TESTIMONIALS } from '../../data/resilience_data';

class ResilientDatabase implements IDatabaseProvider {
  private provider: IDatabaseProvider;

  constructor() {
    if (ACTIVE_DB === 'appwrite') {
      this.provider = new AppwriteProvider();
    } else {
      this.provider = new SupabaseProvider();
    }
  }

  // Auth
  async getSession() { return this.provider.getSession(); }
  onAuthStateChange(callback: (session: any) => void) { return this.provider.onAuthStateChange(callback); }
  async signInWithGoogle() { return this.provider.signInWithGoogle(); }
  async signOut() { return this.provider.signOut(); }
  async updateUser(data: { full_name?: string }) { return this.provider.updateUser(data); }
  
  async getUserCount() {
    try {
      return await this.provider.getUserCount();
    } catch (e) {
      return 42; // Fallback
    }
  }

  getUserAvatar(name: string) {
    return this.provider.getUserAvatar(name);
  }

  // Events
  async getEvents() {
    try {
      return await this.provider.getEvents();
    } catch (e) {
      console.warn("Database error, falling back to static events", e);
      return ALL_EVENTS;
    }
  }
  async createEvent(event: Partial<any>) { return this.provider.createEvent(event); }
  async updateEvent(id: string, data: Partial<any>) { return this.provider.updateEvent(id, data); }
  async deleteEvent(id: string) { return this.provider.deleteEvent(id); }
  async getEventById(id: string) {
    try {
      return await this.provider.getEventById(id);
    } catch (e) {
      return ALL_EVENTS.find(e => e.id === id) || null;
    }
  }

  // Testimonials
  async getTestimonials() {
    try {
      return await this.provider.getTestimonials();
    } catch (e) {
      console.warn("Database error, falling back to static testimonials", e);
      return RESILIENCE_TESTIMONIALS;
    }
  }
  async createTestimonial(testimonial: Partial<any>) { return this.provider.createTestimonial(testimonial); }
  async updateTestimonial(id: string, data: Partial<any>) { return this.provider.updateTestimonial(id, data); }
  async deleteTestimonial(id: string) { return this.provider.deleteTestimonial(id); }
  async getTestimonialMedia(id: string) {
    try {
      return await this.provider.getTestimonialMedia(id);
    } catch (e) {
      return RESILIENCE_TESTIMONIALS.find(t => t.id === id)?.media || null;
    }
  }

  // Applications
  async getVolunteerApplications(userId?: string) {
    try {
      return await this.provider.getVolunteerApplications(userId);
    } catch (e) {
      return []; // Apps can't be baked in easily
    }
  }
  async createVolunteerApplication(app: Partial<any>) { return this.provider.createVolunteerApplication(app); }
  async updateVolunteerApplication(id: string, data: Partial<any>) { return this.provider.updateVolunteerApplication(id, data); }
  async deleteVolunteerApplication(id: string) { return this.provider.deleteVolunteerApplication(id); }

  // Registrations
  async getEventRegistrations(userId?: string) {
    try {
      return await this.provider.getEventRegistrations(userId);
    } catch (e) {
      return userId ? STATIC_REGISTRATIONS.filter(r => r.userId === userId) : STATIC_REGISTRATIONS;
    }
  }
  async createEventRegistration(reg: Partial<any>) { return this.provider.createEventRegistration(reg); }
  async updateEventRegistration(id: string, data: Partial<any>) { return this.provider.updateEventRegistration(id, data); }
  async deleteEventRegistration(id: string) { return this.provider.deleteEventRegistration(id); }

  // Storage
  async getMediaUrl(path: string) {
    try {
      return await this.provider.getMediaUrl(path);
    } catch (e) {
      return path; // Fallback to raw path
    }
  }

  // JWT Support
  setJWT(jwt: string | null) { this.provider.setJWT(jwt); }
  async createJWT() { return this.provider.createJWT(); }

  // Circle of Friends
  async getFriendEntries() {
    try {
      return await this.provider.getFriendEntries();
    } catch (e) {
      console.warn("Database error for circle of friends", e);
      return [];
    }
  }
  async createFriendEntry(entry: Partial<any>) { return this.provider.createFriendEntry(entry); }
  async updateFriendEntry(id: string, data: Partial<any>) { return this.provider.updateFriendEntry(id, data); }
  async deleteFriendEntry(id: string) { return this.provider.deleteFriendEntry(id); }
}

export const db = new ResilientDatabase();
