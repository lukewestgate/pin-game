import { describe, expect, it, vi } from 'vitest';
import { attachInput, type InputHost } from '../src/input/input';
import type { PinCandidate } from '../src/input/picking';

describe('attachInput', () => {
  it('computes the Pin candidates once per press and once per tap', () => {
    const listeners = new Map<string, (e: unknown) => void>();
    const canvas = {
      addEventListener: (type: string, fn: (e: unknown) => void) => listeners.set(type, fn),
      removeEventListener: () => undefined,
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
      setPointerCapture: () => undefined,
    } as unknown as HTMLCanvasElement;
    vi.stubGlobal('document', {
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    const cand: PinCandidate = {
      id: 3,
      x: 50,
      y: 50,
      r: 20,
      visible: true,
      blocked: true,
      depth: 1,
    };
    const candidates = vi.fn(() => [cand]);
    const blockedTap = vi.fn();
    const host: InputHost = {
      modelRegion: () => ({ x: 0, y: 0, w: 100, h: 100 }),
      candidates,
      zoom: () => 1,
      setZoom: () => undefined,
      turn: () => undefined,
      highlight: () => undefined,
      peekAt: () => undefined,
      peekEnd: () => undefined,
      tapPin: () => undefined,
      blockedTap,
      pointerUp: () => undefined,
    };
    attachInput(canvas, host);
    const ev = (t: number) => ({
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: 50,
      clientY: 50,
      timeStamp: t,
    });
    listeners.get('pointerdown')?.(ev(0));
    expect(candidates).toHaveBeenCalledTimes(1);
    listeners.get('pointerup')?.(ev(50));
    expect(blockedTap).toHaveBeenCalledWith(3);
    expect(candidates).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
