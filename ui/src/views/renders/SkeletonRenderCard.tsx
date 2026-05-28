export function SkeletonRenderCard() {
  return (
    <div className="rounded-lg border-none bg-zinc-800">
      {/* image area placeholder — matches aspect-video + bg-zinc-900 of real card */}
      <div className="aspect-video animate-pulse bg-zinc-700" />
      {/* progress bar placeholder — matches h-1.5 reserved space */}
      <div className="h-1.5 bg-zinc-700" />
      {/* bottom strip placeholder — matches p-3 flex layout */}
      <div className="flex items-center justify-between p-3">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-700" />
        <div className="h-4 w-12 animate-pulse rounded bg-zinc-700" />
      </div>
    </div>
  );
}
