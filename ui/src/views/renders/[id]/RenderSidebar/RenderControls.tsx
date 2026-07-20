import { useState } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { DeleteRenderModal } from './DeleteRenderModal';
import { useRenderQuery } from '@/hooks/useRender';
import {
  usePauseRenderMutation,
  useResumeRenderMutation,
  useDeleteRenderMutation,
} from '@/hooks/useRenderMutations';
import { isRenderStatePausing, isRenderStatePaused, isRenderStateRunning } from '@/utils/api';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/utils/api';

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
  } = useRenderQuery({ renderID });

  const { mutate: pauseRender, isPending: isPausePending } = usePauseRenderMutation();
  const { mutate: resumeRender, isPending: isResumePending } = useResumeRenderMutation();
  const { mutate: deleteRender, isPending: isDeletePending } = useDeleteRenderMutation();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      resumeRender(renderID, {
        onError: (error) => {
          toast.error(extractErrorMessage(error));
        },
      });
    } else if (isRunning) {
      pauseRender(renderID, {
        onError: (error) => {
          toast.error(extractErrorMessage(error));
        },
      });
    }
  }

  function handleDelete() {
    deleteRender(renderID, {
      onSuccess: () => {
        toast.success('Render deleted');
        navigate('/renders');
      },
      onError: (error) => {
        toast.error(extractErrorMessage(error));
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
        onClick={() => setShowDeleteModal(true)}
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

      <DeleteRenderModal
        show={showDeleteModal}
        renderName={render.config.name}
        isPending={isDeletePending}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
