import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from './api';
import { fetchUserInfo } from './api';

interface AuthContextType {
  token: string | undefined;
  user: User | undefined;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  clearToken: () => void;
  validToken: string;
  validUser: User;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | undefined>(() => {
    return localStorage?.getItem('auth_token') ?? undefined;
  });
  const [user, setUser] = useState<User | undefined>(undefined);

  const clearTokenFn = useCallback(() => {
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
            clearTokenFn();
          } else {
            setUser(undefined);
          }
        });
    }
  }, [token, user, clearTokenFn]);

  const setToken = useCallback((newToken: string) => {
    localStorage?.setItem('auth_token', newToken);
    setTokenState(newToken);
    setUser(undefined);
  }, []);

  const value: AuthContextType = {
    get token() {
      return token;
    },
    get user() {
      return user;
    },
    get isAuthenticated() {
      return !!token;
    },
    setToken,
    clearToken: clearTokenFn,
    get validToken() {
      if (!token) {
        throw new Error('Not authenticated');
      }
      return token;
    },
    get validUser() {
      if (!user) {
        throw new Error('Not authenticated');
      }
      return user;
    },
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
