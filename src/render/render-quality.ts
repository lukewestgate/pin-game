// Render quality settings: 4x MSAA and a device pixel ratio capped at about 2.

export const MSAA_SAMPLES = 4;
export const MAX_PIXEL_RATIO = 2;

/** The engine's hardware scaling level for a device pixel ratio (below 1 renders sharper). */
export function hardwareScalingFor(devicePixelRatio: number): number {
  const ratio = Math.min(Math.max(devicePixelRatio, 1), MAX_PIXEL_RATIO);
  return 1 / ratio;
}
