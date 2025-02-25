import { supabase } from './supabase';

// With header-based user context, there is no need to issue
// separate RPC calls before each query. These helpers are now
// thin wrappers kept only for backwards compatibility.

export const ensureUserContext = async (): Promise<void> => {
  // No-op: the current user ID is carried on every request
  // via the x-user-id header configured in lib/auth.ts.
  return;
};

export const withUserContext = async <T>(queryFn: () => Promise<T>): Promise<T> => {
  // Directly execute the query; user identity is already encoded
  // in the Supabase client's headers.
  return queryFn();
};

export { supabase };
