import { Progress } from 'flowbite-react';
import {
  type Render,
  isRenderStateCreated,
  isRenderStateRunning,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePausing,
  isRenderStatePaused,
} from '@/utils/api';

export type StateDisplayProps = {
  state: Render['state'];
  totalCheckpoints: number;
};

export function StateDisplay(props: StateDisplayProps) {
  const { state, totalCheckpoints } = props;

  const running = isRenderStateRunning(state);
  const pausing = isRenderStatePausing(state);
  const showProgress = running || pausing;

  const progress = running
    ? state.running.progress_info.progress
    : pausing
      ? state.pausing.progress_info.progress
      : 0;

  const color: 'blue' | 'yellow' = running ? 'blue' : 'yellow';

  const checkpoint = running
    ? state.running.checkpoint_iteration
    : pausing
      ? state.pausing.checkpoint_iteration
      : null;

  let statusText: string;
  if (isRenderStateCreated(state)) {
    statusText = 'CREATED';
  } else if (running) {
    statusText = `Running to checkpoint ${checkpoint} / ${totalCheckpoints}`;
  } else if (isRenderStateFinishedCheckpointIteration(state)) {
    statusText = `Finished checkpoint ${state.finished_checkpoint_iteration} / ${totalCheckpoints}`;
  } else if (pausing) {
    statusText = `Pausing at checkpoint ${checkpoint} / ${totalCheckpoints}`;
  } else if (isRenderStatePaused(state)) {
    statusText = `Paused at checkpoint ${state.paused} / ${totalCheckpoints}`;
  } else {
    statusText = 'Unknown state';
  }

  return (
    <>
      <div className="min-h-4 w-full px-32">
        {showProgress && (
          <Progress
            progress={Math.round(progress * 100)}
            color={color}
            size="lg"
            labelProgress
            progressLabelPosition="inside"
            theme={{ bar: 'transition-[width] duration-1000 ease-linear' }}
          />
        )}
      </div>
      <p>{statusText}</p>
    </>
  );
}
