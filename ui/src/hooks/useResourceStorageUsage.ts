import { useQuery } from '@tanstack/react-query';
import { getResourceStorageUsage } from '../utils/api';
import { useAuth } from '../providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export function useResourceStorageUsageQuery() {
  const { authenticatedFetch, accessToken } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  return useQuery({
    queryKey: resourceStorageUsageQueryKey(targetUserID),
    queryFn: () => getResourceStorageUsage(authenticatedFetch, targetUserID),
    enabled: accessToken !== undefined,
  });
}

export function resourceStorageUsageQueryKey(targetUserID?: number) {
  return ['resourceStorageUsage', targetUserID] as const;
}
