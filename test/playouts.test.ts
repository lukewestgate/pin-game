import { describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { CANDY } from '../src/content/palette';
import type { Level } from '../src/rules/level';
import { candidateColours } from '../src/rules/next-colour';
import { hash32, rng } from '../src/rules/random';
import { initialState, tap, type RulesEvent } from '../src/rules/rules';
import { legalTaps, type State } from '../src/rules/state';
import { A, B, C, build } from './helpers';

const PLAYOUTS = 200;

const levels: [string, Level][] = [
  ...bundledLevels().map((l): [string, Level] => [l.id, l]),
  [
    'hand-built',
    build(
      [
        { id: 'lid', pins: [A, B, C] },
        { id: 'mid', pins: [A, B, C], coveredBy: [0] },
        { id: 'deep', pins: [A, B, C], coveredBy: [1] },
      ],
      { boxes: 2, capacity: 3, bufferSize: 4 },
      7,
    ),
  ],
];

interface Playout {
  taps: number[];
  states: State[];
  events: RulesEvent[][];
}

/** Plays uniformly random legal taps from a seed until the Level is over. */
function playout(level: Level, seed: number): Playout {
  const pick = rng(seed);
  const start = initialState(level);
  const result: Playout = { taps: [], states: [start.state], events: [start.events] };
  let state = start.state;
  for (;;) {
    const legal = legalTaps(level, state);
    const pin = legal[Math.floor(pick() * legal.length)];
    if (pin === undefined) return result;
    const next = tap(level, state, pin);
    state = next.state;
    result.taps.push(pin);
    result.states.push(state);
    result.events.push(next.events);
  }
}

describe.each(levels)('seeded playouts on %s', (_name, level) => {
  it('keeps every Pin in exactly one place and the Buffer within its size', () => {
    for (let seed = 0; seed < PLAYOUTS; seed++) {
      const { states, events } = playout(level, seed);
      const closed = new Map<number, number>();
      for (const [i, state] of states.entries()) {
        for (const e of events[i] ?? [])
          if (e.kind === 'boxClosed') closed.set(e.colour, (closed.get(e.colour) ?? 0) + 1);
        for (const colour of level.colours) {
          const total = level.pins.filter((p) => p.colour === colour).length;
          const onModel = level.pins.filter(
            (p) => p.colour === colour && !state.removed[p.index],
          ).length;
          const inBuffer = state.buffer.filter((c) => c === colour).length;
          const inOpenBoxes = state.boxes
            .filter((b) => b.colour === colour)
            .reduce((n, b) => n + b.fill, 0);
          const inClosedBoxes = (closed.get(colour) ?? 0) * level.capacity;
          expect(onModel + inBuffer + inOpenBoxes + inClosedBoxes).toBe(total);
        }
        expect(state.buffer.length).toBeLessThanOrEqual(level.bufferSize);
        for (const box of state.boxes) expect(box.fill).toBeLessThan(level.capacity);
      }
    }
  });

  it('never has two open Boxes of one colour', () => {
    for (let seed = 0; seed < PLAYOUTS; seed++)
      for (const state of playout(level, seed).states) {
        const open = state.boxes.map((b) => b.colour).filter((c) => c !== null);
        expect(new Set(open).size).toBe(open.length);
      }
  });

  it('ends only by a win or a loss, and a win leaves nothing behind', () => {
    for (let seed = 0; seed < PLAYOUTS; seed++) {
      const final = playout(level, seed).states.at(-1);
      expect(final?.status).not.toBe('playing');
      if (final?.status === 'won') {
        expect(final.removed.every(Boolean)).toBe(true);
        expect(final.buffer).toEqual([]);
      }
    }
  });

  it('replays to identical states and events', () => {
    for (let seed = 0; seed < PLAYOUTS; seed++) {
      const first = playout(level, seed);
      let state = initialState(level).state;
      for (const [i, pin] of first.taps.entries()) {
        const result = tap(level, state, pin);
        expect(result.events).toEqual(first.events[i + 1]);
        expect(result.state).toEqual(first.states[i + 1]);
        state = result.state;
      }
    }
  });

  it('picks the next colour as a pure function of (seed, pick number, state)', () => {
    // Reducing from a structural copy of the state, with no history, gives the same result.
    for (let seed = 0; seed < 50; seed++) {
      const { taps, states } = playout(level, seed);
      for (const [i, pin] of taps.entries()) {
        const copy = structuredClone(states[i]) as State;
        expect(tap(level, copy, pin)).toEqual(tap(level, states[i] as State, pin));
        expect(candidateColours(level, copy)).toEqual(candidateColours(level, states[i] as State));
      }
    }
    // And the first Box's colour is exactly the seeded pick over the qualifying colours.
    const empty: State = {
      removed: level.pins.map(() => false),
      partLeft: level.pinsOfPart.map((pins) => pins.length),
      buffer: [],
      boxes: [],
      picks: 0,
      closes: 0,
      status: 'playing',
    };
    const q = candidateColours(level, empty);
    expect(initialState(level).state.boxes[0]?.colour).toBe(q[hash32(level.seed, 0) % q.length]);
  });
});

describe('the Candy palette', () => {
  it('is the ten colours in the specified order', () => {
    expect(CANDY).toHaveLength(10);
    expect(CANDY[0]).toBe('#ff3b47');
    expect(CANDY[3]).toBe('#2f6bff');
    expect(CANDY[9]).toBe('#1b1b22');
  });

  it('is what Level colour indices refer to', () => {
    const level = bundledLevels()[0];
    expect(level?.colours.every((c) => c >= 0 && c < CANDY.length)).toBe(true);
  });
});
