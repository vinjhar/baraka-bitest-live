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

// Add retries for failed requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: getStorage(),
    flowType: 'pkce'
  },
  global: {
    fetch: async (url, options) => {
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          return await fetch(url, {
            ...options,
            // Ensure credentials are included
            credentials: 'include'
          });
        } catch (error) {
          retries++;
          if (retries === MAX_RETRIES) throw error;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        }
      }
      throw new Error('Failed to fetch after maximum retries');
    }
  }
});