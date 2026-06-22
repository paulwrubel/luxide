import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/providers/Auth';

export function AdminRouteLayout() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // wait for user info to finish loading before checking role
  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/renders" replace />;
  }

  return <Outlet />;
}
