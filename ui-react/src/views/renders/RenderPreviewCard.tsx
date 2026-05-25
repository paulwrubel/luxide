import { Card, Progress, Spinner } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { isRenderStateRunning, isRenderStatePausing, type Render } from '../../utils/api';
import { useLatestCheckpointImage } from '../../hooks/useLatestCheckpointImage';

interface RenderPreviewCardProps {
  render: Render;
}

export default function RenderPreviewCard({ render }: RenderPreviewCardProps) {
  const checkpointImageQuery = useLatestCheckpointImage(render.id);
  const renderSize = render.config.parameters.image_dimensions;
  const state = render.state;
  const running = isRenderStateRunning(state);
  const pausing = isRenderStatePausing(state);
  const showProgress = running || pausing;
  const progress = running
    ? state.running.progress_info.progress
    : pausing
      ? state.pausing.progress_info.progress
      : 0;

  return (
    <Link to={`/renders/${render.id}`}>
      <Card
        className="bg-zinc-800! text-zinc-200! hover:bg-zinc-700!"
        theme={{
          root: {
            base: 'border-none',
            children: 'p-0',
          },
        }}
        renderImage={() => (
          <div>
            {checkpointImageQuery.isPending && (
              <div className="flex flex-col items-center justify-center">
                <Spinner size="xl" color="info" />
                <span className="mt-2 text-sm">loading preview...</span>
              </div>
            )}
            {checkpointImageQuery.isError && (
              <img
                src={`https://placehold.co/${renderSize[0]}x${renderSize[1]}?text=Error`}
                alt="Render Error"
              />
            )}
            {checkpointImageQuery.isSuccess && (
              <img src={checkpointImageQuery.data} alt="Render Preview" />
            )}
          </div>
        )}
      >
        {showProgress && (
          <div>
            <Progress
              progress={Math.round(progress * 100)}
              color={running ? 'blue' : 'yellow'}
              size="sm"
              theme={{ base: 'rounded-none', bar: 'rounded-none' }}
              className="[&>div]:transition-[width] [&>div]:duration-500"
            />
          </div>
        )}
        <div className="flex items-center justify-between p-3">
          <h5 className="text-lg font-semibold">{render.id}</h5>
          <code className="text-sm font-light italic">{render.config.name}</code>
        </div>
      </Card>
    </Link>
  );
}
