import { Metadata } from 'next';
import { getEvents } from '@/lib/db';
import EventsContent from './EventsContent';

export const metadata: Metadata = {
  title: "Upcoming Events & Classes | Aaria's Blue Elephant",
  description: "Join our inclusive events, advocacy sessions, and community gatherings designed for all abilities. Find upcoming classes and fundraisers at Aaria's Blue Elephant.",
  openGraph: {
    title: "Inclusive Events & Gatherings | Aaria's Blue Elephant",
    description: "Discover our mission-driven events that foster connection and inclusive play for children of all abilities.",
    images: ["https://aariasblueelephant.org/og-events.jpg"],
  },
};

export default async function EventsPage() {
  const initialEvents = await getEvents();
  
  return <EventsContent initialEvents={initialEvents} />;
}
