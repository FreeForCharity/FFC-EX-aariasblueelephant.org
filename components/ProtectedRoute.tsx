import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const [isGracePeriod, setIsGracePeriod] = React.useState(true);

  React.useEffect(() => {
    // Disable grace period after 5 seconds to ensure eventual redirection if really unauthenticated
    const timer = setTimeout(() => setIsGracePeriod(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Stay in loading state if AuthContext is searching, or if we are in the grace window waiting for cookies
  if (isLoading || (isGracePeriod && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-dark">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-cyan border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/permission-denied" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;