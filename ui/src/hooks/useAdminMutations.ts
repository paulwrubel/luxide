import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserRole } from '../utils/api';
import { useAuth } from '../providers/auth';
import type { Role } from '../utils/api';

export function useUpdateUserRole() {
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
