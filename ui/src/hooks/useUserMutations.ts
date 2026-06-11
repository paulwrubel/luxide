import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserRole, updateUserQuotas } from '../utils/api';
import { useAuth } from '../providers/auth';
import type { Role } from '../utils/api';

export function useUpdateUserRoleMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userID, role }: { userID: number; role: Role }) =>
      updateUserRole(token, userID, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

export function useUpdateUserQuotasMutation() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

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
    }) => updateUserQuotas(token, userID, maxRenders, maxCheckpointsPerRender, maxRenderPixelCount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}
