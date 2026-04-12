import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSidebarNavItems, useNavigationCounts, type AppNavItemConfig } from './navigationConfig';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItemProps = Pick<AppNavItemConfig, 'to' | 'text' | 'icon'> & {
  count?: number;
  isCollapsed: boolean;
  onClose: () => void;
};

const NavItem = React.memo(({ to, text, icon, count, isCollapsed, onClose }: NavItemProps) => {
  const Icon = icon;

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
        <Icon className="h-6 w-6" />
      </div>

      {!isCollapsed && (
        <span className="whitespace-nowrap opacity-100 transition-opacity duration-300">
          {text}
        </span>
      )}

      {count && count > 0 ? (
        <div className={`absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-bg-sidebar transition-all duration-300
          ${isCollapsed
            ? 'top-1 end-1 h-4 w-4'
            : 'start-3 top-1/2 h-5 min-w-[20px] -translate-y-1/2 px-1.5'
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

const SIDEBAR_COLLAPSED_WIDTH = 80;
const SIDEBAR_EXPANDED_DEFAULT = 288;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_VIEWPORT_RATIO_CAP = 0.36;

const clampSidebarWidthForViewport = (preferredWidth: number, viewportWidth: number) => {
  const viewportMax = Math.min(
    SIDEBAR_MAX_WIDTH,
    Math.max(SIDEBAR_MIN_WIDTH, Math.floor(viewportWidth * SIDEBAR_VIEWPORT_RATIO_CAP))
  );

  return Math.min(viewportMax, Math.max(SIDEBAR_MIN_WIDTH, preferredWidth));
};

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

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_width');
      if (saved) {
        const w = parseInt(saved, 10);
        if (!Number.isNaN(w) && w >= SIDEBAR_MIN_WIDTH && w <= SIDEBAR_MAX_WIDTH) {
          return clampSidebarWidthForViewport(w, window.innerWidth);
        }
      }
    } catch {
      // ignore
    }
    return clampSidebarWidthForViewport(SIDEBAR_EXPANDED_DEFAULT, window.innerWidth);
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);
    const listener = () => setIsDesktop(mql.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (e: MouseEvent) => {
      const rightEdge = window.innerWidth;
      const newWidth = rightEdge - e.clientX;
      const clamped = clampSidebarWidthForViewport(newWidth, window.innerWidth);
      setSidebarWidth(clamped);
      try {
        localStorage.setItem('sidebar_width', String(clamped));
      } catch {
        // ignore
      }
    };
    const onUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

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

  const notificationCounts = useNavigationCounts();

  const handleSignOut = async () => {
    await signOut();
  };

  const visibleNavItems = useMemo(() => getSidebarNavItems(userProfile?.role), [userProfile?.role]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ease-in-out
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside 
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-[calc(100vw-1rem)] max-w-sm flex-col border-l border-white/50 bg-bg-sidebar shadow-2xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} 
        md:relative md:w-auto md:max-w-none md:translate-x-0
        ${!isResizing && !isCollapsed ? 'transition-[width] duration-200 ease-out' : ''}`}
        style={isDesktop ? { width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : clampSidebarWidthForViewport(sidebarWidth, window.innerWidth) } : undefined}
        aria-label="القائمة الجانبية"
      >
        {isDesktop && !isCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض القائمة الجانبية"
            onMouseDown={handleResizeStart}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-10 flex items-center justify-center group"
          >
            <span className="w-0.5 h-12 rounded-full bg-gray-300 group-hover:bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        )}

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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-x-[-1]"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></svg>
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

        <div className="p-4 border-t border-gray-200/50 bg-gray-50/50 flex flex-col items-center">
          <button 
            onClick={handleSignOut}
            className="group flex items-center justify-center gap-3 p-3 rounded-xl text-text-secondary w-full hover:bg-red-50 hover:text-red-600 transition-all duration-300 font-medium"
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
