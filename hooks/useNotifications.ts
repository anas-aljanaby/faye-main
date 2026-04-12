import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification, NotificationPreference } from '../types';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_PREFERENCES: NotificationPreference = {
  userId: '',
  inAppEnabled: true,
  emailEnabled: true,
  paymentDueReminderDays: 7,
  overdueReminderFrequencyDays: 3,
};

const MISSING_TABLE_ERROR_CODE = 'PGRST205';

export const useNotifications = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsTableAvailable, setNotificationsTableAvailable] = useState(true);
  const [preferencesTableAvailable, setPreferencesTableAvailable] = useState(true);

  const mapNotification = useCallback((row: any): AppNotification => ({
    id: row.id,
    userId: row.user_id,
    organizationId: row.organization_id,
    type: row.type,
    title: row.title,
    body: row.body,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    readAt: row.read_at ? new Date(row.read_at) : undefined,
    emailSentAt: row.email_sent_at ? new Date(row.email_sent_at) : undefined,
    createdAt: new Date(row.created_at),
  }), []);

  const isMissingTableError = useCallback((error: { code?: string } | null) => {
    return error?.code === MISSING_TABLE_ERROR_CODE;
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!userProfile) return;
    if (!notificationsTableAvailable) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (isMissingTableError(error)) {
        setNotificationsTableAvailable(false);
        setNotifications([]);
      } else {
        console.error('Error fetching notifications:', error);
      }
      setLoading(false);
      return;
    }

    setNotifications((data ?? []).map(mapNotification));
    setLoading(false);
  }, [isMissingTableError, mapNotification, notificationsTableAvailable, userProfile]);

  const fetchPreferences = useCallback(async () => {
    if (!userProfile) return;
    if (!preferencesTableAvailable) {
      setPreferences({ ...DEFAULT_PREFERENCES, userId: userProfile.id });
      return;
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userProfile.id)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) {
        setPreferencesTableAvailable(false);
      } else {
        console.error('Error fetching notification preferences:', error);
      }
      setPreferences({ ...DEFAULT_PREFERENCES, userId: userProfile.id });
      return;
    }

    if (!data) {
      setPreferences({ ...DEFAULT_PREFERENCES, userId: userProfile.id });
      return;
    }

    setPreferences({
      userId: data.user_id,
      inAppEnabled: data.in_app_enabled,
      emailEnabled: data.email_enabled,
      paymentDueReminderDays: data.payment_due_reminder_days,
      overdueReminderFrequencyDays: data.overdue_reminder_frequency_days,
    });
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
      email_enabled: next.emailEnabled,
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
      setNotifications([]);
      setPreferences(null);
      setLoading(false);
      setNotificationsTableAvailable(true);
      setPreferencesTableAvailable(true);
      return;
    }

    fetchNotifications();
    fetchPreferences();

    if (!notificationsTableAvailable) {
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

  const unreadCount = useMemo(() => notifications.filter((n) => !n.readAt).length, [notifications]);

  return {
    loading,
    notifications,
    unreadCount,
    preferences,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
  };
};
