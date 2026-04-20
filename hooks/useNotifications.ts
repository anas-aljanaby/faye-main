import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification, NotificationPreference } from '../types';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_PREFERENCES: NotificationPreference = {
  userId: '',
  inAppEnabled: true,
  emailEnabled: false,
  messageNotificationsEnabled: true,
  financialNotificationsEnabled: true,
  paymentNotificationsEnabled: true,
  paymentDueReminderDays: 7,
  overdueReminderFrequencyDays: 3,
};

const MISSING_TABLE_ERROR_CODE = 'PGRST205';
const SCHEMA_CACHE_PREFIX = 'faye:notification-schema';

type SchemaAvailability = 'unknown' | 'available' | 'missing';

type NotificationRowsResult =
  | { status: 'available'; data: any[] }
  | { status: 'missing'; data: [] };

type PreferenceRowResult =
  | { status: 'available'; data: any | null }
  | { status: 'missing'; data: null };

const notificationRequests = new Map<string, Promise<NotificationRowsResult>>();
const preferenceRequests = new Map<string, Promise<PreferenceRowResult>>();

const getSchemaCacheKey = (table: 'notifications' | 'notification_preferences') =>
  `${SCHEMA_CACHE_PREFIX}:${supabase.supabaseUrl}:${table}`;

const readSchemaAvailability = (table: 'notifications' | 'notification_preferences'): SchemaAvailability => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const cached = window.sessionStorage.getItem(getSchemaCacheKey(table));
  if (cached === 'available' || cached === 'missing') {
    return cached;
  }

  return 'unknown';
};

const writeSchemaAvailability = (
  table: 'notifications' | 'notification_preferences',
  availability: Exclude<SchemaAvailability, 'unknown'>
) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(getSchemaCacheKey(table), availability);
};

let notificationsSchemaAvailability = readSchemaAvailability('notifications');
let preferencesSchemaAvailability = readSchemaAvailability('notification_preferences');

const getDefaultPreferences = (userId: string): NotificationPreference => ({
  ...DEFAULT_PREFERENCES,
  userId,
});

const getNotificationsRows = async (
  userId: string,
  isMissingTableError: (error: { code?: string } | null) => boolean
): Promise<NotificationRowsResult> => {
  if (notificationsSchemaAvailability === 'missing') {
    return { status: 'missing', data: [] };
  }

  const requestKey = `${supabase.supabaseUrl}:notifications:${userId}`;
  const existingRequest = notificationRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (isMissingTableError(error)) {
        notificationsSchemaAvailability = 'missing';
        writeSchemaAvailability('notifications', 'missing');
        return { status: 'missing', data: [] };
      }

      throw error;
    }

    notificationsSchemaAvailability = 'available';
    writeSchemaAvailability('notifications', 'available');
    return { status: 'available', data: data ?? [] };
  })().finally(() => {
    notificationRequests.delete(requestKey);
  });

  notificationRequests.set(requestKey, request);
  return request;
};

const getPreferenceRow = async (
  userId: string,
  isMissingTableError: (error: { code?: string } | null) => boolean
): Promise<PreferenceRowResult> => {
  if (preferencesSchemaAvailability === 'missing') {
    return { status: 'missing', data: null };
  }

  const requestKey = `${supabase.supabaseUrl}:notification_preferences:${userId}`;
  const existingRequest = preferenceRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        preferencesSchemaAvailability = 'missing';
        writeSchemaAvailability('notification_preferences', 'missing');
        return { status: 'missing', data: null };
      }

      throw error;
    }

    preferencesSchemaAvailability = 'available';
    writeSchemaAvailability('notification_preferences', 'available');
    return { status: 'available', data: data ?? null };
  })().finally(() => {
    preferenceRequests.delete(requestKey);
  });

  preferenceRequests.set(requestKey, request);
  return request;
};

export const useNotifications = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsTableAvailable, setNotificationsTableAvailable] = useState(
    () => notificationsSchemaAvailability !== 'missing'
  );
  const [preferencesTableAvailable, setPreferencesTableAvailable] = useState(
    () => preferencesSchemaAvailability !== 'missing'
  );

  const mapNotification = useCallback((row: any): AppNotification => ({
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    actionUrl: row.action_url ?? undefined,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : undefined,
    readAt: row.read_at ? new Date(row.read_at) : undefined,
    emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
    pushSentAt: row.push_sent_at ? new Date(row.push_sent_at) : undefined,
    lastPushError: row.last_push_error ?? undefined,
    createdAt: new Date(row.created_at),
  }), []);

  const isMissingTableError = useCallback((error: { code?: string } | null) => {
    return error?.code === MISSING_TABLE_ERROR_CODE;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile) return;
    if (!notificationsTableAvailable || notificationsSchemaAvailability === 'missing') {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await getNotificationsRows(userProfile.id, isMissingTableError);

      if (result.status === 'missing') {
        setNotificationsTableAvailable(false);
        setNotifications([]);
        return;
      }

      setNotificationsTableAvailable(true);
      setNotifications(result.data.map(mapNotification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isMissingTableError, mapNotification, notificationsTableAvailable, userProfile]);

  const fetchPreferences = useCallback(async () => {
    if (!userProfile) return;
    if (!preferencesTableAvailable || preferencesSchemaAvailability === 'missing') {
      setPreferences(getDefaultPreferences(userProfile.id));
      return;
    }

    try {
      const result = await getPreferenceRow(userProfile.id, isMissingTableError);

      if (result.status === 'missing') {
        setPreferencesTableAvailable(false);
        setPreferences(getDefaultPreferences(userProfile.id));
        return;
      }

      setPreferencesTableAvailable(true);

      if (!result.data) {
        setPreferences(getDefaultPreferences(userProfile.id));
        return;
      }

      setPreferences({
        userId: result.data.user_id,
        inAppEnabled: result.data.in_app_enabled,
        emailEnabled: false,
        messageNotificationsEnabled: result.data.message_notifications_enabled ?? true,
        financialNotificationsEnabled: result.data.financial_notifications_enabled ?? true,
        paymentNotificationsEnabled: result.data.payment_notifications_enabled ?? true,
        paymentDueReminderDays: result.data.payment_due_reminder_days,
        overdueReminderFrequencyDays: result.data.overdue_reminder_frequency_days,
      });
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      setPreferences(getDefaultPreferences(userProfile.id));
    }
  }, [isMissingTableError, preferencesTableAvailable, userProfile]);

  const markAsRead = useCallback(async (id: string) => {
    const now = new Date();
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: now } : n)));
    if (!notificationsTableAvailable) return;
    await supabase.from('notifications').update({ read_at: now.toISOString() }).eq('id', id);
  }, [notificationsTableAvailable]);

  const markAllAsRead = useCallback(async () => {
    if (!userProfile || !notificationsTableAvailable) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date(now) })));
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userProfile.id)
      .is('read_at', null);
  }, [notificationsTableAvailable, userProfile]);

  const updatePreferences = useCallback(async (next: Omit<NotificationPreference, 'userId'>) => {
    if (!userProfile) return;
    setPreferences({ userId: userProfile.id, ...next });
    if (!preferencesTableAvailable) return;

    const payload = {
      user_id: userProfile.id,
      in_app_enabled: next.inAppEnabled,
      email_enabled: false,
      message_notifications_enabled: next.messageNotificationsEnabled,
      financial_notifications_enabled: next.financialNotificationsEnabled,
      payment_notifications_enabled: next.paymentNotificationsEnabled,
      payment_due_reminder_days: next.paymentDueReminderDays,
      overdue_reminder_frequency_days: next.overdueReminderFrequencyDays,
    };

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(payload, { onConflict: 'user_id' });

    if (!error) {
      setPreferences({ userId: userProfile.id, ...next });
    }
  }, [preferencesTableAvailable, userProfile]);

  useEffect(() => {
    if (!userProfile) {
      notificationsSchemaAvailability = readSchemaAvailability('notifications');
      preferencesSchemaAvailability = readSchemaAvailability('notification_preferences');
      setNotifications([]);
      setPreferences(null);
      setLoading(false);
      setNotificationsTableAvailable(notificationsSchemaAvailability !== 'missing');
      setPreferencesTableAvailable(preferencesSchemaAvailability !== 'missing');
      return;
    }

    fetchNotifications();
    fetchPreferences();

    if (!notificationsTableAvailable || notificationsSchemaAvailability === 'missing') {
      return;
    }

    const channel = supabase
      .channel(`notifications:${userProfile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [mapNotification(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? mapNotification(payload.new) : n))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    fetchNotifications,
    fetchPreferences,
    mapNotification,
    notificationsTableAvailable,
    userProfile,
  ]);

  const visibleNotifications = useMemo(() => {
    if (preferences?.inAppEnabled === false) {
      return [];
    }

    return notifications;
  }, [notifications, preferences?.inAppEnabled]);

  const unreadCount = useMemo(
    () => visibleNotifications.filter((n) => !n.readAt).length,
    [visibleNotifications]
  );

  return {
    loading,
    notifications: visibleNotifications,
    unreadCount,
    preferences,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
  };
};
