import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRenderStats } from '../utils/api';
import type { RenderStats } from '../utils/api';
import { useAuth } from '../providers/auth';
import { useEventSource } from './useEventSource';

export type UseRenderStatsOptions = {
  renderID: number;
  streaming?: boolean;
};

export function useRenderStats(options: UseRenderStatsOptions) {
  const { renderID, streaming } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['renderStats', renderID, token],
    queryFn: () => getRenderStats(token, renderID),
    staleTime: Infinity,
  });

  const handleUpdate = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStats-shaped data
      const stats = JSON.parse(event.data) as RenderStats;
      queryClient.setQueryData<RenderStats>(['renderStats', renderID, token], stats);
    },
    [renderID, token, queryClient],
  );

  const handleError = useCallback(() => {
    console.warn(`SSE stats connection error for render ${renderID}`);
  }, [renderID]);

  useEventSource({
    enabled: streaming ?? false,
    path: `/renders/${renderID}/stats/stream`,
    token,
    intervalMillis: 500,
    onUpdateEvent: handleUpdate,
    onErrorEvent: handleError,
  });

  return queryResult;
}
