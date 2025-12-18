import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';

interface BellIconProps {
  onClick: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const BellIcon: React.FC<BellIconProps> = ({ onClick, buttonRef }) => (
    <button 
      ref={buttonRef}
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-primary-hover transition-colors"
      aria-label="Notifications"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">1</span>
    </button>
);

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const [notificationPosition, setNotificationPosition] = useState({ top: 0, left: 0 });

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const roleLabel = userProfile?.role === 'team_member' ? 'عضو فريق' : 'كافل';

  useEffect(() => {
    if (showNotifications && notificationButtonRef.current) {
      const rect = notificationButtonRef.current.getBoundingClientRect();
      // Position dropdown to the left of the button (RTL layout)
      // 320px is the width of the dropdown (w-80 = 20rem = 320px)
      setNotificationPosition({
        top: rect.bottom + 8,
        left: rect.right - 320, // Align right edge of dropdown with right edge of button
      });
    }
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-40 bg-primary shadow-md">
      <div className="flex justify-between items-center h-16 px-6 text-white">
        <div className="flex items-center gap-4">
           <button onClick={onMenuClick} className="p-2 md:hidden" aria-label="Open menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
           </button>
           <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                  <p className="font-bold text-lg">{userProfile?.name || 'المستخدم'}</p>
                  <p className="text-sm opacity-80">{roleLabel}</p>
              </div>
              <div className="relative">
                <BellIcon 
                  buttonRef={notificationButtonRef}
                  onClick={() => setShowNotifications(!showNotifications)} 
                />
              </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold transition-transform hover:scale-105" aria-label="العودة للصفحة الرئيسية">
            <span>فيء</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-primary-hover transition-colors"
              aria-label="User menu"
            >
              <Avatar src={userProfile?.avatar_url} name={userProfile?.name || 'مستخدم'} size="sm" />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="font-semibold text-gray-800">{userProfile?.name}</p>
                  <p className="text-sm text-gray-500">{roleLabel}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-right px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  تسجيل الخروج
                </button>
              </div>
            )}
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
            className="fixed w-80 bg-white rounded-lg shadow-2xl border border-gray-200 py-0 z-[100] max-h-96 overflow-hidden flex flex-col"
            style={{
              top: `${notificationPosition.top}px`,
              left: `${notificationPosition.left}px`,
            }}
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <p className="font-semibold text-gray-800 text-lg">إشعارات جديدة</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-8 text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-gray-300">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <p className="text-sm">لا توجد إشعارات جديدة</p>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;