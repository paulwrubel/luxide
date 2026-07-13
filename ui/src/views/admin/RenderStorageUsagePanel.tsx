import { StorageUsagePanel } from '@/components/StorageUsagePanel';
import { useRenderStorageUsageQuery } from '@/hooks/useRenderStorageUsage';

export function RenderStorageUsagePanel() {
  const { data, isPending, isError, error } = useRenderStorageUsageQuery();

  return (
    <StorageUsagePanel
      title="Checkpoint Storage Usage"
      label="total checkpoint data"
      bytes={data?.bytes}
      isPending={isPending}
      isError={isError}
      error={error}
    />
  );
}
