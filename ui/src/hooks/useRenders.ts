import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { getAllRenders } from '../utils/api';
import type { Render, RenderState, RenderStateSnapshot } from '../utils/api';
import { useAuth } from '../providers/auth';

function stateKey(state: RenderState): string {
  if (typeof state === 'string') {
    return state;
  }
  return Object.keys(state)[0];
}

export type UseRendersOptions = {
  streaming?: boolean;
};

export function useRenders(options: UseRendersOptions = {}) {
  const { streaming } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['renders', token],
    queryFn: () => getAllRenders(token),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!streaming) {
      return;
    }

    const url = `${window.location.origin}/api/v1/renders/state/stream?interval_ms=100`;

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
      queryClient.setQueryData<Render[]>(['renders', token], (old) => {
        if (!old) {
          return old;
        }
        return old.map((r) =>
          r.id === snapshot.render_id
            ? { ...r, state: snapshot.state, updated_at: snapshot.updated_at }
            : r,
        );
      });
      // only fetch a new checkpoint image when a checkpoint was actually saved
      const newKey = stateKey(snapshot.state);
      if (newKey === 'finished_checkpoint_iteration' || newKey === 'paused') {
        queryClient.invalidateQueries({ queryKey: ['checkpointImage', snapshot.render_id, token] });
      }
    });

    es.addEventListener('removed', (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const { render_id } = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render[]>(['renders', token], (old) => {
        if (!old) {
          return old;
        }
        return old.filter((r) => r.id !== render_id);
      });
    });

    es.addEventListener('error', () => {
      console.warn('SSE renders stream connection error');
    });

    return () => {
      es.close();
    };
  }, [streaming, token, queryClient]);

  return queryResult;
}
