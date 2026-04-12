/**
 * MASTER SWITCH for the Database Provider
 * Change this to 'supabase' to switch back to Supabase.
 * Then push the code and deploy.
 */
export const ACTIVE_DB: 'appwrite' | 'supabase' = 'appwrite';

export const APPWRITE_CONFIG = {
  ENDPOINT: 'https://sfo.cloud.appwrite.io/v1',
  PROJECT_ID: '69db08fb001174cd0d39',
  DATABASE_ID: '69db1c34003bd1ff00a2',
  COLLECTIONS: {
    EVENTS: 'events',
    TESTIMONIALS: 'testimonials',
    REGISTRATIONS: 'event_registrations',
    VOLUNTEERS: 'volunteer_applications',
    PROFILES: 'profiles'
  },
  BUCKETS: {
    MEDIA: 'media'
  }
};

export const SUPABASE_CONFIG = {
  URL: import.meta.env.VITE_SUPABASE_URL || '',
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
};
