// The Pin's geometry as plain arrays (no Babylon): a pan head, its ink-outline shell and the
// threaded shank. The head sits on y = 0 and points up; the shank hangs below y = 0.
// Pan head: diameter 0.24, flat rim 0.03, then a quarter-round dome to about 0.076.
import type { MeshData } from './rounded-box';

export const PIN_HEAD = { diameter: 0.24, rim: 0.03, height: 0.076, segments: 14 } as const;
const DOME_STEPS = 6;
const SHANK = { core: 0.05, thread: 0.066, pitch: 0.045 } as const;

/** A lathe profile point: radius, height, outward normal in the profile plane, and mark flag. */
interface Point {
  r: number;
  y: number;
  nr: number;
  ny: number;
  mark?: boolean;
}

/** Each group is a run of points joined by strips; groups are not joined to each other. */
function lathe(groups: Point[][], segments: number, markRadius = 1): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const group of groups) {
    const base = positions.length / 3;
    for (const p of group) {
      for (let s = 0; s < segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const [c, sn] = [Math.cos(a), Math.sin(a)];
        positions.push(p.r * c, p.y, p.r * sn);
        normals.push(p.nr * c, p.ny, p.nr * sn);
        // The head disc gets 0..1 cell UVs (v grows towards +z); everything else gets -1.
        if (p.mark)
          uvs.push(0.5 + (p.r * c) / (2 * markRadius), 0.5 + (p.r * sn) / (2 * markRadius));
        else uvs.push(-1, -1);
      }
    }
    for (let i = 0; i < group.length - 1; i++) {
      for (let s = 0; s < segments; s++) {
        const a = base + i * segments + s;
        const b = base + i * segments + ((s + 1) % segments);
        const c = base + (i + 1) * segments + s;
        const d = base + (i + 1) * segments + ((s + 1) % segments);
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  orient(positions, normals, indices);
  return { positions, indices, normals, uvs };
}

/** Flips any triangle whose winding disagrees with its vertex normals (Babylon fronts face away
 * from the cross product), so every face is drawn from outside. */
function orient(positions: number[], normals: number[], indices: number[]): void {
  const p = (i: number, k: number) => positions[3 * i + k] as number;
  for (let t = 0; t < indices.length; t += 3) {
    const [i0, i1, i2] = [indices[t], indices[t + 1], indices[t + 2]] as [number, number, number];
    const u = [p(i1, 0) - p(i0, 0), p(i1, 1) - p(i0, 1), p(i1, 2) - p(i0, 2)] as const;
    const v = [p(i2, 0) - p(i0, 0), p(i2, 1) - p(i0, 1), p(i2, 2) - p(i0, 2)] as const;
    const cross = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ] as const;
    const dot = [i0, i1, i2].reduce(
      (sum, i) =>
        sum +
        cross[0] * (normals[3 * i] as number) +
        cross[1] * (normals[3 * i + 1] as number) +
        cross[2] * (normals[3 * i + 2] as number),
      0,
    );
    if (dot > 0) {
      indices[t + 1] = i2;
      indices[t + 2] = i1;
    }
  }
}

const unit = (x: number, y: number): [number, number] => {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
};

function headProfile(): Point[][] {
  const R = PIN_HEAD.diameter / 2;
  const { rim, height } = PIN_HEAD;
  const dome = height - rim;
  const flat = R - dome;
  const arc: Point[] = [];
  for (let i = 0; i <= DOME_STEPS; i++) {
    const a = (i / DOME_STEPS) * (Math.PI / 2);
    arc.push({
      r: flat + dome * Math.cos(a),
      y: rim + dome * Math.sin(a),
      nr: Math.cos(a),
      ny: Math.sin(a),
    });
  }
  return [
    [
      { r: 0, y: 0, nr: 0, ny: -1 },
      { r: R, y: 0, nr: 0, ny: -1 },
    ],
    [
      { r: R, y: 0, nr: 1, ny: 0 },
      { r: R, y: rim, nr: 1, ny: 0 },
    ],
    arc,
    [
      { r: flat, y: height, nr: 0, ny: 1, mark: true },
      { r: 0, y: height, nr: 0, ny: 1, mark: true },
    ],
  ];
}

/** The head. Its flat top disc carries cell UVs; the rest has UV -1 so the atlas skips it. */
export function pinHeadData(): MeshData {
  const dome = PIN_HEAD.height - PIN_HEAD.rim;
  return lathe(headProfile(), PIN_HEAD.segments, PIN_HEAD.diameter / 2 - dome);
}

/** The ink outline: the head pushed out `width` along smoothed normals, wound inside out, so
 * only its far side shows as a silhouette line (an inverted hull). */
export function pinOutlineData(width: number): MeshData {
  const head = pinHeadData();
  const n = head.positions.length / 3;
  // Vertices at the same spot (the hard bottom edge) share one averaged push direction.
  const key = (i: number) =>
    [0, 1, 2].map((k) => (head.positions[3 * i + k] as number).toFixed(5)).join(',');
  const sums = new Map<string, [number, number, number]>();
  for (let i = 0; i < n; i++) {
    const sum = sums.get(key(i)) ?? [0, 0, 0];
    for (let k = 0; k < 3; k++) sum[k] = (sum[k] as number) + (head.normals[3 * i + k] as number);
    sums.set(key(i), sum);
  }
  const positions = head.positions.map((value, j) => {
    const i = Math.floor(j / 3);
    const sum = sums.get(key(i)) as [number, number, number];
    const len = Math.hypot(...sum) || 1;
    return value + (width * (sum[j % 3] as number)) / len;
  });
  const indices: number[] = [];
  for (let t = 0; t < head.indices.length; t += 3) {
    indices.push(
      head.indices[t] as number,
      head.indices[t + 2] as number,
      head.indices[t + 1] as number,
    );
  }
  return { positions, indices, normals: head.normals, uvs: head.uvs };
}

/** A threaded shank of `length`, hanging from y = 0: ridges every `pitch`, then a blunt tip. */
export function shankData(length: number): MeshData {
  const { core, thread, pitch } = SHANK;
  const pts: Point[] = [];
  const turns = Math.max(1, Math.floor(length / pitch));
  const step = length / turns;
  for (let t = 0; t <= turns; t++) {
    const y = -t * step;
    pts.push({ r: core, y, ...ridgeNormal(0) });
    if (t < turns) pts.push({ r: thread, y: y - step / 2, ...ridgeNormal(1) });
  }
  const [tr, ty] = unit(1, -1);
  pts.push({ r: core * 0.6, y: -length, nr: tr, ny: ty }, { r: 0, y: -length, nr: 0, ny: -1 });
  return lathe([pts], 10);
}

/** Ridge crests and roots face mostly sideways; this keeps the shading soft without a slope fit. */
function ridgeNormal(crest: 0 | 1): { nr: number; ny: number } {
  const [nr, ny] = unit(1, crest ? 0 : 0.15);
  return { nr, ny };
}
