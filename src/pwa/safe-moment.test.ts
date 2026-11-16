import { describe, expect, it } from 'vitest';
import { isSafeToUpdate } from './safe-moment';

describe('isSafeToUpdate', () => {
  it('is safe before the first tap of a Level', () => {
    expect(isSafeToUpdate({ tapsOnLevel: 0, bannerShowing: false })).toBe(true);
  });

  it('is not safe mid-Level', () => {
    expect(isSafeToUpdate({ tapsOnLevel: 3, bannerShowing: false })).toBe(false);
  });

  it('is safe once a win or lose banner shows, even after taps', () => {
    expect(isSafeToUpdate({ tapsOnLevel: 9, bannerShowing: true })).toBe(true);
  });
});
