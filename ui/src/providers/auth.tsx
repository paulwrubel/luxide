import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../utils/api';
import { fetchUserInfo } from '../utils/api';

interface AuthContextType {
  token: string | undefined;
  user: User | undefined;
  isAuthenticated: boolean;
  mustGetToken: () => string;
  setToken: (token: string) => void;
  clearToken: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | undefined>(() => {
    return localStorage?.getItem('auth_token') ?? undefined;
  });
  const [user, setUser] = useState<User | undefined>(undefined);

  const clearToken = useCallback(() => {
    localStorage?.removeItem('auth_token');
    setTokenState(undefined);
    setUser(undefined);
  }, []);

  useEffect(() => {
    if (token && !user) {
      fetchUserInfo(token)
        .then((fetchedUser) => {
          setUser(fetchedUser);
        })
        .catch((e: unknown) => {
          if (e instanceof Error && e.message === 'Unauthorized') {
            clearToken();
          } else {
            setUser(undefined);
          }
        });
    }
  }, [token, user, clearToken]);

  const setToken = useCallback((newToken: string) => {
    localStorage?.setItem('auth_token', newToken);
    setTokenState(newToken);
    setUser(undefined);
  }, []);

  const mustGetToken = useCallback(() => {
    if (!token) {
      throw new Error('Authentication token is required but not available');
    }
    return token;
  }, [token]);

  const value: AuthContextType = {
    token,
    user,
    isAuthenticated: !!token,
    mustGetToken,
    setToken,
    clearToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
