import { describe, expect, it } from 'vitest';
import { candidateColours } from '../src/rules/next-colour';
import { initialState, tap } from '../src/rules/rules';
import type { State } from '../src/rules/state';
import { canUndo, commit, startHistory, undo } from '../src/rules/history';
import { A, B, C, build, findSeed, pinOf, start } from './helpers';

/** Three colours, two free Pins each; one Box of Capacity 2. */
const flat = (seed: number, rules = {}) =>
  build(
    [
      { id: 'a', pins: [A, A] },
      { id: 'b', pins: [B, B] },
      { id: 'c', pins: [C, C] },
    ],
    { boxes: 1, capacity: 2, bufferSize: 5, ...rules },
    seed,
  );

describe('losing', () => {
  it('loses the moment the last Buffer slot fills, not before', () => {
    const level = flat(0, { bufferSize: 2 });
    const open = start(level).boxes[0]?.colour ?? -1;
    const [x, y] = [A, B, C].filter((c) => c !== open);
    if (x === undefined || y === undefined) throw new Error('setup');

    const first = tap(level, start(level), pinOf(level, x));
    expect(first.events).toEqual([{ kind: 'pinToBuffer', pin: pinOf(level, x), slot: 0 }]);
    expect(first.state.status).toBe('playing');

    const second = tap(level, first.state, pinOf(level, y));
    expect(second.events).toEqual([
      { kind: 'pinToBuffer', pin: pinOf(level, y), slot: 1 },
      { kind: 'lost' },
    ]);
    expect(second.state.status).toBe('lost');
    expect(second.state.buffer).toEqual([x, y]);
  });

  it('honours a per-Level Buffer override of 6', () => {
    // Open colour is whichever the seed picks; fill the Buffer with six Pins of the others.
    const make = (bufferSize?: number) =>
      build(
        [
          { id: 'a', pins: [A, A, A] },
          { id: 'b', pins: [B, B, B] },
          { id: 'c', pins: [C, C, C] },
        ],
        { boxes: 1, capacity: 3, ...(bufferSize ? { bufferSize } : {}) },
      );
    const play = (bufferSize?: number) => {
      const level = make(bufferSize);
      const open = start(level).boxes[0]?.colour;
      let state: State = start(level);
      const others = level.pins.filter((p) => p.colour !== open).map((p) => p.index);
      const statuses: string[] = [];
      for (const pin of others) {
        state = tap(level, state, pin).state;
        statuses.push(state.status);
      }
      return { statuses, level };
    };

    const defaults = play();
    expect(defaults.level.bufferSize).toBe(5);
    expect(defaults.statuses.indexOf('lost')).toBe(4);

    const override = play(6);
    expect(override.level.bufferSize).toBe(6);
    expect(override.statuses.indexOf('lost')).toBe(5);
    expect(override.statuses.slice(0, 5)).toEqual(Array(5).fill('playing'));
  });
});

describe('Boxes', () => {
  it('opens a grey Box when no colour qualifies, then wins', () => {
    const level = build(
      [
        { id: 'a', pins: [A, A] },
        { id: 'b', pins: [B, B] },
      ],
      { boxes: 2, capacity: 2, bufferSize: 5 },
    );
    const s0 = start(level);
    expect(s0.boxes.map((b) => b.colour).sort()).toEqual([A, B]);

    const s1 = tap(level, s0, pinOf(level, A, 0));
    const s2 = tap(level, s1.state, pinOf(level, A, 1));
    const boxA = s0.boxes.findIndex((b) => b.colour === A);
    expect(s2.events).toEqual([
      { kind: 'partFell', part: 0 },
      { kind: 'pinToBox', pin: pinOf(level, A, 1), box: boxA, fill: 2 },
      { kind: 'boxClosed', box: boxA, colour: A },
      { kind: 'boxOpened', box: boxA, colour: null },
    ]);
    expect(s2.state.boxes[boxA]).toEqual({ colour: null, fill: 0 });
    expect(s2.state.status).toBe('playing');

    // A grey Box takes nothing: the last colour still goes to its own Box.
    const s3 = tap(level, s2.state, pinOf(level, B, 0));
    const s4 = tap(level, s3.state, pinOf(level, B, 1));
    expect(s4.events.at(-1)).toEqual({ kind: 'won' });
    expect(s4.state.status).toBe('won');
  });

  it('chains drain → close → replacement', () => {
    // lid (A, A) covers vault (C, C); shelf (B, B) is free. The Box must open A, then B, then C.
    const make = (seed: number) =>
      build(
        [
          { id: 'lid', pins: [A, A] },
          { id: 'shelf', pins: [B, B] },
          { id: 'vault', pins: [C, C], coveredBy: [0] },
        ],
        { boxes: 1, capacity: 2, bufferSize: 5 },
        seed,
      );
    const script = (level: ReturnType<typeof make>) => {
      let state = start(level);
      const log = [];
      for (const pin of [
        pinOf(level, B, 0),
        pinOf(level, B, 1),
        pinOf(level, A, 0),
        pinOf(level, A, 1),
      ]) {
        const result = tap(level, state, pin);
        state = result.state;
        log.push(result);
      }
      return log;
    };
    const seed = findSeed(make, (level) => {
      if (start(level).boxes[0]?.colour !== A) return false;
      const last = script(level).at(-1);
      return last?.events.some((e) => e.kind === 'boxOpened' && e.colour === B) ?? false;
    });
    const level = make(seed);

    const last = script(level).at(-1);
    expect(last?.events).toEqual([
      { kind: 'partFell', part: 0 },
      { kind: 'pinToBox', pin: pinOf(level, A, 1), box: 0, fill: 2 },
      { kind: 'boxClosed', box: 0, colour: A },
      { kind: 'boxOpened', box: 0, colour: B },
      { kind: 'bufferDrained', box: 0, colour: B, from: [0, 1], fill: 2 },
      { kind: 'boxClosed', box: 0, colour: B },
      { kind: 'boxOpened', box: 0, colour: C },
    ]);
    expect(last?.state.buffer).toEqual([]);
    expect(last?.state.boxes).toEqual([{ colour: C, fill: 0 }]);
  });
});

describe('refusals', () => {
  const level = build(
    [
      { id: 'lid', pins: [A, A] },
      { id: 'block', pins: [A, A], coveredBy: [0] },
    ],
    { boxes: 1, capacity: 2, bufferSize: 5 },
  );

  it('refuses a Blocked tap with no change', () => {
    const state = start(level);
    const result = tap(level, state, 2);

    expect(result.refused).toEqual({ reason: 'blocked', blockers: [0] });
    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
  });

  it('refuses taps after a win', () => {
    let state = start(level);
    for (const pin of [0, 1, 2, 3]) state = tap(level, state, pin).state;
    expect(state.status).toBe('won');

    const result = tap(level, state, 0);
    expect(result).toEqual({ state, events: [], refused: { reason: 'over' } });
  });

  it('refuses taps after a loss', () => {
    const small = flat(0, { bufferSize: 1 });
    const open = start(small).boxes[0]?.colour;
    const other = [A, B, C].find((c) => c !== open) ?? -1;
    const lost = tap(small, start(small), pinOf(small, other)).state;
    expect(lost.status).toBe('lost');

    const result = tap(small, lost, pinOf(small, open ?? A));
    expect(result.state).toBe(lost);
    expect(result.events).toEqual([]);
    expect(result.refused).toEqual({ reason: 'over' });
  });

  it('refuses a Pin that is already removed', () => {
    const state = tap(level, start(level), 0).state;
    expect(tap(level, state, 0).refused).toEqual({ reason: 'removed' });
  });
});

describe('next colour', () => {
  it('never opens two Boxes of one colour', () => {
    for (let seed = 0; seed < 60; seed++) {
      const level = build(
        [
          { id: 'a', pins: [A, A] },
          { id: 'b', pins: [B, B] },
          { id: 'c', pins: [C, C] },
        ],
        { boxes: 2, capacity: 2, bufferSize: 5 },
        seed,
      );
      let state = start(level);
      const distinct = (s: State) => {
        const open = s.boxes.map((b) => b.colour).filter((c) => c !== null);
        return new Set(open).size === open.length;
      };
      expect(distinct(state)).toBe(true);
      const openColour = state.boxes[0]?.colour ?? A;
      state = tap(level, state, pinOf(level, openColour, 0)).state;
      state = tap(level, state, pinOf(level, openColour, 1)).state;
      expect(distinct(state)).toBe(true);
    }
  });

  describe('reachable-first', () => {
    // cage (A, A) covers vault (B, B).
    const level = build(
      [
        { id: 'cage', pins: [A, A] },
        { id: 'vault', pins: [B, B], coveredBy: [0] },
      ],
      { boxes: 1, capacity: 2, bufferSize: 5 },
    );
    const base: State = {
      removed: [false, false, false, false],
      partLeft: [2, 2],
      buffer: [],
      boxes: [{ colour: null, fill: 0 }],
      picks: 0,
      closes: 0,
      status: 'playing',
    };

    it('prefers a colour with an unblocked Pin over one that is fully Blocked', () => {
      expect(candidateColours(level, base)).toEqual([A]);
      for (let seed = 0; seed < 30; seed++)
        expect(start({ ...level, seed }).boxes[0]?.colour).toBe(A);
    });

    it('prefers a colour in the Buffer even when all its Pins are Blocked', () => {
      const state = { ...base, buffer: [B] };
      expect(candidateColours(level, state)).toEqual([A, B]);
    });

    it('falls back to Blocked colours when nothing reachable qualifies', () => {
      const state = { ...base, boxes: [{ colour: A, fill: 0 }] };
      expect(candidateColours(level, state)).toEqual([B]);
    });
  });
});

describe('undo', () => {
  it('walks back several taps, restoring Pins, Buffer and Boxes exactly', () => {
    const level = flat(3);
    const s0 = initialState(level).state;
    let history = startHistory(s0);
    for (const pin of [0, 2, 4]) {
      const result = tap(level, history.present, pin);
      history = commit(history, result.state);
    }
    const afterThree = history.present;

    history = undo(history);
    expect(history.present).not.toEqual(afterThree);
    history = undo(undo(history));
    expect(history.present).toEqual(s0);
    expect(canUndo(history)).toBe(false);
  });
});
