import { describe, expect, it } from 'vitest';
import { bufferWarning } from '../src/render/buffer-warning';

describe('Buffer warning', () => {
  it('is silent while three or more slots are free', () => {
    expect(bufferWarning(0, 5)).toEqual({ amber: [], pulse: null });
    expect(bufferWarning(2, 5)).toEqual({ amber: [], pulse: null });
  });

  it('rings both empty slots in amber at 2 left', () => {
    expect(bufferWarning(3, 5)).toEqual({ amber: [3, 4], pulse: null });
  });

  it('rings the last empty slot in amber and pulses it red at 1 left', () => {
    expect(bufferWarning(4, 5)).toEqual({ amber: [4], pulse: 4 });
  });

  it('follows the Buffer size, not a fixed five', () => {
    expect(bufferWarning(6, 8)).toEqual({ amber: [6, 7], pulse: null });
    expect(bufferWarning(3, 4)).toEqual({ amber: [3], pulse: 3 });
  });

  it('is silent for a full Buffer (the Level is already lost)', () => {
    expect(bufferWarning(5, 5)).toEqual({ amber: [], pulse: null });
  });
});
