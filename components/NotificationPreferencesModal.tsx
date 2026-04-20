import React, { useEffect, useState } from 'react';
import { NotificationPreference } from '../types';
import type { PushNotificationStatus } from '../hooks/usePushNotifications';
import ResponsiveModalShell from './ResponsiveModalShell';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  preferences: NotificationPreference | null;
  pushStatus: PushNotificationStatus;
  pushBusy: boolean;
  pushError: string | null;
  onClose: () => void;
  onSave: (next: Omit<NotificationPreference, 'userId'>) => Promise<void>;
  onEnablePush: () => Promise<void>;
  onDisablePush: () => Promise<void>;
}

const pushStatusCopy: Record<PushNotificationStatus, { title: string; description: string }> = {
  unsupported: {
    title: 'غير مدعوم على هذا المتصفح',
    description: 'إشعارات الجهاز غير متاحة هنا. ستبقى الإشعارات داخل التطبيق متاحة فقط.',
  },
  install_required: {
    title: 'يلزم فتح التطبيق المثبت',
    description: 'أضف فيء إلى الشاشة الرئيسية وافتح النسخة المثبتة لتفعيل تنبيهات الجهاز.',
  },
  permission_denied: {
    title: 'تم حظر إذن الإشعارات',
    description: 'أعد تفعيل إذن الإشعارات من إعدادات المتصفح أو النظام ثم جرّب مرة أخرى.',
  },
  enabled: {
    title: 'مفعّل على هذا الجهاز',
    description: 'سيستقبل هذا الجهاز التنبيهات الفورية عندما تكون الأنواع المختارة مفعّلة.',
  },
  ready: {
    title: 'جاهز للتفعيل',
    description: 'الإذن متاح، ويمكن ربط هذا الجهاز الآن لاستقبال التنبيهات الفورية.',
  },
  prompt: {
    title: 'بحاجة إلى إذن',
    description: 'عند التفعيل سيطلب المتصفح السماح بإرسال الإشعارات إلى هذا الجهاز.',
  },
};

const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  preferences,
  pushStatus,
  pushBusy,
  pushError,
  onClose,
  onSave,
  onEnablePush,
  onDisablePush,
}) => {
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [messageNotificationsEnabled, setMessageNotificationsEnabled] = useState(true);
  const [financialNotificationsEnabled, setFinancialNotificationsEnabled] = useState(true);
  const [paymentNotificationsEnabled, setPaymentNotificationsEnabled] = useState(true);
  const [paymentDueReminderDays, setPaymentDueReminderDays] = useState(7);
  const [overdueReminderFrequencyDays, setOverdueReminderFrequencyDays] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!preferences) return;
    setInAppEnabled(preferences.inAppEnabled);
    setMessageNotificationsEnabled(preferences.messageNotificationsEnabled);
    setFinancialNotificationsEnabled(preferences.financialNotificationsEnabled);
    setPaymentNotificationsEnabled(preferences.paymentNotificationsEnabled);
    setPaymentDueReminderDays(preferences.paymentDueReminderDays);
    setOverdueReminderFrequencyDays(preferences.overdueReminderFrequencyDays);
  }, [preferences]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      inAppEnabled,
      emailEnabled: false,
      messageNotificationsEnabled,
      financialNotificationsEnabled,
      paymentNotificationsEnabled,
      paymentDueReminderDays,
      overdueReminderFrequencyDays,
    });
    setSaving(false);
    onClose();
  };

  const handlePushAction = async () => {
    try {
      if (pushStatus === 'enabled') {
        await onDisablePush();
        return;
      }

      await onEnablePush();
    } catch {
      // The hook already exposes a localized error message for display in the modal.
    }
  };

  const pushCopy = pushStatusCopy[pushStatus];
  const pushActionLabel = pushStatus === 'enabled' ? 'إيقاف على هذا الجهاز' : 'تفعيل على هذا الجهاز';
  const pushActionDisabled = pushBusy || pushStatus === 'unsupported' || pushStatus === 'permission_denied';

  return (
    <ResponsiveModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="إعدادات الإشعارات"
      description="اختر أنواع الإشعارات المهمة لك وحدد القنوات التي تريد استخدامها."
      maxWidthClassName="md:max-w-2xl"
      zIndexClassName="z-[120]"
      bodyClassName="space-y-5"
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
      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-text-primary">أنواع الإشعارات</h4>
          <p className="mt-1 text-sm text-text-secondary">ابدأ فقط بما هو مهم الآن، ويمكننا التوسعة لاحقاً بسهولة.</p>
        </div>

        <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
          <div>
            <span className="block font-semibold text-text-primary">الرسائل الجديدة</span>
            <span className="mt-1 block text-sm text-text-secondary">تنبيه عند وصول رسالة مباشرة جديدة.</span>
          </div>
          <input
            type="checkbox"
            checked={messageNotificationsEnabled}
            onChange={(e) => setMessageNotificationsEnabled(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
        </label>

        <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
          <div>
            <span className="block font-semibold text-text-primary">التنبيهات المالية الحرجة</span>
            <span className="mt-1 block text-sm text-text-secondary">طلبات اعتماد المصروفات وقرارات الموافقة أو الرفض.</span>
          </div>
          <input
            type="checkbox"
            checked={financialNotificationsEnabled}
            onChange={(e) => setFinancialNotificationsEnabled(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
        </label>

        <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
          <div>
            <span className="block font-semibold text-text-primary">إشعارات الدفعات</span>
            <span className="mt-1 block text-sm text-text-secondary">الاستحقاق والتأخير والتسجيلات المرتبطة بالدفعات.</span>
          </div>
          <input
            type="checkbox"
            checked={paymentNotificationsEnabled}
            onChange={(e) => setPaymentNotificationsEnabled(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
        </label>
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-text-primary">قنوات التسليم</h4>
          <p className="mt-1 text-sm text-text-secondary">حاليًا نعتمد على الإشعارات داخل التطبيق وإشعارات الجهاز فقط.</p>
        </div>

        <label className="flex min-h-[56px] items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
          <div>
            <span className="block font-semibold text-text-primary">داخل التطبيق</span>
            <span className="mt-1 block text-sm text-text-secondary">تظهر في الجرس ولوحة الإشعارات داخل فيء.</span>
          </div>
          <input
            type="checkbox"
            checked={inAppEnabled}
            onChange={(e) => setInAppEnabled(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
        </label>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">إشعارات الجهاز للتطبيق المثبت</p>
              <p className="text-sm text-text-secondary">{pushCopy.title}</p>
              <p className="text-sm text-text-secondary">{pushCopy.description}</p>
              {pushError ? (
                <p className="text-sm font-medium text-red-600">{pushError}</p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handlePushAction}
              disabled={pushActionDisabled}
              className="min-h-[48px] rounded-xl border border-primary/20 bg-white px-4 py-2.5 font-semibold text-primary transition-colors hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pushBusy ? 'جارٍ التحديث...' : pushActionLabel}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-text-primary">توقيت تذكيرات الدفعات</h4>
          <p className="mt-1 text-sm text-text-secondary">هذه الحقول تطبق فقط عندما تكون إشعارات الدفعات مفعّلة.</p>
        </div>

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
      </section>
    </ResponsiveModalShell>
  );
};

export default NotificationPreferencesModal;
