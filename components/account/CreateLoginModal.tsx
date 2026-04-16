import React, { useState, useEffect } from 'react';
import { createProfileLogin, generateRandomPassword } from '../../lib/adminAccountApi';
import ResponsiveModalShell from '../ResponsiveModalShell';

export const CreateLoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  displayName: string;
  onSuccess: () => void;
}> = ({ isOpen, onClose, profileId, displayName, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
    }
  }, [isOpen, profileId]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(16));
  };

  const formId = 'create-login-form';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('أدخل البريد الإلكتروني.');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    setSubmitting(true);
    try {
      await createProfileLogin(profileId, email.trim(), password);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإنشاء');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="إنشاء حساب دخول"
      description="ربط بريد إلكتروني وكلمة مرور مؤقتة بملف المستخدم. لا يُعدّل هذا الاسم من هنا."
      maxWidthClassName="md:max-w-md"
      zIndexClassName="z-[60]"
      bodyClassName="space-y-0"
      footer={
        <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[48px] rounded-xl bg-gray-100 px-5 py-2.5 font-semibold text-text-secondary transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="min-h-[48px] rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
          </button>
        </div>
      }
    >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">الاسم</label>
            <input
              type="text"
              readOnly
              value={displayName}
              className="min-h-[48px] w-full cursor-default rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">البريد الإلكتروني</label>
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary"
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">كلمة المرور المؤقتة</label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="min-h-[44px] rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                توليد عشوائي
              </button>
            </div>
            <input
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary"
              dir="ltr"
              placeholder="8 أحرف على الأقل"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
        </form>
    </ResponsiveModalShell>
  );
};
