import { Progress, type ProgressTheme } from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';

export type ProgressStateProps = {
  progress: number;
  color: 'blue' | 'yellow';
  label: string;
  checkpoint: number;
  totalCheckpoints: number;
};

export function ProgressState(props: ProgressStateProps) {
  const { progress, color, label, checkpoint, totalCheckpoints } = props;

  const progressTheme: DeepPartial<ProgressTheme> = {
    bar: 'transition-[width] duration-500 ease-in-out',
  };

  return (
    <>
      <div className="w-full px-32">
        <Progress
          progress={Math.round(progress * 100)}
          color={color}
          size="lg"
          labelProgress
          progressLabelPosition="inside"
          theme={progressTheme}
        />
      </div>
      <p>
        {label} at checkpoint {checkpoint} / {totalCheckpoints}
      </p>
    </>
  );
}
