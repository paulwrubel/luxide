import { StorageUsagePanel } from '@/components/StorageUsagePanel';
import { useResourceStorageUsageQuery } from '@/hooks/useResourceStorageUsage';
import { useAuth } from '@/providers/Auth';

export function ResourceStorageUsagePanel() {
  const { user } = useAuth();
  const { data, isSuccess, isPending, isError, error } = useResourceStorageUsageQuery();

  return (
    <StorageUsagePanel
      title="Resource Storage Usage"
      label="total resource storage used"
      bytes={data?.bytes ?? 0}
      maxBytes={user?.max_resource_storage_bytes ?? undefined}
      isSuccess={isSuccess}
      isPending={isPending}
      isError={isError}
      error={error}
    />
  );
}
