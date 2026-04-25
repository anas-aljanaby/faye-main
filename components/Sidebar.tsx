import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { getSidebarNavItems, useNavigationCounts, type AppNavItemConfig } from './navigationConfig';

type NavItemProps = Pick<AppNavItemConfig, 'to' | 'text' | 'icon'> & {
  count?: number;
  isCollapsed: boolean;
};

const NavItem = React.memo(({ to, text, icon, count, isCollapsed }: NavItemProps) => {
  const Icon = icon;
  const showCount = Boolean(count && count > 0);

  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `group relative flex items-center gap-4 rounded-xl p-3 font-medium transition-all duration-300 ease-in-out
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
        <>
          <span className="flex-1 truncate whitespace-nowrap opacity-100 transition-opacity duration-300">
            {text}
          </span>

          {showCount ? (
            <span className="inline-flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
              {count! > 99 ? '99+' : count}
            </span>
          ) : null}
        </>
      )}

      {isCollapsed && showCount ? (
        <div className={`absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm ring-2 ring-bg-sidebar transition-all duration-300
          top-1 end-1 h-4 min-w-4 px-1`}
        >
          {count! > 99 ? '99+' : count}
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

const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_EXPANDED_DEFAULT = 288;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_VIEWPORT_RATIO_CAP = 0.36;

interface SidebarProps {
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const clampSidebarWidthForViewport = (preferredWidth: number, viewportWidth: number) => {
  const viewportMax = Math.min(
    SIDEBAR_MAX_WIDTH,
    Math.max(SIDEBAR_MIN_WIDTH, Math.floor(viewportWidth * SIDEBAR_VIEWPORT_RATIO_CAP))
  );

  return Math.min(viewportMax, Math.max(SIDEBAR_MIN_WIDTH, preferredWidth));
};

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onCollapsedChange }) => {
  const location = useLocation();
  const { signOut, userProfile, permissions, isSystemAdmin } = useAuth();
  const { organization } = useOrganization();

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
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const syncDesktop = () => setIsDesktop(mql.matches);
    syncDesktop();
    mql.addEventListener('change', syncDesktop);
    return () => mql.removeEventListener('change', syncDesktop);
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
    onCollapsedChange(!isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  const notificationCounts = useNavigationCounts();

  const handleSignOut = async () => {
    await signOut();
  };

  const visibleNavItems = useMemo(
    () =>
      getSidebarNavItems({
        role: userProfile?.role,
        permissions,
        isSystemAdmin: isSystemAdmin(),
      }),
    [isSystemAdmin, permissions, userProfile?.role]
  );

  if (!isDesktop) {
    return null;
  }

  const currentSidebarWidth = isCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : clampSidebarWidthForViewport(sidebarWidth, window.innerWidth);

  return (
    <>
      <aside
        className={`fixed right-0 top-14 z-30 hidden h-[calc(100dvh-3.5rem)] flex-col border-l border-white/50 bg-bg-sidebar shadow-xl sm:top-[3.75rem] sm:h-[calc(100dvh-3.75rem)] md:top-16 md:flex md:h-[calc(100dvh-4rem)] ${!isResizing ? 'transition-[width] duration-200 ease-out' : ''}`}
        style={{ width: currentSidebarWidth }}
        aria-label="القائمة الجانبية"
      >
        {!isCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="تغيير عرض القائمة الجانبية"
            onMouseDown={handleResizeStart}
            className="absolute left-0 top-0 bottom-0 z-10 flex w-1 cursor-col-resize items-center justify-center group hover:bg-primary/20 active:bg-primary/40"
          >
            <span className="h-12 w-0.5 rounded-full bg-gray-300 opacity-0 transition-opacity group-hover:bg-primary/60 group-hover:opacity-100 pointer-events-none" />
          </div>
        )}

        <div className="flex h-14 items-center border-b border-gray-200/50 transition-all duration-300">
          <div
            className="flex h-full shrink-0 items-center justify-center"
            style={{ width: isCollapsed ? '100%' : SIDEBAR_COLLAPSED_WIDTH }}
          >
            <button
              onClick={toggleCollapse}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-200 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
              aria-label={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
              aria-expanded={!isCollapsed}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              >
                <path d="m6 17 5-5-5-5" />
                <path d="m13 17 5-5-5-5" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="scrollbar-hide flex-1 space-y-2 overflow-y-auto px-3 py-5">
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              text={item.text}
              icon={item.icon}
              count={item.countKey ? notificationCounts[item.countKey] : undefined}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        <div className={`flex flex-col items-center border-t border-gray-200/50 bg-gray-50/50 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          <button
            onClick={handleSignOut}
            className={`group flex items-center justify-center rounded-xl font-medium text-text-secondary transition-all duration-300 hover:bg-red-50 hover:text-red-600 ${isCollapsed ? 'h-12 w-12 p-0' : 'w-full gap-3 p-3'}`}
            title={isCollapsed ? 'تسجيل الخروج' : ''}
            aria-label="تسجيل الخروج"
          >
            <div className="transition-transform group-hover:-translate-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>

            {!isCollapsed && <span>تسجيل الخروج</span>}
          </button>

          {!isCollapsed && (
            <div className="mt-4 text-center text-xs text-gray-400">
              <p>{organization.name} © {new Date().getFullYear()}</p>
              <p>الإصدار 2.1.0</p>
            </div>
          )}
        </div>
      </aside>
      <div aria-hidden="true" className="hidden shrink-0 md:block" style={{ width: currentSidebarWidth }} />
    </>
  );
};

export default Sidebar;
