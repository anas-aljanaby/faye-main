import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountStatus } from '../../hooks/useAccountStatus';
import { AccountStatusBadge } from './AccountStatusBadge';
import { CreateLoginModal } from './CreateLoginModal';

function formatLastSignIn(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export const AccountAccessSection: React.FC<{
  profileId: string;
  displayName: string;
}> = ({ profileId, displayName }) => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useAccountStatus(profileId, true);
  const [modalOpen, setModalOpen] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['account-status', profileId] });
    void queryClient.invalidateQueries({ queryKey: ['account-statuses'] });
    void refetch();
  };

  return (
    <>
      <section
        className="rounded-xl border-2 border-indigo-200/70 bg-gradient-to-br from-indigo-50/80 to-slate-50 p-6 shadow-sm"
        aria-label="إدارة حساب الدخول"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-indigo-950">حساب الدخول إلى المنصة</h2>
            <p className="text-sm text-indigo-900/70 mt-1">
              منفصلة عن تعديل بيانات الملف الشخصي في الأعلى.
            </p>
          </div>
          <AccountStatusBadge status={data?.status} loading={isLoading} />
        </div>

        {isError && (
          <p className="text-sm text-red-600 mb-4">
            {error instanceof Error ? error.message : 'تعذّر تحميل حالة الحساب.'}
          </p>
        )}

        {!isLoading && !isError && data?.status === 'no_login' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sm text-gray-700 flex-1">لا يوجد حساب دخول مرتبط. يمكنك إنشاء حساب وتسليم البيانات للمستخدم بشكل آمن.</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shrink-0 py-2.5 px-5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm"
            >
              إنشاء حساب دخول
            </button>
          </div>
        )}

        {!isLoading && !isError && data && data.status !== 'no_login' && (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/80 rounded-lg px-4 py-3 border border-indigo-100">
                <dt className="font-semibold text-gray-600">البريد المرتبط</dt>
                <dd className="mt-1 font-mono text-gray-900 break-all" dir="ltr">
                  {data.email ?? '—'}
                </dd>
              </div>
              <div className="bg-white/80 rounded-lg px-4 py-3 border border-indigo-100">
                <dt className="font-semibold text-gray-600">آخر تسجيل دخول</dt>
                <dd className="mt-1 text-gray-900">{formatLastSignIn(data.lastSignInAt)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled
                title="سيُفعّل لاحقاً عند تهيئة البريد"
                className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-gray-400 text-sm font-semibold cursor-not-allowed"
              >
                إعادة تعيين كلمة المرور
              </button>
              <button
                type="button"
                disabled
                title="سيُفعّل لاحقاً"
                className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-gray-400 text-sm font-semibold cursor-not-allowed"
              >
                تعطيل الحساب
              </button>
              <button
                type="button"
                disabled
                title="سيُفعّل لاحقاً مع SMTP"
                className="py-2 px-4 rounded-lg border border-gray-200 bg-white text-gray-400 text-sm font-semibold cursor-not-allowed"
              >
                إعادة إرسال الدعوة
              </button>
            </div>
          </div>
        )}
      </section>

      <CreateLoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        profileId={profileId}
        displayName={displayName}
        onSuccess={invalidate}
      />
    </>
  );
};
