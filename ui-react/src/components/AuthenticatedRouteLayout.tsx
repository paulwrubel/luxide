import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

export function AuthenticatedRouteLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
