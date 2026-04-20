import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  registerDevicePushSubscription,
  removeDevicePushSubscription,
} from '../lib/notificationSubscriptions';

type PushPermissionState = NotificationPermission | 'unsupported';

type SerializablePushSubscription = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export type PushNotificationStatus =
  | 'unsupported'
  | 'install_required'
  | 'permission_denied'
  | 'enabled'
  | 'ready'
  | 'prompt';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? '';

const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

const isStandaloneDisplayMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (typeof navigator !== 'undefined' &&
      'standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

async function getSubscriptionStatus(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export const usePushNotifications = () => {
  const { userProfile } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    isPushSupported() ? Notification.permission : 'unsupported'
  );
  const [supported, setSupported] = useState<boolean>(() => isPushSupported());
  const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneDisplayMode());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshEnvironment = useCallback(() => {
    const pushSupported = isPushSupported();
    setSupported(pushSupported);
    setPermission(pushSupported ? Notification.permission : 'unsupported');
    setIsStandalone(isStandaloneDisplayMode());
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!supported || !userProfile) {
      setIsSubscribed(false);
      return;
    }

    try {
      const subscription = await getSubscriptionStatus();
      setIsSubscribed(Boolean(subscription));

      if (subscription) {
        await registerDevicePushSubscription(
          subscription.toJSON() as SerializablePushSubscription,
          isStandaloneDisplayMode()
        );
      }
    } catch (nextError) {
      console.error('Failed to refresh push subscription state', nextError);
    }
  }, [supported, userProfile]);

  useEffect(() => {
    refreshEnvironment();

    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshEnvironment();
      }
    };

    const supportsModernListeners = typeof mediaQuery.addEventListener === 'function';
    if (supportsModernListeners) {
      mediaQuery.addEventListener('change', refreshEnvironment);
    } else {
      mediaQuery.addListener(refreshEnvironment);
    }
    window.addEventListener('focus', refreshEnvironment);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (supportsModernListeners) {
        mediaQuery.removeEventListener('change', refreshEnvironment);
      } else {
        mediaQuery.removeListener(refreshEnvironment);
      }
      window.removeEventListener('focus', refreshEnvironment);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshEnvironment]);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  const enablePush = useCallback(async () => {
    if (!supported) {
      throw new Error('هذا المتصفح لا يدعم إشعارات الويب.');
    }

    if (!isStandalone) {
      throw new Error('افتح التطبيق المثبت كـ PWA ثم فعّل الإشعارات على هذا الجهاز.');
    }

    if (!VAPID_PUBLIC_KEY) {
      throw new Error('مفتاح إشعارات الويب غير مضبوط في إعدادات التطبيق.');
    }

    setBusy(true);
    setError(null);

    try {
      let nextPermission = Notification.permission;
      if (nextPermission !== 'granted') {
        nextPermission = await Notification.requestPermission();
        setPermission(nextPermission);
      }

      if (nextPermission !== 'granted') {
        throw new Error('لم يتم منح الإذن لإرسال إشعارات الجهاز.');
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      await registerDevicePushSubscription(
        subscription.toJSON() as SerializablePushSubscription,
        isStandaloneDisplayMode()
      );

      setIsSubscribed(true);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : 'تعذر تفعيل إشعارات الجهاز.';
      setError(message);
      throw nextError instanceof Error ? nextError : new Error(message);
    } finally {
      setBusy(false);
    }
  }, [isStandalone, supported]);

  const disablePush = useCallback(async () => {
    if (!supported) {
      setIsSubscribed(false);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const subscription = await getSubscriptionStatus();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      await removeDevicePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
      setIsSubscribed(false);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : 'تعذر إيقاف إشعارات الجهاز.';
      setError(message);
      throw nextError instanceof Error ? nextError : new Error(message);
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const status = useMemo(() => {
    if (!supported) {
      return 'unsupported' as PushNotificationStatus;
    }
    if (!isStandalone) {
      return 'install_required' as PushNotificationStatus;
    }
    if (permission === 'denied') {
      return 'permission_denied' as PushNotificationStatus;
    }
    if (isSubscribed) {
      return 'enabled' as PushNotificationStatus;
    }
    if (permission === 'granted') {
      return 'ready' as PushNotificationStatus;
    }
    return 'prompt' as PushNotificationStatus;
  }, [isStandalone, isSubscribed, permission, supported]);

  return {
    supported,
    permission,
    isStandalone,
    isSubscribed,
    busy,
    error,
    status,
    refreshSubscription,
    enablePush,
    disablePush,
  };
};
