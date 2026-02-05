import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRedirectProps {
  to: string;
  children: React.ReactNode;
}

/**
 * Wrapper that redirects unauthenticated users to /auth
 * while preserving the intended destination for post-login redirect.
 */
export function AuthRedirect({ to, children }: AuthRedirectProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While loading, render nothing to prevent flash
  if (loading) {
    return null;
  }

  // If not authenticated, redirect to auth with intended destination
  if (!user) {
    return <Navigate to="/auth" state={{ from: to }} replace />;
  }

  return <>{children}</>;
}
