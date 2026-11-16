// The dealing procedure for a Level, ported from `car-sweep.cjs` (Car level design, ticket 07).
// A dev tool, not shipped.
import type { ModelData } from '../src/content/schema';

export interface Slot {
  socket: string;
  /** Index of the Part holding this Socket. */
  part: number;
  /** True when nothing covers the Socket at the start. */
  outer: boolean;
}

export const COLOURS = 5;
export const PER_COLOUR = 6;

/** Every Socket of the Model in Part order (the order Pins are numbered in). */
export function dealSlots(model: ModelData): Slot[] {
  return model.parts.flatMap((part, partIndex) =>
    part.sockets.map((s) => ({ socket: s.id, part: partIndex, outer: s.coveredBy.length === 0 })),
  );
}

/** Copied from `car-sweep.cjs`, so deal seeds reproduce its deals. */
function rng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded uniform shuffle of 6 Pins per colour over the Sockets. Retries until no Part has all its
 * Pins in one colour and every colour has an outer Pin. Returns one colour per slot.
 */
export function deal(slots: readonly Slot[], seed: number): number[] {
  if (slots.length !== COLOURS * PER_COLOUR) throw new Error(`expected 30 Sockets`);
  const r = rng(seed);
  for (;;) {
    const c: number[] = [];
    for (let k = 0; k < COLOURS; k++) for (let j = 0; j < PER_COLOUR; j++) c.push(k);
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [c[i], c[j]] = [c[j] as number, c[i] as number];
    }
    const byPart = new Map<number, number[]>();
    slots.forEach((s, i) => byPart.set(s.part, [...(byPart.get(s.part) ?? []), c[i] as number]));
    if ([...byPart.values()].some((a) => a.length > 1 && a.every((x) => x === a[0]))) continue;
    const outer = new Set(c.filter((_, i) => slots[i]?.outer));
    if (outer.size < COLOURS) continue;
    return c;
  }
}

/** The frozen Level JSON: an explicit colour for every Socket. The deal seed is not stored. */
export function buildLevelJson(
  id: string,
  model: ModelData,
  colours: readonly number[],
  seed: number,
) {
  const slots = dealSlots(model);
  return {
    id,
    formatVersion: 1 as const,
    model: model.id,
    seed,
    rules: { boxes: 3, capacity: 3, bufferSize: 6, nextColour: 'reachable-first' as const },
    colours: Object.fromEntries(slots.map((s, i) => [s.socket, colours[i] as number])),
  };
}
