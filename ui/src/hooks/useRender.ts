import { useQuery } from '@tanstack/react-query';
import { getRender } from '../utils/api';
import { useAuth } from '../providers/auth';

export type UseRenderOptions = {
  renderID: number;
};

export function useRender(options: UseRenderOptions) {
  const { renderID } = options;

  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  return useQuery({
    queryKey: ['render', renderID, token],
    queryFn: () => getRender(token, renderID),
    staleTime: Infinity,
  });
}
