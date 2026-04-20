import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveState from './ResponsiveState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
};

export default ProtectedRoute;
