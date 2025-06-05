import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://yhxmewmcodmfmdpiyyxa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloeG1ld21jb2RtZm1kcGl5eXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1NzA4OTQsImV4cCI6MjA2MzE0Njg5NH0.JnfPuI0c1TE8iEYixTlokoMEdiD3qTQYiTZS9h4kJ2Y";

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
    headers: {
      'X-Client-Info': 'supabase-js/2.39.7'
    },
    fetch: async (url, options = {}) => {
      let retries = 0;
      
      // Convert HTTPS to HTTP for localhost during development
      const finalUrl = process.env.NODE_ENV === 'development' && url.startsWith('https://localhost') 
        ? url.replace('https://', 'http://')
        : url;

      while (retries < MAX_RETRIES) {
        try {
          const response = await fetch(finalUrl, {
            ...options,
            credentials: 'include',
            headers: {
              ...options.headers,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          // Check if the response is ok
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return response;
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