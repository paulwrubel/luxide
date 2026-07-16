import { useQuery } from '@tanstack/react-query';
import { getAllResourceMetadata } from '../utils/api';
import { useAuth } from '../providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export function useAllResourceMetadataQuery() {
  const { authenticatedFetch, accessToken } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  return useQuery({
    queryKey: allResourceMetadataQueryKey(),
    queryFn: () => getAllResourceMetadata(authenticatedFetch, targetUserID),
    enabled: accessToken !== undefined,
  });
}

export function allResourceMetadataQueryKey() {
  return ['allResourceMetadata'] as const;
}
