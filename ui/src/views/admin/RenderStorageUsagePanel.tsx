import { StorageUsagePanel } from '@/components/StorageUsagePanel';
import { useRenderStorageUsageQuery } from '@/hooks/useRenderStorageUsage';

export function RenderStorageUsagePanel() {
  const { data, isSuccess, isPending, isError, error } = useRenderStorageUsageQuery();

  return (
    <StorageUsagePanel
      title="Checkpoint Storage Usage"
      label="total checkpoint data"
      bytes={data?.bytes ?? 0}
      isSuccess={isSuccess}
      isPending={isPending}
      isError={isError}
      error={error}
    />
  );
}
