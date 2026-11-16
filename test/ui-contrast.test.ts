import { describe, expect, it } from 'vitest';
import { UI } from '../src/render/ui-colours';

function luminance(hex: string): number {
  const channel = (i: number): number => {
    const c = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const AA_LARGE = 3;

describe('UI colours', () => {
  it('white on the teal buttons passes WCAG AA for large text', () => {
    expect(contrast('#ffffff', UI.teal)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('white on the slate lose ribbon passes WCAG AA for large text', () => {
    expect(contrast('#ffffff', UI.slate)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('ink on the green confirm buttons passes WCAG AA for large text', () => {
    expect(contrast(UI.ink, UI.go)).toBeGreaterThanOrEqual(AA_LARGE);
  });

  it('ink on the gold win ribbon and the yellow dev pill passes', () => {
    expect(contrast(UI.ink, UI.gold)).toBeGreaterThanOrEqual(AA_LARGE);
  });
});
