import { supabase } from './supabase';

// Re-export supabase for callers that import from supabaseClient.
// Auth uses Supabase JWT; RLS resolves the app user via user_profiles.auth_user_id.
export { supabase };
