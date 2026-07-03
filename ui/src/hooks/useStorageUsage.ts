import { useQuery } from '@tanstack/react-query';
import { getStorageUsage } from '../utils/api';
import { useAuth } from '../providers/Auth';

export function useStorageUsageQuery() {
  const { authenticatedFetch } = useAuth();

  return useQuery({
    queryKey: storageUsageQueryKey(),
    queryFn: () => getStorageUsage(authenticatedFetch),
  });
}

export function storageUsageQueryKey() {
  return ['storageUsage'] as const;
}
