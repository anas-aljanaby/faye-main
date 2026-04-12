import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getMobileMoreNavItems,
  getMobilePrimaryNavItems,
  isNavigationItemActive,
  useNavigationCounts,
  type AppNavItemConfig,
} from './navigationConfig';

const MoreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

interface MobileNavItemButtonProps {
  item: AppNavItemConfig;
  isActive: boolean;
  count?: number;
  onClick?: () => void;
}

const MobileNavItemButton: React.FC<MobileNavItemButtonProps> = ({ item, isActive, count, onClick }) => {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onClick}
      aria-label={item.text}
      className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-center transition-all duration-200 ${
        isActive
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'text-text-secondary hover:bg-white/80 hover:text-primary'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />

      {count && count > 0 ? (
        <span
          className={`absolute end-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            isActive ? 'bg-white text-primary' : 'bg-red-500 text-white'
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}

      <span className="max-w-[4.5rem] text-[10px] font-semibold leading-3">{item.text}</span>
    </Link>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();
  const navigationCounts = useNavigationCounts();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryItems = useMemo(() => getMobilePrimaryNavItems(userProfile?.role), [userProfile?.role]);
  const moreItems = useMemo(() => getMobileMoreNavItems(userProfile?.role), [userProfile?.role]);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMoreOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

  if (!userProfile) {
    return null;
  }

  const moreTabActive = moreItems.some((item) => isNavigationItemActive(location.pathname, item));

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="pointer-events-auto mx-auto max-w-screen-sm border-t border-white/70 bg-white/90 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <nav className="grid grid-cols-5 gap-2" aria-label="التنقل السفلي">
            {primaryItems.map((item) => (
              <MobileNavItemButton
                key={item.id}
                item={item}
                isActive={isNavigationItemActive(location.pathname, item)}
                count={item.countKey ? navigationCounts[item.countKey] : undefined}
              />
            ))}

            {moreItems.length > 0 ? (
              <button
                type="button"
                aria-label="المزيد"
                aria-expanded={isMoreOpen}
                onClick={() => setIsMoreOpen((currentState) => !currentState)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-center transition-all duration-200 ${
                  isMoreOpen || moreTabActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-secondary hover:bg-white/80 hover:text-primary'
                }`}
              >
                <MoreIcon className="h-5 w-5 shrink-0" />
                <span className="max-w-[4.5rem] text-[10px] font-semibold leading-3">المزيد</span>
              </button>
            ) : null}
          </nav>
        </div>
      </div>

      {moreItems.length > 0 ? (
        <>
          <div
            className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
              isMoreOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 md:hidden ${
              isMoreOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="قائمة المزيد"
          >
            <div className="mx-auto max-w-screen-sm rounded-t-[2rem] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_48px_rgba(15,23,42,0.22)]">
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />

              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-secondary">روابط إضافية</p>
                  <h2 className="text-lg font-bold text-text-primary">المزيد</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-slate-100 text-text-secondary transition-colors hover:bg-slate-200 hover:text-text-primary"
                  aria-label="إغلاق"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavigationItemActive(location.pathname, item);

                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                        isActive ? 'bg-primary-light text-primary' : 'text-text-primary hover:bg-bg-page'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-sm font-semibold">{item.text}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 opacity-60"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={async () => {
                    setIsMoreOpen(false);
                    await signOut();
                  }}
                  className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogoutIcon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-right text-sm font-semibold">تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default MobileBottomNav;
