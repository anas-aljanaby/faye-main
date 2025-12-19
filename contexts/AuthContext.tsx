import React, { createContext, useContext, useEffect, useState } from 'react';
import { authenticate, signOut as authSignOut, getSession, AuthSession } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';
import { cache } from '../utils/cache';

interface UserProfile {
  id: string;
  organization_id: string;
  role: 'team_member' | 'sponsor';
  name: string;
  avatar_url?: string;
  member_id?: string;
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
  user: { id: string } | null;
  session: AuthSession | null;
  userProfile: UserProfile | null;
  permissions: UserPermissions | null;
  loading: boolean;
  signIn: (loginIdentifier: string, password: string) => Promise<{ error: string | null }>;
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
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const existingSession = getSession();
    if (existingSession) {
      loadSession(existingSession);
    } else {
      setLoading(false);
    }
  }, []);

  const loadSession = async (authSession: AuthSession) => {
    try {
      setSessionState(authSession);
      setUser({ id: authSession.userProfileId });
      setUserProfile(authSession.userProfile);

      // Fetch user permissions (only for team members)
      // Note: RLS is disabled on user_permissions, so no need to set user context
      if (authSession.userProfile.role === 'team_member') {
        await fetchPermissions(authSession.userProfileId);
      } else {
        setPermissions(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setSessionState(null);
      setUser(null);
      setUserProfile(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (userId: string) => {
    try {
      // RLS is disabled on user_permissions, so no need for withUserContext
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('can_edit_orphans, can_edit_sponsors, can_edit_transactions, can_create_expense, can_approve_expense, can_view_financials, is_manager')
        .eq('user_id', userId)
        .maybeSingle();

      if (permissionsError) {
        console.error('Error fetching user permissions:', permissionsError);
        setPermissions(DEFAULT_PERMISSIONS);
      } else if (!permissionsData) {
        // No explicit permissions record yet - use defaults
        setPermissions(DEFAULT_PERMISSIONS);
      } else {
        setPermissions(permissionsData as UserPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions(DEFAULT_PERMISSIONS);
    }
  };

  const fetchUserProfileAndPermissions = async (userId: string) => {
    try {
      // RLS is disabled on user_profiles, so no need for withUserContext
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, organization_id, role, name, avatar_url, member_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        setUserProfile(null);
        setPermissions(null);
      } else if (!profileData) {
        console.error('User profile not found for id:', userId);
        setUserProfile(null);
        setPermissions(null);
      } else {
        setUserProfile(profileData as UserProfile);

        // Fetch user permissions (only for team members)
        if (profileData.role === 'team_member') {
          await fetchPermissions(userId);
        } else {
          setPermissions(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile and permissions:', error);
      setUserProfile(null);
      setPermissions(null);
    }
  };

  const refreshPermissions = async () => {
    if (user) {
      await fetchPermissions(user.id);
    }
  };

  // Helper functions for permission checks
  const canEditOrphans = () => permissions?.can_edit_orphans || permissions?.is_manager || false;
  const canEditSponsors = () => permissions?.can_edit_sponsors || permissions?.is_manager || false;
  const canEditTransactions = () => permissions?.can_edit_transactions || permissions?.is_manager || false;
  const canCreateExpense = () => permissions?.can_create_expense || permissions?.is_manager || false;
  const canApproveExpense = () => permissions?.can_approve_expense || permissions?.is_manager || false;
  const canViewFinancials = () => permissions?.can_view_financials || permissions?.is_manager || false;
  const isManager = () => {
    const result = permissions?.is_manager || false;
    console.log('isManager check:', { permissions, result });
    return result;
  };

  const signIn = async (loginIdentifier: string, password: string) => {
    const { session: authSession, error } = await authenticate(loginIdentifier, password);

    if (error) {
      return { error };
    }

    if (authSession) {
      await loadSession(authSession);
    }

    return { error: null };
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setSessionState(null);
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
