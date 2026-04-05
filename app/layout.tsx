import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Providers from '@/components/Providers';
import Delight from '@/components/Delight';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://aariasblueelephant.org'),
  title: {
    default: "Aaria's Blue Elephant | Autism Awareness & Inclusion",
    template: "%s | Aaria's Blue Elephant"
  },
  description: "Fun without barriers. Inclusive play for children with autism and sensory processing needs.",
  keywords: ["Autism", "Inclusion", "Neurodiversity", "Events", "Tracy CA", "Early Intervention"],
  authors: [{ name: "Aaria's Blue Elephant" }],
  creator: "Aaria's Blue Elephant",
  publisher: "Aaria's Blue Elephant",
  formatDetection: {
    email: false,
    address: true,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aariasblueelephant.org',
    siteName: "Aaria's Blue Elephant",
    title: "Aaria's Blue Elephant | Autism Awareness & Inclusion",
    description: "Fun without barriers. Inclusive play for children with autism and sensory processing needs.",
    images: [
      {
        url: '/hero-logo.jpg',
        width: 1200,
        height: 630,
        alt: "Aaria's Blue Elephant Logo",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Aaria's Blue Elephant | Autism Awareness & Inclusion",
    description: "Fun without barriers. Inclusive play for children with autism and sensory processing needs.",
    images: ['/hero-logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors selection:bg-[#00AEEF] selection:text-white`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main id="main-content" className="flex-grow outline-none" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </div>
          <Delight />
        </Providers>
      </body>
    </html>
  );
}
