import { useQuery } from '@tanstack/react-query';
import { getUser } from '../utils/api';
import { useAuth } from '../providers/Auth';

export type UseUserOptions = {
  enabled?: boolean;
};

export function useUserQuery(userID: number, options: UseUserOptions = {}) {
  const { enabled = true } = options;

  const { accessToken, authenticatedFetch } = useAuth();

  return useQuery({
    queryKey: userQueryKey(userID),
    queryFn: () => getUser(authenticatedFetch, userID),
    enabled: enabled && accessToken !== undefined,
  });
}

export function userQueryKey(userID: number) {
  return ['user', userID] as const;
}
