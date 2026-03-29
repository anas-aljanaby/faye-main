import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { signInWithEmail, signOutAuth } from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

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
  session: Session | null;
  userProfile: UserProfile | null;
  permissions: UserPermissions | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
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
  const [session, setSessionState] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async (userId: string) => {
    try {
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select(
          'can_edit_orphans, can_edit_sponsors, can_edit_transactions, can_create_expense, can_approve_expense, can_view_financials, is_manager'
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (permissionsError) {
        console.error('Error fetching user permissions:', permissionsError);
        setPermissions(DEFAULT_PERMISSIONS);
      } else if (!permissionsData) {
        setPermissions(DEFAULT_PERMISSIONS);
      } else {
        setPermissions(permissionsData as UserPermissions);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions(DEFAULT_PERMISSIONS);
    }
  }, []);

  const syncFromSession = useCallback(
    async (nextSession: Session | null): Promise<{ error: string | null }> => {
      setSessionState(nextSession);

      if (!nextSession) {
        setUser(null);
        setUserProfile(null);
        setPermissions(null);
        return { error: null };
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, organization_id, role, name, avatar_url, member_id')
        .eq('auth_user_id', nextSession.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        setPermissions(null);
        setSessionState(null);
        return { error: 'فشل في جلب بيانات المستخدم' };
      }

      if (!profileData) {
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        setPermissions(null);
        setSessionState(null);
        return {
          error:
            'لم يتم ربط حساب الدخول بملف مستخدم في المنظمة. اطلب من المسؤول ربط بريدك الإلكتروني بملفك.',
        };
      }

      const profile = profileData as UserProfile;
      setUser({ id: profile.id });
      setUserProfile(profile);

      if (profile.role === 'team_member') {
        await fetchPermissions(profile.id);
      } else {
        setPermissions(null);
      }

      return { error: null };
    },
    [fetchPermissions]
  );

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void (async () => {
        await syncFromSession(nextSession);
        if (event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const refreshPermissions = useCallback(async () => {
    if (user) {
      await fetchPermissions(user.id);
    }
  }, [user, fetchPermissions]);

  const isManager = useCallback(() => {
    return permissions?.is_manager || false;
  }, [permissions]);

  const canEditOrphans = useCallback(() => {
    return permissions?.can_edit_orphans || permissions?.is_manager || false;
  }, [permissions]);

  const canEditSponsors = useCallback(() => {
    return permissions?.can_edit_sponsors || permissions?.is_manager || false;
  }, [permissions]);

  const canEditTransactions = useCallback(() => {
    return permissions?.can_edit_transactions || permissions?.is_manager || false;
  }, [permissions]);

  const canCreateExpense = useCallback(() => {
    return permissions?.can_create_expense || permissions?.is_manager || false;
  }, [permissions]);

  const canApproveExpense = useCallback(() => {
    return permissions?.can_approve_expense || permissions?.is_manager || false;
  }, [permissions]);

  const canViewFinancials = useCallback(() => {
    return permissions?.can_view_financials || permissions?.is_manager || false;
  }, [permissions]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        return { error: error.message || 'فشل تسجيل الدخول' };
      }

      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();
      const { error: syncError } = await syncFromSession(nextSession);
      return { error: syncError };
    },
    [syncFromSession]
  );

  const signOut = useCallback(async () => {
    await signOutAuth();
    await syncFromSession(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('FAYE_REACT_QUERY_CACHE_v')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    }
  }, [syncFromSession]);

  const value = useMemo(() => {
    return {
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
  }, [
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
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
