// DOM glue: feeds pointer, wheel and per-frame events to the pure classifier and acts on its
// intents. All decisions live in gestures.ts, picking.ts and camera-control.ts.
import { pinchZoom, wheelZoom } from './camera-control';
import { CAMERA, FEEDBACK, GESTURE, PICK } from './constants';
import { gestureInit, gestureStep, type GestureState, type Intent } from './gestures';
import { pickPin, type PinCandidate } from './picking';

export interface InputHost {
  /** The Model region in CSS px. Picking happens only inside it. */
  modelRegion(): { x: number; y: number; w: number; h: number };
  candidates(): PinCandidate[];
  zoom(): number;
  setZoom(zoom: number): void;
  turn(dx: number, dy: number): void;
  highlight(pin: number | null): void;
  /** A tap on a tappable Pin. */
  tapPin(pin: number): void;
  /** A tap on a Blocked Pin. */
  blockedTap(pin: number): void;
}

export interface Input {
  /** Call every frame, so a press held past `holdMs` becomes a hold. */
  tick(nowMs: number): void;
  dispose(): void;
}

export function attachInput(canvas: HTMLCanvasElement, host: InputHost): Input {
  let state: GestureState = gestureInit();
  let zoomAtPinchStart = 1;

  const inRegion = (x: number, y: number): boolean => {
    const r = host.modelRegion();
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  };
  const pick = (x: number, y: number) =>
    inRegion(x, y) ? pickPin(x, y, host.candidates(), PICK) : { id: null, how: 'miss' as const };

  function handle(intent: Intent): void {
    switch (intent.type) {
      case 'press':
        host.highlight(pick(intent.x, intent.y).id);
        break;
      case 'pressCancel':
        host.highlight(null);
        break;
      case 'tap': {
        host.highlight(null);
        const { id } = pick(intent.x, intent.y);
        if (id === null) break;
        if (host.candidates().find((c) => c.id === id)?.blocked) {
          host.blockedTap(id);
          navigator.vibrate?.(FEEDBACK.vibrateBlockedMs);
        } else host.tapPin(id);
        break;
      }
      case 'drag':
        host.turn(intent.dx, intent.dy);
        break;
      case 'pinchStart':
        zoomAtPinchStart = host.zoom();
        break;
      case 'pinch':
        host.setZoom(pinchZoom(zoomAtPinchStart, intent.ratio, CAMERA));
        break;
      // Peek (ticket 27) will use holdStart and holdEnd; dragStart/dragEnd/pinchEnd need no action.
      default:
        break;
    }
  }

  function feed(kind: 'down' | 'move' | 'up' | 'cancel', e: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    const step = gestureStep(
      state,
      {
        kind,
        id: e.pointerId,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t: e.timeStamp,
        pointerType: e.pointerType === 'mouse' || e.pointerType === 'pen' ? e.pointerType : 'touch',
      },
      GESTURE,
    );
    state = step.state;
    step.out.forEach(handle);
  }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // left button only
    canvas.setPointerCapture(e.pointerId);
    feed('down', e);
  };
  const onMove = (e: PointerEvent) => feed('move', e);
  const onUp = (e: PointerEvent) => feed('up', e);
  const onCancel = (e: PointerEvent) => feed('cancel', e);
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    host.setZoom(wheelZoom(host.zoom(), e, CAMERA));
  };
  const noDefault = (e: Event) => e.preventDefault();

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', noDefault);
  document.addEventListener('gesturestart', noDefault); // iOS Safari page zoom

  return {
    tick(nowMs) {
      const step = gestureStep(
        state,
        { kind: 'tick', id: 0, x: 0, y: 0, t: nowMs, pointerType: 'touch' },
        GESTURE,
      );
      state = step.state;
      step.out.forEach(handle);
    },
    dispose() {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', noDefault);
      document.removeEventListener('gesturestart', noDefault);
    },
  };
}
