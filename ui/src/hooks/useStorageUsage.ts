import { useQuery } from '@tanstack/react-query';
import { getStorageUsage } from '../utils/api';
import { useAuth } from '../providers/Auth';

export function useStorageUsageQuery() {
  const { mustGetAccessToken, authenticatedFetch } = useAuth();
  const accessToken = mustGetAccessToken();

  return useQuery({
    queryKey: storageUsageQueryKey(accessToken),
    queryFn: () => getStorageUsage(authenticatedFetch),
  });
}

export function storageUsageQueryKey(token: string) {
  return ['storageUsage', token] as const;
}
