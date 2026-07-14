import { useQuery } from '@tanstack/react-query';
import { getResourceData } from '../utils/api';
import { useAuth } from '../providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export type UseResourceDataOptions = {
  enabled?: boolean;
};

export function useResourceDataQuery(resourceId: number, options: UseResourceDataOptions = {}) {
  const { enabled = true } = options;

  const { authenticatedFetch, accessToken } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  return useQuery({
    queryKey: resourceDataQueryKey(resourceId),
    queryFn: () => getResourceData(authenticatedFetch, resourceId, targetUserID),
    enabled: enabled && accessToken !== undefined,
    staleTime: Infinity,
  });
}

export function resourceDataQueryKey(resourceId: number) {
  return ['resourceData', resourceId] as const;
}
