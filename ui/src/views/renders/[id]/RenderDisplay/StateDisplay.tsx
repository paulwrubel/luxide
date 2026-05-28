import {
  type Render,
  type RenderStats,
  isRenderStateCreated,
  isRenderStateRunning,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePausing,
  isRenderStatePaused,
} from '@/utils/api';
import { formatDuration } from '@/utils/duration';
import { ProgressState } from './ProgressState';

export type StateDisplayProps = {
  state: Render['state'];
  totalCheckpoints: number;
  samplesPerCheckpoint?: number;
  renderStats?: RenderStats;
};

export function StateDisplay(props: StateDisplayProps) {
  const { state, totalCheckpoints, samplesPerCheckpoint, renderStats } = props;

  if (isRenderStateCreated(state)) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-6 text-center">
        <p className="text-lg font-medium text-zinc-300">CREATED</p>
        <p className="mt-1 text-sm text-zinc-500">waiting to start...</p>
      </div>
    );
  }

  if (isRenderStateRunning(state)) {
    const ci = state.running.progress_info;
    const checkpointTiming = {
      elapsed: formatDuration(ci.elapsed),
      remaining: formatDuration(ci.estimated_remaining),
      total: formatDuration(ci.estimated_total),
    };

    return (
      <>
        <ProgressState
          progress={ci.progress}
          color="blue"
          label="Running to"
          checkpoint={state.running.checkpoint_iteration}
          totalCheckpoints={totalCheckpoints}
          samplesPerCheckpoint={samplesPerCheckpoint}
        />
        <div className="flex w-full max-w-2xl gap-4">
          <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              This Checkpoint
            </h4>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Elapsed</span>
                <span className="text-zinc-300">{checkpointTiming.elapsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Remaining</span>
                <span className="text-zinc-300">{checkpointTiming.remaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total</span>
                <span className="text-zinc-300">{checkpointTiming.total}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Whole Render
            </h4>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Elapsed</span>
                <span className="text-zinc-300">{renderStats?.elapsed ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Remaining</span>
                <span className="text-zinc-300">{renderStats?.estimated_remaining ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total</span>
                <span className="text-zinc-300">{renderStats?.estimated_total ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isRenderStateFinishedCheckpointIteration(state)) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-6 text-center">
        <p className="text-lg font-medium text-zinc-300">
          ✅ Finished checkpoint {state.finished_checkpoint_iteration} / {totalCheckpoints}
        </p>
        {renderStats && (
          <p className="mt-1 text-sm text-zinc-500">Total time: {renderStats.elapsed}</p>
        )}
      </div>
    );
  }

  if (isRenderStatePausing(state)) {
    const ci = state.pausing.progress_info;
    const checkpointTiming = {
      elapsed: formatDuration(ci.elapsed),
      remaining: formatDuration(ci.estimated_remaining),
      total: formatDuration(ci.estimated_total),
    };

    return (
      <>
        <ProgressState
          progress={ci.progress}
          color="yellow"
          label="Pausing at"
          checkpoint={state.pausing.checkpoint_iteration}
          totalCheckpoints={totalCheckpoints}
          samplesPerCheckpoint={samplesPerCheckpoint}
        />
        <div className="flex w-full max-w-2xl gap-4">
          <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              This Checkpoint
            </h4>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Elapsed</span>
                <span className="text-zinc-300">{checkpointTiming.elapsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Remaining</span>
                <span className="text-zinc-300">{checkpointTiming.remaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total</span>
                <span className="text-zinc-300">{checkpointTiming.total}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Whole Render
            </h4>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Elapsed</span>
                <span className="text-zinc-300">{renderStats?.elapsed ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Remaining</span>
                <span className="text-zinc-300">{renderStats?.estimated_remaining ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total</span>
                <span className="text-zinc-300">{renderStats?.estimated_total ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isRenderStatePaused(state)) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-6 text-center">
        <p className="text-lg font-medium text-zinc-300">
          Paused at checkpoint {state.paused} / {totalCheckpoints}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-6 text-center">
      <p className="text-lg font-medium text-zinc-300">Unknown state</p>
    </div>
  );
}
