import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';
import {
  postRender,
  pauseRender,
  resumeRender,
  deleteRender,
  updateRenderTotalCheckpoints,
  updateRenderName,
} from '../utils/api';
import { useAuth } from '../providers/Auth';
import type { NormalizedRenderConfig } from '../utils/render/config';
import { rendersQueryKey } from './useRenders';
import { renderQueryKey } from './useRender';

export function useCreateRenderMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: NormalizedRenderConfig) =>
      postRender(authenticatedFetch, config, targetUserID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rendersQueryKey(targetUserID) });
    },
  });
}

export function usePauseRenderMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderID: number) => pauseRender(authenticatedFetch, renderID, targetUserID),
    onSuccess: (_data, renderID) => {
      queryClient.invalidateQueries({ queryKey: rendersQueryKey(targetUserID) });
      queryClient.invalidateQueries({ queryKey: renderQueryKey(renderID, targetUserID) });
    },
  });
}

export function useResumeRenderMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderID: number) => resumeRender(authenticatedFetch, renderID, targetUserID),
    onSuccess: (_data, renderID) => {
      queryClient.invalidateQueries({ queryKey: rendersQueryKey(targetUserID) });
      queryClient.invalidateQueries({ queryKey: renderQueryKey(renderID, targetUserID) });
    },
  });
}

export function useDeleteRenderMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderID: number) => deleteRender(authenticatedFetch, renderID, targetUserID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rendersQueryKey(targetUserID) });
    },
  });
}

export function useUpdateRenderTotalCheckpointsMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      renderID,
      newTotalCheckpoints,
    }: {
      renderID: number;
      newTotalCheckpoints: number;
    }) =>
      updateRenderTotalCheckpoints(authenticatedFetch, renderID, newTotalCheckpoints, targetUserID),
    onSuccess: (_data, { renderID }) => {
      queryClient.invalidateQueries({ queryKey: rendersQueryKey(targetUserID) });
      queryClient.invalidateQueries({ queryKey: renderQueryKey(renderID, targetUserID) });
    },
  });
}

export function useUpdateRenderNameMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ renderID, newName }: { renderID: number; newName: string }) =>
      updateRenderName(authenticatedFetch, renderID, newName, targetUserID),
    onSuccess: (_data, { renderID }) => {
      queryClient.invalidateQueries({ queryKey: rendersQueryKey(targetUserID) });
      queryClient.invalidateQueries({ queryKey: renderQueryKey(renderID, targetUserID) });
    },
  });
}
