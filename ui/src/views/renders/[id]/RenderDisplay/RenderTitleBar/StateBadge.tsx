import {
  type RenderState,
  isRenderStateCreated,
  isRenderStateRunning,
  isRenderStatePausing,
  isRenderStatePaused,
  isRenderStateFinishedCheckpointIteration,
} from '@/utils/api';

export type StateBadgeProps = {
  renderState: RenderState;
};

export function StateBadge(props: StateBadgeProps) {
  const { renderState } = props;

  let label: string;
  let className: string;

  if (isRenderStateCreated(renderState)) {
    label = 'Created';
    className = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  } else if (isRenderStateRunning(renderState)) {
    label = 'Running';
    className = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
  } else if (isRenderStatePausing(renderState)) {
    label = 'Pausing';
    className = 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
  } else if (isRenderStatePaused(renderState)) {
    label = 'Paused';
    className = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  } else if (isRenderStateFinishedCheckpointIteration(renderState)) {
    label = 'Finished';
    className = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  } else {
    label = 'Unknown';
    className = 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  }

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
