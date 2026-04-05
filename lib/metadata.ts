import type { Metadata } from 'next';

export const baseMetadata: Metadata = {
  title: {
    default: "Aaria's Blue Elephant",
    template: "%s | Aaria's Blue Elephant",
  },
  description: "A safe haven for neurodivergent and neurotypical children. Early intervention, inclusive play, and community building.",
  metadataBase: new URL('https://aariasblueelephant.org'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Aaria's Blue Elephant",
    description: "A safe haven for neurodivergent and neurotypical children.",
    url: 'https://aariasblueelephant.org',
    siteName: "Aaria's Blue Elephant",
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: "Aaria's Blue Elephant Logo",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Aaria's Blue Elephant",
    description: "A safe haven for neurodivergent and neurotypical children.",
    images: ['/logo.png'],
  },
};
