import { Button, Spinner, TextInput, Label } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useRender } from '@/hooks/useRender';
import { useAuth } from '@/providers/auth';
import { updateRenderTotalCheckpoints, type RenderState } from '@/utils/api';

function getCurrentCheckpointIteration(state: RenderState): number {
  if (typeof state === 'object') {
    if ('running' in state) {
      return state.running.checkpoint_iteration;
    }
    if ('finished_checkpoint_iteration' in state) {
      return state.finished_checkpoint_iteration;
    }
    if ('pausing' in state) {
      return state.pausing.checkpoint_iteration;
    }
    if ('paused' in state) {
      return state.paused;
    }
  }
  return 0;
}

export type CheckpointLimitEditorProps = {
  renderID: number;
};

export function CheckpointLimitEditor({ renderID }: CheckpointLimitEditorProps) {
  const renderQuery = useRender({ renderID });
  const { mustGetToken } = useAuth();
  const [newCheckpointLimit, setNewCheckpointLimit] = useState<number>(0);
  const [isUpdatingCheckpoints, setIsUpdatingCheckpoints] = useState(false);

  useEffect(() => {
    if (renderQuery.data && newCheckpointLimit === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewCheckpointLimit(renderQuery.data.config.parameters.total_checkpoints);
    }
  }, [renderQuery.data, newCheckpointLimit]);

  async function handleUpdate() {
    setIsUpdatingCheckpoints(true);
    await updateRenderTotalCheckpoints(mustGetToken(), renderID, newCheckpointLimit);
    setIsUpdatingCheckpoints(false);
  }

  if (renderQuery.isLoading) {
    return <Spinner size="md" className="fill-zinc-400" />;
  }

  if (renderQuery.isError) {
    return <p className="text-sm text-red-500">Error loading render</p>;
  }

  const currentCheckpointIteration = renderQuery.data
    ? getCurrentCheckpointIteration(renderQuery.data.state)
    : 0;

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
