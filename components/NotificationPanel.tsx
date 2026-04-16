import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, NotificationPreference } from '../types';
import NotificationPreferencesModal from './NotificationPreferencesModal';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  preferences: NotificationPreference | null;
  onSavePreferences: (next: Omit<NotificationPreference, 'userId'>) => Promise<void>;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  preferences,
  onSavePreferences,
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const navigate = useNavigate();

  const getIcon = (type: AppNotification['type']) => {
    if (type === 'payment_overdue') return '⏳';
    if (type === 'payment_received') return '✅';
    if (type === 'payment_due' || type === 'payment_reminder') return '🔔';
    return 'ℹ️';
  };

  const openNotification = async (notification: AppNotification) => {
    await onMarkAsRead(notification.id);
    onClose();
    if (notification.relatedEntityType === 'payment') {
      navigate('/payments');
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
      <div className="w-full max-w-full overflow-hidden rounded-lg border border-gray-200 bg-bg-card shadow-2xl sm:w-80">
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

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-secondary">
              <p className="text-sm">لا توجد إشعارات جديدة</p>
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
        onClose={() => setShowPreferences(false)}
        onSave={onSavePreferences}
      />
    </>
  );
};

export default NotificationPanel;
