import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: string | string[];
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
    let loginPath = '/admin/login';
    if (typeof allowedRole === 'string' && allowedRole.trim()) {
      loginPath = `/${allowedRole.toLowerCase().replace(/\s+/g, '-')}/login`;
    } else if (Array.isArray(allowedRole) && allowedRole.length > 0 && typeof allowedRole[0] === 'string') {
      loginPath = `/${allowedRole[0].toLowerCase().replace(/\s+/g, '-')}/login`;
    }
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Force first-time password reset check
  if (user?.must_change_password && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRole && user?.role) {
    const rolesList = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    const userRoleNorm = user.role.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isMatch = rolesList.some((role) => {
      if (typeof role !== 'string') return false;
      const allowedRoleNorm = role.toLowerCase().replace(/[^a-z0-9]/g, '');

      const isAdmin = userRoleNorm === 'admin' || userRoleNorm.includes('admin');
      const isExact = userRoleNorm === allowedRoleNorm;
      const isSubMatch = userRoleNorm.includes(allowedRoleNorm) || allowedRoleNorm.includes(userRoleNorm);
      const isOfficeMatch = (allowedRoleNorm.includes('office') || allowedRoleNorm.includes('staff')) &&
                            (userRoleNorm.includes('office') || userRoleNorm.includes('staff'));

      const isAdmissionMatch = (allowedRoleNorm.includes('admission') && userRoleNorm.includes('admission'));
      const isPlacementMatch = (allowedRoleNorm.includes('placement') && userRoleNorm.includes('placement'));
      const isCOEMatch = (allowedRoleNorm.includes('coe') || allowedRoleNorm.includes('controller')) &&
                         (userRoleNorm.includes('coe') || userRoleNorm.includes('controller'));
      const isGovernanceMatch = (allowedRoleNorm === 'admin') &&
                                (userRoleNorm.includes('chancellor') || userRoleNorm.includes('registrar'));

      return isAdmin || isExact || isSubMatch || isOfficeMatch || isAdmissionMatch || isPlacementMatch || isCOEMatch || isGovernanceMatch;
    });

    if (!isMatch) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <>{children}</>;
};
