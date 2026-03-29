// Supabase Auth helpers (JWT session; RLS uses auth.uid() -> user_profiles.auth_user_id)
import { supabase } from './supabase';

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOutAuth = () => supabase.auth.signOut();
