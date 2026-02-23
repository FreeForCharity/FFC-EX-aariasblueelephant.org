/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('⚠️ Missing Supabase keys in .env.local! Supabase authentication will not work until you configure your .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Make sure you restart the Vite development server after adding them.');
}

// Fallback to placeholder if missing so the app at least boots to show the error
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
);
