import {
  type Render,
  type RenderStats,
  isRenderStateRunning,
  isRenderStatePausing,
  isRenderStateCreated,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
} from '@/utils/api';
import { formatDuration } from '@/utils/duration';
import { ProgressState } from './ProgressState';
import { RenderTiming } from './RenderTiming';

export type RenderProgressProps = {
  state: Render['state'];
  totalCheckpoints: number;
  samplesPerCheckpoint?: number;
  renderStats?: RenderStats;
};

export function RenderProgress(props: RenderProgressProps) {
  const { state, totalCheckpoints, samplesPerCheckpoint, renderStats } = props;

  const showProgress = isRenderStateRunning(state) || isRenderStatePausing(state);

  // ---- progress bar section ----

  const progress = isRenderStateRunning(state)
    ? state.running.progress_info.progress
    : isRenderStatePausing(state)
      ? state.pausing.progress_info.progress
      : 0;
  const progressColor = isRenderStateRunning(state) ? 'blue' : 'yellow';

  // ---- checkpoint timing (from ProgressInfo, needs formatDuration) ----

  let checkpointTiming = null;
  if (showProgress) {
    const progressInfo = isRenderStateRunning(state)
      ? state.running.progress_info
      : state.pausing.progress_info;
    checkpointTiming = {
      elapsed: formatDuration(progressInfo.elapsed),
      remaining: formatDuration(progressInfo.estimated_remaining),
      total: formatDuration(progressInfo.estimated_total),
    };
  }

  // ---- whole render timing (from /stats, already formatted strings) ----

  const wholeRenderTiming = renderStats
    ? {
        elapsed: renderStats.elapsed,
        remaining: renderStats.estimated_remaining,
        total: renderStats.estimated_total,
      }
    : null;

  // ---- status text ----

  let statusText: string;
  if (isRenderStateRunning(state)) {
    const samplesText =
      samplesPerCheckpoint !== undefined
        ? ` · ${Math.round(state.running.progress_info.progress * samplesPerCheckpoint)} of ${samplesPerCheckpoint} samples`
        : '';
    statusText = `Checkpoint ${state.running.checkpoint_iteration} of ${totalCheckpoints}${samplesText}`;
  } else if (isRenderStatePausing(state)) {
    const samplesText =
      samplesPerCheckpoint !== undefined
        ? ` · ${Math.round(state.pausing.progress_info.progress * samplesPerCheckpoint)} of ${samplesPerCheckpoint} samples`
        : '';
    statusText = `Pausing at checkpoint ${state.pausing.checkpoint_iteration} of ${totalCheckpoints}${samplesText}`;
  } else if (isRenderStateCreated(state)) {
    statusText = 'Created and waiting to start';
  } else if (isRenderStatePaused(state)) {
    statusText = `Paused at checkpoint ${state.paused} of ${totalCheckpoints}`;
  } else if (isRenderStateFinishedCheckpointIteration(state)) {
    const timeInfo = renderStats ? ` — Total time: ${renderStats.elapsed}` : '';
    statusText = `Finished checkpoint ${state.finished_checkpoint_iteration} of ${totalCheckpoints}${timeInfo}`;
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
