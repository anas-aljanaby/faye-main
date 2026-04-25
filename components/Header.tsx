import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import ThemeSettings from './ThemeSettings';
import { useNotifications } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/usePushNotifications';
import NotificationPanel from './NotificationPanel';

interface BellIconProps {
  onClick: () => void;
  unreadCount: number;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const BellIcon: React.FC<BellIconProps> = ({ onClick, unreadCount, buttonRef }) => (
    <button 
      ref={buttonRef}
      onClick={onClick}
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 transition-colors hover:bg-primary-hover"
      aria-label="الإشعارات"
    >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 md:h-6 md:w-6"
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute end-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-primary ring-2 ring-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
    </button>
);

const Header: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isThemeSettingsOpen, setIsThemeSettingsOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, left: 0, width: 320 });
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, left: 0, width: 192 });
  const { notifications, unreadCount, markAsRead, markAllAsRead, preferences, updatePreferences } = useNotifications();
  const { status: pushStatus, busy: pushBusy, error: pushError, enablePush, disablePush } = usePushNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const toggleNotifications = () => {
    setShowUserMenu(false);
    setShowNotifications((previousState) => !previousState);
  };

  const toggleUserMenu = () => {
    setShowNotifications(false);
    setShowUserMenu((previousState) => !previousState);
  };

  const openThemeSettings = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setIsThemeSettingsOpen(true);
  };

  const roleLabel = userProfile?.role === 'team_member' ? 'عضو فريق' : 'كافل';

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(mql.matches);
    syncViewport();
    mql.addEventListener('change', syncViewport);
    return () => mql.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (showNotifications && notificationButtonRef.current) {
      const rect = notificationButtonRef.current.getBoundingClientRect();
      const viewportPadding = isMobileViewport ? 8 : 16;
      const panelWidth = Math.min(
        window.innerWidth - viewportPadding * 2,
        isMobileViewport ? 360 : 320
      );
      const left = Math.min(
        window.innerWidth - panelWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - panelWidth)
      );

      setNotificationPosition({
        top: rect.bottom + (isMobileViewport ? 6 : 8),
        left,
        width: panelWidth,
      });
    }
  }, [showNotifications, isMobileViewport]);

  useEffect(() => {
    if (showUserMenu && userMenuButtonRef.current) {
      const rect = userMenuButtonRef.current.getBoundingClientRect();
      const viewportPadding = isMobileViewport ? 8 : 16;
      const panelWidth = Math.min(
        window.innerWidth - viewportPadding * 2,
        isMobileViewport ? 240 : 192
      );
      const left = Math.min(
        window.innerWidth - panelWidth - viewportPadding,
        Math.max(viewportPadding, rect.right - panelWidth)
      );

      setUserMenuPosition({
        top: rect.bottom + (isMobileViewport ? 6 : 8),
        left,
        width: panelWidth,
      });
    }
  }, [showUserMenu, isMobileViewport]);

  return (
    <>
    <header className="sticky top-0 z-40 bg-primary pt-[env(safe-area-inset-top)] shadow-md md:pt-0">
      <div className="flex h-14 items-center justify-between ps-3 pe-2 text-white sm:h-[3.75rem] sm:ps-4 sm:pe-3 md:h-16 md:px-6">
        <div className="flex items-center gap-1.5 sm:gap-3">
           <div className="flex items-center gap-1 md:hidden">
              <div className="relative">
                <BellIcon 
                  buttonRef={notificationButtonRef}
                  unreadCount={unreadCount}
                  onClick={toggleNotifications}
                />
              </div>
            </div>
           <div className="hidden items-center gap-6 md:flex">
              <div className="text-center">
                  <p className="font-bold text-lg">{userProfile?.name || 'المستخدم'}</p>
                  <p className="text-sm opacity-80">{roleLabel}</p>
              </div>
              <div className="relative">
                <BellIcon 
                  buttonRef={notificationButtonRef}
                  unreadCount={unreadCount}
                  onClick={toggleNotifications}
                />
              </div>
              <button
                onClick={openThemeSettings}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 transition-colors hover:bg-primary-hover"
                title="تخصيص المظهر"
                aria-label="تخصيص المظهر"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </button>
            </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="relative">
            <button
              ref={userMenuButtonRef}
              onClick={toggleUserMenu}
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-primary-hover"
              aria-label="قائمة المستخدم"
            >
              <Avatar src={userProfile?.avatar_url} name={userProfile?.name || 'مستخدم'} size="sm" />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden h-4 w-4 sm:block">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowNotifications(false)}
          />
          <div
            className="fixed z-[100] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-hidden"
            style={{
              top: `${notificationPosition.top}px`,
              left: `${notificationPosition.left}px`,
              width: `${notificationPosition.width}px`,
            }}
          >
            <NotificationPanel
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              preferences={preferences}
              onSavePreferences={updatePreferences}
              pushStatus={pushStatus}
              pushBusy={pushBusy}
              pushError={pushError}
              onEnablePush={enablePush}
              onDisablePush={disablePush}
            />
          </div>
        </>
      )}
      {showUserMenu && (
        <div
          className="fixed z-[100] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-x-hidden overflow-y-auto rounded-2xl border border-gray-200 bg-bg-card py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          style={{
            top: `${userMenuPosition.top}px`,
            left: `${userMenuPosition.left}px`,
            width: `${userMenuPosition.width}px`,
          }}
        >
          <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
            <p className="truncate font-semibold text-text-primary">{userProfile?.name}</p>
            <p className="text-sm text-text-secondary">{roleLabel}</p>
          </div>
          {isMobileViewport && (
            <button
              onClick={openThemeSettings}
              className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-right text-text-primary transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              تخصيص المظهر
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-right text-text-primary transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            تسجيل الخروج
          </button>
        </div>
      )}
    </header>
    <ThemeSettings isOpen={isThemeSettingsOpen} onClose={() => setIsThemeSettingsOpen(false)} />
    </>
  );
};

export default Header;
