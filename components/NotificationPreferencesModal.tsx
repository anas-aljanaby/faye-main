import React, { useEffect, useState } from 'react';
import { NotificationPreference } from '../types';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  preferences: NotificationPreference | null;
  onClose: () => void;
  onSave: (next: Omit<NotificationPreference, 'userId'>) => Promise<void>;
}

const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  preferences,
  onClose,
  onSave,
}) => {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [paymentDueReminderDays, setPaymentDueReminderDays] = useState(7);
  const [overdueReminderFrequencyDays, setOverdueReminderFrequencyDays] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!preferences) return;
    setInAppEnabled(preferences.inAppEnabled);
    setEmailEnabled(preferences.emailEnabled);
    setPaymentDueReminderDays(preferences.paymentDueReminderDays);
    setOverdueReminderFrequencyDays(preferences.overdueReminderFrequencyDays);
  }, [preferences]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      inAppEnabled,
      emailEnabled,
      paymentDueReminderDays,
      overdueReminderFrequencyDays,
    });
    setSaving(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[110] bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-bg-card p-6 shadow-2xl">
          <h3 className="mb-1 text-xl font-bold text-text-primary">إعدادات الإشعارات</h3>
          <p className="mb-4 text-sm text-text-secondary">تحكم في طريقة وتوقيت تذكيرات الدفعات.</p>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <span className="font-semibold text-text-primary">تفعيل إشعارات داخل التطبيق</span>
              <input type="checkbox" checked={inAppEnabled} onChange={(e) => setInAppEnabled(e.target.checked)} />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <span className="font-semibold text-text-primary">تفعيل إشعارات البريد الإلكتروني</span>
              <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-text-primary">
                عدد الأيام قبل موعد الاستحقاق
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={paymentDueReminderDays}
                onChange={(e) => setPaymentDueReminderDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-text-primary">تكرار تذكير الدفعات المتأخرة (بالأيام)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={overdueReminderFrequencyDays}
                onChange={(e) =>
                  setOverdueReminderFrequencyDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold">
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPreferencesModal;
