import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { getRender } from '../utils/api';
import type { Render, RenderState, RenderStateSnapshot } from '../utils/api';
import { useAuth } from '../providers/auth';

function stateKey(state: RenderState): string {
  if (typeof state === 'string') {
    return state;
  }
  return Object.keys(state)[0];
}

export type UseRenderOptions = {
  renderID: number;
  streaming?: boolean;
};

export function useRender(options: UseRenderOptions) {
  const { renderID, streaming } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['render', renderID, token],
    queryFn: () => getRender(token, renderID),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!streaming) {
      return;
    }

    const url = `${window.location.origin}/api/v1/renders/${renderID}/state/stream?interval_ms=50`;

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
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const snapshot = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render>(['render', renderID, token], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          state: snapshot.state,
          updated_at: snapshot.updated_at,
        };
      });
      // only fetch a new checkpoint image when a checkpoint was actually saved
      const newKey = stateKey(snapshot.state);
      if (newKey === 'finished_checkpoint_iteration' || newKey === 'paused') {
        queryClient.invalidateQueries({ queryKey: ['checkpointImage', renderID, token] });
      }
    });

    es.addEventListener('error', () => {
      // the library handles reconnection; just log for debugging
      console.warn(`SSE connection error for render ${renderID}`);
    });

    return () => {
      es.close();
    };
  }, [streaming, renderID, token, queryClient]);

  return queryResult;
}
