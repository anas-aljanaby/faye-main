import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, NotificationPreference } from '../types';
import type { PushNotificationStatus } from '../hooks/usePushNotifications';
import NotificationPreferencesModal from './NotificationPreferencesModal';
import ResponsiveState from './ResponsiveState';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  preferences: NotificationPreference | null;
  onSavePreferences: (next: Omit<NotificationPreference, 'userId'>) => Promise<void>;
  pushStatus: PushNotificationStatus;
  pushBusy: boolean;
  pushError: string | null;
  onEnablePush: () => Promise<void>;
  onDisablePush: () => Promise<void>;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  preferences,
  onSavePreferences,
  pushStatus,
  pushBusy,
  pushError,
  onEnablePush,
  onDisablePush,
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const navigate = useNavigate();

  const getIcon = (type: AppNotification['type']) => {
    if (type === 'payment_overdue') return '⏳';
    if (type === 'payment_received') return '✅';
    if (type === 'payment_due' || type === 'payment_reminder') return '🔔';
    if (type === 'message_received') return '💬';
    if (type === 'financial_transaction_pending_approval') return '🧾';
    if (type === 'financial_transaction_approved') return '✔️';
    if (type === 'financial_transaction_rejected') return '⚠️';
    return 'ℹ️';
  };

  const openNotification = async (notification: AppNotification) => {
    await onMarkAsRead(notification.id);
    onClose();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      return;
    }
    if (notification.relatedEntityType === 'payment') {
      navigate('/payments');
      return;
    }
    if (notification.relatedEntityType === 'conversation') {
      const conversationId = typeof notification.metadata?.conversation_id === 'string'
        ? notification.metadata.conversation_id
        : notification.relatedEntityId;
      navigate(conversationId ? `/messages?conversation=${conversationId}` : '/messages');
      return;
    }
    if (notification.relatedEntityType === 'financial_transaction') {
      navigate('/financial-system');
      return;
    }
    if (notification.relatedEntityType === 'orphan' && notification.relatedEntityId) {
      navigate(`/orphan/${notification.relatedEntityId}`);
      return;
    }
    navigate('/');
  };

  return (
    <>
      <div className="flex max-h-[calc(100dvh-6rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-bg-card shadow-2xl sm:w-80">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-lg font-semibold text-text-primary">إشعارات جديدة</p>
          <div className="flex flex-wrap items-center justify-end gap-1 text-right sm:gap-2">
            <button
              onClick={() => setShowPreferences(true)}
              className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              الإعدادات
            </button>
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex min-h-[44px] items-center rounded-xl px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              تعليم الكل كمقروء
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {preferences?.inAppEnabled === false ? (
            <div className="p-3 sm:p-4">
              <ResponsiveState
                compact
                title="الإشعارات داخل التطبيق متوقفة"
                description="يمكنك إعادة تفعيلها من الإعدادات إذا أردت ظهور التنبيهات هنا مرة أخرى."
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-3 sm:p-4">
              <ResponsiveState
                compact
                title="لا توجد إشعارات جديدة"
                description="عندما يصل إشعار جديد سيظهر هنا بشكل منظم وواضح."
              />
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => openNotification(notification)}
                className={`w-full border-b border-gray-100 px-4 py-3 text-right transition-colors hover:bg-gray-50 ${
                  notification.readAt ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getIcon(notification.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-primary">{notification.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">{notification.body}</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {notification.createdAt.toLocaleString('ar-EG')}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <NotificationPreferencesModal
        isOpen={showPreferences}
        preferences={preferences}
        pushStatus={pushStatus}
        pushBusy={pushBusy}
        pushError={pushError}
        onClose={() => setShowPreferences(false)}
        onSave={onSavePreferences}
        onEnablePush={onEnablePush}
        onDisablePush={onDisablePush}
      />
    </>
  );
};

export default NotificationPanel;
