import { describe, expect, it } from 'vitest';
import { GESTURE } from '../src/input/constants';
import {
  gestureInit,
  gestureStep,
  type GestureEvent,
  type GestureState,
  type Intent,
} from '../src/input/gestures';

type Spec = [kind: GestureEvent['kind'], id: number, x: number, y: number, t: number];

/** Runs events through the classifier and returns every intent, in order. */
function run(
  events: Spec[],
  pointerType: GestureEvent['pointerType'] = 'touch',
): { out: Intent[]; state: GestureState } {
  let state = gestureInit();
  const out: Intent[] = [];
  for (const [kind, id, x, y, t] of events) {
    const step = gestureStep(state, { kind, id, x, y, t, pointerType }, GESTURE);
    state = step.state;
    out.push(...step.out);
  }
  return { out, state };
}
const types = (out: Intent[]) => out.map((i) => i.type);

describe('gestureStep', () => {
  it('treats a 6 px wobble as a tap located where the press started', () => {
    const { out } = run([
      ['down', 1, 100, 100, 0],
      ['move', 1, 104, 104, 30],
      ['up', 1, 104, 104, 90],
    ]);
    expect(types(out)).toEqual(['press', 'tap']);
    expect(out[1]).toMatchObject({ type: 'tap', x: 100, y: 100 });
  });

  it('turns a touch past 10 px into a drag, catching up the distance already moved', () => {
    const { out } = run([
      ['down', 1, 0, 0, 0],
      ['move', 1, 12, 0, 20],
      ['move', 1, 20, 0, 40],
      ['up', 1, 20, 0, 60],
    ]);
    expect(types(out)).toEqual(['press', 'pressCancel', 'dragStart', 'drag', 'drag', 'dragEnd']);
    expect(out[3]).toMatchObject({ dx: 12, dy: 0 });
    expect(out[4]).toMatchObject({ dx: 8, dy: 0 });
  });

  it('turns a mouse past 4 px into a drag, but not a touch', () => {
    const moves: Spec[] = [
      ['down', 1, 0, 0, 0],
      ['move', 1, 6, 0, 20],
    ];
    expect(types(run(moves, 'mouse').out)).toContain('dragStart');
    expect(types(run(moves, 'touch').out)).not.toContain('dragStart');
  });

  it('calls a release after holdMs with no tick a hold, not a tap', () => {
    const { out } = run([
      ['down', 1, 50, 50, 0],
      ['up', 1, 50, 50, 300],
    ]);
    expect(types(out)).toEqual(['press', 'pressCancel', 'holdStart', 'holdEnd']);
  });

  it('starts a hold on a tick once holdMs has passed', () => {
    const { out } = run([
      ['down', 1, 50, 50, 0],
      ['tick', 0, 0, 0, 100],
      ['tick', 0, 0, 0, 250],
    ]);
    expect(types(out)).toEqual(['press', 'pressCancel', 'holdStart']);
  });

  it('keeps turning while holding once the finger passes the slop again', () => {
    const { out } = run([
      ['down', 1, 50, 50, 0],
      ['tick', 0, 0, 0, 250],
      ['move', 1, 55, 50, 260],
      ['move', 1, 70, 50, 270],
      ['move', 1, 80, 50, 280],
      ['up', 1, 80, 50, 300],
    ]);
    expect(types(out)).toEqual(['press', 'pressCancel', 'holdStart', 'drag', 'drag', 'holdEnd']);
    expect(out[3]).toMatchObject({ dx: 20, dy: 0 });
  });

  it('ends a hold when a second finger lands, then pinches', () => {
    const { out } = run([
      ['down', 1, 50, 50, 0],
      ['tick', 0, 0, 0, 250],
      ['down', 2, 150, 50, 300],
      ['move', 2, 250, 50, 320],
    ]);
    expect(types(out)).toEqual([
      'press',
      'pressCancel',
      'holdStart',
      'holdEnd',
      'pinchStart',
      'pinch',
    ]);
    expect(out[5]).toMatchObject({ ratio: 2 });
  });

  it('cancels a press and a drag when a second finger lands', () => {
    const press = run([
      ['down', 1, 50, 50, 0],
      ['down', 2, 90, 50, 10],
    ]);
    expect(types(press.out)).toEqual(['press', 'pressCancel', 'pinchStart']);
    const drag = run([
      ['down', 1, 50, 50, 0],
      ['move', 1, 80, 50, 10],
      ['down', 2, 90, 50, 20],
    ]);
    expect(types(drag.out)).toEqual([
      'press',
      'pressCancel',
      'dragStart',
      'drag',
      'dragEnd',
      'pinchStart',
    ]);
  });

  it('ignores the leftover finger after a pinch until it lifts, and a third finger throughout', () => {
    const { out, state } = run([
      ['down', 1, 50, 50, 0],
      ['down', 2, 150, 50, 10],
      ['down', 3, 300, 300, 15],
      ['move', 3, 310, 300, 16],
      ['up', 2, 150, 50, 20],
      ['move', 1, 200, 200, 30],
      ['up', 1, 200, 200, 40],
    ]);
    expect(types(out)).toEqual(['press', 'pressCancel', 'pinchStart', 'pinchEnd']);
    expect(state).toEqual(gestureInit());
  });

  it('lets a new finger join the leftover finger in a new pinch', () => {
    const { out } = run([
      ['down', 1, 50, 50, 0],
      ['down', 2, 150, 50, 10],
      ['up', 2, 150, 50, 20],
      ['down', 3, 250, 50, 30],
      ['move', 3, 450, 50, 40],
    ]);
    expect(types(out).slice(-2)).toEqual(['pinchStart', 'pinch']);
    expect(out.at(-1)).toMatchObject({ ratio: 2 });
  });

  it('cancels a press on a pointercancel without tapping', () => {
    const { out } = run([
      ['down', 1, 0, 0, 0],
      ['cancel', 1, 0, 0, 10],
    ]);
    expect(types(out)).toEqual(['press', 'pressCancel']);
  });
});
