import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEventSource } from '@/hooks/useEventSource';
import { getRender } from '@/utils/api';
import { stateKey } from '@/utils/api';
import type { Render, RenderStateSnapshot } from '@/utils/api';
import { useAuth } from '@/providers/auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';

export type UseRenderOptions = {
  renderID: number;
  streaming?: boolean;
};

export function useRender(options: UseRenderOptions) {
  const { renderID, streaming } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ['render', renderID, token, targetUserID],
    queryFn: () => getRender(token, renderID, targetUserID),
    staleTime: Infinity,
  });

  const handleUpdate = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStateSnapshot-shaped data
      const snapshot = JSON.parse(event.data) as RenderStateSnapshot;
      queryClient.setQueryData<Render>(['render', renderID, token, targetUserID], (old) => {
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
        queryClient.invalidateQueries({
          queryKey: ['checkpointImage', renderID, token, targetUserID],
        });
      }
    },
    [renderID, token, targetUserID, queryClient],
  );

  const handleError = useCallback(() => {
    console.warn(`SSE connection error for render ${renderID}`);
  }, [renderID]);

  useEventSource({
    enabled: streaming ?? false,
    path: `/renders/${renderID}/state/stream`,
    token,
    targetUserID,
    intervalMillis: 50,
    onUpdateEvent: handleUpdate,
    onErrorEvent: handleError,
  });

  return queryResult;
}
