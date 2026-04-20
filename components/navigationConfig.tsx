import React, { useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import type { NotificationType } from '../types';

export type AppRole = 'team_member' | 'sponsor';
export type NavigationCountKey = 'messages' | 'financial';
export type AppNavItemId =
  | 'dashboard'
  | 'orphans'
  | 'sponsors'
  | 'human-resources'
  | 'messages'
  | 'financial-system'
  | 'payments'
  | 'policies';

export interface NavigationIconProps {
  className?: string;
}

export type NavigationIcon = React.ComponentType<NavigationIconProps>;

export interface AppNavItemConfig {
  id: AppNavItemId;
  to: string;
  text: string;
  icon: NavigationIcon;
  matchPaths: string[];
  countKey?: NavigationCountKey;
}

const HomeIcon: NavigationIcon = ({ className }) => (
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
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const PeopleIcon: NavigationIcon = ({ className }) => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 1-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UserIcon: NavigationIcon = ({ className }) => (
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
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BriefcaseIcon: NavigationIcon = ({ className }) => (
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
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const MessageIcon: NavigationIcon = ({ className }) => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ClipboardIcon: NavigationIcon = ({ className }) => (
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
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const CardIcon: NavigationIcon = ({ className }) => (
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
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M2 10h20" />
    <path d="M7 15h.01" />
    <path d="M11 15h2" />
  </svg>
);

const ShieldIcon: NavigationIcon = ({ className }) => (
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
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const navItemsById: Record<AppNavItemId, AppNavItemConfig> = {
  dashboard: {
    id: 'dashboard',
    to: '/',
    text: 'لوحة التحكم',
    icon: HomeIcon,
    matchPaths: ['/'],
  },
  orphans: {
    id: 'orphans',
    to: '/orphans',
    text: 'الأيتام',
    icon: PeopleIcon,
    matchPaths: ['/orphans', '/orphan'],
  },
  sponsors: {
    id: 'sponsors',
    to: '/sponsors',
    text: 'الكفلاء',
    icon: UserIcon,
    matchPaths: ['/sponsors', '/sponsor'],
  },
  'human-resources': {
    id: 'human-resources',
    to: '/human-resources',
    text: 'الموارد البشرية',
    icon: BriefcaseIcon,
    matchPaths: ['/human-resources', '/team'],
  },
  messages: {
    id: 'messages',
    to: '/messages',
    text: 'المراسلات',
    icon: MessageIcon,
    matchPaths: ['/messages'],
    countKey: 'messages',
  },
  'financial-system': {
    id: 'financial-system',
    to: '/financial-system',
    text: 'النظام المالي',
    icon: ClipboardIcon,
    matchPaths: ['/financial-system'],
    countKey: 'financial',
  },
  payments: {
    id: 'payments',
    to: '/payments',
    text: 'الدفعات',
    icon: CardIcon,
    matchPaths: ['/payments'],
  },
  policies: {
    id: 'policies',
    to: '/policies',
    text: 'سياسات فيء',
    icon: ShieldIcon,
    matchPaths: ['/policies'],
  },
};

const sidebarNavOrder: Record<AppRole, AppNavItemId[]> = {
  team_member: ['dashboard', 'orphans', 'sponsors', 'human-resources', 'messages', 'financial-system', 'policies'],
  sponsor: ['dashboard', 'orphans', 'messages', 'policies'],
};

const mobilePrimaryNavOrder: Record<AppRole, AppNavItemId[]> = {
  team_member: ['dashboard', 'orphans', 'messages', 'financial-system'],
  sponsor: ['dashboard', 'orphans', 'payments', 'messages', 'policies'],
};

const mobileMoreNavOrder: Record<AppRole, AppNavItemId[]> = {
  team_member: ['sponsors', 'human-resources', 'policies'],
  sponsor: [],
};

const resolveRole = (role?: AppRole | null): AppRole => (role === 'sponsor' ? 'sponsor' : 'team_member');

const mapNavigationItems = (itemIds: AppNavItemId[]) => itemIds.map((itemId) => navItemsById[itemId]);

export const getSidebarNavItems = (role?: AppRole | null) => mapNavigationItems(sidebarNavOrder[resolveRole(role)]);

export const getMobilePrimaryNavItems = (role?: AppRole | null) =>
  mapNavigationItems(mobilePrimaryNavOrder[resolveRole(role)]);

export const getMobileMoreNavItems = (role?: AppRole | null) =>
  mapNavigationItems(mobileMoreNavOrder[resolveRole(role)]);

export const isNavigationItemActive = (pathname: string, item: AppNavItemConfig) =>
  item.matchPaths.some((matchPath) => (matchPath === '/' ? pathname === '/' : pathname.startsWith(matchPath)));

const MESSAGE_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set(['message_received']);
const FINANCIAL_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  'financial_transaction_pending_approval',
  'financial_transaction_approved',
  'financial_transaction_rejected',
]);

export const useNavigationCounts = () => {
  const { notifications } = useNotifications();

  return useMemo(() => {
    let messages = 0;
    let financial = 0;

    notifications.forEach((notification) => {
      if (notification.readAt) {
        return;
      }

      if (MESSAGE_NOTIFICATION_TYPES.has(notification.type)) {
        messages += 1;
        return;
      }

      if (FINANCIAL_NOTIFICATION_TYPES.has(notification.type)) {
        financial += 1;
      }
    });

    return { messages, financial };
  }, [notifications]);
};
