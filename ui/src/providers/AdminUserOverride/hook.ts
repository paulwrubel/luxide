import { useContext } from 'react';
import { AdminUserOverrideContext } from './context';
import type { AdminUserOverrideContextType } from './context';

export function useAdminUserOverride(): AdminUserOverrideContextType {
  const context = useContext(AdminUserOverrideContext);
  if (context === null) {
    throw new Error('useAdminUserOverride must be used within AdminUserOverrideProvider');
  }
  return context;
}
