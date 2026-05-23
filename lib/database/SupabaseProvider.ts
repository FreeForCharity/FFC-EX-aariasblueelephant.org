import { supabase } from '../supabase';
import { IDatabaseProvider, Team, SubCoach, Student, CheckIn, BuddyUpConfig } from './types';
import { Event, Testimonial, VolunteerApplication, EventRegistration } from '../../types';

export class SupabaseProvider implements IDatabaseProvider {
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (session: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return subscription;
  }

  async signInWithGoogle() {
    let redirectUrl = window.location.origin;
    if (window.location.hostname.includes('github.io')) {
      redirectUrl += '/FFC-EX-aariasblueelephant.org';
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'select_account' },
      }
    });
  }

  async signOut() {
    await supabase.auth.signOut();
  }

  async updateUser(data: { full_name?: string }) {
    await supabase.auth.updateUser({ data });
  }

  async getUserCount() {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    return count || 0;
  }

  getUserAvatar(name: string) {
    // Standard initial fallback for Supabase
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  }

  async getEvents() {
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (error) throw error;
    return (data || []).map((e: any) => ({
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
      image: e.image,
      mediaLink: e.media_link,
      hours: e.duration || e.hours || 0
    }));
  }

  async createEvent(event: Partial<Event>) {
    const payload = {
      ...event,
      initial_likes: event.initialLikes,
      media_link: event.mediaLink,
      duration: event.hours
    };
    delete (payload as any).initialLikes;
    delete (payload as any).mediaLink;
    delete (payload as any).hours;
    delete payload.id;
    
    const { error } = await supabase.from('events').insert([payload]);
    if (error) throw error;
  }

  async updateEvent(id: string, data: Partial<Event>) {
    const payload = {
      ...data,
      ...(data.initialLikes !== undefined && { initial_likes: data.initialLikes }),
      ...(data.mediaLink !== undefined && { media_link: data.mediaLink }),
      ...(data.hours !== undefined && { duration: data.hours })
    };
    delete (payload as any).initialLikes;
    delete (payload as any).mediaLink;
    delete (payload as any).hours;
    delete payload.id;

    const { error } = await supabase.from('events').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  }

  async getEventById(id: string) {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  }

  async getTestimonials() {
    const { data, error } = await supabase.from('testimonials')
      .select('*')
      .order('rank', { ascending: true, nullsFirst: false })
      .order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map((t: any) => ({
      id: t.id,
      author: t.author,
      authorEmail: t.author_email,
      role: t.role,
      title: t.title,
      content: t.content,
      date: t.date,
      avatar: t.avatar,
      status: t.status,
      rating: t.rating,
      rank: t.rank,
      media: t.media,
      userId: t.user_id
    }));
  }

  async createTestimonial(testimonial: Partial<Testimonial>) {
    const payload = {
      ...testimonial,
      author_email: testimonial.authorEmail,
      user_id: testimonial.userId
    };
    delete (payload as any).authorEmail;
    delete (payload as any).userId;
    delete payload.id;

    const { error } = await supabase.from('testimonials').insert([payload]);
    if (error) throw error;
  }

  async updateTestimonial(id: string, data: Partial<Testimonial>) {
    const payload = {
      ...data,
      ...(data.authorEmail !== undefined && { author_email: data.authorEmail }),
      ...(data.userId !== undefined && { user_id: data.userId })
    };
    delete (payload as any).authorEmail;
    delete (payload as any).userId;
    delete payload.id;

    const { error } = await supabase.from('testimonials').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteTestimonial(id: string) {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) throw error;
  }

  async getTestimonialMedia(id: string) {
    const { data } = await supabase.from('testimonials').select('media').eq('id', id).single();
    return data?.media || null;
  }

  async getVolunteerApplications(userId?: string) {
    let query = supabase.from('volunteer_applications').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((app: any) => ({
      ...app,
      userId: app.user_id
    }));
  }

  async createVolunteerApplication(app: Partial<VolunteerApplication>) {
    const payload = {
      ...app,
      user_id: app.userId
    };
    delete payload.userId;

    const { error } = await supabase.from('volunteer_applications').insert([payload]);
    if (error) throw error;
  }

  async updateVolunteerApplication(id: string, data: Partial<VolunteerApplication>) {
    const payload = {
      ...data,
      ...(data.userId !== undefined && { user_id: data.userId })
    };
    delete (payload as any).userId;
    delete payload.id;

    const { error } = await supabase.from('volunteer_applications').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteVolunteerApplication(id: string) {
    const { error } = await supabase.from('volunteer_applications').delete().eq('id', id);
    if (error) throw error;
  }

  async getEventRegistrations(userId?: string) {
    let query = supabase.from('event_registrations').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((reg: any) => ({
      ...reg,
      eventId: reg.event_id,
      userId: reg.user_id,
      userName: reg.user_name,
      userEmail: reg.user_email,
      specialNeeds: reg.special_needs
    }));
  }

  async createEventRegistration(reg: Partial<EventRegistration>) {
    const payload = {
      ...reg,
      event_id: reg.eventId,
      user_id: reg.userId,
      user_name: reg.userName,
      user_email: reg.userEmail,
      special_needs: reg.specialNeeds
    };
    delete payload.eventId;
    delete payload.userId;
    delete payload.userName;
    delete payload.userEmail;
    delete payload.specialNeeds;

    const { error } = await supabase.from('event_registrations').insert([payload]);
    if (error) throw error;
  }

  async updateEventRegistration(id: string, data: Partial<EventRegistration>) {
    const payload = {
      ...data,
      ...(data.eventId !== undefined && { event_id: data.eventId }),
      ...(data.userId !== undefined && { user_id: data.userId }),
      ...(data.userName !== undefined && { user_name: data.userName }),
      ...(data.userEmail !== undefined && { user_email: data.userEmail }),
      ...(data.specialNeeds !== undefined && { special_needs: data.specialNeeds })
    };
    delete (payload as any).eventId;
    delete (payload as any).userId;
    delete (payload as any).userName;
    delete (payload as any).userEmail;
    delete (payload as any).specialNeeds;
    delete payload.id;

    const { error } = await supabase.from('event_registrations').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteEventRegistration(id: string) {
    const { error } = await supabase.from('event_registrations').delete().eq('id', id);
    if (error) throw error;
  }

  async getMediaUrl(path: string) {
    // In Supabase, if it's already a URL, return it, otherwise get public URL
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  }

  async getFriendEntries() {
    const { data, error } = await supabase.from('circle_of_friends')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((e: any) => ({
      id: e.id,
      name: e.name,
      grade: e.grade,
      school: e.school,
      teacher: e.teacher,
      category: e.category,
      content: e.content,
      media: e.media,
      priority: e.priority,
      date: e.created_at
    }));
  }

  async createFriendEntry(entry: Partial<any>) {
    const payload = { ...entry };
    if (payload.date) {
      payload.created_at = payload.date;
      delete payload.date;
    }
    const { error } = await supabase.from('circle_of_friends').insert([payload]);
    if (error) throw error;
  }

  async updateFriendEntry(id: string, data: Partial<any>) {
    const payload = { ...data };
    if (payload.date) {
      payload.created_at = payload.date;
      delete payload.date;
    }
    delete payload.id;
    const { error } = await supabase.from('circle_of_friends').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteFriendEntry(id: string) {
    const { error } = await supabase.from('circle_of_friends').delete().eq('id', id);
    if (error) throw error;
  }

  // JWT Support (Supabase handles this internally, but we satisfy the interface)
  setJWT(_jwt: string | null): void {
    // No-op for Supabase
  }

  async createJWT(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // App Settings
  async getMediaAlbumUrl(): Promise<string> {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'google_photos_album_url').single();
    if (error) return '';
    return data?.value || '';
  }

  async setMediaAlbumUrl(url: string): Promise<void> {
    const { error } = await supabase.from('app_settings').upsert({ key: 'google_photos_album_url', value: url });
    if (error) throw error;
  }

  async getCarouselMode(): Promise<'events' | 'media'> {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'carousel_mode').single();
    if (error || !data) return 'events';
    return (data.value === 'media' ? 'media' : 'events') as 'events' | 'media';
  }

  async setCarouselMode(mode: 'events' | 'media'): Promise<void> {
    const { error } = await supabase.from('app_settings').upsert({ key: 'carousel_mode', value: mode });
    if (error) throw error;
  }

  // Summer Buddy Up
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

    const teamIds = new Set<string>();
    const teamsList: Team[] = [];

    if (uid) {
      const { data: headCoachTeams, error: err1 } = await supabase
        .from('teams')
        .select('*')
        .eq('head_coach_id', uid);
      if (err1) throw err1;
      if (headCoachTeams) {
        for (const t of headCoachTeams) {
          if (!teamIds.has(t.id)) {
            teamIds.add(t.id);
            teamsList.push(t);
          }
        }
      }
    }

    if (email) {
      const { data: subCoachesData, error: err2 } = await supabase
        .from('sub_coaches')
        .select('team_id')
        .eq('email', email);
      if (err2) throw err2;
      
      const subCoachTeamIds = (subCoachesData || []).map(s => s.team_id);
      if (subCoachTeamIds.length > 0) {
        const { data: subTeams, error: err3 } = await supabase
          .from('teams')
          .select('*')
          .in('id', subCoachTeamIds);
        if (err3) throw err3;
        if (subTeams) {
          for (const t of subTeams) {
            if (!teamIds.has(t.id)) {
              teamIds.add(t.id);
              teamsList.push(t);
            }
          }
        }
      }
    }

    return teamsList;
  }

  async createTeam(team: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase.from('teams').insert([team]).select().single();
    if (error) throw error;
    return data;
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<void> {
    const { error } = await supabase.from('teams').update(data).eq('id', id);
    if (error) throw error;
  }

  async getPendingSubCoachInvites(): Promise<any[]> {
    const session = await this.getSession();
    const email = session?.user?.email?.toLowerCase();
    if (!email) return [];
    
    // Fetch pending invites
    const { data: invites, error } = await supabase
      .from('sub_coaches')
      .select(`
        *,
        team:teams (
          team_name,
          head_coach_id
        )
      `)
      .eq('email', email)
      .eq('consent_accepted', false);
      
    if (error) throw error;
    return invites || [];
  }

  async acceptSubCoachInvite(id: string): Promise<void> {
    const session = await this.getSession();
    const uid = session?.user?.id;
    if (!uid) throw new Error("Must be logged in to accept invite");
    
    const { error } = await supabase
      .from('sub_coaches')
      .update({ 
        consent_accepted: true,
        user_id: uid
      })
      .eq('id', id);
      
    if (error) throw error;
  }

  async getSubCoaches(teamId: string): Promise<SubCoach[]> {
    const { data, error } = await supabase.from('sub_coaches').select('*').eq('team_id', teamId);
    if (error) throw error;
    return data || [];
  }

  async createSubCoach(coach: Partial<SubCoach>): Promise<void> {
    const { error } = await supabase.from('sub_coaches').insert([{
      ...coach,
      email: coach.email?.toLowerCase()
    }]);
    if (error) throw error;
    
    if (coach.team_id) {
      await this.updateTeam(coach.team_id, { status: 'PENDING_ADMIN_APPROVAL' });
    }
  }

  async updateSubCoach(id: string, data: Partial<SubCoach>): Promise<void> {
    const payload = { ...data };
    if (payload.email) payload.email = payload.email.toLowerCase();
    const { error } = await supabase.from('sub_coaches').update(payload).eq('id', id);
    if (error) throw error;
  }

  async getStudents(teamId: string): Promise<Student[]> {
    const { data, error } = await supabase.from('students').select('*').eq('team_id', teamId);
    if (error) throw error;
    return data || [];
  }

  async createStudent(student: Partial<Student>): Promise<void> {
    const { error } = await supabase.from('students').insert([student]);
    if (error) throw error;
    
    if (student.team_id) {
      await this.updateTeam(student.team_id, { status: 'PENDING_ADMIN_APPROVAL' });
    }
  }

  async getCheckIns(teamId: string): Promise<CheckIn[]> {
    const { data, error } = await supabase.from('check_ins').select('*').eq('team_id', teamId).order('submitted_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createCheckIn(checkIn: Partial<CheckIn>): Promise<void> {
    const { error } = await supabase.from('check_ins').insert([checkIn]);
    if (error) throw error;
  }

  async getAllTeamsForAdmin(): Promise<any[]> {
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        *,
        sub_coaches (*),
        students (*),
        check_ins (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (teams || []).map(team => ({
      team: { ...team, sub_coaches: undefined, students: undefined, check_ins: undefined },
      checkIns: team.check_ins || [],
      subCoaches: team.sub_coaches || [],
      students: team.students || []
    }));
  }

  async getBuddyUpConfig(): Promise<BuddyUpConfig> {
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'buddy_up_config').single();
    if (error && error.code !== 'PGRST116') {
      console.warn('Failed to fetch buddy_up_config', error);
      return { checkins_enabled: false, checkin_questions: ['What project are you working on?', 'What did you learn?', 'How could you improve?'] };
    }
    if (data?.value) {
      try {
        return JSON.parse(data.value) as BuddyUpConfig;
      } catch(e) {
        // fallback
      }
    }
    return { checkins_enabled: false, checkin_questions: ['What project are you working on?', 'What did you learn?', 'How could you improve?'] };
  }

  async updateBuddyUpConfig(config: BuddyUpConfig): Promise<void> {
    const { error } = await supabase.from('app_settings').upsert({ key: 'buddy_up_config', value: JSON.stringify(config) });
    if (error) throw error;
  }
}
