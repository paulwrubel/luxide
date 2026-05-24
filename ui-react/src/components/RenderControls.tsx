import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  pauseRender,
  resumeRender,
  deleteRender,
  updateRenderTotalCheckpoints,
  isRenderStatePausing,
  isRenderStatePaused,
  isRenderStateRunning,
  type Render,
} from '../utils/api';
import { Button, Spinner, TextInput, Label } from 'flowbite-react';
import { useAuth } from '../utils/auth';

interface RenderControlsProps {
  render: Render;
}

export default function RenderControls({ render }: RenderControlsProps) {
  const { id } = useParams<{ id: string }>();
  const renderId = Number(id);
  const navigate = useNavigate();
  const { validToken } = useAuth();

  const [isPausingOrResuming, setIsPausingOrResuming] = useState(false);
  const [newCheckpointLimit, setNewCheckpointLimit] = useState<number>(
    render.config.parameters.total_checkpoints
  );
  const [isUpdatingCheckpoints, setIsUpdatingCheckpoints] = useState(false);

  const isPausing = isRenderStatePausing(render.state);
  const isPaused = isRenderStatePaused(render.state);
  const isRunning = isRenderStateRunning(render.state);

  async function handlePauseOrResume() {
    setIsPausingOrResuming(true);
    if (isPaused || isPausing) {
      await resumeRender(validToken, renderId);
    } else if (isRunning) {
      await pauseRender(validToken, renderId);
    }
    setIsPausingOrResuming(false);
  }

  async function handleUpdateCheckpoints() {
    setIsUpdatingCheckpoints(true);
    await updateRenderTotalCheckpoints(
      validToken,
      renderId,
      newCheckpointLimit
    );
    setIsUpdatingCheckpoints(false);
  }

  async function handleDelete() {
    await deleteRender(validToken, renderId);
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
        color="primary"
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
          color={isPaused || isPausing ? 'primary' : 'warning'}
          outline
          onClick={handlePauseOrResume}
          disabled={
            isPausingOrResuming || !(isPaused || isPausing || isRunning)
          }
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

        <Button
          color="failure"
          onClick={handleDelete}
          disabled={isPausing || isRunning}
        >
          Delete Render
        </Button>
      </div>
    </div>
  );
}
