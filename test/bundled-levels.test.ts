import { describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { initialState, tap } from '../src/rules/rules';
import { legalTaps } from '../src/rules/state';

describe('bundled Levels', () => {
  it('loads the tiny cart Level with default rule numbers and a covered Pin', () => {
    const level = bundledLevels().find((l) => l.id === 'tiny-cart-1');

    expect(level).toBeDefined();
    if (!level) return;
    expect(level.pins).toHaveLength(12);
    expect([level.boxes, level.capacity, level.bufferSize]).toEqual([3, 3, 5]);
    expect(level.pins.some((p) => p.coveredBy.length > 0)).toBe(true);
  });

  it('can be won by some tap order', () => {
    const level = bundledLevels().find((l) => l.id === 'tiny-cart-1');
    if (!level) throw new Error('missing tiny-cart-1');

    // Tiny exhaustive search; the real solver and gate arrive with ticket 22.
    const wins = (state: ReturnType<typeof initialState>['state']): boolean =>
      state.status === 'won' ||
      legalTaps(level, state).some((pin) => wins(tap(level, state, pin).state));

    expect(wins(initialState(level).state)).toBe(true);
  });
});
