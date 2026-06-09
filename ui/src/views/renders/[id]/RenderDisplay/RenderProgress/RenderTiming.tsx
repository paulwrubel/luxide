import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import type { Duration as ApiDuration } from '@/utils/api';
import { formatDuration } from '@/utils/duration';

export type RenderTimingData = {
  elapsed: ApiDuration;
  remaining: ApiDuration;
  total: ApiDuration;
  remainingSeconds?: number;
};

export type RenderTimingProps = {
  title: string;
  timings?: RenderTimingData;
};

function formatCompletionTime(now: number, remainingSeconds: number): string {
  const dt = DateTime.fromMillis(now + remainingSeconds * 1000);
  if (remainingSeconds < 86400) {
    return dt.toLocaleString(DateTime.TIME_SIMPLE);
  }
  return dt.toLocaleString({
    month: 'long',
    day: 'numeric',
    year: dt.year !== DateTime.now().year ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function RenderTiming(props: RenderTimingProps) {
  const { title, timings } = props;

  // track current time as state, updating every second
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, []);

  const localCompletionTime =
    timings?.remainingSeconds && timings.remainingSeconds > 0
      ? formatCompletionTime(now, timings.remainingSeconds)
      : null;

  const elapsedFormatted = timings?.elapsed ? formatDuration(timings.elapsed) : '—';
  const remainingFormatted = timings?.remaining ? formatDuration(timings.remaining) : '—';
  const totalFormatted = timings?.total ? formatDuration(timings.total) : '—';

  return (
    <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
      <h4 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">{title}</h4>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Elapsed</span>
          <span className="text-zinc-300">{elapsedFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Remaining</span>
          <span className="flex gap-2 text-zinc-300">
            {localCompletionTime && <span className="text-zinc-500">({localCompletionTime}) </span>}
            {remainingFormatted}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Total</span>
          <span className="text-zinc-300">{totalFormatted}</span>
        </div>
      </div>
    </div>
  );
}
