import type { Render, RenderStats } from '@/utils/api';
import {
  isRenderStateCreated,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
  isRenderStatePausing,
  isRenderStateRunning,
} from '@/utils/api';
import type { UseQueryResult } from '@tanstack/react-query';
import { Spinner } from 'flowbite-react';
import { StateDisplay } from './StateDisplay';

export type RenderDisplayProps = {
  renderQuery: UseQueryResult<Render, Error>;
  imageURLQuery: UseQueryResult<string, Error>;
  samplesPerCheckpoint?: number;
  statsQuery: UseQueryResult<RenderStats, Error>;
};

function stateBadge(state: Render['state']): { label: string; className: string } {
  if (isRenderStateCreated(state)) {
    return {
      label: 'Created',
      className:
        'rounded-full px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
    };
  }
  if (isRenderStateRunning(state)) {
    return {
      label: 'Running',
      className:
        'rounded-full px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    };
  }
  if (isRenderStatePausing(state)) {
    return {
      label: 'Pausing',
      className:
        'rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
  }
  if (isRenderStatePaused(state)) {
    return {
      label: 'Paused',
      className:
        'rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
  }
  if (isRenderStateFinishedCheckpointIteration(state)) {
    return {
      label: 'Finished',
      className:
        'rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
  }
  return {
    label: 'Unknown',
    className:
      'rounded-full px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
  };
}

/** main content area showing the checkpoint image and render state progress */
export function RenderDisplay(props: RenderDisplayProps) {
  const { renderQuery, imageURLQuery, samplesPerCheckpoint, statsQuery } = props;

  const badge = renderQuery.isSuccess ? stateBadge(renderQuery.data.state) : null;

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 px-8">
      {/* render name + state header */}
      {renderQuery.isSuccess && (
        <div className="flex w-full items-center justify-between px-4 py-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {renderQuery.data.config.name}
          </h2>
          <span className={badge!.className}>{badge!.label}</span>
        </div>
      )}

      {/* checkpoint image */}
      {imageURLQuery.isPending && <p>Loading...</p>}
      {imageURLQuery.isError && (
        <p>Error loading checkpoint image: {imageURLQuery.error?.message}</p>
      )}
      {imageURLQuery.isSuccess && (
        <img alt="Render" src={imageURLQuery.data} className="rounded border border-zinc-700" />
      )}

      {/* render state */}
      {renderQuery.isPending && (
        <div className="flex justify-center p-4">
          <Spinner size="lg" color="info" />
        </div>
      )}
      {renderQuery.isError && <p>Error loading render: {renderQuery.error?.message}</p>}
      {renderQuery.isSuccess && (
        <StateDisplay
          state={renderQuery.data.state}
          totalCheckpoints={renderQuery.data.config.parameters.total_checkpoints}
          samplesPerCheckpoint={samplesPerCheckpoint}
          renderStats={statsQuery.data}
        />
      )}
    </div>
  );
}
