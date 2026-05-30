import { Button, Spinner } from 'flowbite-react';

export type RenderControlsProps = {
  isPausingOrResuming: boolean;
  isPaused: boolean;
  isPausing: boolean;
  isRunning: boolean;
  onPauseOrResume: () => void;
  onDelete: () => void;
};

export function RenderControls(props: RenderControlsProps) {
  const { isPausingOrResuming, isPaused, isPausing, isRunning, onPauseOrResume, onDelete } = props;

  return (
    <div className="flex justify-evenly gap-2">
      <Button
        color={isPaused || isPausing ? 'default' : 'yellow'}
        outline
        onClick={onPauseOrResume}
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

      <Button color="red" onClick={onDelete} disabled={isPausing || isRunning}>
        Delete Render
      </Button>
    </div>
  );
}
