import { describe, expect, it } from 'vitest';
import { FEEDBACK } from '../src/input/constants';
import { flashStrength, peekStep, perpendicular, wiggleOffset } from '../src/render/pin-feedback';

describe('pin feedback curves', () => {
  it('shakes for 320 ms in 3 decaying cycles of at most 0.05 units', () => {
    const samples = Array.from({ length: 320 }, (_, ms) => wiggleOffset(ms, FEEDBACK));
    expect(wiggleOffset(0, FEEDBACK)).toBe(0);
    expect(wiggleOffset(320, FEEDBACK)).toBe(0);
    expect(Math.max(...samples.map(Math.abs))).toBeLessThanOrEqual(0.05);
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if (Math.sign(samples[i - 1] ?? 0) * Math.sign(samples[i] ?? 0) < 0) crossings++;
    }
    expect(crossings).toBe(5); // 3 cycles = 6 zero crossings, one of them at the very end
    const peak = (from: number, to: number) => Math.max(...samples.slice(from, to).map(Math.abs));
    expect(peak(0, 107)).toBeGreaterThan(peak(214, 320));
  });

  it('fades the red flash out over 350 ms', () => {
    expect(flashStrength(0, FEEDBACK)).toBe(1);
    expect(flashStrength(175, FEEDBACK)).toBeCloseTo(0.5, 6);
    expect(flashStrength(350, FEEDBACK)).toBe(0);
  });

  it('shakes sideways, perpendicular to the pull-out, even for straight up', () => {
    for (const dir of [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0.6, 0.8],
      [-0.6, 0, -0.8],
    ] as const) {
      const p = perpendicular(dir);
      expect(p[0] * dir[0] + p[1] * dir[1] + p[2] * dir[2]).toBeCloseTo(0, 9);
      expect(Math.hypot(...p)).toBeCloseTo(1, 9);
    }
  });

  it('fades a Peeked Part to 0.22 over 120 ms and back at the same rate', () => {
    expect(peekStep(1, true, 60, FEEDBACK)).toBeCloseTo(1 - 0.78 / 2, 6);
    expect(peekStep(1, true, 120, FEEDBACK)).toBeCloseTo(0.22, 6);
    expect(peekStep(1, true, 1000, FEEDBACK)).toBeCloseTo(0.22, 6);
    expect(peekStep(0.22, false, 60, FEEDBACK)).toBeCloseTo(0.22 + 0.78 / 2, 6);
    expect(peekStep(0.22, false, 120, FEEDBACK)).toBe(1);
  });
});
