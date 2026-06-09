import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';

export type RenderTimingData = {
  elapsed: string;
  remaining: string;
  total: string;
  remainingSeconds?: number;
};

export type RenderTimingProps = {
  title: string;
  timings?: RenderTimingData;
};

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

function formatCompletionTime(now: number, remainingSeconds: number): string {
  const dt = DateTime.fromMillis(now + remainingSeconds * 1000);
  if (remainingSeconds < 86400) {
    return dt.toLocaleString(DateTime.TIME_SIMPLE);
  }
  return dt.toLocaleString({
    month: 'long',
    day: 'numeric',
    year: remainingSeconds >= SECONDS_PER_YEAR ? 'numeric' : undefined,
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

  const localCompletion =
    timings?.remainingSeconds && timings.remainingSeconds > 0
      ? formatCompletionTime(now, timings.remainingSeconds)
      : null;

  return (
    <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
      <h4 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">{title}</h4>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Elapsed</span>
          <span className="text-zinc-300">{timings?.elapsed ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Remaining</span>
          <span className="flex gap-2 text-zinc-300">
            {localCompletion && <span className="text-zinc-500">({localCompletion}) </span>}
            {timings?.remaining ?? '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Total</span>
          <span className="text-zinc-300">{timings?.total ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
