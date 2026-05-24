import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

export default function AuthenticatedLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
