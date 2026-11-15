# 20: Walking skeleton: tap Pins on a tiny Level

**What to build:** The thinnest playable path through every layer. The player opens the app in a browser, sees a tiny hand-made Model built from primitives, clicks Pins to remove them, and watches each Pin snap (no animation) into the open Box of its colour or into the Buffer. Boxes close and get replaced, Buffer Pins drain, Parts disappear once their last Pin is out, and the Level is won or lost under the spec's rules. Plain DOM Restart and Undo buttons work, and the result shows as plain text. This ticket also sets up the toolchain every later ticket builds on. See [spec](../spec.md): Stack and structure, Rules engine, Content format.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] One package with pnpm (pinned via `packageManager`), Vite, strict TypeScript with `noUncheckedIndexedAccess`, ESLint (typescript-eslint), Prettier and Vitest. Node pinned in `.nvmrc` and `engines` (20.19 or later; 24 LTS is fine).
- [ ] ESLint forbids Babylon and DOM imports in the rules, solver and content modules, and a deliberate violation fails lint.
- [ ] `pnpm check` runs typecheck, lint, `vitest run` and Prettier `--check`. `pnpm build` runs `check` first.
- [ ] Babylon is imported through `@babylonjs/core` deep ES-module imports, with side-effect imports gathered in one place. The WebGL2 engine is used, with no hand-written GLSL.
- [ ] Minimal Zod schemas for Model and Level (ids, `formatVersion`, Parts with one or more shapes as a tagged union, Sockets with position, pull-out direction and `coveredBy`; a Level with Model id, Socket colours, seed and rule overrides). TS types are inferred from them. The loader turns string ids into indices.
- [ ] The prototype's rules module is ported to pure TS with its PRNG copied exactly. `tap(level, state, pin) → { state, events }` emits `pinToBox`, `pinToBuffer`, `boxClosed`, `boxOpened`, `bufferDrained`, `partFell`, `won` and `lost`. Rule numbers come from developer defaults (3 Boxes, Capacity 3, Buffer 5) merged with Level overrides, and `reachable-first` is a named next-colour strategy.
- [ ] Undo is a stack of past states outside the reducer, and can undo a loss.
- [ ] A tiny Level and Model in the data folders, bundled with an eager glob import, with at least one covered Pin.
- [ ] Rendering draws the Model from shapes and the Boxes and Buffer with an orthographic HUD camera, and redraws from rules state after each tap. Clicking a Pin calls `tap()`. Rendering never decides outcomes.
- [ ] A few Vitest tests through the content → rules seam: a tap to a Box, a tap to the Buffer, and a Blocked tap refused.
