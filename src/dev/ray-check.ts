// Dev-only ray check: casts along each Socket's pull-out axis and compares the Parts it hits with
// the hand-written `coveredBy` list. Warnings only, never a gate: `coveredBy` is the source of truth.
// Each shape is approximated by its local bounding box, so rounded or curved shapes can over-hit.
import type { ModelData, Shape } from '../content/schema';

type V3 = readonly [number, number, number];

export interface RayWarning {
  socket: string;
  part: string;
  /** Listed in `coveredBy` but not hit by the ray. */
  missing: string[];
  /** Hit by the ray but not listed in `coveredBy`. */
  extra: string[];
  message: string;
}

/** Keeps the ray off the Socket's own surface. */
const EPSILON = 1e-4;

function rotX([x, y, z]: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}
function rotY([x, y, z]: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}
function rotZ([x, y, z]: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c, z];
}

/** Babylon's `rotation` Euler order: Z first, then X, then Y. */
function rotate(v: V3, r: V3): V3 {
  return rotY(rotX(rotZ(v, r[2]), r[0]), r[1]);
}
function unrotate(v: V3, r: V3): V3 {
  return rotZ(rotX(rotY(v, -r[1]), -r[0]), -r[2]);
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const ZERO: V3 = [0, 0, 0];

/** Full extents of a shape's bounding box in its own space (Babylon builders, Y up). */
function extents(shape: Shape): V3 {
  switch (shape.kind) {
    case 'box':
    case 'sphere':
      return shape.size;
    case 'cylinder':
      return [shape.diameter, shape.height, shape.diameter];
    case 'torus': {
      const outer = shape.diameter + shape.thickness;
      return [outer, shape.thickness, outer];
    }
    case 'capsule':
      return [shape.radius * 2, shape.height, shape.radius * 2];
  }
}

/** Distance along the ray at which it enters the box, or null if it misses or lies behind. */
function hitBox(origin: V3, dir: V3, half: V3): number | null {
  let near = EPSILON;
  let far = Infinity;
  for (let i = 0; i < 3; i++) {
    const o = origin[i] ?? 0;
    const d = dir[i] ?? 0;
    const h = half[i] ?? 0;
    if (Math.abs(d) < 1e-12) {
      if (Math.abs(o) > h) return null;
      continue;
    }
    const t1 = (-h - o) / d;
    const t2 = (h - o) / d;
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
    if (near > far) return null;
  }
  return near;
}

export function rayCheck(model: ModelData): RayWarning[] {
  const warnings: RayWarning[] = [];
  for (const part of model.parts) {
    const partPos = part.position ?? ZERO;
    const partRot = part.rotation ?? ZERO;
    for (const socket of part.sockets) {
      const origin = add(rotate(socket.position, partRot), partPos);
      const dir = rotate(socket.direction, partRot);
      const hits = new Set<string>();
      for (const other of model.parts) {
        if (other === part) continue;
        const otherPos = other.position ?? ZERO;
        const otherRot = other.rotation ?? ZERO;
        const o1 = unrotate(sub(origin, otherPos), otherRot);
        const d1 = unrotate(dir, otherRot);
        const hit = other.shapes.some((shape) => {
          const shapeRot = shape.rotation ?? ZERO;
          const o2 = unrotate(sub(o1, shape.position), shapeRot);
          const d2 = unrotate(d1, shapeRot);
          const e = extents(shape);
          return hitBox(o2, d2, [e[0] / 2, e[1] / 2, e[2] / 2]) !== null;
        });
        if (hit) hits.add(other.id);
      }
      const listed = new Set(socket.coveredBy);
      const missing = [...listed].filter((id) => !hits.has(id));
      const extra = [...hits].filter((id) => !listed.has(id));
      if (!missing.length && !extra.length) continue;
      const bits = [
        missing.length ? `ray misses listed Part ${missing.join(', ')}` : '',
        extra.length ? `ray hits unlisted Part ${extra.join(', ')}` : '',
      ].filter(Boolean);
      warnings.push({
        socket: socket.id,
        part: part.id,
        missing,
        extra,
        message: `Socket ${socket.id} (Part ${part.id}): ${bits.join('; ')}`,
      });
    }
  }
  return warnings;
}
