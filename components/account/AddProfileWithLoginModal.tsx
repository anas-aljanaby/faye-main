import React, { useEffect, useMemo, useState } from 'react';
import ResponsiveModalShell from '../ResponsiveModalShell';
import PasswordFieldWithActions from './PasswordFieldWithActions';
import { createProfileWithLogin, generateRandomPassword } from '../../lib/adminAccountApi';

type AddProfileWithLoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'team_member' | 'sponsor';
  onSuccess?: (result: { id: string; name: string; role: 'team_member' | 'sponsor' }) => void;
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
};

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AddProfileWithLoginModal: React.FC<AddProfileWithLoginModalProps> = ({
  open,
  onOpenChange,
  role,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setEmail('');
    setPassword('');
    setErrors({});
    setSubmitting(false);
    setToast(null);
  }, [open, role]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const labels = useMemo(() => {
    const roleTitle = role === 'team_member' ? 'عضو فريق' : 'كافل';
    const submitLabel = role === 'team_member' ? 'إنشاء عضو الفريق' : 'إنشاء الكافل';
    const successLabel =
      role === 'team_member'
        ? 'تم إنشاء عضو الفريق بنجاح. لم تتم إضافة أي صلاحيات افتراضيًا.'
        : 'تم إنشاء الكافل بنجاح ويمكنه الآن تسجيل الدخول.';

    const note =
      role === 'team_member'
        ? 'سيتم إنشاء المستخدم بدون أي صلاحيات افتراضيًا، ويمكنك إضافة الصلاحيات بعد الإنشاء.'
        : 'سيتم إنشاء حساب الكافل ويمكنه تسجيل الدخول بعد الإنشاء. يظل الوصول محدودًا حسب العلاقات والبيانات المسندة له.';

    return { roleTitle, submitLabel, successLabel, note };
  }, [role]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) next.name = 'الاسم مطلوب.';
    if (!normalizedEmail) next.email = 'البريد الإلكتروني مطلوب.';
    else if (!EMAIL_REGEX.test(normalizedEmail)) next.email = 'صيغة البريد الإلكتروني غير صحيحة.';
    if (!password) next.password = 'كلمة المرور مطلوبة.';
    else if (password.length < 8) next.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';

    return next;
  };

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword(16));
    setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const profile = await createProfileWithLogin(role, name.trim(), email.trim(), password.trim());
      onSuccess?.({ id: profile.id, name: profile.name, role: profile.role });
      setToast({ type: 'success', message: labels.successLabel });
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'فشل إنشاء المستخدم.';
      setErrors((prev) => ({ ...prev, general: message }));
      setToast({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {toast && (
        <div className="fixed left-1/2 top-4 z-[180] w-[min(92vw,32rem)] -translate-x-1/2">
          <div
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${
              toast.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80">
              {toast.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </span>
            <p className="text-sm font-semibold leading-6">{toast.message}</p>
          </div>
        </div>
      )}

      <ResponsiveModalShell
        isOpen={open}
        onClose={() => onOpenChange(false)}
        closeDisabled={submitting}
        title={`إضافة ${labels.roleTitle} جديد`}
        description="سيتم إنشاء الملف وحساب الدخول في خطوة واحدة."
        maxWidthClassName="md:max-w-lg"
        footer={
          <div className="grid grid-cols-2 gap-3 md:flex md:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="min-h-[46px] rounded-xl bg-gray-100 px-5 py-2.5 font-semibold text-text-secondary transition-colors hover:bg-gray-200 disabled:opacity-50 md:min-h-[48px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="add-profile-with-login-form"
              disabled={submitting}
              className="min-h-[46px] rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 md:min-h-[48px]"
            >
              {submitting ? 'جاري الإنشاء...' : labels.submitLabel}
            </button>
          </div>
        }
      >
      <form id="add-profile-with-login-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">الاسم</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: undefined, general: undefined }));
            }}
            className="min-h-[48px] w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary"
            required
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">البريد الإلكتروني</label>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined, general: undefined }));
            }}
            className="min-h-[48px] w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:border-primary focus:ring-2 focus:ring-primary"
            placeholder="name@example.com"
            required
          />
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/90 text-sky-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <p className="text-xs font-medium">
              سيُستخدم هذا البريد الإلكتروني لتسجيل الدخول، لذلك تأكد من صحته.
            </p>
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <PasswordFieldWithActions
          label="كلمة المرور"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined, general: undefined }));
          }}
          onGenerate={handleGeneratePassword}
          error={errors.password}
          showCopy
        />

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {labels.note}
        </div>

        {errors.general && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errors.general}
          </div>
        )}
      </form>
      </ResponsiveModalShell>
    </>
  );
};

export default AddProfileWithLoginModal;
