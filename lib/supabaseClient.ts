import { supabase } from './supabase';

// Re-export supabase for callers that import from supabaseClient.
// User identity is sent on every request via the x-user-id header (lib/supabase.ts).
export { supabase };
