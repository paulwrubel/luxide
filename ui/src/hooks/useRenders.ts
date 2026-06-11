import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEventSource } from '@/hooks/useEventSource';
import { getAllRenders } from '@/utils/api';
import { stateKey } from '@/utils/api';
import type { Render, RenderStateSnapshot } from '@/utils/api';
import { checkpointImageQueryKey } from './useLatestCheckpointImage';
import { useAuth } from '@/providers/auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export type UseRendersOptions = {
  streaming?: boolean;
};

export function useRendersQuery(options: UseRendersOptions = {}) {
  const { streaming } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => rendersQueryKey(token, targetUserID), [token, targetUserID]);

  const queryResult = useQuery({
    queryKey,
    queryFn: () => getAllRenders(token, targetUserID),
    staleTime: Infinity,
  });

  const handleUpdate = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const {
        render_id: renderID,
        state,
        updated_at: updatedAt,
      } = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render[]>(queryKey, (old) => {
        if (!old) {
          return old;
        }
        return old.map((r) =>
          r.id === renderID ? { ...r, state: state, updated_at: updatedAt } : r,
        );
      });
      // only fetch a new checkpoint image when a checkpoint was actually saved
      const newKey = stateKey(state);
      if (newKey === 'finished_checkpoint_iteration' || newKey === 'paused') {
        queryClient.invalidateQueries({
          queryKey: checkpointImageQueryKey(renderID, token, targetUserID),
        });
      }
    },
    [queryClient, queryKey, targetUserID, token],
  );

  const handleRemoved = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const { render_id } = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render[]>(queryKey, (old) => {
        if (!old) {
          return old;
        }
        return old.filter((r) => r.id !== render_id);
      });
    },
    [queryClient, queryKey],
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

export function rendersQueryKey(token: string, targetUserID: number | undefined) {
  return ['renders', token, targetUserID] as const;
}
