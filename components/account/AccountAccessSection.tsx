import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccountStatus } from '../../hooks/useAccountStatus';
import { useAuth } from '../../contexts/AuthContext';
import { AccountStatusBadge } from './AccountStatusBadge';
import { CreateLoginModal } from './CreateLoginModal';
import { unlinkProfileLogin } from '../../lib/adminAccountApi';
import ResponsiveModalShell from '../ResponsiveModalShell';

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
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAccountStatus(profileId, true);
  const [modalOpen, setModalOpen] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinkSubmitting, setUnlinkSubmitting] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const isOwnProfile = user?.id === profileId;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['account-status', profileId] });
    void queryClient.invalidateQueries({ queryKey: ['account-statuses'] });
    void refetch();
  };

  return (
    <>
      <section
        className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50/90 to-neutral-50 p-6 shadow-sm"
        aria-label="إدارة حساب الدخول"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">حساب الدخول إلى المنصة</h2>
            <p className="text-sm text-text-secondary mt-1">
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
          <div className="rounded-lg bg-white/80 border border-stone-200 px-4 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <p className="text-sm text-gray-700 flex-1 leading-relaxed">
              لم يتم إنشاء حساب دخول لهذا العضو بعد. يمكنك إنشاء حساباً وتسليم بيانات الدخول بشكل آمن.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="min-h-[48px] shrink-0 w-full rounded-xl border-2 border-primary bg-white px-5 py-2.5 text-center font-semibold text-primary shadow-sm transition-colors hover:bg-primary-light sm:w-auto"
            >
              إنشاء حساب دخول
            </button>
          </div>
        )}

        {!isLoading && !isError && data && data.status !== 'no_login' && (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white/80 rounded-lg px-4 py-3 border border-stone-200">
                <dt className="font-semibold text-gray-600">البريد المرتبط</dt>
                <dd className="mt-1 font-mono text-gray-900 break-all" dir="ltr">
                  {data.email ?? '—'}
                </dd>
              </div>
              <div className="bg-white/80 rounded-lg px-4 py-3 border border-stone-200">
                <dt className="font-semibold text-gray-600">آخر تسجيل دخول</dt>
                <dd className="mt-1 text-gray-900">{formatLastSignIn(data.lastSignInAt)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled
                title="سيُفعّل لاحقاً عند تهيئة البريد"
                className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
              >
                إعادة تعيين كلمة المرور
              </button>
              <button
                type="button"
                disabled={isOwnProfile}
                title={
                  isOwnProfile
                    ? 'لا يمكن فك ربط حسابك من هنا'
                    : 'حذف مستخدم المصادقة وفك الربط عن الملف'
                }
                onClick={() => {
                  setUnlinkError(null);
                  setUnlinkConfirmOpen(true);
                }}
                className="min-h-[44px] rounded-xl border-2 border-red-600 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:opacity-50 disabled:hover:bg-white"
              >
                فك الربط وتعطيل الدخول
              </button>
              <button
                type="button"
                disabled
                title="سيُفعّل لاحقاً مع SMTP"
                className="min-h-[44px] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
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

      {unlinkConfirmOpen && (
        <ResponsiveModalShell
          isOpen={unlinkConfirmOpen}
          onClose={() => setUnlinkConfirmOpen(false)}
          closeDisabled={unlinkSubmitting}
          title="فك ربط حساب الدخول؟"
          maxWidthClassName="md:max-w-md"
          zIndexClassName="z-[60]"
          bodyClassName="space-y-4"
          footer={
            <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                disabled={unlinkSubmitting}
                onClick={() => setUnlinkConfirmOpen(false)}
                className="min-h-[48px] rounded-xl bg-gray-100 px-5 py-2.5 font-semibold text-text-secondary transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={unlinkSubmitting}
                onClick={async () => {
                  setUnlinkError(null);
                  setUnlinkSubmitting(true);
                  try {
                    await unlinkProfileLogin(profileId);
                    setUnlinkConfirmOpen(false);
                    invalidate();
                  } catch (e) {
                    setUnlinkError(e instanceof Error ? e.message : 'فشل العملية');
                  } finally {
                    setUnlinkSubmitting(false);
                  }
                }}
                className="min-h-[48px] rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {unlinkSubmitting ? 'جاري التنفيذ…' : 'نعم، فك الربط'}
              </button>
            </div>
          }
        >
          <p className="text-sm leading-relaxed text-text-secondary">
            سيتم حذف مستخدم المصادقة في النظام وإزالة الربط عن ملف <strong>{displayName}</strong>. بيانات
            الملف (الاسم، الصلاحيات، الروابط…) تبقى كما هي. يمكن لاحقاً إنشاء حساب دخول جديد لهذا الملف.
          </p>
          {unlinkError && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {unlinkError}
            </p>
          )}
        </ResponsiveModalShell>
      )}
    </>
  );
};
