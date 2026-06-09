import { Duration as LuxonDuration } from 'luxon';
import { type Duration as ApiDuration } from './api';

export function isApiDuration(duration: LuxonDuration | ApiDuration): duration is ApiDuration {
  return 'nanos' in duration;
}

/**
 * Formats a luxon Duration into a human-readable string.
 * - < 60 seconds: "Xs" or "<1s"
 * - 1-59 minutes: "Xm Ys"
 * - >= 1 hour: "Xh Ym Zs"
 * - >= 1 year: "Xy Yd Zh Am Bs"
 * - >= 1 day: "Xd Yh Zm Ws"
 *
 * rounds sub-second values down (ignores sub-second precision).
 */
export function formatDuration(duration: LuxonDuration | ApiDuration): string {
  const luxonDuration = isApiDuration(duration)
    ? LuxonDuration.fromObject({ seconds: duration.secs, milliseconds: duration.nanos / 1_000_000 })
    : duration;

  if (luxonDuration.as('seconds') < 1 && luxonDuration.milliseconds > 0) {
    return '<1s';
  }

  if (luxonDuration.as('seconds') < 60) {
    return `${Math.floor(luxonDuration.as('seconds'))}s`;
  }

  const shifted = luxonDuration.shiftTo('years', 'days', 'hours', 'minutes', 'seconds');
  const y = Math.floor(shifted.years);
  const d = Math.floor(shifted.days);
  const h = Math.floor(shifted.hours);
  const m = Math.floor(shifted.minutes);
  const s = Math.floor(shifted.seconds);

  if (y > 0) {
    return `${y}y ${d}d ${h}h ${m}m ${s}s`;
  }
  if (d > 0) {
    return `${d}d ${h}h ${m}m ${s}s`;
  }
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${m}m ${s}s`;
}
