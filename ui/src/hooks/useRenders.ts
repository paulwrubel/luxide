import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEventSource } from '@/hooks/useEventSource';
import { getAllRenders } from '@/utils/api';
import { stateKey } from '@/utils/api';
import type { Render, RenderStateSnapshot } from '@/utils/api';
import { useAuth } from '@/providers/auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export type UseRendersOptions = {
  streaming?: boolean;
};

export function useRenders(options: UseRendersOptions = {}) {
  const { streaming } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['renders', token, targetUserID],
    queryFn: () => getAllRenders(token, targetUserID),
    staleTime: Infinity,
  });

  const handleUpdate = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const snapshot = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render[]>(['renders', token, targetUserID], (old) => {
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
        queryClient.invalidateQueries({
          queryKey: ['checkpointImage', snapshot.render_id, token, targetUserID],
        });
      }
    },
    [token, targetUserID, queryClient],
  );

  const handleRemoved = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const { render_id } = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render[]>(['renders', token, targetUserID], (old) => {
        if (!old) {
          return old;
        }
        return old.filter((r) => r.id !== render_id);
      });
    },
    [token, targetUserID, queryClient],
  );

  const handleError = useCallback(() => {
    console.warn('SSE renders stream connection error');
  }, []);

  useEventSource({
    enabled: streaming ?? false,
    path: `/renders/state/stream`,
    token,
    targetUserID,
    intervalMillis: 100,
    onUpdateEvent: handleUpdate,
    onRemovedEvent: handleRemoved,
    onErrorEvent: handleError,
  });

  return queryResult;
}
