import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRenderStats } from '@/utils/api';
import type { RenderStats } from '@/utils/api';
import { useAuth } from '@/providers/Auth';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';
import { useEventSource } from '@/hooks/useEventSource';

export type UseRenderStatsOptions = {
  renderID: number;
  streaming?: boolean;
};

export function useRenderStatsQuery(options: UseRenderStatsOptions) {
  const { renderID, streaming } = options;

  const { mustGetAccessToken, authenticatedFetch } = useAuth();
  const accessToken = mustGetAccessToken();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => renderStatsQueryKey(renderID, accessToken, targetUserID),
    [renderID, accessToken, targetUserID],
  );

  const queryResult = useQuery({
    queryKey,
    queryFn: () => getRenderStats(authenticatedFetch, renderID, targetUserID),
    staleTime: Infinity,
  });

  const handleUpdate = useCallback(
    (event: MessageEvent) => {
      // JSON.parse returns any; the SSE endpoint always sends RenderStats-shaped data
      const stats = JSON.parse(event.data) as RenderStats;
      queryClient.setQueryData<RenderStats>(queryKey, stats);
    },
    [queryClient, queryKey],
  );

  const handleError = useCallback(() => {
    console.warn(`SSE stats connection error for render ${renderID}`);
  }, [renderID]);

  useEventSource({
    enabled: streaming ?? false,
    path: `/renders/${renderID}/stats/stream`,
    accessToken,
    targetUserID,
    intervalMillis: 500,
    onUpdateEvent: handleUpdate,
    onErrorEvent: handleError,
  });

  return queryResult;
}

export function renderStatsQueryKey(
  renderID: number,
  token: string,
  targetUserID: number | undefined,
) {
  return ['renderStats', renderID, token, targetUserID] as const;
}
