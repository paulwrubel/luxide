import { Alert, Progress, Spinner } from 'flowbite-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export type StorageUsagePanelProps = {
  title: string;
  label: string;
  bytes: number;
  maxBytes?: number;
  isSuccess: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

export function StorageUsagePanel(props: StorageUsagePanelProps) {
  const { title, label, bytes, maxBytes, isSuccess, isPending, isError, error } = props;

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-zinc-300">{title}</h2>
      {isPending && <Spinner />}
      {isError && <Alert color="red">Error loading usage: {error?.message}</Alert>}
      {isSuccess && (
        <>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <span className="text-2xl font-bold text-white">{formatBytes(bytes)}</span>
            <span className="ml-2 text-sm text-zinc-400">{label}</span>
          </div>
          {maxBytes !== undefined && (
            <div className="mt-3">
              <Progress
                progress={Math.min(Math.round((bytes / maxBytes) * 100), 100)}
                color={bytes > maxBytes ? 'red' : 'blue'}
                size="lg"
              />
              <p className="mt-1 text-xs text-zinc-500">
                {formatBytes(bytes)} of {formatBytes(maxBytes)} used
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
