import { describe, expect, it } from 'vitest';
import { loadLevel } from '../src/content/loader';
import { canUndo, commit, startHistory, undo } from '../src/rules/history';
import { initialState, tap } from '../src/rules/rules';

const up = [0, 1, 0];
const box = { kind: 'box', size: [1, 0.2, 1], position: [0, 1, 0], colour: '#8fa7c4' };

// A lid covering a block, on a Core base. Pins in order: lid-a, lid-b, block-a, block-b.
const tinyModel = {
  id: 'tiny',
  formatVersion: 1,
  parts: [
    {
      id: 'lid',
      shapes: [box],
      sockets: [
        { id: 'lid-a', position: [-0.2, 1.1, 0], direction: up, coveredBy: [] },
        { id: 'lid-b', position: [0.2, 1.1, 0], direction: up, coveredBy: [] },
      ],
    },
    {
      id: 'block',
      shapes: [box],
      sockets: [
        { id: 'block-a', position: [-0.2, 0.6, 0], direction: up, coveredBy: ['lid'] },
        { id: 'block-b', position: [0.2, 0.6, 0], direction: up, coveredBy: ['lid'] },
      ],
    },
    { id: 'base', shapes: [box], sockets: [] },
  ],
};

// Red (0) and yellow (1), two of each. With seed 1 the single Box opens yellow.
const tinyLevel = {
  id: 'tiny-1',
  formatVersion: 1,
  model: 'tiny',
  seed: 1,
  colours: { 'lid-a': 0, 'lid-b': 1, 'block-a': 0, 'block-b': 1 },
  rules: { boxes: 1, capacity: 2, bufferSize: 3 },
};

const LID_A = 0;
const LID_B = 1;
const BLOCK_A = 2;
const BLOCK_B = 3;
const LID = 0;
const BLOCK = 1;

function start(overrides: object = {}) {
  const level = loadLevel({ ...tinyLevel, ...overrides }, 'tiny-1.json', {
    'tiny.json': tinyModel,
  });
  return { level, state: initialState(level).state };
}

describe('tap, through the content loader', () => {
  it('sends a Pin to the open Box of its colour', () => {
    const { level, state } = start();

    const result = tap(level, state, LID_B);

    expect(result.events).toEqual([{ kind: 'pinToBox', pin: LID_B, slot: 0, fill: 1 }]);
    expect(result.state.boxes).toEqual([{ colour: 1, fill: 1 }]);
    expect(result.state.removed).toEqual([false, true, false, false]);
  });

  it('sends a Pin with no open Box of its colour to the Buffer', () => {
    const { level, state } = start();

    const result = tap(level, state, LID_A);

    expect(result.events).toEqual([{ kind: 'pinToBuffer', pin: LID_A, slot: 0 }]);
    expect(result.state.buffer).toEqual([0]);
    expect(result.state.boxes).toEqual([{ colour: 1, fill: 0 }]);
  });

  it('refuses a Blocked Pin and changes nothing', () => {
    const { level, state } = start();

    const result = tap(level, state, BLOCK_A);

    expect(result.state).toBe(state);
    expect(result.events).toEqual([]);
    expect(result.refused).toEqual({ reason: 'blocked', blockers: [LID] });
  });

  it('plays a whole Level: Part falls, Box closes, next Box drains the Buffer, win', () => {
    const { level, state: s0 } = start();

    const s1 = tap(level, s0, LID_B).state;
    const t2 = tap(level, s1, LID_A);
    expect(t2.events).toEqual([
      { kind: 'partFell', part: LID },
      { kind: 'pinToBuffer', pin: LID_A, slot: 0 },
    ]);

    // Yellow fills and closes; red is the only colour left, so its Box opens and drains.
    const t3 = tap(level, t2.state, BLOCK_B);
    expect(t3.events).toEqual([
      { kind: 'pinToBox', pin: BLOCK_B, slot: 0, fill: 2 },
      { kind: 'boxClosed', slot: 0, colour: 1 },
      { kind: 'boxOpened', slot: 0, colour: 0 },
      { kind: 'bufferDrained', slot: 0, colour: 0, from: [0], fill: 1 },
    ]);
    expect(t3.state.buffer).toEqual([]);

    // Red closes; nothing qualifies, so the Box goes grey and the Level is won.
    const t4 = tap(level, t3.state, BLOCK_A);
    expect(t4.events).toEqual([
      { kind: 'partFell', part: BLOCK },
      { kind: 'pinToBox', pin: BLOCK_A, slot: 0, fill: 2 },
      { kind: 'boxClosed', slot: 0, colour: 0 },
      { kind: 'boxOpened', slot: 0, colour: null },
      { kind: 'won' },
    ]);
    expect(t4.state.status).toBe('won');
  });
});

describe('undo', () => {
  it('undoes a loss, with a per-Level Buffer override in effect', () => {
    const { level, state } = start({ rules: { boxes: 1, capacity: 2, bufferSize: 1 } });
    let history = startHistory(state);

    const lose = tap(level, history.present, LID_A);
    expect(lose.events).toEqual([{ kind: 'pinToBuffer', pin: LID_A, slot: 0 }, { kind: 'lost' }]);
    history = commit(history, lose.state);
    expect(tap(level, history.present, LID_B).refused).toEqual({ reason: 'over' });

    history = undo(history);
    expect(history.present).toEqual(state);
    expect(canUndo(history)).toBe(false);
    expect(tap(level, history.present, LID_B).events).toEqual([
      { kind: 'pinToBox', pin: LID_B, slot: 0, fill: 1 },
    ]);
  });

  it('does nothing with no past states', () => {
    const { state } = start();
    const history = startHistory(state);

    expect(undo(history)).toBe(history);
  });
});
