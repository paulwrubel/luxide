import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext } from './context';
import type { AuthContextType } from './context';
import { fetchUserInfo, getAPIURL } from '@/utils/api';
import type { User } from '@/utils/api';
import { bootstrapAuth } from '@/layouts/authLoader';

export type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider(props: AuthProviderProps) {
  const { children } = props;

  const [accessToken, setAccessTokenState] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const clearAccessToken = useCallback(() => {
    setAccessTokenState(undefined);
    setUser(undefined);
  }, []);

  const mustGetAccessToken = useCallback(() => {
    if (!accessToken) {
      throw new Error('Access token is required but not available');
    }
    return accessToken;
  }, [accessToken]);

  const setAccessToken = useCallback((newToken: string) => {
    setAccessTokenState(newToken);
    setUser(undefined);
  }, []);

  // attempt session recovery from the refresh cookie on mount
  // this runs on every page, not just authenticated routes, so the
  // navbar avatar appears correctly even on the home page
  useEffect(() => {
    bootstrapAuth().then((session) => {
      if (session) {
        setAccessTokenState(session.accessToken);
      }
      setIsAuthLoading(false);
    });
  }, []);

  // authenticatedFetch: wraps fetch with Authorization header and 401 -> refresh -> retry
  const apiURL = getAPIURL();
  const authenticatedFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      const response = await fetch(input, { ...init, headers, credentials: 'include' });

      if (response.status !== 401) {
        return response;
      }

      // deduplicate concurrent refresh attempts
      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = fetch(`${apiURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
          // the /auth/refresh response shape is known: { access_token: string }
          .then((res) => (res.ok ? (res.json() as Promise<{ access_token: string }>) : null))
          .then((data) => (data ? data.access_token : null))
          .catch(() => null)
          .finally(() => {
            refreshPromiseRef.current = null;
          });
      }

      const newToken = await refreshPromiseRef.current;

      if (newToken) {
        setAccessTokenState(newToken);
        const retryHeaders = new Headers(init?.headers);
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' });
      }

      // refresh failed — logout
      clearAccessToken();
      return response;
    },
    // clearAccessToken is stable, apiURL is constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken],
  );

  // fetch user info whenever we have a token but no user
  useEffect(() => {
    if (accessToken && !user) {
      fetchUserInfo(authenticatedFetch)
        .then(setUser)
        .catch((e: unknown) => {
          if (e instanceof Error && e.message === 'Unauthorized') {
            clearAccessToken();
          } else {
            setUser(undefined);
          }
        });
    }
    // authenticatedFetch and clearAccessToken are stable (useCallback with [] deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user]);

  const value: AuthContextType = {
    accessToken,
    user,
    isAuthenticated: !!accessToken,
    isAuthLoading,
    authenticatedFetch,
    mustGetAccessToken,
    setAccessToken,
    clearAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
