import React, { useRef, useEffect } from 'react';
import { useTheme, ThemeMode, BrandColor, FontSize } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { mode, setMode, brandColor, setBrandColor, fontSize, setFontSize } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const colors: { id: BrandColor; color: string; label: string }[] = [
    { id: 'default', color: '#8c1c3e', label: 'العنابي (الأصلي)' },
    { id: 'blue', color: '#2563eb', label: 'الأزرق' },
    { id: 'green', color: '#059669', label: 'الأخضر' },
    { id: 'purple', color: '#7c3aed', label: 'البنفسجي' },
    { id: 'orange', color: '#ea580c', label: 'البرتقالي' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              ref={modalRef}
              className="bg-bg-card rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold text-text-primary">تخصيص المظهر</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto">
                <section>
                  <h4 className="text-sm font-bold text-text-secondary uppercase mb-3 tracking-wider">وضع العرض</h4>
                  <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                    {[
                      { id: 'light', label: 'نهاري', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> },
                      { id: 'dark', label: 'ليلي', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> },
                      { id: 'system', label: 'النظام', icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setMode(item.id as ThemeMode)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                          ${mode === item.id ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-text-secondary uppercase mb-3 tracking-wider">لون السمة</h4>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setBrandColor(c.id)}
                        className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                          ${brandColor === c.id ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''}`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                        aria-label={`تغيير اللون إلى ${c.label}`}
                      >
                        {brandColor === c.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-text-secondary uppercase mb-3 tracking-wider">حجم الخط</h4>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex items-center justify-between">
                    <button
                      onClick={() => setFontSize('small')}
                      className={`flex-1 py-2 rounded-lg text-xs transition-colors ${fontSize === 'small' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm font-bold' : 'text-gray-500'}`}
                    >
                      ع
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
                    <button
                      onClick={() => setFontSize('normal')}
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${fontSize === 'normal' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm font-bold' : 'text-gray-500'}`}
                    >
                      ع
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />
                    <button
                      onClick={() => setFontSize('large')}
                      className={`flex-1 py-2 rounded-lg text-lg transition-colors ${fontSize === 'large' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm font-bold' : 'text-gray-500'}`}
                    >
                      ع
                    </button>
                  </div>
                  <div className="flex justify-between px-2 mt-1 text-xs text-text-secondary">
                    <span>صغير</span>
                    <span>متوسط</span>
                    <span>كبير</span>
                  </div>
                </section>
              </div>

              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                  onClick={onClose}
                  className="w-full bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30"
                >
                  حفظ وإغلاق
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ThemeSettings;
