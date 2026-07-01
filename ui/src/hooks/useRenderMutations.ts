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

export function useCreateRenderMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: NormalizedRenderConfig) => postRender(token, config, targetUserID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function usePauseRenderMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderID: number) => pauseRender(token, renderID, targetUserID),
    onSuccess: (_data, renderID) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderID] });
    },
  });
}

export function useResumeRenderMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderID: number) => resumeRender(token, renderID, targetUserID),
    onSuccess: (_data, renderID) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderID] });
    },
  });
}

export function useDeleteRenderMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderID: number) => deleteRender(token, renderID, targetUserID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function useUpdateRenderTotalCheckpointsMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      renderID,
      newTotalCheckpoints,
    }: {
      renderID: number;
      newTotalCheckpoints: number;
    }) => updateRenderTotalCheckpoints(token, renderID, newTotalCheckpoints, targetUserID),
    onSuccess: (_data, { renderID }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderID] });
    },
  });
}

export function useUpdateRenderNameMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ renderID, newName }: { renderID: number; newName: string }) =>
      updateRenderName(token, renderID, newName, targetUserID),
    onSuccess: (_data, { renderID }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderID] });
    },
  });
}
