// The Head-mark atlas, drawn in code: one strip of square cells, one per Head mark. Each pixel
// stores two masks: R is the recess wall (the mark's shape) and G is its floor (the same shape
// shifted down, clipped to the wall). The material turns them into colour x 0.3 and colour x 0.5.
// Cell 0 is the default cross; the six drives sit in palette order (cell = colour index), so
// the colour-blind setting only changes the per-instance index.

export const MARKS = ['cross', 'slot', 'hex', 'torx', 'square', 'triangle'] as const;
export const MARK_CELLS = 8;
export const MARK_CELL_SIZE = 64;
/** How far the floor sits below the wall, as a fraction of the cell. */
export const FLOOR_SHIFT = 0.07;

type Shape = (u: number, v: number) => boolean;

/** A plus sign with rounded arm ends, centred in the cell. */
const cross: Shape = (u, v) => {
  const half = 0.07; // half the arm width
  const reach = 0.3; // arm length from the centre
  const bar = (along: number, across: number) =>
    Math.abs(across) <= half && Math.abs(along) <= reach - half;
  const cap = (cx: number, cy: number) => Math.hypot(u - 0.5 - cx, v - 0.5 - cy) <= half;
  const x = u - 0.5;
  const y = v - 0.5;
  return (
    bar(x, y) ||
    bar(y, x) ||
    cap(reach - half, 0) ||
    cap(-(reach - half), 0) ||
    cap(0, reach - half) ||
    cap(0, -(reach - half))
  );
};

/** A single horizontal bar with rounded ends. */
const slot: Shape = (u, v) => {
  const half = 0.06;
  const reach = 0.3;
  const x = u - 0.5;
  const y = v - 0.5;
  const dx = Math.max(0, Math.abs(x) - (reach - half));
  return Math.hypot(dx, y) <= half;
};

/** A regular hexagon with vertices left and right, so the top and bottom are flat. */
const hex: Shape = (u, v) => {
  const r = 0.28;
  const x = Math.abs(u - 0.5);
  const y = Math.abs(v - 0.5);
  return (
    y <= r * Math.cos(Math.PI / 6) &&
    x * Math.cos(Math.PI / 6) + y * 0.5 <= r * Math.cos(Math.PI / 6)
  );
};

/** A six-lobed star, a Torx drive. */
const torx: Shape = (u, v) => {
  const x = u - 0.5;
  const y = v - 0.5;
  return Math.hypot(x, y) <= 0.22 + 0.07 * Math.cos(6 * Math.atan2(y, x));
};

const square: Shape = (u, v) => Math.abs(u - 0.5) <= 0.22 && Math.abs(v - 0.5) <= 0.22;

/** An upward triangle, apex at the top. */
const triangle: Shape = (u, v) => {
  const top = 0.24;
  const bottom = 0.72;
  return v >= top && v <= bottom && Math.abs(u - 0.5) <= ((v - top) / (bottom - top)) * 0.27;
};

const SHAPES: Record<(typeof MARKS)[number], Shape> = { cross, slot, hex, torx, square, triangle };

/**
 * The atlas cell for a Pin of `colour`. With the setting off every Pin gets the cross. Colours
 * past the sixth reuse drives (the game has five colours today).
 */
export function markIndexFor(colour: number, screwShapes: boolean): number {
  return screwShapes ? colour % MARKS.length : 0;
}

/** RGBA bytes for the whole strip, MARK_CELLS * MARK_CELL_SIZE wide. Row 0 is v = 0. */
export function markAtlasPixels(): Uint8Array {
  const width = MARK_CELLS * MARK_CELL_SIZE;
  const pixels = new Uint8Array(width * MARK_CELL_SIZE * 4);
  MARKS.forEach((mark, cell) => {
    const shape = SHAPES[mark];
    for (let py = 0; py < MARK_CELL_SIZE; py++) {
      for (let px = 0; px < MARK_CELL_SIZE; px++) {
        const u = (px + 0.5) / MARK_CELL_SIZE;
        const v = (py + 0.5) / MARK_CELL_SIZE;
        const wall = shape(u, v);
        // The floor at v is the wall's shape at v - shift: it has moved towards larger v.
        const floor = wall && shape(u, v - FLOOR_SHIFT);
        const o = (py * width + cell * MARK_CELL_SIZE + px) * 4;
        pixels[o] = wall ? 255 : 0;
        pixels[o + 1] = floor ? 255 : 0;
        pixels[o + 3] = 255;
      }
    }
  });
  return pixels;
}

/** Black at 25% where a drive's recess wall is: the faint drive shown in empty Box holes. */
export const HOLE_MARK_ALPHA = 0.25;
export function holeMarkPixels(): Uint8Array {
  const pixels = markAtlasPixels();
  const alpha = Math.round(HOLE_MARK_ALPHA * 255);
  const out = new Uint8Array(pixels.length); // black (0, 0, 0) with alpha only on the wall
  for (let o = 0; o < pixels.length; o += 4) out[o + 3] = pixels[o] === 255 ? alpha : 0;
  return out;
}
