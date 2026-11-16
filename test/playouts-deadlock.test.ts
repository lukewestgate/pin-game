import { expect, it } from 'vitest';
import { playouts } from '../src/solver/playouts';
import { A, B, C, build } from './helpers';

it('ends a playout with no legal tap as a loss instead of spinning', () => {
  const level = build(
    [
      { id: 'x', pins: [A, B, C], coveredBy: [1] },
      { id: 'y', pins: [A, B, C], coveredBy: [0] },
    ],
    { boxes: 2, capacity: 3, bufferSize: 4 },
    1,
  );
  expect(playouts(level, { count: 3 })).toEqual({ played: 3, winRate: 0 });
});
