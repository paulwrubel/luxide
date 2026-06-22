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
    mutationFn: (renderId: number) => pauseRender(token, renderId, targetUserID),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useResumeRenderMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => resumeRender(token, renderId, targetUserID),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useDeleteRenderMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => deleteRender(token, renderId, targetUserID),
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
      renderId,
      newTotalCheckpoints,
    }: {
      renderId: number;
      newTotalCheckpoints: number;
    }) => updateRenderTotalCheckpoints(token, renderId, newTotalCheckpoints, targetUserID),
    onSuccess: (_data, { renderId }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useUpdateRenderNameMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ renderId, newName }: { renderId: number; newName: string }) =>
      updateRenderName(token, renderId, newName, targetUserID),
    onSuccess: (_data, { renderId }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}
