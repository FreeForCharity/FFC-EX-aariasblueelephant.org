import { Client, Databases, Query } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPWRITE_CONFIG = {
  ENDPOINT: 'https://sfo.cloud.appwrite.io/v1',
  PROJECT_ID: '69db08fb001174cd0d39',
  API_KEY: process.env.APPWRITE_API_KEY || 'standard_19197f3504070eb4262276278d895c46b408cd5e7cf7d5e439070c34963ccca216107ec872f383c6f90ab97ace851a612feb31b1b9d5fc6c5999d940b307162a9c81ad41ea4e50e134f089bd5261c1d35242b77e2b31472514a84bc065d9e7ae059f43b5c7cc784173917892d69d64bf2621d365d98bd3c2fb77ec696eaf573c',
  DATABASE_ID: '69db1c34003bd1ff00a2',
  COLLECTIONS: {
    EVENTS: 'events',
    TESTIMONIALS: 'testimonials',
    REGISTRATIONS: 'event_registrations'
  }
};

async function fetchData() {
  console.log('🔄 Fetching FULL resilience snapshot from Appwrite...');
  
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID)
    .setKey(APPWRITE_CONFIG.API_KEY);
    
  const databases = new Databases(client);

  try {
    const eventsResponse = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.EVENTS, [Query.limit(100)]);
    const testimonialsResponse = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.TESTIMONIALS, [Query.limit(100)]);
    const regsResponse = await databases.listDocuments(APPWRITE_CONFIG.DATABASE_ID, APPWRITE_CONFIG.COLLECTIONS.REGISTRATIONS, [Query.limit(100)]);

    const events = eventsResponse.documents.map((doc: any) => ({
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
    }));

    const testimonials = testimonialsResponse.documents.map((doc: any) => ({
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
    }));

    const registrations = regsResponse.documents.map((doc: any) => ({
      id: doc.$id,
      eventId: doc.eventId,
      userId: doc.userId,
      userName: doc.userName,
      userEmail: doc.userEmail,
      status: doc.status,
      date: doc.date,
      specialNeeds: doc.specialNeeds
    }));

    const fileContent = `/**
 * AUTO-GENERATED RESILIENCE DATA
 * This file is updated at build time to provide a local offline fallback
 * if both PRIMARY and SECONDARY database providers are unreachable.
 */
import { Event, Testimonial, EventRegistration } from '../types';

export const RESILIENCE_EVENTS: Event[] = ${JSON.stringify(events, null, 2)};
export const RESILIENCE_TESTIMONIALS: Testimonial[] = ${JSON.stringify(testimonials, null, 2)};
export const RESILIENCE_REGISTRATIONS: EventRegistration[] = ${JSON.stringify(registrations, null, 2)};
`;

    const outputPath = path.resolve(__dirname, '../data/resilience_data.ts');
    fs.writeFileSync(outputPath, fileContent);
    
    console.log(`✅ Resilience snapshot updated: ${events.length} events, ${testimonials.length} testimonials, ${registrations.length} registrations.`);
  } catch (error) {
    console.error('❌ Could not fetch resilience data:', error);
    process.exit(1);
  }
}

fetchData();
