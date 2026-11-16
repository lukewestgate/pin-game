// Pure tap / drag / hold / pinch classifier (ticket 13). No DOM: time arrives on each event, plus
// a per-frame `tick`, so it tests headless. Lifted from the gesture-tuning prototype.
import type { GestureConstants } from './constants';

export type PointerKind = 'touch' | 'mouse' | 'pen';

export interface GestureEvent {
  kind: 'down' | 'move' | 'up' | 'cancel' | 'tick';
  /** Pointer id. Ignored on `tick`. */
  id: number;
  x: number;
  y: number;
  /** Milliseconds. */
  t: number;
  pointerType: PointerKind;
}

export type Intent =
  | { type: 'press'; t: number; x: number; y: number }
  | { type: 'pressCancel'; t: number }
  | { type: 'tap'; t: number; x: number; y: number; ms: number; moved: number }
  | { type: 'dragStart'; t: number; x: number; y: number }
  | { type: 'drag'; t: number; dx: number; dy: number }
  | { type: 'dragEnd'; t: number }
  | { type: 'holdStart'; t: number; x: number; y: number }
  | { type: 'holdEnd'; t: number }
  | { type: 'pinchStart'; t: number }
  | { type: 'pinch'; t: number; ratio: number }
  | { type: 'pinchEnd'; t: number };

interface Finger {
  id: number;
  x: number;
  y: number;
}

export type GestureState =
  | { mode: 'idle' }
  | {
      mode: 'pressed';
      id: number;
      pt: PointerKind;
      x0: number;
      y0: number;
      x: number;
      y: number;
      t0: number;
      maxMove: number;
    }
  | {
      mode: 'holding';
      id: number;
      pt: PointerKind;
      x: number;
      y: number;
      hx: number;
      hy: number;
      turning: boolean;
      t0: number;
    }
  | { mode: 'dragging'; id: number; pt: PointerKind; x: number; y: number }
  | { mode: 'pinching'; a: Finger; b: Finger; d0: number }
  /** One finger left over from a pinch: ignored until lifted, or joined by a new finger. */
  | { mode: 'waiting'; id: number; x: number; y: number };

export function gestureInit(): GestureState {
  return { mode: 'idle' };
}

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

function pinchFrom(a: Finger, b: Finger): GestureState {
  return {
    mode: 'pinching',
    a: { id: a.id, x: a.x, y: a.y },
    b: { id: b.id, x: b.x, y: b.y },
    d0: dist(a.x, a.y, b.x, b.y) || 1,
  };
}

export function gestureStep(
  state: GestureState,
  e: GestureEvent,
  K: GestureConstants,
): { state: GestureState; out: Intent[] } {
  const out: Intent[] = [];
  let s = state;
  const slop = (pt: PointerKind) => (pt === 'mouse' ? K.slopMousePx : K.slopTouchPx);

  // A press held long enough is a hold, even if the tick that should have said so came late.
  if (s.mode === 'pressed' && e.kind !== 'down' && e.t - s.t0 >= K.holdMs) {
    out.push({ type: 'pressCancel', t: e.t }, { type: 'holdStart', t: e.t, x: s.x0, y: s.y0 });
    s = {
      mode: 'holding',
      id: s.id,
      pt: s.pt,
      x: s.x,
      y: s.y,
      hx: s.x,
      hy: s.y,
      turning: false,
      t0: s.t0,
    };
  }

  // A second finger landing on a one-finger gesture turns it into a pinch.
  if (
    e.kind === 'down' &&
    (s.mode === 'pressed' || s.mode === 'holding' || s.mode === 'dragging') &&
    e.id !== s.id
  ) {
    out.push(
      s.mode === 'pressed'
        ? { type: 'pressCancel', t: e.t }
        : s.mode === 'holding'
          ? { type: 'holdEnd', t: e.t }
          : { type: 'dragEnd', t: e.t },
      { type: 'pinchStart', t: e.t },
    );
    return { state: pinchFrom(s, e), out };
  }

  switch (s.mode) {
    case 'idle':
      if (e.kind === 'down') {
        s = {
          mode: 'pressed',
          id: e.id,
          pt: e.pointerType,
          x0: e.x,
          y0: e.y,
          x: e.x,
          y: e.y,
          t0: e.t,
          maxMove: 0,
        };
        out.push({ type: 'press', t: e.t, x: e.x, y: e.y });
      }
      break;

    case 'pressed':
      if (e.kind !== 'tick' && e.id !== s.id) break;
      if (e.kind === 'move') {
        const d = dist(e.x, e.y, s.x0, s.y0);
        const maxMove = Math.max(s.maxMove, d);
        if (d > slop(s.pt)) {
          out.push(
            { type: 'pressCancel', t: e.t },
            { type: 'dragStart', t: e.t, x: s.x0, y: s.y0 },
          );
          if (K.catchUp) out.push({ type: 'drag', t: e.t, dx: e.x - s.x0, dy: e.y - s.y0 });
          s = { mode: 'dragging', id: s.id, pt: s.pt, x: e.x, y: e.y };
        } else {
          s = { ...s, x: e.x, y: e.y, maxMove };
        }
      } else if (e.kind === 'up') {
        out.push({
          type: 'tap',
          t: e.t,
          x: s.x0,
          y: s.y0,
          ms: e.t - s.t0,
          moved: s.maxMove,
        });
        s = gestureInit();
      } else if (e.kind === 'cancel') {
        out.push({ type: 'pressCancel', t: e.t });
        s = gestureInit();
      }
      break;

    case 'holding':
      if (e.kind === 'tick' || e.id !== s.id) break;
      if (e.kind === 'move') {
        if (s.turning) {
          out.push({ type: 'drag', t: e.t, dx: e.x - s.x, dy: e.y - s.y });
          s = { ...s, x: e.x, y: e.y };
        } else if (dist(e.x, e.y, s.hx, s.hy) > slop(s.pt)) {
          if (K.catchUp) out.push({ type: 'drag', t: e.t, dx: e.x - s.hx, dy: e.y - s.hy });
          s = { ...s, turning: true, x: e.x, y: e.y };
        } else {
          s = { ...s, x: e.x, y: e.y };
        }
      } else if (e.kind === 'up' || e.kind === 'cancel') {
        out.push({ type: 'holdEnd', t: e.t });
        s = gestureInit();
      }
      break;

    case 'dragging':
      if (e.kind === 'tick' || e.id !== s.id) break;
      if (e.kind === 'move') {
        out.push({ type: 'drag', t: e.t, dx: e.x - s.x, dy: e.y - s.y });
        s = { ...s, x: e.x, y: e.y };
      } else if (e.kind === 'up' || e.kind === 'cancel') {
        out.push({ type: 'dragEnd', t: e.t });
        s = gestureInit();
      }
      break;

    case 'pinching': {
      if (e.kind === 'tick') break;
      const which = e.id === s.a.id ? 'a' : e.id === s.b.id ? 'b' : null;
      if (!which) break; // a third finger is ignored
      if (e.kind === 'move') {
        s = { ...s, [which]: { id: e.id, x: e.x, y: e.y } };
        out.push({
          type: 'pinch',
          t: e.t,
          ratio: dist(s.a.x, s.a.y, s.b.x, s.b.y) / s.d0,
        });
      } else if (e.kind === 'up' || e.kind === 'cancel') {
        out.push({ type: 'pinchEnd', t: e.t });
        const rest = which === 'a' ? s.b : s.a;
        s = { mode: 'waiting', id: rest.id, x: rest.x, y: rest.y };
      }
      break;
    }

    case 'waiting':
      if (e.kind === 'tick') break;
      if (e.kind === 'down' && e.id !== s.id) {
        out.push({ type: 'pinchStart', t: e.t });
        s = pinchFrom(s, e);
      } else if (e.id === s.id && e.kind === 'move') {
        s = { ...s, x: e.x, y: e.y };
      } else if (e.id === s.id && (e.kind === 'up' || e.kind === 'cancel')) {
        s = gestureInit();
      }
      break;
  }
  return { state: s, out };
}
