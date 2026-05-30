import { useLatestCheckpointImage } from '@/hooks/useLatestCheckpointImage';
import { Spinner } from 'flowbite-react';

export type RenderPreviewProps = {
  renderID: number;
};

export function RenderPreview(props: RenderPreviewProps) {
  const { renderID } = props;

  const {
    data: checkpointImage,
    isPending: isCheckpointImagePending,
    isError: isCheckpointImageError,
    error: checkpointImageError,
  } = useLatestCheckpointImage({
    renderID,
  });

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-4">
      {isCheckpointImagePending && <Spinner size="xl" color="info" />}
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
