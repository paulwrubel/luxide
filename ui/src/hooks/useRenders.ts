import { useQuery } from '@tanstack/react-query';
import { getAllRenders } from '../utils/api';
import { useAuth } from '../providers/auth';

export function useRenders() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: ['renders', token],
    queryFn: () => getAllRenders(token),
    refetchInterval: 1000,
  });
}
