import { Client as AppwriteClient, Databases as AppwriteDatabases, Query as AppwriteQuery } from 'node-appwrite';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the active provider from env, defaulting to 'appwrite'
const PROVIDER = (process.env.DATABASE_PROVIDER || 'appwrite').toLowerCase();

const CONFIG = {
  appwrite: {
    ENDPOINT: 'https://sfo.cloud.appwrite.io/v1',
    PROJECT_ID: '69db08fb001174cd0d39',
    API_KEY: process.env.APPWRITE_API_KEY || 'standard_19197f3504070eb4262276278d895c46b408cd5e7cf7d5e439070c34963ccca216107ec872f383c6f90ab97ace851a612feb31b1b9d5fc6c5999d940b307162a9c81ad41ea4e50e134f089bd5261c1d35242b77e2b31472514a84bc065d9e7ae059f43b5c7cc784173917892d69d64bf2621d365d98bd3c2fb77ec696eaf573c',
    DATABASE_ID: '69db1c34003bd1ff00a2',
    COLLECTIONS: {
      EVENTS: 'events',
      TESTIMONIALS: 'testimonials',
      REGISTRATIONS: 'event_registrations'
    }
  },
  supabase: {
    URL: process.env.SUPABASE_URL || 'https://joclqxgedhdgslxnovxz.supabase.co',
    KEY: process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  }
};

async function fetchFromAppwrite() {
  const client = new AppwriteClient()
    .setEndpoint(CONFIG.appwrite.ENDPOINT)
    .setProject(CONFIG.appwrite.PROJECT_ID)
    .setKey(CONFIG.appwrite.API_KEY);
    
  const databases = new AppwriteDatabases(client);

  const [events, tests, regs] = await Promise.all([
    databases.listDocuments(CONFIG.appwrite.DATABASE_ID, CONFIG.appwrite.COLLECTIONS.EVENTS, [AppwriteQuery.limit(100)]),
    databases.listDocuments(CONFIG.appwrite.DATABASE_ID, CONFIG.appwrite.COLLECTIONS.TESTIMONIALS, [AppwriteQuery.limit(100)]),
    databases.listDocuments(CONFIG.appwrite.DATABASE_ID, CONFIG.appwrite.COLLECTIONS.REGISTRATIONS, [AppwriteQuery.limit(100)])
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
      authorEmail: doc.authorEmail,
      role: doc.role,
      title: doc.title,
      content: doc.content,
      date: doc.date,
      avatar: doc.avatar,
      status: doc.status,
      rating: doc.rating,
      rank: doc.rank,
      media: doc.media,
      userId: doc.userId
    })),
    registrations: regs.documents.map((doc: any) => ({
      id: doc.$id,
      eventId: doc.eventId,
      userId: doc.userId,
      userName: doc.userName,
      userEmail: doc.userEmail,
      status: doc.status,
      date: doc.date,
      specialNeeds: doc.specialNeeds
    }))
  };
}

async function fetchFromSupabase() {
  const supabase = createSupabaseClient(CONFIG.supabase.URL, CONFIG.supabase.KEY);

  const [events, tests, regs] = await Promise.all([
    supabase.from('events').select('*').order('date', { ascending: true }),
    supabase.from('testimonials').select('*').order('date', { ascending: false }),
    supabase.from('event_registrations').select('*').order('created_at', { ascending: false })
  ]);

  if (events.error) throw events.error;
  if (tests.error) throw tests.error;
  if (regs.error) throw regs.error;

  return {
    events: events.data || [],
    testimonials: tests.data || [],
    registrations: regs.data || []
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
import { Event, Testimonial, EventRegistration } from '../types';

export const RESILIENCE_EVENTS: Event[] = ${JSON.stringify(data.events, null, 2)};
export const RESILIENCE_TESTIMONIALS: Testimonial[] = ${JSON.stringify(data.testimonials, null, 2)};
export const RESILIENCE_REGISTRATIONS: EventRegistration[] = ${JSON.stringify(data.registrations, null, 2)};
`;

    const outputPath = path.resolve(__dirname, '../data/resilience_data.ts');
    fs.writeFileSync(outputPath, fileContent);
    
    console.log(`✅ [${PROVIDER.toUpperCase()}] Resilience snapshot updated successfully.`);
    console.log(`📊 Stats: ${data.events.length} events, ${data.testimonials.length} testimonials, ${data.registrations.length} registrations.`);
  } catch (error) {
    console.error(`❌ [${PROVIDER.toUpperCase()}] Backup failed:`, error);
    process.exit(1);
  }
}

runSync();
