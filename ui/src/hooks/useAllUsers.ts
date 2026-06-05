import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '../utils/api';
import { useAuth } from '../providers/auth';

export function useAllUsers() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: ['allUsers', token],
    queryFn: () => getAllUsers(token),
  });
}
