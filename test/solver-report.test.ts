import { describe, expect, it } from 'vitest';
import { initialState, tap } from '../src/rules/rules';
import { playouts } from '../src/solver/playouts';
import { report } from '../src/solver/report';
import { A, B, C, build } from './helpers';

const level = () =>
  build(
    [
      { id: 'lid', pins: [A, B, C] },
      { id: 'deep', pins: [A, B, C], coveredBy: [0] },
    ],
    { boxes: 3, capacity: 3, bufferSize: 5 },
    3,
  );

describe('playouts', () => {
  it('is deterministic for a seed and a rate between 0 and 1', () => {
    const a = playouts(level(), { count: 100, seed: 1 });
    expect(playouts(level(), { count: 100, seed: 1 })).toEqual(a);
    expect(a.winRate).toBeGreaterThan(0);
    expect(a.winRate).toBeLessThanOrEqual(1);
  });

  it('stops early when cancelled', () => {
    expect(playouts(level(), { count: 100, seed: 1, shouldStop: () => true }).played).toBe(0);
  });
});

describe('report', () => {
  it('describes a winnable Level', () => {
    const l = level();
    const r = report(l);
    expect(r.verdict).toBe('winnable');
    expect(r.nodes).toBeGreaterThan(0);
    expect(r.playouts).toBe(1000);
    expect(r.winRate).toBe(playouts(l, { count: 1000, seed: 1 }).winRate);
    expect(r.firstTapWinShare).toBeGreaterThan(0);
    expect(r.firstTapWinShare).toBeLessThanOrEqual(1);
    // Replay the winning order by hand to get the peak Buffer use.
    let state = initialState(l).state;
    let peak = 0;
    for (const pin of r.path) {
      state = tap(l, state, pin).state;
      peak = Math.max(peak, state.buffer.length);
    }
    expect(r.peakBuffer).toBe(peak);
  });

  it('has no winning order, share or peak for an unwinnable Level', () => {
    const r = report(
      build(
        [
          { id: 'lid', pins: [A, B, C] },
          { id: 'deep', pins: [A, B, C], coveredBy: [0] },
        ],
        { boxes: 1, capacity: 3, bufferSize: 2 },
      ),
    );
    expect(r.verdict).toBe('unwinnable');
    expect(r.path).toEqual([]);
    expect(r.firstTapWinShare).toBe(0);
    expect(r.peakBuffer).toBeNull();
  });
});
