import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { useAuth } from '../providers/auth';

export type UseRenderStatsStreamOptions = {
  renderID: number;
};

export function useRenderStatsStream(options: UseRenderStatsStreamOptions) {
  const { renderID } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  useEffect(() => {
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
      const stats = JSON.parse(event.data);
      queryClient.setQueryData(['renderStats', renderID, token], stats);
    });

    es.addEventListener('error', () => {
      // the library handles reconnection; just log for debugging
      console.warn(`SSE stats connection error for render ${renderID}`);
    });

    return () => {
      es.close();
    };
  }, [renderID, token, queryClient]);
}
