import { Button, Spinner, TextInput, Label } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useRender } from '@/hooks/useRender';
import { useAuth } from '@/providers/auth';
import {
  updateRenderTotalCheckpoints,
  isRenderStateRunning,
  isRenderStatePausing,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
  type RenderState,
} from '@/utils/api';

export type CheckpointLimitEditorProps = {
  renderID: number;
};

export function CheckpointLimitEditor({ renderID }: CheckpointLimitEditorProps) {
  const {
    data: render,
    isLoading: isRenderLoading,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });
  const { mustGetToken } = useAuth();
  const [newCheckpointLimit, setNewCheckpointLimit] = useState<number>(0);
  const [isUpdatingCheckpoints, setIsUpdatingCheckpoints] = useState(false);

  useEffect(() => {
    if (render && newCheckpointLimit === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewCheckpointLimit(render.config.parameters.total_checkpoints);
    }
  }, [render, newCheckpointLimit]);

  async function handleUpdate() {
    setIsUpdatingCheckpoints(true);
    await updateRenderTotalCheckpoints(mustGetToken(), renderID, newCheckpointLimit);
    setIsUpdatingCheckpoints(false);
  }

  if (isRenderLoading) {
    return <Spinner size="md" className="fill-zinc-400" />;
  }

  if (isRenderError) {
    return <p className="text-sm text-red-500">Error loading render: {renderError.message}</p>;
  }

  const currentCheckpointIteration = render ? getCurrentCheckpointIteration(render.state) : 0;

  return (
    <>
      <Label>
        <span className="mb-1 block">Checkpoint Limit</span>
        <TextInput
          type="number"
          required
          className="w-full"
          value={newCheckpointLimit}
          onChange={(e) => setNewCheckpointLimit(Number(e.target.value))}
        />
      </Label>

      <Button
        color="default"
        outline
        onClick={handleUpdate}
        disabled={
          isUpdatingCheckpoints ||
          !Number.isInteger(newCheckpointLimit) ||
          newCheckpointLimit <= currentCheckpointIteration
        }
      >
        {isUpdatingCheckpoints ? (
          <span className="flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            Updating...
          </span>
        ) : (
          'Update'
        )}
      </Button>
    </>
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
