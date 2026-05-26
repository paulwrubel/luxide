import {
  type Render,
  isRenderStateCreated,
  isRenderStateRunning,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePausing,
  isRenderStatePaused,
} from '@/utils/api';
import { ProgressState } from './ProgressState';

export type StateDisplayProps = {
  state: Render['state'];
  totalCheckpoints: number;
};

export function StateDisplay(props: StateDisplayProps) {
  const { state, totalCheckpoints } = props;

  if (isRenderStateCreated(state)) {
    return <p>CREATED</p>;
  }

  if (isRenderStateRunning(state)) {
    return (
      <ProgressState
        progress={state.running.progress_info.progress}
        color="blue"
        label="Running to"
        checkpoint={state.running.checkpoint_iteration}
        totalCheckpoints={totalCheckpoints}
      />
    );
  }

  if (isRenderStateFinishedCheckpointIteration(state)) {
    return (
      <p>
        Finished checkpoint {state.finished_checkpoint_iteration} / {totalCheckpoints}
      </p>
    );
  }

  if (isRenderStatePausing(state)) {
    return (
      <ProgressState
        progress={state.pausing.progress_info.progress}
        color="yellow"
        label="Pausing at"
        checkpoint={state.pausing.checkpoint_iteration}
        totalCheckpoints={totalCheckpoints}
      />
    );
  }

  if (isRenderStatePaused(state)) {
    return (
      <p>
        Paused at checkpoint {state.paused} / {totalCheckpoints}
      </p>
    );
  }

  return <p>Unknown state</p>;
}
