// Render quality settings: 4x MSAA and a device pixel ratio capped at about 2.

export const MSAA_SAMPLES = 4;
export const MAX_PIXEL_RATIO = 2;

/** The engine's hardware scaling level for a device pixel ratio (below 1 renders sharper). */
export function hardwareScalingFor(devicePixelRatio: number, maxRatio = MAX_PIXEL_RATIO): number {
  const ratio = Math.min(Math.max(devicePixelRatio, 1), maxRatio);
  return 1 / ratio;
}

/** Quality knobs for trying settings on a device: `?dpr=1.5` caps the pixel ratio, `?aa=0` drops MSAA. */
export function qualityFromSearch(search: string): { maxPixelRatio: number; antialias: boolean } {
  const params = new URLSearchParams(search);
  const dpr = Number(params.get('dpr'));
  return {
    maxPixelRatio: dpr >= 1 ? dpr : MAX_PIXEL_RATIO,
    antialias: params.get('aa') !== '0',
  };
}
