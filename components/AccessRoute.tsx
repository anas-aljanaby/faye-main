import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveState from './ResponsiveState';
import {
  canAccessFinancialSystem,
  canAccessOrphans,
  canAccessSponsorProfiles,
} from '../lib/accessControl';

type RequiredAccess = 'orphans' | 'sponsors' | 'financial';

interface AccessRouteProps {
  access: RequiredAccess;
  children: React.ReactNode;
}

const AccessRoute: React.FC<AccessRouteProps> = ({ access, children }) => {
  const { userProfile, permissions, loading, isSystemAdmin } = useAuth();

  if (loading) {
    return (
      <ResponsiveState
        variant="loading"
        fullScreen
        title="جاري التحقق من الصلاحيات"
        description="نتأكد من مستوى الوصول المناسب لحسابك قبل فتح هذه الصفحة."
      />
    );
  }

  const accessContext = {
    role: userProfile?.role,
    permissions,
    isSystemAdmin: isSystemAdmin(),
  };

  const hasAccess =
    access === 'orphans'
      ? canAccessOrphans(accessContext)
      : access === 'sponsors'
        ? canAccessSponsorProfiles(accessContext)
        : canAccessFinancialSystem(accessContext);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AccessRoute;
