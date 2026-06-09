import { Button, Spinner } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { useRender } from '@/hooks/useRender';
import { usePauseRender, useResumeRender, useDeleteRender } from '@/hooks/useRenderMutations';
import { isRenderStatePausing, isRenderStatePaused, isRenderStateRunning } from '@/utils/api';
export type RenderControlsProps = {
  renderID: number;
};

export function RenderControls(props: RenderControlsProps) {
  const { renderID } = props;

  const navigate = useNavigate();

  const {
    data: render,
    isLoading: isRenderLoading,
    isError: isRenderError,
    error: renderError,
  } = useRender({ renderID });

  const { mutate: pauseRender, isPending: isPausePending } = usePauseRender();
  const { mutate: resumeRender, isPending: isResumePending } = useResumeRender();
  const { mutate: deleteRender, isPending: isDeletePending } = useDeleteRender();

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

  function handlePauseOrResume() {
    if (isPaused || isPausing) {
      resumeRender(renderID);
    } else if (isRunning) {
      pauseRender(renderID);
    }
  }

  function handleDelete() {
    deleteRender(renderID, {
      onSuccess: () => {
        navigate('/renders');
      },
    });
  }

  return (
    <div className="flex justify-evenly gap-2">
      <Button
        color={isPaused || isPausing ? 'default' : 'yellow'}
        outline
        onClick={handlePauseOrResume}
        disabled={isPausePending || isResumePending || !(isPaused || isPausing || isRunning)}
      >
        {isPausePending || isResumePending ? (
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
        color="red"
        onClick={handleDelete}
        disabled={isDeletePending || isPausing || isRunning}
      >
        {isDeletePending ? (
          <span className="flex items-center justify-center">
            <Spinner size="sm" className="mr-2" />
            Deleting...
          </span>
        ) : (
          'Delete Render'
        )}
      </Button>
    </div>
  );
}
