import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

async function ruleIds(code: string, filePath: string): Promise<(string | null)[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return result?.messages.map((m) => m.ruleId) ?? [];
}

describe('lint keeps rules, solver and content headless', () => {
  it.each(['src/rules/violation.ts', 'src/solver/violation.ts', 'src/content/violation.ts'])(
    'rejects a Babylon import and DOM use in %s',
    async (filePath) => {
      const code = [
        "import { Scene } from '@babylonjs/core/scene';",
        "import { draw } from '../render/view';",
        'export const x = [Scene, draw, document.title, window.innerWidth];',
        '',
      ].join('\n');

      const ids = await ruleIds(code, filePath);

      expect(ids.filter((id) => id === 'no-restricted-imports')).toHaveLength(2);
      expect(ids.filter((id) => id === 'no-restricted-globals')).toHaveLength(2);
    },
  );

  it('allows pure Babylon modules and the DOM in render', async () => {
    const code =
      "import { Scene } from '@babylonjs/core/scene.pure';\nexport const x = [Scene, document];\n";

    expect(await ruleIds(code, 'src/render/fine.ts')).toEqual([]);
  });
});

describe('lint gathers Babylon side effects in one place', () => {
  const sideEffecting = "import { Scene } from '@babylonjs/core/scene';\nexport const x = Scene;\n";

  it('rejects a side-effecting Babylon module outside the side-effects file', async () => {
    expect(await ruleIds(sideEffecting, 'src/render/view.ts')).toEqual(['no-restricted-imports']);
    expect(await ruleIds("import '@babylonjs/core';\n", 'src/main.ts')).toEqual([
      'no-restricted-imports',
    ]);
  });

  it('allows it in the side-effects file', async () => {
    expect(await ruleIds(sideEffecting, 'src/render/babylon-side-effects.ts')).toEqual([]);
  });
});
