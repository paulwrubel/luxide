import { useState } from 'react';
import { Alert, Button, Spinner } from 'flowbite-react';
import { ResourcesTable } from './ResourcesTable';
import { UploadResourceModal } from './UploadResourceModal';
import { useResourceStorageUsageQuery } from '@/hooks/useResourceStorageUsage';

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function ResourceStorageUsagePanel() {
  const { data: storageUsage, isPending, isError, error } = useResourceStorageUsageQuery();

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Resource Storage Usage</h2>
      {isPending && <Spinner />}
      {isError && <Alert color="red">Error loading usage: {error?.message}</Alert>}
      {!isPending && !isError && storageUsage && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
          <span className="text-2xl font-bold text-white">{formatBytes(storageUsage.bytes)}</span>
          <span className="ml-2 text-sm text-zinc-400">total resource storage used</span>
        </div>
      )}
    </section>
  );
}

export function ResourcesPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6 overflow-y-auto p-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Resources</h1>
        <Button
          color="default"
          onClick={() => {
            setShowUploadModal(true);
          }}
        >
          Upload Resource
        </Button>
      </div>
      <ResourceStorageUsagePanel />
      <ResourcesTable />
      {showUploadModal && (
        <UploadResourceModal
          show={showUploadModal}
          onClose={() => {
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
