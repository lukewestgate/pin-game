import { describe, expect, it } from 'vitest';
import { roundedRectData } from '../src/render/rounded-rect';

function area(data: { positions: number[]; indices: number[] }): number {
  let total = 0;
  for (let t = 0; t < data.indices.length; t += 3) {
    const [a, b, c] = [data.indices[t], data.indices[t + 1], data.indices[t + 2]] as number[];
    const p = (i: number): [number, number] => [
      data.positions[3 * i] as number,
      data.positions[3 * i + 1] as number,
    ];
    const [ax, ay] = p(a as number);
    const [bx, by] = p(b as number);
    const [cx, cy] = p(c as number);
    total += ((bx - ax) * (cy - ay) - (cx - ax) * (by - ay)) / 2;
  }
  return total;
}

describe('rounded rectangle mesh data', () => {
  it('covers a rectangle less its four rounded-off corners, facing the camera', () => {
    const data = roundedRectData(100, 60, 12);
    const expected = 100 * 60 - (4 - Math.PI) * 12 * 12;
    // Signed area: positive means counter-clockwise, the front face of a plane seen from -z.
    expect(Math.abs(area(data))).toBeGreaterThan(expected * 0.99);
    expect(Math.abs(area(data))).toBeLessThan(expected * 1.001);
  });

  it('is centred on the origin and stays inside its width and height', () => {
    const { positions } = roundedRectData(100, 60, 12);
    const xs = positions.filter((_, i) => i % 3 === 0);
    const ys = positions.filter((_, i) => i % 3 === 1);
    expect(Math.max(...xs)).toBeCloseTo(50);
    expect(Math.min(...xs)).toBeCloseTo(-50);
    expect(Math.max(...ys)).toBeCloseTo(30);
    expect(Math.min(...ys)).toBeCloseTo(-30);
  });

  it('clamps an oversized radius to half the shorter side', () => {
    const data = roundedRectData(20, 20, 50);
    expect(Math.abs(area(data))).toBeGreaterThan(Math.PI * 100 * 0.97);
  });
});
