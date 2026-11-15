import { describe, expect, it } from 'vitest';
import { initialState, tap } from '../src/rules/rules';
import { solve } from '../src/solver/solve';
import { A, B, C, build } from './helpers';

const winnableLevel = () =>
  build(
    [
      { id: 'lid', pins: [A, B, C] },
      { id: 'deep', pins: [A, B, C], coveredBy: [0] },
    ],
    { boxes: 3, capacity: 3, bufferSize: 5 },
  );

// The lid must come off first, but with one Box and a Buffer of 2 its three colours always overflow.
const unwinnableLevel = () =>
  build(
    [
      { id: 'lid', pins: [A, B, C] },
      { id: 'deep', pins: [A, B, C], coveredBy: [0] },
    ],
    { boxes: 1, capacity: 3, bufferSize: 2 },
  );

describe('solve', () => {
  it('finds a winning tap order that really wins when replayed', () => {
    const level = winnableLevel();
    const result = solve(level);
    expect(result.verdict).toBe('winnable');
    let state = initialState(level).state;
    for (const pin of result.path) state = tap(level, state, pin).state;
    expect(state.status).toBe('won');
  });

  it('proves a Level unwinnable by exhausting the search', () => {
    const result = solve(unwinnableLevel());
    expect(result.verdict).toBe('unwinnable');
    expect(result.path).toEqual([]);
    expect(result.nodes).toBeGreaterThan(0);
  });

  it('gives up with unknown when the node budget runs out', () => {
    const result = solve(winnableLevel(), { budget: 1 });
    expect(result.verdict).toBe('unknown');
    expect(result.nodes).toBeLessThanOrEqual(2);
  });

  it('can be cancelled between nodes', () => {
    const result = solve(winnableLevel(), { shouldStop: () => true });
    expect(result.verdict).toBe('unknown');
  });
});
