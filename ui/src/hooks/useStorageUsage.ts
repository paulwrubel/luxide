import { useQuery } from '@tanstack/react-query';
import { getStorageUsage } from '../utils/api';
import { useAuth } from '../providers/auth';

export function useStorageUsage() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: storageUsageKey(token),
    queryFn: () => getStorageUsage(token),
  });
}

export function storageUsageKey(token: string) {
  return ['storageUsage', token] as const;
}
