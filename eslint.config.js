import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Modules that must run headless (solver, tests, a future generator): no engine, no DOM.
export const PURE_MODULES = ['src/rules/**', 'src/solver/**', 'src/content/**'];

// Browser-only globals: everything the browser defines that Node does not.
const domGlobals = Object.keys(globals.browser).filter((name) => !(name in globals.node));

// Babylon modules with side effects: each `x.js` that has an `x.pure.js` twin. Only
// src/render/babylon-side-effects.ts may import these; everything else imports the `.pure` twin.
const babylonRoot = fileURLToPath(new URL('node_modules/@babylonjs/core/', import.meta.url));
const babylonSideEffectModules = fs
  .readdirSync(babylonRoot, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.pure.js'))
  .map((file) => `@babylonjs/core/${file.slice(0, -'.pure.js'.length).split(path.sep).join('/')}`);
const SIDE_EFFECTS_FILE = 'src/render/babylon-side-effects.ts';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', '.scratch/', '.claude/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    ignores: [SIDE_EFFECTS_FILE, ...PURE_MODULES],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: ['@babylonjs/core', ...babylonSideEffectModules].map((name) => ({
            name,
            message: `Import the side-effect-free \`.pure\` module; side effects go in ${SIDE_EFFECTS_FILE}.`,
          })),
        },
      ],
    },
  },
  {
    files: PURE_MODULES,
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@babylonjs/*', 'babylonjs', 'babylonjs-*'],
              message: 'Rules, solver and content must stay engine-free (ADR 0002).',
            },
            {
              group: ['**/render/**', '**/input/**', '**/audio/**', '**/dev/**', '**/main'],
              message: 'Rules, solver and content must not depend on engine or DOM modules.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...domGlobals.map((name) => ({
          name,
          message: 'Rules, solver and content must not touch the DOM (ADR 0002).',
        })),
      ],
    },
  },
);
