import type { Render, RenderStats } from '@/utils/api';
import type { UseQueryResult } from '@tanstack/react-query';
import { Spinner } from 'flowbite-react';
import { RenderTitleBar } from './RenderTitleBar';
import { RenderPreview } from './RenderPreview';
import { RenderProgress } from './RenderProgress';

export type RenderDisplayProps = {
  renderQuery: UseQueryResult<Render, Error>;
  imageURLQuery: UseQueryResult<string, Error>;
  statsQuery: UseQueryResult<RenderStats, Error>;
};

export function RenderDisplay(props: RenderDisplayProps) {
  const { renderQuery, imageURLQuery, statsQuery } = props;

  // Loading state — takes full height
  if (renderQuery.isPending) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size="xl" color="info" />
      </div>
    );
  }

  // Error state
  if (renderQuery.isError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-red-500">
          Error loading render: {renderQuery.error?.message}
        </p>
      </div>
    );
  }

  // Success — main layout
  const render = renderQuery.data;

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <RenderTitleBar name={render.config.name} state={render.state} />
      <RenderPreview imageURLQuery={imageURLQuery} />
      <RenderProgress
        state={render.state}
        totalCheckpoints={render.config.parameters.total_checkpoints}
        renderStats={statsQuery.data}
      />
    </div>
  );
}
