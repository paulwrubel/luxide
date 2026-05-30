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
import { useAuth } from '@/providers/auth';
import { RenderInfo } from './RenderInfo';
import { CheckpointLimitEditor } from './CheckpointLimitEditor';
import { RenderControls } from './RenderControls';
import { Separator } from '@/components/Separator';

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
      <RenderInfo render={render} />
      <span className="mt-auto" />
      <CheckpointLimitEditor
        newCheckpointLimit={newCheckpointLimit}
        setNewCheckpointLimit={setNewCheckpointLimit}
        isUpdatingCheckpoints={isUpdatingCheckpoints}
        totalCheckpoints={render.config.parameters.total_checkpoints}
        onUpdate={handleUpdateCheckpoints}
      />
      <Separator />
      <RenderControls
        isPausingOrResuming={isPausingOrResuming}
        isPaused={isPaused}
        isPausing={isPausing}
        isRunning={isRunning}
        onPauseOrResume={handlePauseOrResume}
        onDelete={handleDelete}
      />
    </div>
  );
}
