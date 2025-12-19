// Custom authentication utilities
import { supabase } from './supabase';

export interface AuthSession {
  userProfileId: string;
  userProfile: {
    id: string;
    organization_id: string;
    role: 'team_member' | 'sponsor';
    name: string;
    avatar_url?: string;
    member_id?: string;
  };
}

const SESSION_KEY = 'faye_auth_session';

// Store session in localStorage
export const setSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

// Get session from localStorage
export const getSession = (): AuthSession | null => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
};

// Clear session
export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

// Set current user ID in Supabase session for RLS
// Note: This needs to be called before each query that uses RLS
export const setCurrentUserId = async (userId: string | null) => {
  if (userId) {
    await supabase.rpc('set_current_user_id', { user_id: userId });
  } else {
    await supabase.rpc('clear_current_user_id');
  }
};

// Authenticate user with username or email
export const authenticate = async (
  loginIdentifier: string,
  password: string
): Promise<{ session: AuthSession | null; error: string | null }> => {
  try {
    // Call the authenticate_user function
    const { data, error } = await supabase.rpc('authenticate_user', {
      login_identifier: loginIdentifier,
      password_text: password,
    });

    if (error) {
      console.error('Authentication error:', error);
      return { session: null, error: error.message || 'فشل تسجيل الدخول' };
    }

    if (!data) {
      return { session: null, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // Fetch user profile (RLS disabled on user_profiles, so no need to set user context)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, organization_id, role, name, avatar_url, member_id')
      .eq('id', data)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return { session: null, error: 'فشل في جلب بيانات المستخدم' };
    }

    const session: AuthSession = {
      userProfileId: data,
      userProfile: profile,
    };

    // Store session
    setSession(session);

    return { session, error: null };
  } catch (err) {
    console.error('Unexpected authentication error:', err);
    return { session: null, error: 'حدث خطأ غير متوقع' };
  }
};

// Sign out
export const signOut = async () => {
  clearSession();
};

// Create a user account and link it to a member
export const createUserAccount = async (
  username: string,
  email: string,
  password: string,
  memberProfileId: string
): Promise<{ authId: string | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc('create_user_account', {
      p_username: username,
      p_email: email,
      p_password: password,
      p_member_profile_id: memberProfileId,
    });

    if (error) {
      console.error('Error creating user account:', error);
      return { authId: null, error: error.message || 'فشل في إنشاء حساب المستخدم' };
    }

    return { authId: data, error: null };
  } catch (err) {
    console.error('Unexpected error creating user account:', err);
    return { authId: null, error: 'حدث خطأ غير متوقع' };
  }
};
