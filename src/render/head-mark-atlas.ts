// The Head-mark atlas, drawn in code: one strip of square cells, one per Head mark. Each pixel
// stores two masks: R is the recess wall (the mark's shape) and G is its floor (the same shape
// shifted down, clipped to the wall). The material turns them into colour x 0.3 and colour x 0.5.
// This ticket draws only the cross; ticket 30 adds the drives, which fill the later cells.

export const MARKS = ['cross'] as const;
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

const SHAPES: Record<(typeof MARKS)[number], Shape> = { cross };

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
