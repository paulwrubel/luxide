import { useEffect } from 'react';
import { Outlet, Navigate, useLoaderData } from 'react-router-dom';
import { useAuth } from '../providers/Auth';

export function AuthenticatedRouteLayout() {
  // the authLoader always returns { access_token } on success
  const { access_token } = useLoaderData() as { access_token: string };
  const { accessToken, setAccessToken } = useAuth();

  // bootstrap: pass the loader's access token into AuthProvider
  // runs once intentionally — accessToken is undefined on entry
  useEffect(() => {
    if (!accessToken) {
      setAccessToken(access_token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ongoing guard: redirect if token is cleared (logout, failed refresh)
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
