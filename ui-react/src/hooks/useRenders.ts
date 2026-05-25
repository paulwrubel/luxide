import { useQuery } from '@tanstack/react-query';
import { getAllRenders } from '../utils/api';
import { useAuth } from '../providers/auth';

export function useRenders() {
  const { token } = useAuth();

  if (!token) {
    throw new Error('Not authenticated');
  }

  return useQuery({
    queryKey: ['renders', token],
    queryFn: () => getAllRenders(token),
    refetchInterval: 1000,
  });
}
