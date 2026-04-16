import React, { useEffect, useState } from 'react';
import { NotificationPreference } from '../types';
import ResponsiveModalShell from './ResponsiveModalShell';

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
    <ResponsiveModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="إعدادات الإشعارات"
      description="تحكم في طريقة وتوقيت تذكيرات الدفعات."
      maxWidthClassName="md:max-w-lg"
      zIndexClassName="z-[120]"
      bodyClassName="space-y-4"
      footer={
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-xl border border-gray-300 px-4 py-2.5 font-semibold text-text-secondary transition-colors hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-[48px] rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      }
    >
      <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
        <span className="font-semibold text-text-primary">تفعيل إشعارات داخل التطبيق</span>
        <input
          type="checkbox"
          checked={inAppEnabled}
          onChange={(e) => setInAppEnabled(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-primary"
        />
      </label>

      <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
        <span className="font-semibold text-text-primary">تفعيل إشعارات البريد الإلكتروني</span>
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(e) => setEmailEnabled(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-primary"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-text-primary">عدد الأيام قبل موعد الاستحقاق</span>
        <input
          type="number"
          min={1}
          max={30}
          value={paymentDueReminderDays}
          onChange={(e) => setPaymentDueReminderDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
          className="min-h-[48px] w-full rounded-xl border border-gray-300 px-4 py-2.5"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-text-primary">تكرار تذكير الدفعات المتأخرة (بالأيام)</span>
        <input
          type="number"
          min={1}
          max={30}
          value={overdueReminderFrequencyDays}
          onChange={(e) =>
            setOverdueReminderFrequencyDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))
          }
          className="min-h-[48px] w-full rounded-xl border border-gray-300 px-4 py-2.5"
        />
      </label>
    </ResponsiveModalShell>
  );
};

export default NotificationPreferencesModal;
