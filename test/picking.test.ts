import { describe, expect, it } from 'vitest';
import { PICK } from '../src/input/constants';
import { pickPin, type PinCandidate } from '../src/input/picking';

const pin = (
  id: number,
  x: number,
  y: number,
  extra: Partial<PinCandidate> = {},
): PinCandidate => ({ id, x, y, r: 9, visible: true, blocked: false, depth: 10, ...extra });

describe('pickPin', () => {
  it('takes a direct hit inside the enlarged target (radius max(1.6 x 9, 18) = 18)', () => {
    expect(pickPin(115, 100, [pin(1, 100, 100)], PICK)).toMatchObject({ id: 1, how: 'direct' });
    expect(pickPin(120, 100, [pin(1, 100, 100)], PICK)).toMatchObject({ how: 'assist' });
  });

  it('lets a tappable Pin win an overlap against a closer Blocked one', () => {
    const cands = [pin(1, 100, 100, { blocked: true }), pin(2, 112, 100)];
    expect(pickPin(103, 100, cands, PICK)).toMatchObject({ id: 2, how: 'direct' });
  });

  it('picks the closest centre among tappable Pins, then the nearer to the camera', () => {
    expect(pickPin(104, 100, [pin(1, 100, 100), pin(2, 112, 100)], PICK).id).toBe(1);
    const tie = [pin(1, 100, 100, { depth: 12 }), pin(2, 100, 100, { depth: 9 })];
    expect(pickPin(100, 100, tie, PICK).id).toBe(2);
  });

  it('answers a direct hit on a lone Blocked Pin, so it can wiggle', () => {
    expect(pickPin(100, 100, [pin(1, 100, 100, { blocked: true })], PICK)).toMatchObject({
      id: 1,
      how: 'direct',
    });
  });

  it('assists a near miss to a tappable Pin within 18 px of its target edge', () => {
    expect(pickPin(130, 100, [pin(1, 100, 100)], PICK)).toMatchObject({ id: 1, how: 'assist' });
    expect(pickPin(140, 100, [pin(1, 100, 100)], PICK)).toEqual({ id: null, how: 'miss' });
  });

  it('never assists to a Blocked Pin', () => {
    expect(pickPin(130, 100, [pin(1, 100, 100, { blocked: true })], PICK)).toEqual({
      id: null,
      how: 'miss',
    });
  });

  it('never picks a hidden Pin, directly or by assist', () => {
    expect(pickPin(100, 100, [pin(1, 100, 100, { visible: false })], PICK)).toEqual({
      id: null,
      how: 'miss',
    });
    const cands = [pin(1, 100, 100, { visible: false }), pin(2, 125, 100)];
    expect(pickPin(100, 100, cands, PICK)).toMatchObject({ id: 2, how: 'assist' });
  });
});
