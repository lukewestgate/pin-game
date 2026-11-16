import { describe, expect, it } from 'vitest';
import { PIN_HEAD, pinHeadData, pinOutlineData, shankData } from '../src/render/pin-geometry';
import {
  MARK_CELLS,
  MARK_CELL_SIZE,
  markAtlasPixels,
  markIndexFor,
  MARKS,
} from '../src/render/head-mark-atlas';
import { TOON_BANDS, toonBand, toonShaderCode } from '../src/render/toon';
import { cylinderBevel, roundedBoxData } from '../src/render/rounded-box';
import { MSAA_SAMPLES, hardwareScalingFor } from '../src/render/render-quality';

describe('bevels', () => {
  it('rounds cylinders by min(0.06, 0.2 x diameter, 0.45 x height)', () => {
    expect(cylinderBevel(1, 1)).toBe(0.06);
    expect(cylinderBevel(0.2, 1)).toBeCloseTo(0.04, 10);
    expect(cylinderBevel(1, 0.1)).toBeCloseTo(0.045, 10);
  });

  it('lets a shape set its own cylinder round, still clamped', () => {
    expect(cylinderBevel(1, 1, 0.15)).toBeCloseTo(0.15, 10);
    expect(cylinderBevel(0.2, 1, 0.3)).toBeCloseTo(0.04, 10);
  });

  it('rounds a thin box by 0.45 of its smallest side, not 0.07', () => {
    const data = roundedBoxData([1, 0.1, 1]);
    const ys = data.positions.filter((_, i) => i % 3 === 1);
    expect(Math.max(...ys)).toBeCloseTo(0.05, 6);
    // The flat top starts 0.045 in from the edge (not 0.07).
    const flatTop = [];
    for (let i = 0; i < data.positions.length; i += 3) {
      if (Math.abs((data.positions[i + 1] ?? 0) - 0.05) < 1e-6) {
        flatTop.push(Math.abs(data.positions[i] ?? 0));
      }
    }
    expect(Math.max(...flatTop)).toBeCloseTo(0.5 - 0.045, 3);
  });
});

describe('pan-head Pin geometry', () => {
  const head = pinHeadData();
  const ys = head.positions.filter((_, i) => i % 3 === 1);
  const radius = (i: number) =>
    Math.hypot(head.positions[3 * i] ?? 0, head.positions[3 * i + 2] ?? 0);

  it('is 0.24 across, a 0.03 flat rim, and about 0.076 tall', () => {
    expect(PIN_HEAD).toMatchObject({ diameter: 0.24, rim: 0.03, height: 0.076 });
    expect(Math.min(...ys)).toBeCloseTo(0, 6);
    expect(Math.max(...ys)).toBeCloseTo(0.076, 6);
    expect(Math.max(...ys.map((_, i) => radius(i)))).toBeCloseTo(0.12, 6);
    // The widest ring is a vertical wall exactly as tall as the rim.
    const wall = ys.filter((_, i) => Math.abs(radius(i) - 0.12) < 1e-6);
    expect(Math.max(...wall) - Math.min(...wall)).toBeCloseTo(0.03, 6);
  });

  it('has unit normals and indices that stay in range', () => {
    const n = head.positions.length / 3;
    expect(Math.max(...head.indices)).toBeLessThan(n);
    for (let i = 0; i < n; i++) {
      const len = Math.hypot(
        head.normals[3 * i] ?? 0,
        head.normals[3 * i + 1] ?? 0,
        head.normals[3 * i + 2] ?? 0,
      );
      expect(len).toBeCloseTo(1, 4);
    }
  });

  it('gives only the flat top disc a cell UV in 0..1, and everything else -1', () => {
    const n = head.positions.length / 3;
    let marked = 0;
    for (let i = 0; i < n; i++) {
      const u = head.uvs[2 * i] ?? 0;
      const v = head.uvs[2 * i + 1] ?? 0;
      if (u < 0) {
        expect(v).toBeLessThan(0);
        continue;
      }
      marked++;
      expect(u).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(head.positions[3 * i + 1]).toBeCloseTo(0.076, 6);
    }
    expect(marked).toBeGreaterThan(0);
  });

  it('builds an outline shell that is bigger and faces inward', () => {
    const shell = pinOutlineData(0.014);
    expect(shell.positions.length).toBe(head.positions.length);
    expect(Math.max(...shell.positions.filter((_, i) => i % 3 === 1))).toBeGreaterThan(0.076);
    expect(shell.indices.length).toBe(head.indices.length);
    // Same triangles, opposite winding.
    expect(shell.indices.slice(0, 3)).toEqual([head.indices[0], head.indices[2], head.indices[1]]);
  });

  it('draws a threaded shank of the asked length below the head', () => {
    const shank = shankData(0.3);
    const sy = shank.positions.filter((_, i) => i % 3 === 1);
    expect(Math.max(...sy)).toBeCloseTo(0, 6);
    expect(Math.min(...sy)).toBeCloseTo(-0.3, 6);
    const r = shank.positions.filter((_, i) => i % 3 === 0).map(Math.abs);
    expect(Math.max(...r)).toBeLessThan(0.12);
    // Threads: more than one distinct radius along the shank.
    expect(new Set(r.map((x) => x.toFixed(4))).size).toBeGreaterThan(2);
  });
});

describe('Head-mark atlas', () => {
  const pixels = markAtlasPixels();
  const sample = (cell: number, u: number, v: number) => {
    const x = cell * MARK_CELL_SIZE + Math.floor(u * MARK_CELL_SIZE);
    const y = Math.floor(v * MARK_CELL_SIZE);
    const o = (y * MARK_CELLS * MARK_CELL_SIZE + x) * 4;
    return { wall: pixels[o] ?? 0, floor: pixels[o + 1] ?? 0 };
  };

  it('is one strip of cells, with the cross first', () => {
    expect(pixels.length).toBe(MARK_CELLS * MARK_CELL_SIZE * MARK_CELL_SIZE * 4);
    expect(MARKS[0]).toBe('cross');
  });

  it('draws the cross as a recess: wall at the centre and arms, nothing in the corners', () => {
    expect(sample(0, 0.5, 0.5).wall).toBe(255);
    expect(sample(0, 0.5, 0.3).wall).toBe(255);
    expect(sample(0, 0.3, 0.5).wall).toBe(255);
    expect(sample(0, 0.15, 0.15).wall).toBe(0);
    expect(sample(MARKS.length, 0.5, 0.5).wall).toBe(0); // cells past the last drive stay empty
  });

  it('shifts the floor down, so the upper edge shows the wall and the lower edge does not', () => {
    const topArm = sample(0, 0.5, 0.23);
    const bottomArm = sample(0, 0.5, 0.78);
    expect(topArm).toEqual({ wall: 255, floor: 0 });
    expect(bottomArm).toEqual({ wall: 255, floor: 255 });
  });
});

describe('colour-blind drives', () => {
  const pixels = markAtlasPixels();
  const wallAt = (mark: (typeof MARKS)[number], u: number, v: number) => {
    const cell = MARKS.indexOf(mark);
    const x = cell * MARK_CELL_SIZE + Math.floor(u * MARK_CELL_SIZE);
    const y = Math.floor(v * MARK_CELL_SIZE);
    return pixels[(y * MARK_CELLS * MARK_CELL_SIZE + x) * 4] === 255;
  };
  const polar = (mark: (typeof MARKS)[number], deg: number, r: number) =>
    wallAt(
      mark,
      0.5 + r * Math.cos((deg * Math.PI) / 180),
      0.5 + r * Math.sin((deg * Math.PI) / 180),
    );

  it('holds the six drives in palette order', () => {
    expect(MARKS).toEqual(['cross', 'slot', 'hex', 'torx', 'square', 'triangle']);
  });

  it('draws every drive as a non-empty recess no two of which match', () => {
    const cells = MARKS.map((_, c) => {
      const out: number[] = [];
      for (let i = 0; i < MARK_CELL_SIZE * MARK_CELL_SIZE; i++) {
        const x = c * MARK_CELL_SIZE + (i % MARK_CELL_SIZE);
        const y = Math.floor(i / MARK_CELL_SIZE);
        out.push(pixels[(y * MARK_CELLS * MARK_CELL_SIZE + x) * 4] ?? 0);
      }
      return out;
    });
    cells.forEach((cell, i) => {
      expect(cell.filter((p) => p === 255).length).toBeGreaterThan(200);
      cells.slice(i + 1).forEach((other) => expect(other).not.toEqual(cell));
    });
  });

  it('draws the slot as one horizontal bar', () => {
    expect(wallAt('slot', 0.75, 0.5)).toBe(true);
    expect(wallAt('slot', 0.5, 0.65)).toBe(false);
  });

  it('draws the hex pointing sideways with flat top and bottom', () => {
    expect(polar('hex', 0, 0.26)).toBe(true);
    expect(polar('hex', 90, 0.26)).toBe(false);
  });

  it('draws the Torx as lobes with notches between them', () => {
    expect(polar('torx', 0, 0.27)).toBe(true);
    expect(polar('torx', 30, 0.2)).toBe(false);
  });

  it('draws the square with its corners filled', () => {
    expect(wallAt('square', 0.7, 0.7)).toBe(true);
    expect(wallAt('square', 0.8, 0.5)).toBe(false);
  });

  it('draws the triangle point up, wide at the bottom', () => {
    expect(wallAt('triangle', 0.3, 0.66)).toBe(true);
    expect(wallAt('triangle', 0.3, 0.3)).toBe(false);
    expect(wallAt('triangle', 0.5, 0.3)).toBe(true);
  });

  it('picks a mark by colour only with the setting on', () => {
    expect([0, 1, 2, 3, 4].map((c) => markIndexFor(c, true))).toEqual([0, 1, 2, 3, 4]);
    expect(markIndexFor(5, true)).toBe(5);
    expect([0, 3, 5].map((c) => markIndexFor(c, false))).toEqual([0, 0, 0]);
  });
});

describe('toon shading', () => {
  it('has exactly 3 bands that get brighter with the light', () => {
    expect(TOON_BANDS).toHaveLength(3);
    const levels = [0, 0.3, 0.6, 0.9, 1].map(toonBand);
    expect(new Set(levels).size).toBe(3);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(toonBand(1)).toBe(1);
  });

  it('is built from one shader snippet that carries the same band numbers', () => {
    const code = toonShaderCode();
    for (const band of TOON_BANDS) expect(code).toContain(band.level.toFixed(3));
  });
});

describe('render quality', () => {
  it('uses 4x MSAA and caps the device pixel ratio at 2', () => {
    expect(MSAA_SAMPLES).toBe(4);
    expect(hardwareScalingFor(1)).toBe(1);
    expect(hardwareScalingFor(2)).toBe(0.5);
    expect(hardwareScalingFor(3.5)).toBe(0.5);
    expect(hardwareScalingFor(0)).toBe(1);
  });
});

describe('quality overrides', () => {
  it('reads ?dpr and ?aa for trying settings on a device', async () => {
    const { qualityFromSearch } = await import('../src/render/render-quality');
    expect(qualityFromSearch('')).toEqual({ maxPixelRatio: 2, antialias: true });
    expect(qualityFromSearch('?dpr=1&aa=0')).toEqual({ maxPixelRatio: 1, antialias: false });
    expect(hardwareScalingFor(3, 1.5)).toBeCloseTo(1 / 1.5, 10);
  });
});
