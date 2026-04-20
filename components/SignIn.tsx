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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      
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
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md items-start justify-center px-3 py-4 md:items-center md:px-4 md:py-8">
        {/* Logo/Header */}
        <div className="w-full">
          <div className="mb-5 text-center md:mb-8">
            <div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-primary shadow-lg md:mb-4 md:h-20 md:w-20 md:rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-white md:h-10 md:w-10">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <h1 className="mb-1 text-2xl font-bold text-gray-800 md:mb-2 md:text-3xl">منظمة فيء</h1>
            <p className="mx-auto max-w-xs text-sm text-text-secondary md:text-base">نظام إدارة رعاية الأيتام</p>
          </div>

          {/* Sign In Form */}
          <div className="rounded-[1.75rem] bg-white p-4 shadow-xl md:rounded-[2rem] md:p-8">
            <h2 className="mb-5 text-center text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">تسجيل الدخول</h2>
            
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition focus:border-primary focus:ring-2 focus:ring-primary md:text-base"
                  placeholder="you@example.com"
                  dir="ltr"
                  autoComplete="email"
                  inputMode="email"
                />
              </div>

              <PasswordInput
                id="password"
                label="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputClassName="min-h-12"
                placeholder="••••••••"
                autoComplete="current-password"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-gray-400 md:text-base"
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

            <div className="mt-5 text-center text-xs text-text-secondary md:mt-6 md:text-sm">
              <p>للمساعدة، يرجى التواصل مع مدير النظام</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-text-secondary md:mt-8 md:text-sm">
            <p>© 2024 منظمة فيء. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
