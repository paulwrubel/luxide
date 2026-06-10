import { useState } from 'react';
import { Progress, type ProgressTheme } from 'flowbite-react';
import type { DeepPartial } from 'flowbite-react/types';

export type ProgressStateProps = {
  progress: number; // 0.0 to 1.0
  color: 'blue' | 'yellow';
};

export function ProgressState(props: ProgressStateProps) {
  const { progress, color } = props;

  // disable the CSS width transition when progress decreases
  // (new checkpoint started), so the bar snaps instead of animating backwards.
  // a 2-element array preserves history so the re-render after setState still
  // sees the previous value and can compute the correct direction.
  const [stack, setStack] = useState([progress, progress]);
  const increasing = stack[1] >= stack[0];
  if (stack[1] !== progress) {
    setStack([stack[1], progress]);
  }

  const progressTheme: DeepPartial<ProgressTheme> = {
    bar: increasing ? 'transition-[width] duration-50 ease-linear' : '',
  };

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <div className="w-full">
        <Progress
          // @ts-expect-error — toFixed returns a string but Flowbite handles the numeric coercion internally
          progress={(Math.round(progress * 1_000) / 10).toFixed(1)}
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
