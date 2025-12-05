import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { cache } from '../utils/cache';

interface UserProfile {
  id: string;
  organization_id: string;
  role: 'team_member' | 'sponsor';
  name: string;
  avatar_url?: string;
}

interface UserPermissions {
  can_edit_orphans: boolean;
  can_edit_sponsors: boolean;
  can_edit_transactions: boolean;
  can_create_expense: boolean;
  can_approve_expense: boolean;
  can_view_financials: boolean;
  is_manager: boolean;
}

// Default permissions for users without explicit permissions (backward compatibility)
const DEFAULT_PERMISSIONS: UserPermissions = {
  can_edit_orphans: false,
  can_edit_sponsors: false,
  can_edit_transactions: false,
  can_create_expense: false,
  can_approve_expense: false,
  can_view_financials: false,
  is_manager: false,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  permissions: UserPermissions | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  // Helper functions for permission checks
  canEditOrphans: () => boolean;
  canEditSponsors: () => boolean;
  canEditTransactions: () => boolean;
  canCreateExpense: () => boolean;
  canApproveExpense: () => boolean;
  canViewFinancials: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfileAndPermissions(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchUserProfileAndPermissions(session.user.id);
      } else {
        setUserProfile(null);
        setPermissions(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfileAndPermissions = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, organization_id, role, name, avatar_url')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUserProfile(null);
        setPermissions(null);
      } else {
        setUserProfile(profileData as UserProfile);

        // Fetch user permissions (only for team members)
        if (profileData.role === 'team_member') {
          const { data: permissionsData, error: permissionsError } = await supabase
            .from('user_permissions')
            .select('can_edit_orphans, can_edit_sponsors, can_edit_transactions, can_create_expense, can_approve_expense, can_view_financials, is_manager')
            .eq('user_id', userId)
            .single();

          if (permissionsError) {
            console.error('Error fetching user permissions:', permissionsError);
            // Use default permissions if no permissions found
            setPermissions(DEFAULT_PERMISSIONS);
          } else {
            setPermissions(permissionsData as UserPermissions);
          }
        } else {
          // Sponsors don't need team member permissions
          setPermissions(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile and permissions:', error);
      setUserProfile(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshPermissions = async () => {
    if (user) {
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('can_edit_orphans, can_edit_sponsors, can_edit_transactions, can_create_expense, can_approve_expense, can_view_financials, is_manager')
        .eq('user_id', user.id)
        .single();

      if (!permissionsError && permissionsData) {
        setPermissions(permissionsData as UserPermissions);
      }
    }
  };

  // Helper functions for permission checks
  const canEditOrphans = () => permissions?.can_edit_orphans || permissions?.is_manager || false;
  const canEditSponsors = () => permissions?.can_edit_sponsors || permissions?.is_manager || false;
  const canEditTransactions = () => permissions?.can_edit_transactions || permissions?.is_manager || false;
  const canCreateExpense = () => permissions?.can_create_expense || permissions?.is_manager || false;
  const canApproveExpense = () => permissions?.can_approve_expense || permissions?.is_manager || false;
  const canViewFinancials = () => permissions?.can_view_financials || permissions?.is_manager || false;
  const isManager = () => permissions?.is_manager || false;

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (data.session?.user) {
      await fetchUserProfileAndPermissions(data.session.user.id);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setPermissions(null);
    // Clear cache on sign out
    cache.clear();
  };

  const value = {
    user,
    session,
    userProfile,
    permissions,
    loading,
    signIn,
    signOut,
    refreshPermissions,
    canEditOrphans,
    canEditSponsors,
    canEditTransactions,
    canCreateExpense,
    canApproveExpense,
    canViewFinancials,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

