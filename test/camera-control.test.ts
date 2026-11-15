import { describe, expect, it } from 'vitest';
import { CAMERA } from '../src/input/constants';
import { pinchZoom, turn, wheelZoom } from '../src/input/camera-control';

describe('camera control', () => {
  it('turns 200 degrees for a drag across the Model region width', () => {
    const t = turn({ yaw: 0, pitch: 0 }, 300, 0, 300, CAMERA);
    expect(t.yaw).toBeCloseTo(-(200 * Math.PI) / 180, 6);
    expect(t.pitch).toBe(0);
  });

  it('tilts with vertical drags and limits pitch to +-1.4 rad', () => {
    expect(turn({ yaw: 0, pitch: 0 }, 0, 300, 300, CAMERA).pitch).toBe(-1.4);
    expect(turn({ yaw: 0, pitch: 0 }, 0, -300, 300, CAMERA).pitch).toBe(1.4);
  });

  it('follows the fingers when pinching and clamps zoom to 1x..2.2x', () => {
    expect(pinchZoom(1.5, 1.2, CAMERA)).toBeCloseTo(1.8, 6);
    expect(pinchZoom(1.5, 3, CAMERA)).toBe(2.2);
    expect(pinchZoom(1.5, 0.2, CAMERA)).toBe(1);
  });

  it('zooms with the wheel, counting line deltas as 16 px, and faster for a trackpad pinch', () => {
    const px = wheelZoom(1, { deltaY: -100, deltaMode: 0, ctrlKey: false }, CAMERA);
    expect(px).toBeCloseTo(Math.exp(0.15), 6);
    const lines = wheelZoom(1, { deltaY: -1, deltaMode: 1, ctrlKey: false }, CAMERA);
    expect(lines).toBeCloseTo(Math.exp(16 * 0.0015), 6);
    const pad = wheelZoom(1, { deltaY: -10, deltaMode: 0, ctrlKey: true }, CAMERA);
    expect(pad).toBeCloseTo(Math.exp(0.1), 6);
    expect(wheelZoom(2, { deltaY: -1000, deltaMode: 0, ctrlKey: false }, CAMERA)).toBe(2.2);
  });
});
