import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserRole, updateUserQuotas } from '../utils/api';
import { useAuth } from '../providers/Auth';
import type { Role } from '../utils/api';

export function useUpdateUserRoleMutation() {
  const { authenticatedFetch } = useAuth();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userID, role }: { userID: number; role: Role }) =>
      updateUserRole(authenticatedFetch, userID, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useUpdateUserQuotasMutation() {
  const { authenticatedFetch } = useAuth();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userID,
      maxRenders,
      maxCheckpointsPerRender,
      maxRenderPixelCount,
    }: {
      userID: number;
      maxRenders: number | null;
      maxCheckpointsPerRender: number | null;
      maxRenderPixelCount: number | null;
    }) =>
      updateUserQuotas(
        authenticatedFetch,
        userID,
        maxRenders,
        maxCheckpointsPerRender,
        maxRenderPixelCount,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}
