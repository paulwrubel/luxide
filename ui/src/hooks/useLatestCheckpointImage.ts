import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLatestCheckpointImage } from '../utils/api';
import { useAuth } from '../providers/auth';

export type UseLatestCheckpointImageOptions = {
  renderID: number;
};

export function useLatestCheckpointImage(options: UseLatestCheckpointImageOptions) {
  const { renderID } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const query = useQuery({
    queryKey: ['checkpointImage', renderID, token],
    queryFn: async () => {
      const blob = await getLatestCheckpointImage(token, renderID);
      return URL.createObjectURL(blob);
    },
    refetchInterval: 1000,
  });

  // revoke the previous blob URL when query.data changes or on unmount
  useEffect(() => {
    return () => {
      if (query.data) {
        URL.revokeObjectURL(query.data);
      }
    };
  }, [query.data]);

  return query;
}
