import { useEffect } from 'react';
import { Outlet, Navigate, useLoaderData } from 'react-router-dom';
import { useAuth } from '../providers/Auth';
import type { AuthSession } from './authLoader';

export function AuthenticatedRouteLayout() {
  // the authLoader returns { accessToken } on success
  const { accessToken: loadedAccessToken } = useLoaderData<AuthSession>();
  const { accessToken, setAccessToken } = useAuth();

  // bootstrap: pass the loader's access token into AuthProvider
  // runs once intentionally — accessToken is undefined on entry
  useEffect(() => {
    if (!accessToken) {
      setAccessToken(loadedAccessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ongoing guard: redirect if token is cleared (logout, failed refresh)
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
