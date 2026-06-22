import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/Auth';

/**
 * layout component guarding authenticated routes.
 * checks auth state and conditionally returns <Navigate to="/login" replace />
 * if unauthenticated, or <Outlet /> if authenticated (i.e., renders child routes).
 *
 * @returns `<Navigate to="/login" replace />` if the user is unauthenticated, or `<Outlet />` if authenticated
 */
export function AuthenticatedRouteLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
