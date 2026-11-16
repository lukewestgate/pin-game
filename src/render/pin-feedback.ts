// Pure curves for the tap feedback (ticket 13): the Blocked shake and the red flash.
import type { FeedbackConstants } from '../input/constants';

/** Signed shake distance `elapsed` ms after a Blocked tap: decaying cycles, zero when over. */
export function wiggleOffset(elapsed: number, K: FeedbackConstants): number {
  if (elapsed < 0 || elapsed >= K.wiggleMs) return 0;
  const p = elapsed / K.wiggleMs;
  return K.wiggleAmp * Math.sin(p * 2 * Math.PI * K.wiggleCycles) * (1 - p);
}

/** Red overlay strength 1 → 0 across the flash. */
export function flashStrength(elapsed: number, K: FeedbackConstants): number {
  if (elapsed < 0 || elapsed >= K.flashMs) return 0;
  return 1 - elapsed / K.flashMs;
}

/** A unit vector perpendicular to a Pin's pull-out direction. */
export function perpendicular(dir: readonly [number, number, number]): [number, number, number] {
  const [x, y, z] = dir;
  // cross(dir, up), or cross(dir, x-axis) when the Pin points straight up or down.
  const [cx, cy, cz] = Math.abs(y) > 0.99 ? [0, z, -y] : [-z, 0, x];
  const len = Math.hypot(cx, cy, cz) || 1;
  return [cx / len, cy / len, cz / len];
}

/** A Peeked Part's opacity after `dtMs`: fades towards `peekAlpha` while Peeking, else back to 1. */
export function peekStep(
  alpha: number,
  peeking: boolean,
  dtMs: number,
  K: FeedbackConstants,
): number {
  const step = ((1 - K.peekAlpha) * Math.max(0, dtMs)) / K.peekFadeMs;
  return peeking ? Math.max(K.peekAlpha, alpha - step) : Math.min(1, alpha + step);
}
