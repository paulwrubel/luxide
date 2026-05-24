import { Spinner, Alert } from 'flowbite-react';
import { useAuth } from '../utils/auth';
import { useRenders } from '../hooks/useRenders';
import RenderPreviewCard from '../components/RenderPreviewCard';
import NewRenderCard from '../components/NewRenderCard';

export default function RendersPage() {
  const { validUser } = useAuth();
  const allRendersQuery = useRenders();

  const canCreateNewRender =
    validUser.max_renders === null ||
    (allRendersQuery.data !== undefined &&
      allRendersQuery.data.length < validUser.max_renders);

  return (
    <div className="flex w-full flex-col p-12">
      {allRendersQuery.isPending && (
        <div className="flex w-full justify-center py-8">
          <Spinner size="xl" color="info" />
          <span className="ml-2">Loading renders...</span>
        </div>
      )}

      {allRendersQuery.isError && (
        <Alert color="failure" className="w-full">
          <span className="font-medium">Error loading renders</span>
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
              <NewRenderCard />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
