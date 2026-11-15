import { describe, expect, it } from 'vitest';
import { isDevMode } from '../src/dev/mode';

describe('dev mode', () => {
  it('is off for players', () => {
    expect(isDevMode({ viteDev: false, search: '' })).toBe(false);
    expect(isDevMode({ viteDev: false, search: '?dev2=1&x=dev' })).toBe(false);
  });
  it('is on in Vite dev mode', () => {
    expect(isDevMode({ viteDev: true, search: '' })).toBe(true);
  });
  it('is on with ?dev, with or without a value', () => {
    expect(isDevMode({ viteDev: false, search: '?dev' })).toBe(true);
    expect(isDevMode({ viteDev: false, search: '?a=1&dev=1' })).toBe(true);
  });
});
