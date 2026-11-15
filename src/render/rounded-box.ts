// Rounded, bevelled box geometry as plain arrays (no Babylon), ported from the Car Model toy look
// prototype. Corners are arcs of radius `round`, edges are bevelled by the same amount, and the
// radius is clamped to fit the box. Normals are smooth. UVs are box-projected by the dominant
// normal axis, one texture repeat per UV_REPEAT_UNITS.

/** Model units per texture repeat. */
export const UV_REPEAT_UNITS = 1.2;
/** Default edge radius, capped to 0.45 of the smallest side (UI visual style). */
export const DEFAULT_ROUND = 0.07;

export interface MeshData {
  positions: number[];
  indices: number[];
  normals: number[];
  uvs: number[];
}

type Vec = [number, number, number];

/** `size` is [width (x), height (y), depth (z)]; the box is centred on the origin. */
export function roundedBoxData(size: readonly [number, number, number], round?: number): MeshData {
  const [W, H, D] = size;
  const wanted = round ?? Math.min(DEFAULT_ROUND, 0.45 * Math.min(W, H, D));
  const r = Math.max(0.0005, Math.min(wanted, W / 2 - 1e-4, D / 2 - 1e-4));
  const b = Math.max(0, Math.min(wanted, r, H / 2 - 1e-4));
  const n = 5;
  const k = b > 0 ? 4 : 0;

  const rings: { y: number; inset: number }[] = [];
  if (k) {
    for (let i = 0; i <= k; i++) {
      const t = ((i / k) * Math.PI) / 2;
      rings.push({ y: -H / 2 + b - b * Math.cos(t), inset: b - b * Math.sin(t) });
    }
    for (let i = 0; i <= k; i++) {
      const t = Math.PI / 2 - ((i / k) * Math.PI) / 2;
      rings.push({ y: H / 2 - b + b * Math.cos(t), inset: b - b * Math.sin(t) });
    }
  } else {
    rings.push({ y: -H / 2, inset: 0 }, { y: H / 2, inset: 0 });
  }

  const corners: [number, number, number][] = [
    [1, 1, 0],
    [-1, 1, 0.5],
    [-1, -1, 1],
    [1, -1, 1.5],
  ];
  const ringPoints = (y: number, inset: number): number[] => {
    const pts: number[] = [];
    const rr = Math.max(1e-4, r - inset);
    for (const [sx, sz, a0] of corners) {
      for (let j = 0; j <= n; j++) {
        const a = (a0 + (j / n) * 0.5) * Math.PI;
        pts.push(sx * (W / 2 - r) + Math.cos(a) * rr, y, sz * (D / 2 - r) + Math.sin(a) * rr);
      }
    }
    return pts;
  };

  const positions: number[] = [];
  const indices: number[] = [];
  const M = corners.length * (n + 1);
  for (const ring of rings) positions.push(...ringPoints(ring.y, ring.inset));
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < M; i++) {
      const a = j * M + i;
      const b2 = j * M + ((i + 1) % M);
      const c = (j + 1) * M + i;
      const d = (j + 1) * M + ((i + 1) % M);
      indices.push(a, c, b2, b2, c, d);
    }
  }
  const cap = (ring: { y: number; inset: number }, y: number): void => {
    const base = positions.length / 3;
    positions.push(...ringPoints(ring.y, ring.inset));
    const centre = positions.length / 3;
    positions.push(0, y, 0);
    for (let i = 0; i < M; i++) indices.push(centre, base + i, base + ((i + 1) % M));
  };
  const first = rings[0];
  const last = rings[rings.length - 1];
  if (!first || !last) throw new Error('no rings');
  cap(first, -H / 2);
  cap(last, H / 2);

  const at = (i: number): Vec => [
    positions[3 * i] as number,
    positions[3 * i + 1] as number,
    positions[3 * i + 2] as number,
  ];
  // Wind every triangle the same way as Babylon's front faces, judged from the box centre.
  const normals = new Array<number>(positions.length).fill(0);
  for (let t = 0; t < indices.length; t += 3) {
    const [i0, i1, i2] = [indices[t], indices[t + 1], indices[t + 2]] as [number, number, number];
    const A = at(i0);
    const B = at(i1);
    const C = at(i2);
    const u: Vec = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const v: Vec = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    let cross: Vec = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const centroid = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3];
    if (
      cross[0] * (centroid[0] as number) +
        cross[1] * (centroid[1] as number) +
        cross[2] * (centroid[2] as number) >
      0
    ) {
      indices[t + 1] = i2;
      indices[t + 2] = i1;
      cross = [-cross[0], -cross[1], -cross[2]];
    }
    // Front faces have the cross product pointing inward, so outward is its negative.
    for (const i of [i0, i1, i2]) {
      normals[3 * i] = (normals[3 * i] as number) - cross[0];
      normals[3 * i + 1] = (normals[3 * i + 1] as number) - cross[1];
      normals[3 * i + 2] = (normals[3 * i + 2] as number) - cross[2];
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len =
      Math.hypot(normals[i] as number, normals[i + 1] as number, normals[i + 2] as number) || 1;
    normals[i] = (normals[i] as number) / len;
    normals[i + 1] = (normals[i + 1] as number) / len;
    normals[i + 2] = (normals[i + 2] as number) / len;
  }

  const uvs: number[] = [];
  for (let i = 0; i < positions.length / 3; i++) {
    const [x, y, z] = at(i);
    const nx = Math.abs(normals[3 * i] as number);
    const ny = Math.abs(normals[3 * i + 1] as number);
    const nz = Math.abs(normals[3 * i + 2] as number);
    const [u, v] = ny >= nx && ny >= nz ? [x, z] : nx >= nz ? [z, y] : [x, y];
    uvs.push(u / UV_REPEAT_UNITS, v / UV_REPEAT_UNITS);
  }
  return { positions, indices, normals, uvs };
}
