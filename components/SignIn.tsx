import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PasswordInput from './PasswordInput';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const fieldLabelClassName = 'mb-2.5 block text-sm font-semibold text-slate-700';
  const fieldInputClassName = 'min-h-[56px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-base text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,background-color,color] placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email.trim(), password.trim());
      
      if (error) {
        setError(error || 'حدث خطأ أثناء تسجيل الدخول');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-primary-light/20 via-bg-page to-primary-light/10">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-start justify-center px-4 pt-7 pb-8 md:items-center md:px-4 md:py-8">
        {/* Logo/Header */}
        <div className="w-full">
          <div className="mb-6 text-center md:mb-8">
            <div className="mb-3 inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.75rem] shadow-lg md:mb-4 md:h-20 md:w-20 md:rounded-full">
              <img src="/icons/logo-placeholder.svg" alt="Yetim Logo" className="h-full w-full object-cover" />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-800 md:mb-2 md:text-3xl">منصة يتيم</h1>
            <p className="mx-auto max-w-xs text-sm text-text-secondary md:text-base">نظام إدارة رعاية الأيتام</p>
          </div>

          {/* Sign In Form */}
          <div className="rounded-[1.75rem] border border-white/70 bg-white/95 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-sm md:rounded-[2rem] md:p-8">
            <h2 className="mb-5 text-center text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">تسجيل الدخول</h2>
            
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-4">
              <div>
                <label htmlFor="email" className={fieldLabelClassName}>
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${fieldInputClassName} text-left`}
                  placeholder="name@example.com"
                  dir="ltr"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                />
              </div>

              <PasswordInput
                id="password"
                label="كلمة المرور"
                labelClassName={fieldLabelClassName}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputClassName="min-h-[56px] text-left"
                placeholder="••••••••"
                autoComplete="current-password"
                enterKeyHint="go"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-text-secondary md:mt-6">
              <p>للمساعدة، يرجى التواصل مع مدير النظام</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-text-secondary md:mt-8 md:text-sm">
            <p>© 2024 منصة يتيم. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
