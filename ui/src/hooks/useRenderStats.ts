import { useQuery } from '@tanstack/react-query';
import { getRenderStats } from '../utils/api';
import { useAuth } from '../providers/auth';

export type UseRenderStatsOptions = {
  renderID: number;
};

export function useRenderStats(options: UseRenderStatsOptions) {
  const { renderID } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: ['renderStats', renderID, token],
    queryFn: () => getRenderStats(token, renderID),
    staleTime: Infinity,
  });
}
