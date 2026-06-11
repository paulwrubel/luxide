import { Spinner } from 'flowbite-react';
import { useRenderQuery } from '@/hooks/useRender';
import {
  isRenderStateRunning,
  isRenderStatePausing,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
  type RenderState,
} from '@/utils/api';
import { CheckpointLimitForm } from './CheckpointLimitForm';

export type CheckpointLimitEditorProps = {
  renderID: number;
};

export function CheckpointLimitEditor(props: CheckpointLimitEditorProps) {
  const { renderID } = props;

  const {
    data: render,
    isLoading: isRenderLoading,
    isError: isRenderError,
    error: renderError,
  } = useRenderQuery({ renderID });

  if (isRenderLoading) {
    return <Spinner size="md" className="fill-zinc-400" />;
  }

  if (isRenderError) {
    return <p className="text-sm text-red-500">Error loading render: {renderError.message}</p>;
  }

  if (!render) {
    return null;
  }

  const currentCheckpointIteration = getCurrentCheckpointIteration(render.state);

  return (
    <CheckpointLimitForm
      currentValue={render.config.parameters.total_checkpoints}
      currentCheckpointIteration={currentCheckpointIteration}
      renderID={renderID}
    />
  );
}

function getCurrentCheckpointIteration(state: RenderState): number {
  if (isRenderStateRunning(state)) {
    return state.running.checkpoint_iteration;
  } else if (isRenderStatePausing(state)) {
    return state.pausing.checkpoint_iteration;
  } else if (isRenderStateFinishedCheckpointIteration(state)) {
    return state.finished_checkpoint_iteration;
  } else if (isRenderStatePaused(state)) {
    return state.paused;
  }
  return 0;
}
