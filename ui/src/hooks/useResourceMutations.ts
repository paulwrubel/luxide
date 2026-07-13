import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminUserOverride } from '@/providers/AdminUserOverride';
import { createResource, deleteResource } from '../utils/api';
import { useAuth } from '../providers/Auth';
import { allResourceMetadataQueryKey } from './useResources';

export function useCreateResourceMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createResource(authenticatedFetch, formData, targetUserID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allResourceMetadataQueryKey() });
    },
  });
}

export function useDeleteResourceMutation() {
  const { authenticatedFetch } = useAuth();
  const { targetUserID } = useAdminUserOverride();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resourceID: number) =>
      deleteResource(authenticatedFetch, resourceID, targetUserID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allResourceMetadataQueryKey() });
    },
  });
}
