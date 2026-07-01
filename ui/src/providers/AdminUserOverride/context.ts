import { createContext } from 'react';

export type AdminUserOverrideContextType = {
  targetUserID?: number;
  setTargetUserID: (userID: number) => void;
  clearTargetUserID: () => void;
};

export const AdminUserOverrideContext = createContext<AdminUserOverrideContextType | null>(null);
