import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { conversations, financialTransactions } from '../data';
import { TransactionStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  to: string;
  text: string;
  icon: React.ReactNode;
  countKey?: 'messages' | 'financial';
}

interface NavItemProps extends NavItemConfig {
  count?: number;
  isCollapsed: boolean;
  onClose: () => void;
}

const navItemsData: NavItemConfig[] = [
  { 
    to: '/', 
    text: 'لوحة التحكم', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> 
  },
  { 
    to: '/orphans', 
    text: 'الأيتام', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 1-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> 
  },
  { 
    to: '/sponsors', 
    text: 'الكفلاء', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
  },
  { 
    to: '/human-resources', 
    text: 'الموارد البشرية', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> 
  },
  { 
    to: '/messages', 
    text: 'المراسلات', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    countKey: 'messages'
  },
  { 
    to: '/financial-system', 
    text: 'النظام المالي', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
    countKey: 'financial'
  },
  { 
    to: '/policies', 
    text: 'سياسات فيء', 
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 
  },
];

const NavItem = React.memo(({ to, text, icon, count, isCollapsed, onClose }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClose}
      className={({ isActive }) =>
        `group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ease-in-out font-medium overflow-hidden
        ${isActive 
          ? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-1' 
          : 'text-text-secondary hover:bg-white hover:text-primary hover:shadow-md'
        }
        ${isCollapsed ? 'justify-center w-12 h-12 px-0 mx-auto' : ''}`
      }
      title={isCollapsed ? text : ''}
    >
      <div className={`transition-transform duration-300 ${isCollapsed ? 'group-hover:scale-110' : ''}`}>
        {icon}
      </div>

      {!isCollapsed && (
        <span className="whitespace-nowrap opacity-100 transition-opacity duration-300">
          {text}
        </span>
      )}

      {count && count > 0 ? (
        <div className={`absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-bg-sidebar transition-all duration-300
          ${isCollapsed 
            ? 'top-1 right-1 w-4 h-4' 
            : 'left-3 top-1/2 -translate-y-1/2 min-w-[20px] h-5 px-1.5'
          }`}
        >
          {count > 99 ? '99+' : count}
        </div>
      ) : null}

      {isCollapsed && (
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {text}
          <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
        </div>
      )}
    </NavLink>
  );
});

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { signOut, userProfile } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const savedState = localStorage.getItem('sidebar_collapsed');
      return savedState ? JSON.parse(savedState) : false;
    } catch (e) {
      console.error('فشل في قراءة حالة الشريط الجانبي:', e);
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('last_visited_path', location.pathname);
    } catch {
      // ignore
    }
  }, [location.pathname]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev: boolean) => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const notificationCounts = useMemo(() => {
    let unreadMessages = 0;
    let pendingFinancial = 0;

    try {
      unreadMessages = conversations.filter(c => c.unread).length;
      pendingFinancial = financialTransactions.filter(tx => tx.status === TransactionStatus.Pending).length;
    } catch (error) {
      console.error('خطأ في حساب العدادات:', error);
    }

    return {
      messages: unreadMessages,
      financial: pendingFinancial,
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const restrictedPaths = userProfile?.role === 'sponsor'
    ? ['/sponsors', '/human-resources', '/financial-system']
    : ['/payments'];

  const visibleNavItems = navItemsData.filter(item => !restrictedPaths.includes(item.to));

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ease-in-out
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside 
        className={`fixed inset-y-0 right-0 z-50 bg-bg-sidebar shadow-2xl border-l border-white/50 flex flex-col h-full transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
        md:relative md:translate-x-0
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}`}
        aria-label="القائمة الجانبية"
      >
        <div className={`flex items-center p-4 border-b border-gray-200/50 h-16 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ف
              </div>
              <span className="font-bold text-xl text-primary truncate">جمعية فيء</span>
            </div>
          )}

          <button 
            onClick={toggleCollapse}
            className={`hidden md:flex items-center justify-center p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50
            ${isCollapsed ? 'rotate-180' : ''}`}
            title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
          </button>

          <button 
            onClick={onClose} 
            className="md:hidden p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            aria-label="إغلاق القائمة"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-hide">
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              text={item.text}
              icon={item.icon}
              count={item.countKey ? notificationCounts[item.countKey] : undefined}
              isCollapsed={isCollapsed}
              onClose={onClose}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
          <button 
            onClick={handleSignOut}
            className={`group flex items-center gap-3 p-3 rounded-xl text-text-secondary w-full text-right hover:bg-red-50 hover:text-red-600 transition-all duration-300 font-medium
            ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'تسجيل الخروج' : ''}
          >
            <div className="transition-transform group-hover:-translate-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            
            {!isCollapsed && (
              <span>تسجيل الخروج</span>
            )}
          </button>

          {!isCollapsed && (
            <div className="mt-4 text-center text-xs text-gray-400">
              <p>فيء © {new Date().getFullYear()}</p>
              <p>الإصدار 2.1.0</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

