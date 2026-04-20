import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ResponsiveState from './ResponsiveState';

interface TeamMemberRouteProps {
  children: React.ReactNode;
}

const TeamMemberRoute: React.FC<TeamMemberRouteProps> = ({ children }) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <ResponsiveState
        variant="loading"
        fullScreen
        title="جاري تجهيز بيانات الفريق"
        description="نتحقق من صلاحياتك ونحمّل بيانات عضو الفريق بأبعاد مناسبة للجوال."
      />
    );
  }

  // If user is not a team member, redirect to dashboard
  if (userProfile?.role !== 'team_member') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default TeamMemberRoute;
