import { Card, Progress, Spinner, type CardTheme } from 'flowbite-react';
import { Link } from 'react-router-dom';
import type { DeepPartial } from 'flowbite-react/types';
import { isRenderStateRunning, isRenderStatePausing, type Render } from '@/utils/api';
import { useLatestCheckpointImage } from '@/hooks/useLatestCheckpointImage';

export type RenderPreviewCardProps = {
  render: Render;
};

export function RenderPreviewCard(props: RenderPreviewCardProps) {
  const { render } = props;
  const checkpointImageQuery = useLatestCheckpointImage({ renderID: render.id });
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

  const cardTheme: DeepPartial<CardTheme> = {
    root: {
      base: 'border-none bg-zinc-800 dark:bg-zinc-800',
      children: 'p-0',
    },
  };

  return (
    <Link to={`/renders/${render.id}`}>
      <Card
        className="text-zinc-200 hover:bg-zinc-700"
        theme={cardTheme}
        renderImage={() => (
          <div className="flex aspect-video items-center justify-center overflow-hidden bg-zinc-900">
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
                className="h-full w-full object-contain"
              />
            )}
            {checkpointImageQuery.isSuccess && (
              <img
                src={checkpointImageQuery.data}
                alt="Render Preview"
                className="h-full w-full object-contain"
              />
            )}
          </div>
        )}
      >
        <div className="min-h-1.5">
          {showProgress && (
            <Progress
              progress={Math.round(progress * 100)}
              color={running ? 'blue' : 'yellow'}
              size="sm"
              theme={{ base: 'rounded-none', bar: 'rounded-none transition-[width] duration-500' }}
            />
          )}
        </div>
        <div className="flex items-center justify-between p-3">
          <h5 className="text-lg font-semibold">{render.config.name}</h5>
          <code className="text-sm font-light italic">#{render.id}</code>
        </div>
      </Card>
    </Link>
  );
}
