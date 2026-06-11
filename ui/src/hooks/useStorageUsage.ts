import { useQuery } from '@tanstack/react-query';
import { getStorageUsage } from '../utils/api';
import { useAuth } from '../providers/auth';

export function useStorageUsageQuery() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: storageUsageQueryKey(token),
    queryFn: () => getStorageUsage(token),
  });
}

export function storageUsageQueryKey(token: string) {
  return ['storageUsage', token] as const;
}
