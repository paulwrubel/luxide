import { useState } from 'react';
import { Alert } from 'flowbite-react';
import { useAuth } from '@/providers/auth';
import { useRenders } from '@/hooks/useRenders';
import { RenderPreviewCard } from './RenderPreviewCard';
import { NewRenderCard } from './NewRenderCard';
import { SkeletonRenderCard } from './SkeletonRenderCard';
import { CreateRenderModal } from './CreateRenderModal';
import { HiExclamationTriangle } from 'react-icons/hi2';

export function RendersPage() {
  const { user } = useAuth();
  const allRendersQuery = useRenders({ streaming: true });

  const canCreateNewRender =
    (user?.max_renders ?? null) === null ||
    (allRendersQuery.data !== undefined &&
      allRendersQuery.data.length < (user?.max_renders ?? Infinity));

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex w-full flex-col gap-6 overflow-y-auto p-12">
      {!canCreateNewRender && (
        <Alert color="warning" icon={HiExclamationTriangle}>
          You have reached your maximum number of renders ({allRendersQuery.data?.length}/
          {user?.max_renders}
          ). Please delete an existing render before creating a new one.
        </Alert>
      )}

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
          <div className="w-80">
            <NewRenderCard onClick={() => setShowCreateModal(true)} />
          </div>
        </div>
      )}

      <CreateRenderModal show={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
