import { supabase } from '../supabase';
import { IDatabaseProvider } from './types';
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

  // JWT Support (Supabase handles this internally, but we satisfy the interface)
  setJWT(_jwt: string | null): void {
    // No-op for Supabase
  }

  async createJWT(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }
}
