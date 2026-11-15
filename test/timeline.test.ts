import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TIMING,
  emptyTracks,
  schedule,
  type Step,
  type Tracks,
} from '../src/render/timeline';
import type { RulesEvent } from '../src/rules/rules';

const T = DEFAULT_TIMING;

function only<K extends Step['kind']>(steps: Step[], kind: K, nth = 0): Extract<Step, { kind: K }> {
  const found = steps.filter((s) => s.kind === kind)[nth];
  if (!found) throw new Error(`No ${kind} step #${nth}`);
  return found as Extract<Step, { kind: K }>;
}

const fillAndClose = (pin: number, box = 0): RulesEvent[] => [
  { kind: 'pinToBox', pin, box, fill: 3 },
  { kind: 'boxClosed', box, colour: 0 },
  { kind: 'boxOpened', box, colour: 1 },
];

describe('Timeline.schedule', () => {
  it('pulls a Pin out at tap time and flies it to a free Box straight after', () => {
    const { steps } = schedule(
      [{ kind: 'pinToBox', pin: 4, box: 1, fill: 1 }],
      1000,
      emptyTracks(),
      {},
    );
    const s = only(steps, 'pinToBox');
    expect([s.t0, s.flyAt, s.t1]).toEqual([1000, 1000 + T.pull, 1000 + T.pull + T.fly]);
  });

  it('hovers a Pin while its Box closes and lands it after the next Box slides in', () => {
    const first = schedule(fillAndClose(0), 0, emptyTracks(), {});
    const second = schedule([{ kind: 'pinToBox', pin: 1, box: 0, fill: 1 }], 10, first.tracks, {});
    const slideInEnd = T.pull + T.fly + T.close + T.open;
    const s = only(second.steps, 'pinToBox');
    expect(s.t0).toBe(10);
    expect(s.t1).toBe(slideInEnd);
    expect(s.flyAt).toBe(slideInEnd - T.fly);
    expect(s.flyAt).toBeGreaterThan(s.t0 + T.pull);
  });

  it('closes then slides in per slot, in order', () => {
    const { steps } = schedule(fillAndClose(0), 0, emptyTracks(), {});
    const pin = only(steps, 'pinToBox');
    const closed = only(steps, 'boxClosed');
    const opened = only(steps, 'boxOpened');
    expect(closed.t0).toBe(pin.t1);
    expect(closed.t1).toBe(closed.t0 + T.close);
    expect(opened.t0).toBe(closed.t1);
    expect(opened.t1).toBe(opened.t0 + T.open);
  });

  it('lets other slots carry on while one Box closes', () => {
    const first = schedule(fillAndClose(0, 0), 0, emptyTracks(), {});
    const other = schedule([{ kind: 'pinToBox', pin: 1, box: 2, fill: 1 }], 5, first.tracks, {});
    expect(only(other.steps, 'pinToBox').t1).toBe(5 + T.pull + T.fly);
  });

  it('drops a Part as soon as its last Pin is out, while that Pin still flies', () => {
    const { steps } = schedule(
      [
        { kind: 'partFell', part: 2 },
        { kind: 'pinToBuffer', pin: 3, slot: 0 },
      ],
      100,
      emptyTracks(),
      {},
    );
    const fall = only(steps, 'partFell');
    const pin = only(steps, 'pinToBuffer');
    // The rules list partFell first; it still waits for the pull-out.
    expect(fall.t0).toBe(100 + T.pull);
    expect(fall.t0).toBeLessThan(pin.t1);
    expect(fall.t1).toBe(fall.t0 + T.fall);
  });

  it('ripples a drain at the stagger, then closes the Buffer gaps', () => {
    const { steps } = schedule(
      [{ kind: 'bufferDrained', box: 1, colour: 0, from: [0, 2, 3], fill: 3 }],
      0,
      emptyTracks(),
      {},
    );
    const d = only(steps, 'bufferDrained');
    expect(d.lands).toEqual([0, 1, 2].map((k) => k * T.drainStagger + T.drainFly));
    expect(d.t1).toBe((d.lands[2] ?? NaN) + T.compact);
  });

  it('keeps the Buffer a single serial track', () => {
    const first = schedule([{ kind: 'pinToBuffer', pin: 0, slot: 0 }], 0, emptyTracks(), {});
    const t1 = only(first.steps, 'pinToBuffer').t1;
    const drain = schedule(
      [{ kind: 'bufferDrained', box: 0, colour: 0, from: [0], fill: 1 }],
      0,
      first.tracks,
      {},
    );
    expect(only(drain.steps, 'bufferDrained').t0).toBe(t1);
  });

  it('shows win and lose only after everything has settled, plus a beat', () => {
    const { steps, tracks } = schedule([...fillAndClose(0), { kind: 'won' }], 0, emptyTracks(), {});
    const end = only(steps, 'won');
    const latest = Math.max(...steps.filter((s) => s.kind !== 'won').map((s) => s.t1));
    expect(end.t0).toBe(latest + T.endBeat);
    expect(tracks.all).toBeGreaterThanOrEqual(end.t1);
  });

  it('finishes 30 fast taps within about 3 s of the last one', () => {
    let tracks: Tracks = emptyTracks();
    let last = 0;
    let settled = 0;
    for (let i = 0; i < 30; i++) {
      const now = i * 160;
      const events: RulesEvent[] =
        i % 3 === 2 ? fillAndClose(i) : [{ kind: 'pinToBox', pin: i, box: 0, fill: (i % 3) + 1 }];
      const r = schedule(events, now, tracks, {});
      tracks = r.tracks;
      last = now;
      settled = Math.max(settled, ...r.steps.map((s) => s.t1));
    }
    expect(settled - last).toBeLessThan(3200);
  });

  it('scales every step with the speed multiplier', () => {
    const events: RulesEvent[] = [
      { kind: 'partFell', part: 0 },
      ...fillAndClose(0),
      { kind: 'bufferDrained', box: 0, colour: 1, from: [0, 1], fill: 2 },
      { kind: 'lost' },
    ];
    const slow = schedule(events, 0, emptyTracks(), {}).steps;
    const fast = schedule(events, 0, emptyTracks(), { speed: 4 }).steps;
    expect(fast).toHaveLength(slow.length);
    slow.forEach((s, i) => {
      expect(fast[i]?.t0).toBeCloseTo(s.t0 / 4, 6);
      expect(fast[i]?.t1).toBeCloseTo(s.t1 / 4, 6);
    });
  });
});
