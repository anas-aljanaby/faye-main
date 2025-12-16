// Utility to ensure user ID is set before Supabase queries
// This should be called before any query that needs RLS
import { supabase } from './supabase';
import { getSession } from './auth';

// Set user ID for RLS before executing a query
export const ensureUserContext = async (): Promise<void> => {
  const session = getSession();
  if (session) {
    await supabase.rpc('set_current_user_id', { user_id: session.userProfileId });
  }
};

// Wrapper for Supabase queries that automatically sets user context
export const withUserContext = async <T>(
  queryFn: () => Promise<T>
): Promise<T> => {
  await ensureUserContext();
  return queryFn();
};

// Export the original supabase client
export { supabase };
