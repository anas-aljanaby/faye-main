// Custom authentication utilities
import { setSupabaseUserId, supabase } from './supabase';

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

// Set current user ID for RLS via custom HTTP header.
// This is called when the user signs in or signs out.
export const setCurrentUserId = async (userId: string | null) => {
  setSupabaseUserId(userId);
};

// Authenticate user with username or email
export const authenticate = async (
  loginIdentifier: string,
  password: string
): Promise<{ session: AuthSession | null; error: string | null }> => {
  try {
    // Call the authenticate_user function (now returns profile data directly)
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

    // Extract user profile ID and profile data from the response
    const userProfileId = data.user_profile_id as string;
    const profile = data.profile as {
      id: string;
      organization_id: string;
      role: 'team_member' | 'sponsor';
      name: string;
      avatar_url?: string;
      member_id?: string;
    };

    if (!userProfileId || !profile) {
      console.error('Error: Invalid response from authenticate_user');
      return { session: null, error: 'فشل في جلب بيانات المستخدم' };
    }

    // Set current user ID for RLS policies (for subsequent queries)
    await setCurrentUserId(userProfileId);

    const session: AuthSession = {
      userProfileId: userProfileId,
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
