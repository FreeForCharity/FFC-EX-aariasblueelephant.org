import { IDatabaseProvider, Team, SubCoach, Student, CheckIn, BuddyUpConfig, FriendEntry } from './types';
import { Event, Testimonial, VolunteerApplication, EventRegistration } from '../../types';
import { ALL_EVENTS, STATIC_REGISTRATIONS } from '../../constants';
import { RESILIENCE_TESTIMONIALS } from '../../data/resilience_data';

export class SimulatedProvider implements IDatabaseProvider {
  private authCallbacks: ((session: any) => void)[] = [];

  constructor() {
    // Listen for custom events to trigger auth changes inside the app
    if (typeof window !== 'undefined') {
      window.addEventListener('abe_sim_auth_change', (e: any) => {
        const session = e.detail;
        this.authCallbacks.forEach(cb => cb(session));
      });
    }
  }

  private getList<T>(key: string, defaultVal: T[] = []): T[] {
    const data = localStorage.getItem(key);
    if (!data) {
      // Initialize with defaults if provided
      if (defaultVal.length > 0) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
      }
      return defaultVal;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultVal;
    }
  }

  private saveList<T>(key: string, list: T[]): void {
    localStorage.setItem(key, JSON.stringify(list));
  }

  // Auth
  async getSession() {
    const sessionStr = localStorage.getItem('abe_sim_session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  onAuthStateChange(callback: (session: any) => void) {
    this.authCallbacks.push(callback);
    // Call immediately with the current session
    this.getSession().then(session => callback(session));
    return {
      unsubscribe: () => {
        this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
      }
    };
  }

  async signInWithGoogle() {
    // Simulate by setting a default head coach session and reloading
    const mockHC = {
      user: {
        id: 'hc-user-id',
        email: 'headcoach@aariasblueelephant.org',
        user_metadata: {
          full_name: 'Simulated Head Coach',
          avatar_url: 'https://ui-avatars.com/api/?name=Simulated+Head+Coach&background=00AEEF&color=fff'
        }
      }
    };
    localStorage.setItem('abe_sim_session', JSON.stringify(mockHC));
    window.dispatchEvent(new CustomEvent('abe_sim_auth_change', { detail: mockHC }));
  }

  async signOut() {
    localStorage.removeItem('abe_sim_session');
    window.dispatchEvent(new CustomEvent('abe_sim_auth_change', { detail: null }));
  }

  async updateUser(data: { full_name?: string }) {
    const session = await this.getSession();
    if (session && session.user) {
      if (!session.user.user_metadata) session.user.user_metadata = {};
      session.user.user_metadata.full_name = data.full_name;
      localStorage.setItem('abe_sim_session', JSON.stringify(session));
      window.dispatchEvent(new CustomEvent('abe_sim_auth_change', { detail: session }));
    }
  }

  async getUserCount() {
    return 12; // Static simulated user count
  }

  getUserAvatar(name: string) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  }

  // JWT Support
  setJWT(_jwt: string | null) {}
  async createJWT() {
    return 'mock-jwt-token';
  }

  // Events
  async getEvents() {
    return this.getList<Event>('abe_sim_events', ALL_EVENTS);
  }
  async createEvent(event: Partial<Event>) {
    const list = this.getList<Event>('abe_sim_events', ALL_EVENTS);
    const newEvent = { id: crypto.randomUUID?.() || Math.random().toString(36).substring(2), ...event } as Event;
    list.push(newEvent);
    this.saveList('abe_sim_events', list);
  }
  async updateEvent(id: string, data: Partial<Event>) {
    const list = this.getList<Event>('abe_sim_events', ALL_EVENTS);
    const index = list.findIndex(e => e.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this.saveList('abe_sim_events', list);
    }
  }
  async deleteEvent(id: string) {
    const list = this.getList<Event>('abe_sim_events', ALL_EVENTS);
    this.saveList('abe_sim_events', list.filter(e => e.id !== id));
  }
  async getEventById(id: string) {
    const list = this.getList<Event>('abe_sim_events', ALL_EVENTS);
    return list.find(e => e.id === id) || null;
  }

  // Testimonials
  async getTestimonials() {
    return this.getList<Testimonial>('abe_sim_testimonials', RESILIENCE_TESTIMONIALS);
  }
  async createTestimonial(testimonial: Partial<Testimonial>) {
    const list = this.getList<Testimonial>('abe_sim_testimonials', RESILIENCE_TESTIMONIALS);
    const newT = { id: crypto.randomUUID?.() || Math.random().toString(36).substring(2), ...testimonial } as Testimonial;
    list.push(newT);
    this.saveList('abe_sim_testimonials', list);
  }
  async updateTestimonial(id: string, data: Partial<Testimonial>) {
    const list = this.getList<Testimonial>('abe_sim_testimonials', RESILIENCE_TESTIMONIALS);
    const index = list.findIndex(t => t.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this.saveList('abe_sim_testimonials', list);
    }
  }
  async deleteTestimonial(id: string) {
    const list = this.getList<Testimonial>('abe_sim_testimonials', RESILIENCE_TESTIMONIALS);
    this.saveList('abe_sim_testimonials', list.filter(t => t.id !== id));
  }
  async getTestimonialMedia(id: string) {
    const list = this.getList<Testimonial>('abe_sim_testimonials', RESILIENCE_TESTIMONIALS);
    return list.find(t => t.id === id)?.media || null;
  }

  // Volunteer Applications
  async getVolunteerApplications(userId?: string) {
    const list = this.getList<VolunteerApplication>('abe_sim_volunteer_apps');
    if (userId) return list.filter(a => a.userId === userId);
    return list;
  }
  async createVolunteerApplication(app: Partial<VolunteerApplication>) {
    const list = this.getList<VolunteerApplication>('abe_sim_volunteer_apps');
    const newApp = { id: crypto.randomUUID?.() || Math.random().toString(36).substring(2), created_at: new Date().toISOString(), ...app } as VolunteerApplication;
    list.push(newApp);
    this.saveList('abe_sim_volunteer_apps', list);
  }
  async updateVolunteerApplication(id: string, data: Partial<VolunteerApplication>) {
    const list = this.getList<VolunteerApplication>('abe_sim_volunteer_apps');
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this.saveList('abe_sim_volunteer_apps', list);
    }
  }
  async deleteVolunteerApplication(id: string) {
    const list = this.getList<VolunteerApplication>('abe_sim_volunteer_apps');
    this.saveList('abe_sim_volunteer_apps', list.filter(a => a.id !== id));
  }

  // Event Registrations
  async getEventRegistrations(userId?: string) {
    const list = this.getList<EventRegistration>('abe_sim_event_regs', STATIC_REGISTRATIONS);
    if (userId) return list.filter(r => r.userId === userId);
    return list;
  }
  async createEventRegistration(reg: Partial<EventRegistration>) {
    const list = this.getList<EventRegistration>('abe_sim_event_regs', STATIC_REGISTRATIONS);
    const newReg = { id: crypto.randomUUID?.() || Math.random().toString(36).substring(2), created_at: new Date().toISOString(), ...reg } as EventRegistration;
    list.push(newReg);
    this.saveList('abe_sim_event_regs', list);
  }
  async updateEventRegistration(id: string, data: Partial<EventRegistration>) {
    const list = this.getList<EventRegistration>('abe_sim_event_regs', STATIC_REGISTRATIONS);
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this.saveList('abe_sim_event_regs', list);
    }
  }
  async deleteEventRegistration(id: string) {
    const list = this.getList<EventRegistration>('abe_sim_event_regs', STATIC_REGISTRATIONS);
    this.saveList('abe_sim_event_regs', list.filter(r => r.id !== id));
  }

  // Media
  async getMediaUrl(path: string) {
    return path;
  }

  // Circle of Friends
  async getFriendEntries() {
    return this.getList<FriendEntry>('abe_sim_friend_entries');
  }
  async createFriendEntry(entry: Partial<FriendEntry>) {
    const list = this.getList<FriendEntry>('abe_sim_friend_entries');
    const newEntry = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
      date: new Date().toISOString(),
      ...entry
    } as FriendEntry;
    list.push(newEntry);
    this.saveList('abe_sim_friend_entries', list);
  }
  async updateFriendEntry(id: string, data: Partial<FriendEntry>) {
    const list = this.getList<FriendEntry>('abe_sim_friend_entries');
    const index = list.findIndex(e => e.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...data };
      this.saveList('abe_sim_friend_entries', list);
    }
  }
  async deleteFriendEntry(id: string) {
    const list = this.getList<FriendEntry>('abe_sim_friend_entries');
    this.saveList('abe_sim_friend_entries', list.filter(e => e.id !== id));
  }

  // App Settings
  async getMediaAlbumUrl() {
    return localStorage.getItem('abe_sim_media_album_url') || '';
  }
  async setMediaAlbumUrl(url: string) {
    localStorage.setItem('abe_sim_media_album_url', url);
  }
  async getCarouselMode(): Promise<'events' | 'media'> {
    return (localStorage.getItem('abe_sim_carousel_mode') || 'events') as 'events' | 'media';
  }
  async setCarouselMode(mode: 'events' | 'media') {
    localStorage.setItem('abe_sim_carousel_mode', mode);
  }

  // Summer Buddy Up Relational Tables
  async getTeams(userIdOrEmail?: string): Promise<Team[]> {
    let email = '';
    let uid = '';
    if (userIdOrEmail) {
      if (userIdOrEmail.includes('@')) {
        email = userIdOrEmail.toLowerCase();
      } else {
        uid = userIdOrEmail;
      }
    } else {
      const session = await this.getSession();
      email = session?.user?.email?.toLowerCase() || '';
      uid = session?.user?.id || '';
    }

    const teams = this.getList<Team>('abe_sim_teams');
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');

    const teamIds = new Set<string>();
    const teamsList: Team[] = [];

    if (uid) {
      teams.filter(t => t.head_coach_id === uid).forEach(t => {
        if (!teamIds.has(t.id)) {
          teamIds.add(t.id);
          teamsList.push(t);
        }
      });
    }

    if (email) {
      const subCoachTeamIds = subCoaches.filter(s => s.email.toLowerCase() === email).map(s => s.team_id);
      teams.filter(t => subCoachTeamIds.includes(t.id)).forEach(t => {
        if (!teamIds.has(t.id)) {
          teamIds.add(t.id);
          teamsList.push(t);
        }
      });
    }

    return teamsList;
  }

  async createTeam(team: Partial<Team>): Promise<Team> {
    const teams = this.getList<Team>('abe_sim_teams');
    const newTeam: Team = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
      team_name: team.team_name || 'Mock Team',
      focus_area: team.focus_area || 'Inclusion',
      head_coach_id: team.head_coach_id || 'mock-hc-id',
      status: team.status || 'PENDING_CONSENT',
      ratio_override: team.ratio_override || false,
      created_at: new Date().toISOString()
    };
    teams.push(newTeam);
    this.saveList('abe_sim_teams', teams);
    return newTeam;
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<void> {
    const teams = this.getList<Team>('abe_sim_teams');
    const index = teams.findIndex(t => t.id === id);
    if (index !== -1) {
      teams[index] = { ...teams[index], ...data };
      this.saveList('abe_sim_teams', teams);
    }
  }

  async getPendingSubCoachInvites(): Promise<any[]> {
    const session = await this.getSession();
    const email = session?.user?.email?.toLowerCase();
    if (!email) return [];
    
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');
    const teams = this.getList<Team>('abe_sim_teams');
    
    const pending = subCoaches.filter(sc => sc.email === email && !sc.consent_accepted);
    
    return pending.map(sc => {
      const team = teams.find(t => t.id === sc.team_id);
      return {
        ...sc,
        team: team ? { team_name: team.team_name, head_coach_id: team.head_coach_id } : null
      };
    });
  }

  async acceptSubCoachInvite(id: string): Promise<void> {
    const session = await this.getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error("Must be logged in");
    
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');
    const index = subCoaches.findIndex(sc => sc.id === id);
    if (index !== -1) {
      subCoaches[index] = { ...subCoaches[index], consent_accepted: true, user_id: uid };
      this.saveList('abe_sim_sub_coaches', subCoaches);
    }
  }

  async getSubCoaches(teamId: string): Promise<SubCoach[]> {
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');
    return subCoaches.filter(s => s.team_id === teamId);
  }

  async createSubCoach(coach: Partial<SubCoach>): Promise<void> {
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');
    const newCoach: SubCoach = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
      team_id: coach.team_id || '',
      name: coach.name || '',
      email: (coach.email || '').toLowerCase(),
      phone: coach.phone || '',
      consent_accepted: coach.consent_accepted || false,
      user_id: coach.user_id || null
    };
    subCoaches.push(newCoach);
    this.saveList('abe_sim_sub_coaches', subCoaches);
  }

  async updateSubCoach(id: string, data: Partial<SubCoach>): Promise<void> {
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');
    const index = subCoaches.findIndex(s => s.id === id);
    if (index !== -1) {
      subCoaches[index] = { ...subCoaches[index], ...data };
      if (subCoaches[index].email) {
        subCoaches[index].email = subCoaches[index].email.toLowerCase();
      }
      this.saveList('abe_sim_sub_coaches', subCoaches);
    }
  }

  async getStudents(teamId: string): Promise<Student[]> {
    const students = this.getList<Student>('abe_sim_students');
    return students.filter(s => s.team_id === teamId);
  }

  async createStudent(student: Partial<Student>): Promise<void> {
    const students = this.getList<Student>('abe_sim_students');
    const newStudent: Student = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
      team_id: student.team_id || '',
      name: student.name || '',
      grade: student.grade || '',
      school_district: student.school_district || 'Other Out of Area',
      classification: student.classification || 'Peer Mentor',
      award_delivery_type: student.award_delivery_type || 'VIRTUAL_DIGITAL',
      parent_email: student.parent_email || '',
      parent_user_id: student.parent_user_id || null,
      parent_sub_coach_id: student.parent_sub_coach_id || null
    };
    students.push(newStudent);
    this.saveList('abe_sim_students', students);
  }

  async getCheckIns(teamId: string): Promise<CheckIn[]> {
    const checkIns = this.getList<CheckIn>('abe_sim_check_ins');
    return checkIns.filter(c => c.team_id === teamId).sort((a, b) => a.submitted_at.localeCompare(b.submitted_at));
  }

  async createCheckIn(checkIn: Partial<CheckIn>): Promise<void> {
    const checkIns = this.getList<CheckIn>('abe_sim_check_ins');
    const newCheckIn: CheckIn = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
      team_id: checkIn.team_id || '',
      milestone_target: checkIn.milestone_target || 'JULY_15',
      youtube_url: checkIn.youtube_url || '',
      answers: checkIn.answers || {},
      submitted_at: new Date().toISOString()
    };
    checkIns.push(newCheckIn);
    this.saveList('abe_sim_check_ins', checkIns);
  }

  async getAllTeamsForAdmin(): Promise<any[]> {
    const teams = this.getList<Team>('abe_sim_teams');
    const subCoaches = this.getList<SubCoach>('abe_sim_sub_coaches');
    const students = this.getList<Student>('abe_sim_students');
    const checkIns = this.getList<CheckIn>('abe_sim_check_ins');

    return teams.map(team => ({
      ...team,
      check_ins: checkIns.filter(c => c.team_id === team.id),
      sub_coaches: subCoaches.filter(s => s.team_id === team.id),
      students: students.filter(st => st.team_id === team.id)
    })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getBuddyUpConfig(): Promise<BuddyUpConfig> {
    const defaultCfg: BuddyUpConfig = { checkins_enabled: false, checkin_questions: ['What project are you working on?', 'What did you learn?', 'How could you improve?'] };
    const saved = localStorage.getItem('abe_sim_buddy_up_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return defaultCfg;
  }

  async updateBuddyUpConfig(config: BuddyUpConfig): Promise<void> {
    localStorage.setItem('abe_sim_buddy_up_config', JSON.stringify(config));
  }
}
