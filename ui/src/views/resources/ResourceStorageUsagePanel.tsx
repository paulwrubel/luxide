import { StorageUsagePanel } from '@/components/StorageUsagePanel';
import { useResourceStorageUsageQuery } from '@/hooks/useResourceStorageUsage';

export function ResourceStorageUsagePanel() {
  const { data, isPending, isError, error } = useResourceStorageUsageQuery();

  return (
    <StorageUsagePanel
      title="Resource Storage Usage"
      label="total resource storage used"
      bytes={data?.bytes}
      isPending={isPending}
      isError={isError}
      error={error}
    />
  );
}
