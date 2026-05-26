import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  pauseRender,
  resumeRender,
  deleteRender,
  updateRenderTotalCheckpoints,
  isRenderStatePausing,
  isRenderStatePaused,
  isRenderStateRunning,
  type Render,
} from '@/utils/api';
import { Button, Spinner, TextInput, Label } from 'flowbite-react';
import { useAuth } from '@/providers/auth';

export type RenderControlsProps = {
  render: Render;
  renderID: number;
};

/** sidebar controls panel for a single render (checkpoint management, pause/resume, delete) */
export function RenderControls(props: RenderControlsProps) {
  const { render, renderID } = props;

  const navigate = useNavigate();
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const [isPausingOrResuming, setIsPausingOrResuming] = useState(false);
  const [newCheckpointLimit, setNewCheckpointLimit] = useState<number>(
    render.config.parameters.total_checkpoints,
  );
  const [isUpdatingCheckpoints, setIsUpdatingCheckpoints] = useState(false);

  const isPausing = isRenderStatePausing(render.state);
  const isPaused = isRenderStatePaused(render.state);
  const isRunning = isRenderStateRunning(render.state);

  async function handlePauseOrResume() {
    setIsPausingOrResuming(true);
    if (isPaused || isPausing) {
      await resumeRender(token, renderID);
    } else if (isRunning) {
      await pauseRender(token, renderID);
    }
    setIsPausingOrResuming(false);
  }

  async function handleUpdateCheckpoints() {
    setIsUpdatingCheckpoints(true);
    await updateRenderTotalCheckpoints(token, renderID, newCheckpointLimit);
    setIsUpdatingCheckpoints(false);
  }

  async function handleDelete() {
    await deleteRender(token, renderID);
    navigate('/renders');
  }

  return (
    <div className="flex h-full flex-col items-stretch gap-4 p-4">
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
        onClick={handleUpdateCheckpoints}
        disabled={
          isUpdatingCheckpoints ||
          !Number.isInteger(newCheckpointLimit) ||
          newCheckpointLimit <= render.config.parameters.total_checkpoints
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

      <span className="mt-auto w-full border-b border-zinc-600" />

      <div className="flex justify-evenly gap-2">
        <Button
          color={isPaused || isPausing ? 'default' : 'yellow'}
          outline
          onClick={handlePauseOrResume}
          disabled={isPausingOrResuming || !(isPaused || isPausing || isRunning)}
        >
          {isPausingOrResuming ? (
            <span className="flex items-center justify-center">
              <Spinner size="sm" className="mr-2" />
              Processing...
            </span>
          ) : isPaused || isPausing ? (
            'Resume Render'
          ) : (
            'Pause Render'
          )}
        </Button>

        <Button color="red" onClick={handleDelete} disabled={isPausing || isRunning}>
          Delete Render
        </Button>
      </div>
    </div>
  );
}
