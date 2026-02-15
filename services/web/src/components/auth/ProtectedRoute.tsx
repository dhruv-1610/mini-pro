import { Navigate, useLocation } from 'react-router-dom';
import { useIsAuthenticated } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Wraps routes that require authentication.
 * Redirects to /login with return URL when not authenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
