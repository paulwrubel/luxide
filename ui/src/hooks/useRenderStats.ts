import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { getRenderStats } from '../utils/api';
import type { RenderStats } from '../utils/api';
import { useAuth } from '../providers/auth';

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

  useEffect(() => {
    if (!streaming) {
      return;
    }

    const url = `${window.location.origin}/api/v1/renders/${renderID}/stats/stream?interval_ms=500`;

    const es = new EventSource(url, {
      fetch: (input, init) => {
        return fetch(input, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });

    es.addEventListener('update', (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStats-shaped data
      const stats = JSON.parse(event.data) as RenderStats;
      queryClient.setQueryData<RenderStats>(['renderStats', renderID, token], stats);
    });

    es.addEventListener('error', () => {
      // the library handles reconnection; just log for debugging
      console.warn(`SSE stats connection error for render ${renderID}`);
    });

    return () => {
      es.close();
    };
  }, [streaming, renderID, token, queryClient]);

  return queryResult;
}
