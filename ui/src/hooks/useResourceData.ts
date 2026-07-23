import { useQuery } from '@tanstack/react-query';
import { getResourceData } from '../utils/api';
import { useAuth } from '../providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export type UseResourceDataOptions = {
  enabled?: boolean;
  maxDim?: number;
};

export function useResourceDataQuery(resourceId: number, options: UseResourceDataOptions = {}) {
  const { enabled = true, maxDim } = options;

  const { authenticatedFetch, accessToken } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  return useQuery({
    queryKey: resourceDataQueryKey(resourceId, maxDim, targetUserID),
    queryFn: () => getResourceData(authenticatedFetch, resourceId, targetUserID, maxDim),
    enabled: enabled && accessToken !== undefined,
    staleTime: Infinity,
  });
}

export function resourceDataQueryKey(resourceId: number, maxDim?: number, targetUserID?: number) {
  return ['resourceData', resourceId, maxDim ?? 'full', targetUserID] as const;
}
