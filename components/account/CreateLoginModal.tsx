import React, { useState, useEffect } from 'react';
import { createProfileLogin, generateRandomPassword } from '../../lib/adminAccountApi';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

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

  useBodyScrollLock(isOpen);

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
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-login-title"
      >
        <h2 id="create-login-title" className="text-xl font-bold text-text-primary mb-1">
          إنشاء حساب دخول
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          ربط بريد إلكتروني وكلمة مرور مؤقتة بملف المستخدم. لا يُعدّل هذا الاسم من هنا.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم</label>
            <input
              type="text"
              readOnly
              value={displayName}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 cursor-default"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-gray-700">كلمة المرور المؤقتة</label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-sm font-semibold text-primary hover:text-primary-hover"
              >
                توليد عشوائي
              </button>
            </div>
            <input
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm"
              dir="ltr"
              placeholder="8 أحرف على الأقل"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-2.5 px-5 bg-gray-100 text-text-secondary rounded-lg hover:bg-gray-200 font-semibold disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="py-2.5 px-5 bg-primary text-white rounded-lg hover:bg-primary-hover font-semibold disabled:opacity-50"
            >
              {submitting ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
