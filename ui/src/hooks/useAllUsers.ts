import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '../utils/api';
import { useAuth } from '../providers/Auth';

export type UseAllUsersOptions = {
  enabled?: boolean;
};

export function useAllUsersQuery(options: UseAllUsersOptions = {}) {
  const { enabled = true } = options;

  const { accessToken, authenticatedFetch } = useAuth();

  return useQuery({
    queryKey: allUsersQueryKey(),
    queryFn: () => getAllUsers(authenticatedFetch),
    enabled: enabled && accessToken !== undefined,
  });
}

export function allUsersQueryKey() {
  return ['allUsers'] as const;
}
