import {
  isRenderStateCreated,
  isRenderStateFinishedCheckpointIteration,
  isRenderStatePaused,
  isRenderStatePausing,
  isRenderStateRunning,
  type Render,
} from '../utils/api';
import type { UseQueryResult } from '@tanstack/react-query';
import { Progress, Spinner } from 'flowbite-react';

interface RenderDisplayProps {
  renderQuery: UseQueryResult<Render, Error>;
  imageURLQuery: UseQueryResult<string, Error>;
}

export default function RenderDisplay({
  renderQuery,
  imageURLQuery,
}: RenderDisplayProps) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 px-8">
      {/* checkpoint image */}
      {imageURLQuery.isPending && <p>Loading...</p>}
      {imageURLQuery.isError && <p>Error loading render!!</p>}
      {imageURLQuery.isSuccess && (
        <img alt="Render" src={imageURLQuery.data} />
      )}

      {/* render state */}
      {renderQuery.isPending && (
        <div className="flex justify-center p-4">
          <Spinner size="lg" color="info" />
        </div>
      )}
      {renderQuery.isError && <p>Error loading render!!</p>}
      {renderQuery.isSuccess && (
        <StateDisplay
          state={renderQuery.data.state}
          totalCheckpoints={
            renderQuery.data.config.parameters.total_checkpoints
          }
        />
      )}
    </div>
  );
}

interface StateDisplayProps {
  state: Render['state'];
  totalCheckpoints: number;
}

function StateDisplay({ state, totalCheckpoints }: StateDisplayProps) {
  if (isRenderStateCreated(state)) {
    return <p>CREATED</p>;
  }

  if (isRenderStateRunning(state)) {
    const progress = state.running.progress_info.progress;
    return (
      <>
        <div className="w-full px-32">
          <Progress
            progress={Math.round(progress * 100)}
            color="blue"
            size="lg"
            labelProgress
            labelText
          />
        </div>
        <p>
          Running to checkpoint {state.running.checkpoint_iteration} /{' '}
          {totalCheckpoints}
        </p>
      </>
    );
  }

  if (isRenderStateFinishedCheckpointIteration(state)) {
    return (
      <p>
        Finished checkpoint {state.finished_checkpoint_iteration} /{' '}
        {totalCheckpoints}
      </p>
    );
  }

  if (isRenderStatePausing(state)) {
    const progress = state.pausing.progress_info.progress;
    return (
      <>
        <div className="w-full px-32">
          <Progress
            progress={Math.round(progress * 100)}
            color="yellow"
            size="lg"
            labelProgress
            labelText
          />
        </div>
        <p>
          Pausing at checkpoint {state.pausing.checkpoint_iteration} /{' '}
          {totalCheckpoints}
        </p>
      </>
    );
  }

  if (isRenderStatePaused(state)) {
    return (
      <p>
        Paused at checkpoint {state.paused} / {totalCheckpoints}
      </p>
    );
  }

  return <p>Unknown state</p>;
}
