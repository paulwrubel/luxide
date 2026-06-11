import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '../utils/api';
import { useAuth } from '../providers/auth';

export type UseAllUsersOptions = {
  enabled?: boolean;
};

export function useAllUsers(options: UseAllUsersOptions = {}) {
  const { enabled = true } = options;

  const { token } = useAuth();

  return useQuery({
    queryKey: ['allUsers', token],
    queryFn: () => getAllUsers(token!),
    enabled: enabled && token !== undefined,
  });
}
