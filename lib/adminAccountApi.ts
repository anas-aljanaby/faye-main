import { supabase } from './supabase';
import type { FunctionsHttpError } from '@supabase/supabase-js';

export type AccountStatusKey = 'no_login' | 'pending_first_login' | 'active';

export type AccountStatusPayload = {
  status: AccountStatusKey;
  email: string | null;
  lastSignInAt: string | null;
};

type StatusResponse = { accounts: Record<string, AccountStatusPayload> };

type CreateResponse = {
  ok: boolean;
  profileId: string;
  status: AccountStatusKey;
  email: string | null;
  lastSignInAt: string | null;
};

type UnlinkResponse = {
  ok: boolean;
  profileId: string;
  status: AccountStatusKey;
  email: null;
  lastSignInAt: null;
};

type ErrorBody = { error?: string; message?: string };

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('no_session');
  }
  return token;
}

async function readErrorBody(error: unknown): Promise<ErrorBody | null> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as FunctionsHttpError).context;
    if (ctx && typeof (ctx as Response).json === 'function') {
      try {
        return await (ctx as Response).clone().json();
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function mapAdminAccountError(error: unknown): Promise<string> {
  const body = await readErrorBody(error);
  const code = body?.error;
  const messages: Record<string, string> = {
    unauthorized: 'انتهت الجلسة أو غير مصرّح. سجّل الدخول مرة أخرى.',
    forbidden: 'ليس لديك صلاحية لهذا الإجراء.',
    invalid_body: 'بيانات غير صالحة.',
    profile_not_found: 'لم يُعثر على الملف.',
    invalid_role: 'لا يمكن إنشاء حساب دخول لهذا النوع من الملف.',
    already_has_login: 'يوجد حساب دخول مرتبط بهذا الملف مسبقاً.',
    email_taken: 'البريد الإلكتروني مسجّل مسبقاً.',
    password_too_short: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
    create_failed: body?.message ? `فشل إنشاء الحساب: ${body.message}` : 'فشل إنشاء حساب الدخول.',
    link_failed: 'تم إنشاء المستخدم لكن فشل الربط بالملف. اتصل بالمسؤول.',
    query_failed: 'تعذّر جلب حالة الحساب.',
    server_misconfigured: 'الخادم غير مهيأ بشكل صحيح.',
    unknown_action: 'إجراء غير معروف.',
    internal_error: 'حدث خطأ داخلي.',
    no_session: 'لا توجد جلسة نشطة.',
    cannot_unlink_self: 'لا يمكنك فك ربط حسابك الخاص من هنا.',
    no_login_to_unlink: 'لا يوجد حساب دخول مرتبط بهذا الملف.',
    unlink_failed: 'فشل تحديث الملف بعد فك الربط.',
    delete_auth_failed: body?.message
      ? `فشل حذف مستخدم المصادقة: ${body.message}`
      : 'فشل حذف مستخدم المصادقة.',
  };
  if (code && messages[code]) {
    return messages[code];
  }
  if (error instanceof Error && error.message && !code) {
    return error.message;
  }
  return 'حدث خطأ غير متوقع.';
}

export async function fetchAccountStatuses(
  profileIds: string[]
): Promise<Record<string, AccountStatusPayload>> {
  if (profileIds.length === 0) {
    return {};
  }
  await getAccessToken();
  const { data, error } = await supabase.functions.invoke<StatusResponse>('admin-provision-login', {
    body: { action: 'status', profileIds },
  });
  if (error) {
    throw new Error(await mapAdminAccountError(error));
  }
  if (!data?.accounts) {
    throw new Error('استجابة غير صالحة من الخادم.');
  }
  return data.accounts;
}

export async function unlinkProfileLogin(profileId: string): Promise<AccountStatusPayload> {
  await getAccessToken();
  const { data, error } = await supabase.functions.invoke<UnlinkResponse>('admin-provision-login', {
    body: { action: 'unlink', profileId },
  });
  if (error) {
    throw new Error(await mapAdminAccountError(error));
  }
  if (!data?.ok) {
    throw new Error('فشل فك ربط حساب الدخول.');
  }
  return {
    status: 'no_login',
    email: null,
    lastSignInAt: null,
  };
}

export async function createProfileLogin(
  profileId: string,
  email: string,
  password: string
): Promise<AccountStatusPayload> {
  await getAccessToken();
  const { data, error } = await supabase.functions.invoke<CreateResponse>('admin-provision-login', {
    body: { action: 'create', profileId, email: email.trim(), password },
  });
  if (error) {
    throw new Error(await mapAdminAccountError(error));
  }
  if (!data?.ok) {
    throw new Error('فشل إنشاء حساب الدخول.');
  }
  return {
    status: data.status,
    email: data.email,
    lastSignInAt: data.lastSignInAt,
  };
}

export function generateRandomPassword(length = 16): string {
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = lower + upper + digits + symbols;
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  out += lower[bytes[0] % lower.length];
  out += upper[bytes[1] % upper.length];
  out += digits[bytes[2] % digits.length];
  out += symbols[bytes[3] % symbols.length];
  for (let i = 4; i < length; i++) {
    out += all[bytes[i] % all.length];
  }
  return out
    .split('')
    .sort(() => crypto.getRandomValues(new Uint8Array(1))[0]! - 128)
    .join('');
}
