import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { useAuth } from '../providers/auth';
import type { Render, RenderStateSnapshot } from '@/utils/api';

export function useRendersStream() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  useEffect(() => {
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
      const snapshot = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData(['renders', token], (old: Render[]) => {
        return old.map((r: Render) =>
          r.id === snapshot.render_id
            ? { ...r, state: snapshot.state, updated_at: snapshot.updated_at }
            : r,
        );
      });
    });

    es.addEventListener('removed', (event: MessageEvent) => {
      const { render_id } = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData(['renders', token], (old: unknown) => {
        if (!Array.isArray(old)) {
          return old;
        }
        return old.filter((r: Render) => r.id !== render_id);
      });
    });

    es.addEventListener('error', () => {
      console.warn('SSE renders stream connection error');
    });

    return () => {
      es.close();
    };
  }, [token, queryClient]);
}
