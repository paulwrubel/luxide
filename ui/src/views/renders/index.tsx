import { useState } from 'react';
import { Alert } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/auth';
import { useRenders } from '@/hooks/useRenders';
import { RenderPreviewCard } from './RenderPreviewCard';
import { NewRenderCard } from './NewRenderCard';
import { SkeletonRenderCard } from './SkeletonRenderCard';
import { ImportConfigModal } from './ImportConfigModal';
import type { RenderConfig } from '@/utils/render/config';

export function RendersPage() {
  const { user } = useAuth();
  const allRendersQuery = useRenders();

  const canCreateNewRender =
    (user?.max_renders ?? null) === null ||
    (allRendersQuery.data !== undefined &&
      allRendersQuery.data.length < (user?.max_renders ?? Infinity));

  const navigate = useNavigate();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = (config: RenderConfig) => {
    setShowImportModal(false);
    navigate('/renders/new', { state: { importedConfig: config } });
  };

  return (
    <div className="flex w-full flex-col overflow-y-auto p-12">
      {allRendersQuery.isPending && (
        <div className="flex w-full flex-wrap justify-center gap-4">
          <div className="w-80">
            <SkeletonRenderCard />
          </div>
          <div className="w-80">
            <SkeletonRenderCard />
          </div>
          <div className="w-80">
            <SkeletonRenderCard />
          </div>
        </div>
      )}

      {allRendersQuery.isError && (
        <Alert color="failure" className="w-full font-medium">
          Error loading renders: {allRendersQuery.error?.message}
        </Alert>
      )}

      {allRendersQuery.isSuccess && (
        <div className="flex w-full flex-wrap justify-center gap-4">
          {allRendersQuery.data.map((render) => (
            <div key={render.id} className="w-80">
              <RenderPreviewCard render={render} />
            </div>
          ))}
          {canCreateNewRender && (
            <div className="w-80">
              <NewRenderCard onImport={() => setShowImportModal(true)} />
            </div>
          )}
        </div>
      )}

      <ImportConfigModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
