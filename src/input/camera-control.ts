// Pure maths for turning and zooming the car. Turntable: horizontal drags spin the car about its
// own upright axis, vertical drags tilt it, with pitch limited. Zoom is 1x to zoomMax, no panning.
import type { CameraConstants } from './constants';

export interface View {
  /** Turntable angle (the camera's alpha), radians. */
  yaw: number;
  /** Camera tilt above (negative) or below (positive) the horizon, radians. */
  pitch: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Applies a drag of (dx, dy) CSS px. `regionWidth` is the Model region's width. */
export function turn(
  view: View,
  dx: number,
  dy: number,
  regionWidth: number,
  K: CameraConstants,
): View {
  const perPx = (K.turnDeg * Math.PI) / 180 / Math.max(1, regionWidth);
  return {
    yaw: view.yaw - dx * perPx,
    pitch: clamp(view.pitch - dy * perPx, -K.pitchLimit, K.pitchLimit),
  };
}

/** Zoom follows the fingers: the zoom at pinch start times the finger-gap ratio. */
export function pinchZoom(zoomAtStart: number, ratio: number, K: CameraConstants): number {
  return clamp(zoomAtStart * Math.pow(ratio, K.pinchGain), K.zoomMin, K.zoomMax);
}

export interface WheelLike {
  deltaY: number;
  deltaMode: number;
  ctrlKey: boolean;
}

export function wheelZoom(zoom: number, wheel: WheelLike, K: CameraConstants): number {
  const dy = wheel.deltaMode === 1 ? wheel.deltaY * K.wheelLinePx : wheel.deltaY;
  const gain = wheel.ctrlKey ? K.padGain : K.wheelGain;
  return clamp(zoom * Math.exp(-dy * gain), K.zoomMin, K.zoomMax);
}
