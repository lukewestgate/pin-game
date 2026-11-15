import { describe, expect, it } from 'vitest';
import { coveringParts } from '../src/dev/covering';
import { forecastNextBox } from '../src/dev/forecast';
import { initialState, tap } from '../src/rules/rules';
import { parseModel } from '../src/content/loader';
import { A, B, build } from './helpers';

describe('next-Box forecast ("if this Box closed now")', () => {
  it('names the only colour that could take the slot', () => {
    const level = build(
      [
        { id: 'p0', pins: [A, A, A] },
        { id: 'p1', pins: [B, B, B] },
      ],
      { boxes: 2, capacity: 3, bufferSize: 5 },
    );
    const { state } = initialState(level);
    // Two colours, two Boxes: each Box's own colour is the only one without a Box once it leaves.
    expect(forecastNextBox(level, state, 0)).toBe(state.boxes[0]?.colour);
    expect(forecastNextBox(level, state, 1)).toBe(state.boxes[1]?.colour);
  });

  it('is grey (null) when no colour has Pins left', () => {
    const level = build([{ id: 'p0', pins: [A, A, A] }], {
      boxes: 1,
      capacity: 3,
      bufferSize: 5,
    });
    let { state } = initialState(level);
    expect(forecastNextBox(level, state, 0)).toBe(A);
    for (const pin of [0, 1, 2]) state = tap(level, state, pin).state;
    expect(forecastNextBox(level, state, 0)).toBeNull();
  });

  it('does not change the state it is given', () => {
    const level = build([{ id: 'p0', pins: [A, A, A] }], { boxes: 1, capacity: 3, bufferSize: 5 });
    const { state } = initialState(level);
    const before = JSON.stringify(state);
    forecastNextBox(level, state, 0);
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('covering Parts of a selected Socket', () => {
  const model = parseModel(
    {
      id: 'm',
      formatVersion: 1,
      parts: [
        {
          id: 'floor',
          shapes: [{ kind: 'box', size: [1, 1, 1], position: [0, 0, 0], colour: '#8fa7c4' }],
          sockets: [
            { id: 'bolt', position: [0, 0.5, 0], direction: [0, 1, 0], coveredBy: ['lid'] },
          ],
        },
        {
          id: 'lid',
          shapes: [{ kind: 'box', size: [1, 1, 1], position: [0, 2, 0], colour: '#8fa7c4' }],
          sockets: [],
        },
      ],
    },
    'm.json',
  );
  it('lists the Parts in the Socket coveredBy', () => {
    expect(coveringParts(model, 'bolt')).toEqual(['lid']);
  });
  it('is empty for an unknown Socket', () => {
    expect(coveringParts(model, 'nope')).toEqual([]);
  });
});
