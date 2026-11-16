// A flat rounded rectangle as plain arrays (no Babylon), centred on the origin in the xy plane.
// The HUD stacks these to build tin Boxes, the rubber Buffer mat, holes and rings.

export interface RectData {
  positions: number[];
  indices: number[];
  normals: number[];
}

const ARC_SEGMENTS = 6;

/** A triangle fan from the centre around the outline. The radius is clamped to fit. */
export function roundedRectData(w: number, h: number, radius: number): RectData {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const positions = [0, 0, 0];
  const corners: [number, number, number][] = [
    [1, 1, 0],
    [-1, 1, 0.5],
    [-1, -1, 1],
    [1, -1, 1.5],
  ];
  for (const [sx, sy, turns] of corners) {
    for (let j = 0; j <= ARC_SEGMENTS; j++) {
      const a = (turns + (j / ARC_SEGMENTS) * 0.5) * Math.PI;
      positions.push(sx * (w / 2 - r) + Math.cos(a) * r, sy * (h / 2 - r) + Math.sin(a) * r, 0);
    }
  }
  const ring = positions.length / 3 - 1;
  const indices: number[] = [];
  for (let i = 0; i < ring; i++) indices.push(0, 1 + i, 1 + ((i + 1) % ring));
  const normals = positions.map((_, i) => (i % 3 === 2 ? -1 : 0));
  return { positions, indices, normals };
}
