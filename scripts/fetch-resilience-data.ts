import { Client as AppwriteClient, Databases as AppwriteDatabases, Query as AppwriteQuery } from 'node-appwrite';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the active provider from env, defaulting to 'appwrite'
// Supabase is the live database; Appwrite is retired and only reachable on purpose
const PROVIDER = (process.env.DATABASE_PROVIDER || 'supabase').toLowerCase();

/*
 * PRIVACY: this snapshot is bundled into the public site and committed to a
 * public repo. Only public content goes in — events and published stories.
 * Never registrations, emails, account ids or accommodation details.
 */
const CONFIG = {
  appwrite: {
    ENDPOINT: 'https://sfo.cloud.appwrite.io/v1',
    PROJECT_ID: '69db08fb001174cd0d39',
    // never a literal: this repo is public. Set it as the APPWRITE_API_KEY secret.
    API_KEY: process.env.APPWRITE_API_KEY || '',
    DATABASE_ID: '69db1c34003bd1ff00a2',
    COLLECTIONS: {
      EVENTS: 'events',
      TESTIMONIALS: 'testimonials',
      REGISTRATIONS: 'event_registrations'
    }
  },
  supabase: {
    URL: process.env.SUPABASE_URL || 'https://joclqxgedhdgslxnovxz.supabase.co',
    KEY: process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  }
};

async function fetchFromAppwrite() {
  if (!CONFIG.appwrite.API_KEY) throw new Error('APPWRITE_API_KEY is not set');
  const client = new AppwriteClient()
    .setEndpoint(CONFIG.appwrite.ENDPOINT)
    .setProject(CONFIG.appwrite.PROJECT_ID)
    .setKey(CONFIG.appwrite.API_KEY);
    
  const databases = new AppwriteDatabases(client);

  const [events, tests] = await Promise.all([
    databases.listDocuments(CONFIG.appwrite.DATABASE_ID, CONFIG.appwrite.COLLECTIONS.EVENTS, [AppwriteQuery.limit(100)]),
    databases.listDocuments(CONFIG.appwrite.DATABASE_ID, CONFIG.appwrite.COLLECTIONS.TESTIMONIALS, [AppwriteQuery.limit(100)]),
  ]);

  return {
    events: events.documents.map((doc: any) => ({
      id: doc.$id,
      title: doc.title,
      date: doc.date,
      time: doc.time,
      location: doc.location,
      description: doc.description,
      type: doc.type,
      capacity: doc.capacity,
      registered: doc.registered || 0,
      initialLikes: doc.initialLikes || 0,
      image: doc.image,
      mediaLink: doc.mediaLink,
      hours: doc.hours || 0
    })),
    testimonials: tests.documents.map((doc: any) => ({
      id: doc.$id,
      author: doc.author,
      role: doc.role,
      title: doc.title,
      content: doc.content,
      date: doc.date,
      avatar: doc.avatar,
      status: doc.status,
      rating: doc.rating,
      rank: doc.rank,
      media: doc.media,
    })),
  };
}

async function fetchFromSupabase() {
  const supabase = createSupabaseClient(CONFIG.supabase.URL, CONFIG.supabase.KEY);

  const [events, tests] = await Promise.all([
    supabase.from('events').select('*').order('date', { ascending: true }),
    // the email-free public view: the table itself is private
    supabase.from('testimonials_public').select('*').order('date', { ascending: false }),
  ]);

  if (events.error) throw events.error;
  if (tests.error) throw tests.error;

  // the same shapes the site's Supabase provider produces (camelCase, no extras)
  return {
    events: (events.data || []).map((e: any) => ({
      id: e.id, title: e.title, date: e.date, time: e.time, location: e.location,
      description: e.description, type: e.type, capacity: e.capacity,
      registered: e.registered || 0, initialLikes: e.initial_likes || 0,
      image: e.image, mediaLink: e.media_link, hours: Number(e.duration || e.hours || 0),
    })),
    // published stories only, and only the story: no email, no account id
    testimonials: (tests.data || []).map((t: any) => ({
      id: t.id, author: t.author, role: t.role, title: t.title, content: t.content,
      date: t.date, avatar: t.avatar, status: t.status, rating: t.rating, rank: t.rank, media: t.media,
    })),
  };
}

async function runSync() {
  console.log(`🔄 [Hybrid Backup] Fetching resilience snapshot from ${PROVIDER.toUpperCase()}...`);
  
  try {
    const data = PROVIDER === 'supabase' ? await fetchFromSupabase() : await fetchFromAppwrite();

    const fileContent = `/**
 * AUTO-GENERATED RESILIENCE DATA
 * This file is updated at build time or via GitHub Actions to provide 
 * a local offline fallback if the primary database is unreachable.
 * Source Provider: ${PROVIDER.toUpperCase()}
 */
import { Event, Testimonial } from '../types';

export const RESILIENCE_EVENTS: Event[] = ${JSON.stringify(data.events, null, 2)};
export const RESILIENCE_TESTIMONIALS: Testimonial[] = ${JSON.stringify(data.testimonials, null, 2)};
`;

    const outputPath = path.resolve(__dirname, '../data/resilience_data.ts');
    fs.writeFileSync(outputPath, fileContent);
    
    console.log(`✅ [${PROVIDER.toUpperCase()}] Resilience snapshot updated successfully.`);
    console.log(`📊 Stats: ${data.events.length} events, ${data.testimonials.length} testimonials.`);
  } catch (error: any) {
    console.error(`❌ [${PROVIDER.toUpperCase()}] Backup failed:`, error.message || error);
    console.warn(`⚠️ Warning: Could not generate resilience data. The pipeline will continue using default fallbacks, but your active connection to ${PROVIDER.toUpperCase()} may be degraded or quota-exceeded!`);
    // Removing process.exit(1) to prevent the entire deployment pipeline from breaking due to a database quota error.
  }
}

runSync();
