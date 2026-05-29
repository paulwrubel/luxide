import { Progress, type ProgressTheme } from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';

export type ProgressStateProps = {
  progress: number; // 0.0 to 1.0
  color: 'blue' | 'yellow';
};

export function ProgressState(props: ProgressStateProps) {
  const { progress, color } = props;

  const progressTheme: DeepPartial<ProgressTheme> = {
    bar: 'transition-[width] duration-500 ease-in-out',
  };

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <div className="w-full">
        <Progress
          progress={Math.round(progress * 100)}
          color={color}
          size="lg"
          labelProgress
          progressLabelPosition="inside"
          theme={progressTheme}
        />
      </div>
    </div>
  );
}
