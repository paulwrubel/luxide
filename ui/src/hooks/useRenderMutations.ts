import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  postRender,
  pauseRender,
  resumeRender,
  deleteRender,
  updateRenderTotalCheckpoints,
  updateRenderName,
} from '../utils/api';
import { useAuth } from '../providers/auth';
import type { NormalizedRenderConfig } from '../utils/render/config';

export function useCreateRender() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: NormalizedRenderConfig) => postRender(token, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function usePauseRender() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => pauseRender(token, renderId),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useResumeRender() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => resumeRender(token, renderId),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useDeleteRender() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => deleteRender(token, renderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function useUpdateRenderTotalCheckpoints() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      renderId,
      newTotalCheckpoints,
    }: {
      renderId: number;
      newTotalCheckpoints: number;
    }) => updateRenderTotalCheckpoints(token, renderId, newTotalCheckpoints),
    onSuccess: (_data, { renderId }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useUpdateRenderName() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ renderId, newName }: { renderId: number; newName: string }) =>
      updateRenderName(token, renderId, newName),
    onSuccess: (_data, { renderId }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}
