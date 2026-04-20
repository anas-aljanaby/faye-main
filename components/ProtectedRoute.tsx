import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import OrganizationAccessState from './organization/OrganizationAccessState';
import ResponsiveState from './ResponsiveState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, userProfile } = useAuth();
  const { organization } = useOrganization();

  if (loading) {
    return (
      <ResponsiveState
        variant="loading"
        fullScreen
        title="جاري تجهيز حسابك"
        description="نراجع الجلسة الحالية ونجهز لك الواجهة المناسبة."
      />
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (userProfile && userProfile.organization_id !== organization.id) {
    return <OrganizationAccessState userOrganizationId={userProfile.organization_id} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
