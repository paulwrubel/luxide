export type Duration = {
  secs: number;
  nanos: number;
};

/**
 * Formats a Duration into a human-readable string.
 * - < 60 seconds: "Xs" or "<1s"
 * - 1-59 minutes: "Xm Ys"
 * - >= 1 hour: "Xh Ym Zs"
 *
 * rounds nanos down (ignores sub-second precision).
 */
export function formatDuration(duration: Duration): string {
  const { secs, nanos } = duration;

  if (secs === 0 && nanos > 0) {
    return '<1s';
  }

  if (secs < 60) {
    return `${secs}s`;
  }

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSecs}s`;
  }

  return `${minutes}m ${remainingSecs}s`;
}
