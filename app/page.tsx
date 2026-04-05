import React from 'react';
import { getEvents } from '@/lib/db';
import HomeContent from './HomeContent';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NGO',
  name: "Aaria's Blue Elephant",
  url: 'https://aariasblueelephant.org',
  logo: 'https://aariasblueelephant.org/hero-logo.jpg',
  description: 'A safe haven where neurodivergent and neurotypical children grow together through inclusive play and early intervention.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '101 Felicia Ave',
    addressLocality: 'Tracy',
    addressRegion: 'CA',
    postalCode: '95391',
    addressCountry: 'US',
  },
  sameAs: [
    'https://www.facebook.com/aariasblueelephant',
    'https://www.instagram.com/aariasblueelephant',
  ],
};

export default async function Home() {
  const events = await getEvents();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeContent initialEvents={events} />
    </>
  );
}
