import { createContext } from 'react';
import type { User } from '@/utils/api';

export type AuthContextType = {
  accessToken: string | undefined;
  user: User | undefined;
  isAuthenticated: boolean;
  authenticatedFetch: typeof fetch;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);
