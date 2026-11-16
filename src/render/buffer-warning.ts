// The Buffer's near-full warning as a pure function of its count. No Babylon or DOM imports.

export interface BufferWarning {
  /** Slots that get an amber ring: the empty ones once two or fewer are left. */
  amber: number[];
  /** The slot that also pulses red (the last empty one), or null. */
  pulse: number | null;
}

/** Slots left at which the amber rings and the red pulse begin. */
export const AMBER_AT = 2;
export const PULSE_AT = 1;

export function bufferWarning(count: number, size: number): BufferWarning {
  const left = size - count;
  if (left < PULSE_AT || left > AMBER_AT) return { amber: [], pulse: null };
  const amber = Array.from({ length: left }, (_, i) => count + i);
  return { amber, pulse: left === PULSE_AT ? count : null };
}
