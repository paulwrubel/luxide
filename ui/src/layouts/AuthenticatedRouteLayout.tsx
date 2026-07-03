import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLoaderData } from 'react-router-dom';
import { useAuth } from '../providers/Auth';
import { Spinner } from 'flowbite-react';
import type { AuthSession } from './authLoader';

export function AuthenticatedRouteLayout() {
  // the authLoader returns { accessToken } on success
  const { accessToken: loadedToken } = useLoaderData<AuthSession>();
  const { accessToken, setAccessToken } = useAuth();

  const [didBootstrap, setDidBootstrap] = useState(false);

  // bootstrap: pass the loader's access token into AuthProvider
  // runs once intentionally — accessToken is undefined on entry
  useEffect(() => {
    if (!accessToken) {
      setAccessToken(loadedToken);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDidBootstrap(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // show a spinner until the token is bootstrapped into context
  // prevents the guard from redirecting before the effect fires
  if (!didBootstrap) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  // ongoing guard: redirect if token is cleared (logout, failed refresh)
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
