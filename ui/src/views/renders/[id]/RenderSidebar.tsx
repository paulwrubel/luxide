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

export type RenderSidebarProps = {
  render: Render;
  renderID: number;
};

/** sidebar controls panel for a single render (checkpoint management, pause/resume, delete) */
export function RenderSidebar(props: RenderSidebarProps) {
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
      <div className="rounded border border-zinc-700 p-3">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Render Info</h3>
        <div className="flex flex-col gap-1 text-sm text-zinc-400">
          <div className="flex justify-between">
            <span className="text-zinc-500">Image</span>
            <span className="text-zinc-300">
              {render.config.parameters.image_dimensions[0]} ×{' '}
              {render.config.parameters.image_dimensions[1]}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Samples</span>
            <span className="text-zinc-300">
              {render.config.parameters.samples_per_checkpoint}/ckpt
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Max bounces</span>
            <span className="text-zinc-300">{render.config.parameters.max_bounces}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Created</span>
            <span className="text-right text-zinc-300">
              <div>
                {new Date(render.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div>
                {new Date(render.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </span>
          </div>
        </div>
      </div>

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
