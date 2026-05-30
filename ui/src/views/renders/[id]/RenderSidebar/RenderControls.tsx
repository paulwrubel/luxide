import { Button, Spinner } from 'flowbite-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRender } from '@/hooks/useRender';
import { useAuth } from '@/providers/auth';
import {
  pauseRender,
  resumeRender,
  deleteRender,
  isRenderStatePausing,
  isRenderStatePaused,
  isRenderStateRunning,
} from '@/utils/api';

export type RenderControlsProps = {
  renderID: number;
};

export function RenderControls(props: RenderControlsProps) {
  const { renderID } = props;

  const navigate = useNavigate();
  const { mustGetToken } = useAuth();
  const token = mustGetToken();

  const {
    data: render,
    isLoading: isRenderLoading,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });

  const [isPausingOrResuming, setIsPausingOrResuming] = useState(false);

  if (isRenderLoading || !render) {
    return <Spinner size="md" className="fill-zinc-400" />;
  }

  if (isRenderError) {
    return (
      <p className="text-sm text-red-500">Error loading render controls: {renderError.message}</p>
    );
  }

  const isPaused = isRenderStatePaused(render.state);
  const isPausing = isRenderStatePausing(render.state);
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

  async function handleDelete() {
    await deleteRender(token, renderID);
    navigate('/renders');
  }

  return (
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
  );
}
