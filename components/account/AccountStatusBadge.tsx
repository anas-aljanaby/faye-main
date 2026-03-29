import React from 'react';
import type { AccountStatusKey } from '../../lib/adminAccountApi';

const LABELS: Record<AccountStatusKey, string> = {
  no_login: 'لا يوجد حساب دخول',
  pending_first_login: 'بانتظار تسجيل الدخول الأول',
  active: 'حساب فعّال',
};

const STYLES: Record<AccountStatusKey, string> = {
  no_login: 'bg-gray-100 text-gray-700 border-gray-200',
  pending_first_login: 'bg-amber-100 text-amber-800 border-amber-300',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export const AccountStatusBadge: React.FC<{
  status: AccountStatusKey | undefined;
  loading?: boolean;
  className?: string;
}> = ({ status, loading, className = '' }) => {
  if (loading) {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border border-gray-200 bg-gray-50 text-gray-500 animate-pulse ${className}`}
      >
        جاري التحميل…
      </span>
    );
  }
  if (!status) {
    return null;
  }
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${STYLES[status]} ${className}`}
    >
      {LABELS[status]}
    </span>
  );
};
