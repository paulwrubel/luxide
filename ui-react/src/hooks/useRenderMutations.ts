import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  postRender,
  pauseRender,
  resumeRender,
  deleteRender,
  updateRenderTotalCheckpoints,
} from '../utils/api';
import { useAuth } from '../providers/auth';
import type { RenderConfig } from '../utils/render/config';

export function useCreateRender() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return useMutation({
    mutationFn: (config: RenderConfig) => postRender(token, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function usePauseRender() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return useMutation({
    mutationFn: (renderId: number) => pauseRender(token, renderId),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useResumeRender() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return useMutation({
    mutationFn: (renderId: number) => resumeRender(token, renderId),
    onSuccess: (_data, renderId) => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
      queryClient.invalidateQueries({ queryKey: ['render', renderId] });
    },
  });
}

export function useDeleteRender() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return useMutation({
    mutationFn: (renderId: number) => deleteRender(token, renderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renders'] });
    },
  });
}

export function useUpdateRenderTotalCheckpoints() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  if (!token) {
    throw new Error('Not authenticated');
  }

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
