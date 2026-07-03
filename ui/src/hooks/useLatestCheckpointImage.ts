import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLatestCheckpointImage } from '../utils/api';
import { useAuth } from '../providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export type UseLatestCheckpointImageOptions = {
  renderID: number;
  enabled?: boolean;
};

export function useLatestCheckpointImageQuery(options: UseLatestCheckpointImageOptions) {
  const { renderID, enabled } = options;

  const { authenticatedFetch } = useAuth();

  const { targetUserID } = useAdminUserOverride();

  const { data: checkpointData, ...queryRest } = useQuery({
    queryKey: checkpointImageQueryKey(renderID, targetUserID),
    queryFn: async () => {
      const blob = await getLatestCheckpointImage(authenticatedFetch, renderID, targetUserID);
      if (blob === null) {
        return null;
      }
      return URL.createObjectURL(blob);
    },
    staleTime: 60 * 1000,
    enabled: enabled ?? true,
  });

  // revoke the previous blob URL when checkpointData changes or on unmount
  useEffect(() => {
    return () => {
      if (checkpointData) {
        URL.revokeObjectURL(checkpointData);
      }
    };
  }, [checkpointData]);

  return { data: checkpointData, ...queryRest };
}

export function checkpointImageQueryKey(renderID: number, targetUserID: number | undefined) {
  return ['checkpointImage', renderID, targetUserID] as const;
}
