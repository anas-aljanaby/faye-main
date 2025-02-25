import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const SESSION_KEY = 'faye_auth_session';

let currentUserId: string | null = null;

export const setSupabaseUserId = (userId: string | null) => {
  currentUserId = userId;
};

const getSessionUserId = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const parsed = JSON.parse(sessionStr) as { userProfileId?: string };
    return parsed?.userProfileId || null;
  } catch {
    return null;
  }
};

const customFetch: typeof fetch = (input, init) => {
  const userId = currentUserId || getSessionUserId();

  const mergedHeaders = new Headers(init?.headers);
  if (userId) {
    mergedHeaders.set('x-user-id', userId);
  } else {
    mergedHeaders.delete('x-user-id');
  }

  return fetch(input, {
    ...init,
    headers: mergedHeaders,
  });
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

