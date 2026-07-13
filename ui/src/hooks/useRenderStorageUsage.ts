import { useQuery } from '@tanstack/react-query';
import { getRenderStorageUsage } from '../utils/api';
import { useAuth } from '../providers/Auth';

export function useRenderStorageUsageQuery() {
  const { authenticatedFetch } = useAuth();

  return useQuery({
    queryKey: renderStorageUsageQueryKey(),
    queryFn: () => getRenderStorageUsage(authenticatedFetch),
  });
}

export function renderStorageUsageQueryKey() {
  return ['renderStorageUsage'] as const;
}
