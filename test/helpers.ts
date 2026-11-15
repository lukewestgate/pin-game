import { makeLevel, type Level, type RawLevel, type RuleNumbers } from '../src/rules/level';
import { initialState } from '../src/rules/rules';
import type { State } from '../src/rules/state';

/** Colour letters used by the hand-built Levels. */
export const A = 0;
export const B = 1;
export const C = 2;

interface PartSpec {
  id: string;
  pins: number[];
  coveredBy?: number[];
}

/** A tiny Level from Parts listed as `{ id, pins: colours, coveredBy: Part indices }`. */
export function build(parts: PartSpec[], rules: Partial<RuleNumbers>, seed = 0): Level {
  const raw: RawLevel = {
    seed,
    rules,
    parts: parts.map((p) => ({
      id: p.id,
      pins: p.pins.map((colour) => ({ colour, coveredBy: p.coveredBy ?? [] })),
    })),
  };
  return makeLevel(raw);
}

/** The first seed (from 0) for which `wanted` accepts the Level built with it. */
export function findSeed(make: (seed: number) => Level, wanted: (level: Level) => boolean): number {
  for (let seed = 0; seed < 500; seed++) if (wanted(make(seed))) return seed;
  throw new Error('no seed matched');
}

/** The nth (from 0) Pin of a colour. */
export function pinOf(level: Level, colour: number, nth = 0): number {
  const pin = level.pins.filter((p) => p.colour === colour)[nth];
  if (!pin) throw new Error(`no Pin ${nth} of colour ${colour}`);
  return pin.index;
}

export function start(level: Level): State {
  return initialState(level).state;
}
