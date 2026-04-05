import { supabase } from './supabase';
import { Event, Testimonial } from '@/app/types';

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    // Return mock data for local development if fetch fails
    return [
      {
        id: '1',
        title: 'Story Time at the Park',
        date: '2026-04-10',
        time: '10:00 AM',
        location: 'Tracy Central Park',
        description: 'An inclusive story time session for children of all abilities.',
        type: 'Event',
        capacity: 20,
        registered: 15,
        initialLikes: 25,
        image: '/images/event1.jpg'
      },
      {
        id: '2',
        title: 'Sensory Friendly Art Workshop',
        date: '2026-04-15',
        time: '2:00 PM',
        location: 'Mountain House Community Center',
        description: 'Explore art in a low-sensory environment.',
        type: 'Class',
        capacity: 15,
        registered: 8,
        initialLikes: 12,
        image: '/images/event2.jpg'
      }
    ];
  }

  return data.map((e: any) => ({
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
  }));
}

export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching event by id:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    date: data.date,
    time: data.time,
    location: data.location,
    description: data.description,
    type: data.type,
    capacity: data.capacity,
    registered: data.registered || 0,
    initialLikes: data.initial_likes || 0,
    image: data.image,
    mediaLink: data.media_link,
  };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('status', 'Approved')
    .order('rank', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }

  return data.map((t: any) => ({
    id: t.id,
    author: t.author,
    role: t.role,
    title: t.title,
    content: t.content,
    date: t.date,
    avatar: t.avatar,
    status: t.status,
    rank: t.rank,
  }));
}
