import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  postRender,
  pauseRender,
  resumeRender,
  deleteRender,
  updateRenderTotalCheckpoints,
} from '../utils/api';
import { useAuth } from '../utils/auth';
import type { RenderConfig } from '../utils/render/config';

export function useCreateRender() {
  const { validToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: RenderConfig) => postRender(validToken, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function usePauseRender() {
  const { validToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => pauseRender(validToken, renderId),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useResumeRender() {
  const { validToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => resumeRender(validToken, renderId),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useDeleteRender() {
  const { validToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (renderId: number) => deleteRender(validToken, renderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function useUpdateRenderTotalCheckpoints() {
  const { validToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      renderId,
      newTotalCheckpoints,
    }: {
      renderId: number;
      newTotalCheckpoints: number;
    }) => updateRenderTotalCheckpoints(validToken, renderId, newTotalCheckpoints),
    onSuccess: (_data, { renderId }) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}
