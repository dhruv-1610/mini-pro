import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useIsAdmin } from '../../stores/authStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps routes that require admin role.
 * Redirects to login when not authenticated, or to home when authenticated but not admin.
 */
export function AdminRoute({ children }: AdminRouteProps): React.ReactElement {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
