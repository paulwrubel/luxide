import { useState } from 'react';
import { Button } from 'flowbite-react';
import { ResourcesTable } from './ResourcesTable';
import { UploadResourceModal } from './UploadResourceModal';

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
