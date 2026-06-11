import {
  isRenderStateRunning,
  isRenderStatePausing,
  isRenderStateCreated,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
} from '@/utils/api';
import { useRenderQuery } from '@/hooks/useRender';
import { useRenderStatsQuery } from '@/hooks/useRenderStats';
import { Spinner } from 'flowbite-react';
import { ProgressState } from './ProgressState';
import { RenderTiming, type RenderTimingData } from './RenderTiming';

export function RenderProgress({ renderID }: { renderID: number }) {
  const {
    data: render,
    isPending: isRenderPending,
    isError: isRenderError,
    error: renderError,
  } = useRenderQuery({ renderID });

  const {
    data: renderStats,
    isPending: isStatsPending,
    isError: isStatsError,
    error: statsError,
  } = useRenderStatsQuery({ renderID });

  if (isRenderPending || isStatsPending) {
    return (
      <div className="flex w-full shrink-0 flex-col items-center justify-center px-6 pb-4">
        <Spinner size="md" />
      </div>
    );
  }

  if (isRenderError || isStatsError) {
    return (
      <div className="flex w-full shrink-0 flex-col px-6 pb-4">
        <p className="text-center text-sm text-red-500">
          {isRenderError
            ? `Error loading render: ${renderError.message}`
            : `Error loading render stats: ${statsError!.message}`}
        </p>
      </div>
    );
  }

  const { state } = render;
  const { total_checkpoints: totalCheckpoints } = render.config.parameters;

  const showProgress = isRenderStateRunning(state) || isRenderStatePausing(state);

  // ---- progress bar section ----

  const progress = isRenderStateRunning(state)
    ? state.running.progress_info.progress
    : isRenderStatePausing(state)
      ? state.pausing.progress_info.progress
      : 0;
  const progressColor = isRenderStateRunning(state) ? 'blue' : 'yellow';

  // ---- checkpoint timing (from ProgressInfo) ----

  let checkpointTiming: RenderTimingData | undefined;
  if (showProgress) {
    const progressInfo = isRenderStateRunning(state)
      ? state.running.progress_info
      : state.pausing.progress_info;

    checkpointTiming = {
      elapsed: progressInfo.elapsed,
      remaining: progressInfo.estimated_remaining,
      total: progressInfo.estimated_total,
      remainingSeconds: progressInfo.estimated_remaining.secs,
    };
  }

  // ---- whole render timing (from /stats) ----

  const wholeRenderTiming: RenderTimingData | undefined = renderStats
    ? {
        elapsed: renderStats.elapsed,
        remaining: renderStats.estimated_remaining,
        total: renderStats.estimated_total,
        remainingSeconds: renderStats.estimated_remaining.secs,
      }
    : undefined;

  // ---- status text ----

  let statusText: string;
  if (isRenderStateRunning(state)) {
    statusText = `Checkpoint ${state.running.checkpoint_iteration} of ${totalCheckpoints}`;
  } else if (isRenderStatePausing(state)) {
    statusText = `Pausing at checkpoint ${state.pausing.checkpoint_iteration} of ${totalCheckpoints}`;
  } else if (isRenderStateCreated(state)) {
    statusText = 'Created and waiting to start';
  } else if (isRenderStatePaused(state)) {
    statusText = `Paused at checkpoint ${state.paused} of ${totalCheckpoints}`;
  } else if (isRenderStateFinishedCheckpointIteration(state)) {
    statusText = `Finished checkpoint ${state.finished_checkpoint_iteration} of ${totalCheckpoints}`;
  } else {
    statusText = 'Unknown state';
  }

  // ---- render ----

  return (
    <div className="flex w-full shrink-0 flex-col gap-4 px-6 pb-4">
      {/* progress bar area — always present, never collapses */}
      {showProgress ? (
        <ProgressState progress={progress} color={progressColor} />
      ) : (
        <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
          <div className="h-4 w-full rounded-full bg-zinc-800" />
        </div>
      )}

      {/* timing cards — always present, side by side */}
      <div className="flex w-full gap-4">
        <RenderTiming title="This Checkpoint" timings={checkpointTiming} />
        <RenderTiming title="Whole Render" timings={wholeRenderTiming} />
      </div>

      {/* status text */}
      <p className="text-center text-sm text-zinc-500">{statusText}</p>
    </div>
  );
}
