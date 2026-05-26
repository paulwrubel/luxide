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

  return useQuery({
    queryKey: ['checkpointImage', renderID, token],
    queryFn: async () => {
      const blob = await getLatestCheckpointImage(token, renderID);
      return URL.createObjectURL(blob);
    },
    refetchInterval: 1000,
  });
}
