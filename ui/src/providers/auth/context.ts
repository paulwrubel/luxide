import { createContext } from 'react';
import type { User } from '@/utils/api';

export type AuthContextType = {
  token: string | undefined;
  user: User | undefined;
  isAuthenticated: boolean;
  mustGetToken: () => string;
  setToken: (token: string) => void;
  clearToken: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);
