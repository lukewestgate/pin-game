import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { report } from '../src/solver/report';

const files = readdirSync(new URL('../src/data/levels/', import.meta.url)).filter((f) =>
  f.endsWith('.json'),
);
const levels = bundledLevels();

describe('winnability gate', () => {
  it('covers every file in the levels folder', () => {
    expect(levels).toHaveLength(files.length);
  });

  describe.each(levels.map((l) => [l.id, l] as const))('Level %s', (_id, level) => {
    // `unknown` (budget exhausted) fails too: a Level only ships if it is proven winnable.
    const result = report(level);

    it('is proven winnable', () => {
      expect(result.verdict).toBe('winnable');
    }, 30_000);

    it('has a difficulty report that matches the pinned snapshot', () => {
      expect(result).toMatchSnapshot();
    }, 30_000);
  });
});
