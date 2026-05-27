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

  // App Settings
  getMediaAlbumUrl(): Promise<string>;
  setMediaAlbumUrl(url: string): Promise<void>;
  getCarouselMode(): Promise<'events' | 'media'>;
  setCarouselMode(mode: 'events' | 'media'): Promise<void>;

  // Summer Buddy Up
  getTeams(userIdOrEmail?: string): Promise<Team[]>;
  createTeam(team: Partial<Team>): Promise<Team>;
  updateTeam(id: string, data: Partial<Team>): Promise<void>;
  deleteTeam(id: string): Promise<void>;
  getSubCoaches(teamId: string): Promise<SubCoach[]>;
  createSubCoach(coach: Partial<SubCoach>): Promise<void>;
  updateSubCoach(id: string, data: Partial<SubCoach>): Promise<void>;
  getStudents(teamId: string): Promise<Student[]>;
  createStudent(student: Partial<Student>): Promise<void>;
  getCheckIns(teamId: string): Promise<CheckIn[]>;
  createCheckIn(checkIn: Partial<CheckIn>): Promise<void>;
  getAllTeamsForAdmin(): Promise<any[]>;
  
  getPendingSubCoachInvites(): Promise<any[]>;
  acceptSubCoachInvite(id: string): Promise<void>;
  
  // Settings
  getBuddyUpConfig(): Promise<BuddyUpConfig>;
  updateBuddyUpConfig(config: BuddyUpConfig): Promise<void>;
}

export interface Team {
  id: string;
  team_name: string;
  focus_area: string;
  head_coach_id: string;
  status: 'PENDING_CONSENT' | 'PENDING_ADMIN_APPROVAL' | 'ACTIVE' | 'FLAGGED' | 'COMPLETED';
  ratio_override: boolean;
  created_at: string;
}

export interface SubCoach {
  id: string;
  team_id: string;
  name: string;
  email: string;
  phone: string;
  consent_accepted: boolean;
  user_id: string | null;
}

export interface Student {
  id: string;
  team_id: string;
  name: string;
  grade: string;
  school_district: 'LUSD' | 'Tracy Unified' | 'Other Out of Area';
  classification: 'Inclusion Buddy' | 'Gen Ed, without any special accomodation';
  award_delivery_type: 'IN_PERSON_ONLY' | 'VIRTUAL_DIGITAL';
  parent_email: string;
  parent_user_id?: string | null;
  parent_sub_coach_id?: string | null;
}

export interface CheckIn {
  id: string;
  team_id: string;
  milestone_target: 'JULY_15' | 'JULY_30' | 'AUGUST_15' | 'AUGUST_30';
  youtube_url: string;
  answers: Record<string, string>;
  submitted_at: string;
}

export interface BuddyUpConfig {
  checkins_enabled: boolean;
  checkin_questions: string[];
  unlocked_milestones?: string[];
}
