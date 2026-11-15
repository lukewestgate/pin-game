import type { Level } from './level';
import type { State } from './state';
import { isBlocked } from './state';

/**
 * A next-colour strategy narrows the qualifying colours (Pins left, no open Box) to the ones
 * the seeded pick chooses from. It must be a pure function of (level, state), so the solver's
 * memo stays valid. A `queue` variant with a truthful preview can be added here later.
 */
type Strategy = (level: Level, state: State, qualifying: readonly number[]) => readonly number[];

const STRATEGIES = {
  /** Prefer colours in the Buffer or with an unblocked Pin; fall back to all qualifying. */
  'reachable-first': (level, state, qualifying) => {
    const reachable = qualifying.filter(
      (c) =>
        state.buffer.includes(c) ||
        level.pins.some(
          (p) => p.colour === c && !state.removed[p.index] && !isBlocked(level, state, p.index),
        ),
    );
    return reachable.length ? reachable : qualifying;
  },
} satisfies Record<string, Strategy>;

export type NextColourRule = keyof typeof STRATEGIES;

export const NEXT_COLOUR_RULES = Object.keys(STRATEGIES) as NextColourRule[];

export function candidateColours(level: Level, state: State): readonly number[] {
  const left = new Map(level.colours.map((c) => [c, 0]));
  for (const p of level.pins)
    if (!state.removed[p.index]) left.set(p.colour, (left.get(p.colour) ?? 0) + 1);
  for (const c of state.buffer) left.set(c, (left.get(c) ?? 0) + 1);
  const open = new Set(state.boxes.map((b) => b.colour).filter((c) => c !== null));
  const qualifying = level.colours.filter((c) => (left.get(c) ?? 0) > 0 && !open.has(c));
  return STRATEGIES[level.nextColour](level, state, qualifying);
}
