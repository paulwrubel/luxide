import { useQuery } from '@tanstack/react-query';
import { getLatestCheckpointImage } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useLatestCheckpointImage(renderId: number) {
  const { validToken } = useAuth();

  return useQuery({
    queryKey: ['checkpointImage', renderId, validToken],
    queryFn: async () => {
      const blob = await getLatestCheckpointImage(validToken, renderId);
      return URL.createObjectURL(blob);
    },
    refetchInterval: 1000,
  });
}
