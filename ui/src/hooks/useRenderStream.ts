import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { useAuth } from '../providers/auth';

export type UseRenderStreamOptions = {
  renderID: number;
};

export function useRenderStream(options: UseRenderStreamOptions) {
  const { renderID } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  useEffect(() => {
    const url = `${window.location.origin}/api/v1/renders/${renderID}/state/stream`;

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
      const snapshot = JSON.parse(event.data);
      queryClient.setQueryData(['render', renderID, token], (old: unknown) => {
        if (!old || typeof old !== 'object') {
          return old;
        }
        const render = old as Record<string, unknown>;
        return {
          ...render,
          state: snapshot.state,
          updated_at: snapshot.updated_at,
        };
      });
    });

    es.addEventListener('error', () => {
      // the library handles reconnection; just log for debugging
      console.warn(`SSE connection error for render ${renderID}`);
    });

    return () => {
      es.close();
    };
  }, [renderID, token, queryClient]);
}
