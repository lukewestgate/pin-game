import type { NextColourRule } from './next-colour';

/** Rule numbers. Nothing in rules or layout hard-codes these. */
export interface RuleNumbers {
  boxes: number;
  capacity: number;
  bufferSize: number;
  nextColour: NextColourRule;
}

/** Developer defaults, merged with each Level's overrides. */
export const DEFAULT_RULES: RuleNumbers = {
  boxes: 3,
  capacity: 3,
  bufferSize: 5,
  nextColour: 'reachable-first',
};

/** Input to `makeLevel`: Parts in order, each with its Pins, all ids already turned into indices. */
export interface RawLevel {
  seed: number;
  rules?: Partial<RuleNumbers>;
  parts: readonly {
    id: string;
    pins: readonly { colour: number; coveredBy: readonly number[] }[];
  }[];
}

export interface Pin {
  index: number;
  colour: number;
  part: number;
  /** Part indices, de-duplicated and sorted. */
  coveredBy: readonly number[];
}

export interface Level extends RuleNumbers {
  seed: number;
  parts: readonly { id: string }[];
  pins: readonly Pin[];
  /** Colours in use, ascending. */
  colours: readonly number[];
  pinsOfPart: readonly (readonly number[])[];
}

export function makeLevel(raw: RawLevel): Level {
  const rules: RuleNumbers = { ...DEFAULT_RULES, ...raw.rules };
  const pins: Pin[] = [];
  raw.parts.forEach((part, partIndex) => {
    for (const pin of part.pins) {
      pins.push({
        index: pins.length,
        colour: pin.colour,
        part: partIndex,
        coveredBy: [...new Set(pin.coveredBy)].sort((a, b) => a - b),
      });
    }
  });
  const colours = [...new Set(pins.map((p) => p.colour))].sort((a, b) => a - b);
  return {
    ...rules,
    seed: raw.seed,
    parts: raw.parts.map((p) => ({ id: p.id })),
    pins,
    colours,
    pinsOfPart: raw.parts.map((_, i) => pins.filter((p) => p.part === i).map((p) => p.index)),
  };
}
