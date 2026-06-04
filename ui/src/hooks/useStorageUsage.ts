import { useQuery } from '@tanstack/react-query';
import { getStorageUsage } from '../utils/api';
import { useAuth } from '../providers/auth';

export function useStorageUsage() {
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: ['storageUsage', token],
    queryFn: () => getStorageUsage(token),
  });
}
