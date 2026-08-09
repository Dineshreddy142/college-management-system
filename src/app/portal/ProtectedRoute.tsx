import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginPath = allowedRole ? `/${allowedRole.toLowerCase().replace(' ', '-')}/login` : '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRole && user?.role) {
    const userRoleNorm = user.role.toLowerCase().replace(/[^a-z0-9]/g, '');
    const allowedRoleNorm = allowedRole.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (userRoleNorm !== allowedRoleNorm && !userRoleNorm.includes(allowedRoleNorm) && !allowedRoleNorm.includes(userRoleNorm)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};
