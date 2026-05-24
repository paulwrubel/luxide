import { useQuery } from '@tanstack/react-query';
import { getAllRenders } from '../utils/api';
import { useAuth } from '../utils/auth';

export function useRenders() {
  const { validToken } = useAuth();

  return useQuery({
    queryKey: ['renders', validToken],
    queryFn: () => getAllRenders(validToken),
    refetchInterval: 1000,
  });
}
