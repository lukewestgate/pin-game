import { describe, expect, it } from 'vitest';
import type { Step } from '../render/timeline';
import { CHORD, cuesFor } from './sound-map';

describe('cuesFor', () => {
  it('pops at tap time and clicks when the Pin lands in a Box', () => {
    const step: Step = {
      kind: 'pinToBox',
      pin: 1,
      box: 0,
      fill: 1,
      t0: 100,
      pullEnd: 210,
      flyAt: 210,
      t1: 590,
    };
    expect(cuesFor(step)).toEqual([
      { sound: 'pop', at: 100, chord: 0 },
      { sound: 'click', at: 590, chord: 0 },
    ]);
  });

  it('climbs the chord with the Box fill', () => {
    const at = (fill: number) =>
      cuesFor({ kind: 'pinToBox', pin: 0, box: 0, fill, t0: 0, pullEnd: 1, flyAt: 1, t1: 5 })[1];
    expect(at(2)?.chord).toBe(1);
    expect(at(3)?.chord).toBe(2);
    expect(at(9)?.chord).toBe(CHORD.length - 1);
  });

  it('thunks when the Pin lands in the Buffer', () => {
    const cues = cuesFor({
      kind: 'pinToBuffer',
      pin: 0,
      slot: 0,
      t0: 0,
      pullEnd: 110,
      flyAt: 110,
      t1: 490,
    });
    expect(cues.map((c) => [c.sound, c.at])).toEqual([
      ['pop', 0],
      ['thunk', 490],
    ]);
  });

  it('plays the Box click per drained Pin at its landing time, continuing the chord', () => {
    const cues = cuesFor({
      kind: 'bufferDrained',
      box: 0,
      colour: 1,
      from: [0, 1],
      fill: 3,
      launches: [10, 100],
      lands: [330, 420],
      t0: 10,
      t1: 600,
    });
    expect(cues).toEqual([
      { sound: 'click', at: 330, chord: 1 },
      { sound: 'click', at: 420, chord: 2 },
    ]);
  });

  it('plays clatter, chime, win and lose at step start, and nothing for slide-in', () => {
    expect(cuesFor({ kind: 'partFell', part: 0, t0: 5, t1: 9 })).toEqual([
      { sound: 'clatter', at: 5, chord: 0 },
    ]);
    expect(cuesFor({ kind: 'boxClosed', box: 0, colour: 1, t0: 7, t1: 9 })[0]?.sound).toBe('chime');
    expect(cuesFor({ kind: 'won', t0: 3, t1: 3 })[0]?.sound).toBe('win');
    expect(cuesFor({ kind: 'lost', t0: 3, t1: 3 })[0]?.sound).toBe('lose');
    expect(cuesFor({ kind: 'boxOpened', box: 0, colour: 1, t0: 1, t1: 2 })).toEqual([]);
  });
});
