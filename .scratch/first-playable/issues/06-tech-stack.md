# Tech stack

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 01, 02, 03

## Question

Which engine or library, language, build tooling and project structure should the first version use? The choice must work as a PWA, handle the controls in the map's Notes, deliver the target look, and let the rules engine and solver run headless for tests.

## Answer

Resolved with the human on 2026-11-15 (grilling). The engine, in-scene HUD and rules/render seam are recorded in [ADR 0002](../../../docs/adr/0002-babylon-typescript-for-the-first-version.md). No glossary changes.

- **Engine:** Babylon.js + TypeScript, on the WebGL2 `Engine` (not `WebGPUEngine`). No hand-written GLSL: toon shading uses Babylon's standard or node materials, so a later switch to WebGPU is mostly a matter of how the engine is created.
- **Imports:** `@babylonjs/core` ES modules with deep imports for tree-shaking, never the UMD bundle. Side-effect imports are collected in one `babylon.ts`.
- **Tooling:** Vite + pnpm. Node 24 LTS pinned in `.nvmrc` and `engines`. `tsx` runs TS scripts. Vitest runs tests.
- **TS and lint:** `strict` plus `noUncheckedIndexedAccess`. ESLint (typescript-eslint) and Prettier.
- **Layout:** one package, no monorepo.
  - `src/rules`, `src/solver` and `src/content` (schemas, loader, validation) are pure TS. ESLint `no-restricted-imports` forbids Babylon and DOM imports there, so they run headless in Node.
  - `src/render`, `src/input` and `src/dev` hold the browser code. `src/main.ts` wires it together.
  - Data lives in `data/models/*.json` and `data/levels/*.json`.
  - The dev viewer sits behind Vite dev mode or `?dev`.
- **Rules/render seam:** the prototype's `Rules` module is ported to TS, keeping its pure-function design. `tap(level, state, pin) → { state, events[] }`, with events `pinToBox`, `pinToBuffer`, `boxClosed`, `boxOpened`, `bufferDrained`, `partFell`, `won` and `lost`. Rendering only plays events as animations and never decides outcomes. Undo is a stack of past states.
- **HUD:** the Box row and Buffer are drawn in the Babylon scene by a second orthographic camera, so a removed Pin flies from Model to Box as the same instanced mesh. The DOM is used only for text, buttons and the dev panel.
- **Content:** Zod schemas for Model and Level, with TS types inferred from them. Cross-field checks are plain functions run after parsing: colour totals are multiples of Capacity, covering has no loops, Cores cover nothing, and no Socket is covered by its own Part.
- **Solver:** runs in a Web Worker in the dev viewer, because worst cases take about 10 s. Its other homes are decided in Checks in the toolchain.
- **Animation:** Babylon's built-in animations and easing, with no separate tweening library. Sequencing is decided in Animation sequencing and input during animations.
