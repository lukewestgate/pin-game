import type { Level } from './level';

export interface Box {
  /** `null` is a grey Box: no colour qualified when it opened. */
  colour: number | null;
  fill: number;
}

export type Status = 'playing' | 'won' | 'lost';

export interface State {
  removed: readonly boolean[];
  /** Pins still in each Part. A Part with Pins falls away when this reaches 0. */
  partLeft: readonly number[];
  /** Colours of the Pins in the Buffer, in arrival order. */
  buffer: readonly number[];
  boxes: readonly Box[];
  /** Seeded colour picks made so far, so each pick is a pure function of (seed, pick number, state). */
  picks: number;
  closes: number;
  status: Status;
}

export function blockersOf(level: Level, state: State, pin: number): number[] {
  return (level.pins[pin]?.coveredBy ?? []).filter((part) => (state.partLeft[part] ?? 0) > 0);
}

export function isBlocked(level: Level, state: State, pin: number): boolean {
  return blockersOf(level, state, pin).length > 0;
}

export function legalTaps(level: Level, state: State): number[] {
  if (state.status !== 'playing') return [];
  return level.pins
    .filter((p) => !state.removed[p.index] && !isBlocked(level, state, p.index))
    .map((p) => p.index);
}
