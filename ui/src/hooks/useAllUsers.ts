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
    queryKey: allUsersKey(token),
    queryFn: () => getAllUsers(token!),
    enabled: enabled && token !== undefined,
  });
}

export function allUsersKey(token: string | undefined) {
  return ['allUsers', token] as const;
}
