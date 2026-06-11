import { useLatestCheckpointImageQuery } from '@/hooks/useLatestCheckpointImage';
import { useRenderQuery } from '@/hooks/useRender';
import { isRenderStateCreated, isRenderStateRunning, isRenderStatePausing } from '@/utils/api';
import { Spinner } from 'flowbite-react';

export type RenderPreviewProps = {
  renderID: number;
};

export function RenderPreview(props: RenderPreviewProps) {
  const { renderID } = props;

  const { data: render } = useRenderQuery({ renderID });
  const renderState = render?.state;

  const checkpointEnabled = renderState ? !isRenderStateCreated(renderState) : true;

  const isRunningOrPausing =
    !renderState || isRenderStateRunning(renderState) || isRenderStatePausing(renderState);

  const {
    data: checkpointImage,
    isPending: isCheckpointImagePending,
    isError: isCheckpointImageError,
    error: checkpointImageError,
  } = useLatestCheckpointImageQuery({
    renderID,
    enabled: checkpointEnabled,
  });

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4">
      {isCheckpointImagePending && <Spinner size="xl" color="info" />}
      {!isCheckpointImagePending &&
        !isCheckpointImageError &&
        checkpointImage === null &&
        isRunningOrPausing && (
          <div className="flex flex-col items-center justify-center gap-2">
            <Spinner size="xl" color="info" />
            <p className="text-sm text-zinc-400">Rendering — no checkpoint image yet</p>
          </div>
        )}
      {!isCheckpointImagePending &&
        !isCheckpointImageError &&
        checkpointImage === null &&
        !isRunningOrPausing && (
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-zinc-400">No checkpoint image</p>
          </div>
        )}
      {isCheckpointImageError && (
        <p className="text-sm text-zinc-500">
          Error loading checkpoint image: {checkpointImageError?.message}
        </p>
      )}
      {checkpointImage && (
        <img
          alt="Render checkpoint"
          src={checkpointImage}
          className="max-h-full max-w-full rounded border border-zinc-700 object-contain"
        />
      )}
    </div>
  );
}
