import type { Render } from '@/utils/api';
import {
  isRenderStateCreated,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
  isRenderStatePausing,
  isRenderStateRunning,
} from '@/utils/api';

export type RenderTitleBarProps = {
  name: string;
  state: Render['state'];
};

function stateBadge(state: Render['state']): { label: string; className: string } {
  if (isRenderStateCreated(state)) {
    return {
      label: 'Created',
      className: 'rounded-full px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
    };
  }
  if (isRenderStateRunning(state)) {
    return {
      label: 'Running',
      className: 'rounded-full px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    };
  }
  if (isRenderStatePausing(state)) {
    return {
      label: 'Pausing',
      className: 'rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
  }
  if (isRenderStatePaused(state)) {
    return {
      label: 'Paused',
      className: 'rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
  }
  if (isRenderStateFinishedCheckpointIteration(state)) {
    return {
      label: 'Finished',
      className: 'rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
  }
  return {
    label: 'Unknown',
    className: 'rounded-full px-3 py-1 text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300',
  };
}

export function RenderTitleBar(props: RenderTitleBarProps) {
  const { name, state } = props;
  const badge = stateBadge(state);

  return (
    <div className="flex w-full flex-shrink-0 items-center justify-between px-6 py-3">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{name}</h2>
      <span className={badge.className}>{badge.label}</span>
    </div>
  );
}
