import { ACTIVE_DB } from './config';
import { AppwriteProvider } from './AppwriteProvider';
import { SupabaseProvider } from './SupabaseProvider';
import { SimulatedProvider } from './SimulatedProvider';
import { IDatabaseProvider, Team, SubCoach, Student, CheckIn } from './types';
import { ALL_EVENTS, STATIC_REGISTRATIONS } from '../../constants';
import { RESILIENCE_TESTIMONIALS } from '../../data/resilience_data';

class ResilientDatabase implements IDatabaseProvider {
  private realProvider: IDatabaseProvider;
  private simulatedProvider: IDatabaseProvider;

  constructor() {
    if (ACTIVE_DB === 'appwrite') {
      this.realProvider = new AppwriteProvider();
    } else {
      this.realProvider = new SupabaseProvider();
    }
    this.simulatedProvider = new SimulatedProvider();
  }

  private get provider(): IDatabaseProvider {
    if (typeof window !== 'undefined' && localStorage.getItem('abe_use_simulation') === 'true') {
      return this.simulatedProvider;
    }
    return this.realProvider;
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

  // App Settings
  async getMediaAlbumUrl() {
    try {
      return await this.provider.getMediaAlbumUrl();
    } catch (e) {
      return '';
    }
  }
  async setMediaAlbumUrl(url: string) { return this.provider.setMediaAlbumUrl(url); }

  async getCarouselMode(): Promise<'events' | 'media'> {
    try {
      return await this.provider.getCarouselMode();
    } catch (e) {
      return 'events';
    }
  }

  async setCarouselMode(mode: 'events' | 'media') { return this.provider.setCarouselMode(mode); }

  // Summer Buddy Up
  async getTeams(userIdOrEmail?: string) { return this.provider.getTeams(userIdOrEmail); }
  async createTeam(team: Partial<Team>) { return this.provider.createTeam(team); }
  async updateTeam(id: string, data: Partial<Team>) { return this.provider.updateTeam(id, data); }
  async deleteTeam(id: string) { return this.provider.deleteTeam(id); }
  async getSubCoaches(teamId: string) { return this.provider.getSubCoaches(teamId); }
  async createSubCoach(coach: Partial<SubCoach>) { return this.provider.createSubCoach(coach); }
  async updateSubCoach(id: string, data: Partial<SubCoach>) { return this.provider.updateSubCoach(id, data); }
  async getStudents(teamId: string) { return this.provider.getStudents(teamId); }
  async createStudent(student: Partial<Student>) { return this.provider.createStudent(student); }
  async getCheckIns(teamId: string) { return this.provider.getCheckIns(teamId); }
  async createCheckIn(checkIn: Partial<CheckIn>) { return this.provider.createCheckIn(checkIn); }
  async getAllTeamsForAdmin() { return this.provider.getAllTeamsForAdmin(); }
  
  async getPendingSubCoachInvites() { return this.provider.getPendingSubCoachInvites(); }
  async acceptSubCoachInvite(id: string) { return this.provider.acceptSubCoachInvite(id); }
  async getBuddyUpConfig() { return this.provider.getBuddyUpConfig(); }
  async updateBuddyUpConfig(config: any) { return this.provider.updateBuddyUpConfig(config); }
}

export const db = new ResilientDatabase();
