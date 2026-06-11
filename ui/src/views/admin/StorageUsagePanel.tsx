import { Alert, Spinner } from 'flowbite-react';
import { useStorageUsageQuery } from '@/hooks/useStorageUsage';

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function StorageUsagePanel() {
  const { data: storageUsage, isPending, isError, error } = useStorageUsageQuery();

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Checkpoint Storage Usage</h2>
      {isPending && <Spinner />}
      {isError && <Alert color="red">Error loading usage: {error?.message}</Alert>}
      {!isPending && !isError && storageUsage && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <span className="text-2xl font-bold text-white">{formatBytes(storageUsage.bytes)}</span>
          <span className="ml-2 text-sm text-zinc-400">total checkpoint data</span>
        </div>
      )}
    </section>
  );
}
