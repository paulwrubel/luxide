import { Card, Spinner } from 'flowbite-react';
import { Link } from 'react-router-dom';
import type { Render } from '../utils/api';
import { useCheckpointImage } from '../hooks/useCheckpointImage';

interface RenderPreviewCardProps {
  render: Render;
}

export default function RenderPreviewCard({ render }: RenderPreviewCardProps) {
  const checkpointImageQuery = useCheckpointImage(render.id);
  const renderSize = render.config.parameters.image_dimensions;

  return (
    <Link to={`/renders/${render.id}`}>
      <Card className="!bg-zinc-800 !text-zinc-200 hover:!bg-zinc-700">
        <div className="flex w-full items-center justify-center p-2">
          {checkpointImageQuery.isPending && (
            <div className="flex flex-col items-center justify-center p-4">
              <Spinner size="xl" color="info" />
              <span className="mt-2 text-sm">loading preview...</span>
            </div>
          )}
          {checkpointImageQuery.isError && (
            <img
              src={`https://placehold.co/${renderSize[0]}x${renderSize[1]}?text=Error`}
              alt="Render Error"
              className="max-h-48 w-full object-scale-down"
            />
          )}
          {checkpointImageQuery.isSuccess && (
            <img
              src={checkpointImageQuery.data}
              alt="Render Preview"
              className="max-h-48 w-full object-scale-down"
            />
          )}
        </div>
        <div className="flex items-baseline justify-between border-t border-zinc-600 p-3">
          <h5 className="text-lg font-semibold">{render.id}</h5>
          <code className="text-sm font-light italic">{render.config.name}</code>
        </div>
      </Card>
    </Link>
  );
}
