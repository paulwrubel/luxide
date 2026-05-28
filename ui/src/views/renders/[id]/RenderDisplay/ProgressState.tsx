import { Progress, type ProgressTheme } from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';

export type ProgressStateProps = {
  progress: number;
  color: 'blue' | 'yellow';
  label: string;
  checkpoint: number;
  totalCheckpoints: number;
  samplesPerCheckpoint?: number;
};

export function ProgressState(props: ProgressStateProps) {
  const { progress, color, label, checkpoint, totalCheckpoints, samplesPerCheckpoint } = props;

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
      <div className="mt-2 flex items-center justify-between text-sm text-zinc-400">
        <span>{label} checkpoint {checkpoint} / {totalCheckpoints}</span>
        {samplesPerCheckpoint !== undefined && (
          <span>{Math.round(progress * samplesPerCheckpoint)} of {samplesPerCheckpoint} samples</span>
        )}
      </div>
    </div>
  );
}
