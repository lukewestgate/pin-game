// Every gesture number in one place, so they can be tuned on a device. Starting values from the
// gesture-tuning prototype (ticket 13).
export interface GestureConstants {
  /** A press held this long without moving starts a hold (Peek). */
  holdMs: number;
  /** Movement allowed before a press becomes a drag. */
  slopTouchPx: number;
  slopMousePx: number;
  /** On drag start, turn by the distance already moved, so the car doesn't lag the finger. */
  catchUp: boolean;
}

export interface PickConstants {
  /** Tap target radius = max(drawn head radius x targetScale, minTargetPx / 2). */
  targetScale: number;
  minTargetPx: number;
  /** A miss takes the nearest tappable Pin whose target edge is this close. */
  assistPx: number;
  /** Where targets overlap, a tappable Pin beats a Blocked one. */
  preferUnblocked: boolean;
}

export interface CameraConstants {
  /** Degrees turned by a drag across the Model region's width. */
  turnDeg: number;
  /** Turntable pitch limit, in radians. */
  pitchLimit: number;
  zoomMin: number;
  zoomMax: number;
  pinchGain: number;
  wheelGain: number;
  /** A trackpad pinch arrives as ctrlKey wheel events. */
  padGain: number;
  /** Wheel deltas in line mode count as this many px. */
  wheelLinePx: number;
}

export interface FeedbackConstants {
  pressScale: number;
  wiggleMs: number;
  wiggleAmp: number;
  wiggleCycles: number;
  flashMs: number;
  vibrateBlockedMs: number;
}

export const GESTURE: GestureConstants = {
  holdMs: 240,
  slopTouchPx: 10,
  slopMousePx: 4,
  catchUp: true,
};

export const PICK: PickConstants = {
  targetScale: 1.6,
  minTargetPx: 36,
  assistPx: 18,
  preferUnblocked: true,
};

export const CAMERA: CameraConstants = {
  turnDeg: 200,
  pitchLimit: 1.4,
  zoomMin: 1,
  zoomMax: 2.2,
  pinchGain: 1,
  wheelGain: 0.0015,
  padGain: 0.01,
  wheelLinePx: 16,
};

export const FEEDBACK: FeedbackConstants = {
  pressScale: 1.25,
  wiggleMs: 320,
  wiggleAmp: 0.05,
  wiggleCycles: 3,
  flashMs: 350,
  vibrateBlockedMs: 18,
};
