import { supabase } from './supabase';

type SerializablePushSubscription = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

async function ensureSession(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('لا توجد جلسة نشطة.');
  }
}

async function mapSubscriptionError(error: unknown): Promise<string> {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object' && 'context' in error) {
    try {
      const response = (error as { context?: Response }).context;
      const body = response ? await response.clone().json().catch(() => null) : null;
      const code = typeof body?.error === 'string' ? body.error : null;

      const messages: Record<string, string> = {
        unauthorized: 'انتهت الجلسة. سجّل الدخول مرة أخرى.',
        profile_not_found: 'تعذر العثور على ملف المستخدم الحالي.',
        invalid_body: 'بيانات الاشتراك غير صالحة.',
        upsert_failed: 'تعذر تفعيل الإشعارات على هذا الجهاز.',
        remove_failed: 'تعذر إيقاف الإشعارات على هذا الجهاز.',
        server_misconfigured: 'الخادم غير مهيأ لإشعارات الأجهزة.',
        internal_error: 'حدث خطأ داخلي أثناء حفظ إعدادات الجهاز.',
      };

      if (code && messages[code]) {
        return messages[code];
      }
    } catch {
      // Ignore JSON parsing errors and fall back to generic messaging.
    }
  }

  return 'حدث خطأ غير متوقع أثناء إعداد إشعارات الجهاز.';
}

export async function registerDevicePushSubscription(
  subscription: SerializablePushSubscription,
  installedViaPwa: boolean
): Promise<void> {
  await ensureSession();

  const { error } = await supabase.functions.invoke('notification-subscriptions', {
    body: {
      action: 'upsert',
      subscription,
      installedViaPwa,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    },
  });

  if (error) {
    throw new Error(await mapSubscriptionError(error));
  }
}

export async function removeDevicePushSubscription(endpoint: string): Promise<void> {
  await ensureSession();

  const { error } = await supabase.functions.invoke('notification-subscriptions', {
    body: {
      action: 'remove',
      endpoint,
    },
  });

  if (error) {
    throw new Error(await mapSubscriptionError(error));
  }
}
