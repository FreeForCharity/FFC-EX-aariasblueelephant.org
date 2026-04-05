import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEventById, getEvents } from '@/lib/db';
import EventDetailsContent from './EventDetailsContent';
import { DEFAULT_EVENT_IMAGE } from '@/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return {
      title: 'Event Not Found',
    };
  }

  return {
    title: `${event.title} | Events | Aaria's Blue Elephant`,
    description: event.description.substring(0, 160),
    openGraph: {
      title: event.title,
      description: event.description.substring(0, 160),
      images: [event.image || DEFAULT_EVENT_IMAGE],
    },
  };
}

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((event) => ({
    id: event.id,
  }));
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date,
    location: {
      '@type': 'Place',
      name: event.location,
      address: event.location,
    },
    image: event.image || DEFAULT_EVENT_IMAGE,
    description: event.description,
    organizer: {
      '@type': 'NGO',
      name: "Aaria's Blue Elephant",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <EventDetailsContent event={event} />
    </>
  );
}
