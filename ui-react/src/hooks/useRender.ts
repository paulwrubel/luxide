import { useQuery } from '@tanstack/react-query';
import { getRender } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useRender(renderId: number) {
  const { validToken } = useAuth();

  return useQuery({
    queryKey: ['render', renderId, validToken],
    queryFn: () => getRender(validToken, renderId),
    refetchInterval: 1000,
  });
}
