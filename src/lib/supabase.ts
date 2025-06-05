import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined in environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid VITE_SUPABASE_URL: ${supabaseUrl}. Must be a valid URL.`);
}

// Initialize storage based on environment
const getStorage = () => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    // Test if localStorage is available
    localStorage.setItem('supabase-storage-test', 'test');
    localStorage.removeItem('supabase-storage-test');
    return localStorage;
  } catch (e) {
    console.warn('localStorage not available, falling back to memory storage');
    return undefined; // Supabase will use memory storage as fallback
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: getStorage(),
    flowType: 'pkce'
  }
});