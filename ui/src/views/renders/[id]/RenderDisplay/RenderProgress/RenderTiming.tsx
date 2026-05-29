type TimingData = {
  elapsed: string;
  remaining: string;
  total: string;
};

export type RenderTimingProps = {
  title: string;
  timings: TimingData | null;
};

export function RenderTiming(props: RenderTimingProps) {
  const { title, timings } = props;

  return (
    <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h4>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Elapsed</span>
          <span className="text-zinc-300">{timings?.elapsed ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Remaining</span>
          <span className="text-zinc-300">{timings?.remaining ?? '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Total</span>
          <span className="text-zinc-300">{timings?.total ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
