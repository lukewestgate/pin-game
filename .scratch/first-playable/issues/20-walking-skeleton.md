# 20: Walking skeleton: tap Pins on a tiny Level

**What to build:** The thinnest playable path through every layer. The player opens the app in a browser, sees a tiny hand-made Model built from primitives, clicks Pins to remove them, and watches each Pin snap (no animation) into the open Box of its colour or into the Buffer. Boxes close and get replaced, Buffer Pins drain, Parts disappear once their last Pin is out, and the Level is won or lost under the spec's rules. Plain DOM Restart and Undo buttons work, and the result shows as plain text. This ticket also sets up the toolchain every later ticket builds on. See [spec](../spec.md): Stack and structure, Rules engine, Content format.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] One package with pnpm (pinned via `packageManager`), Vite, strict TypeScript with `noUncheckedIndexedAccess`, ESLint (typescript-eslint), Prettier and Vitest. Node pinned in `.nvmrc` and `engines` (20.19 or later; 24 LTS is fine).
- [x] ESLint forbids Babylon and DOM imports in the rules, solver and content modules, and a deliberate violation fails lint.
- [x] `pnpm check` runs typecheck, lint, `vitest run` and Prettier `--check`. `pnpm build` runs `check` first.
- [x] Babylon is imported through `@babylonjs/core` deep ES-module imports, with side-effect imports gathered in one place. The WebGL2 engine is used, with no hand-written GLSL.
- [x] Minimal Zod schemas for Model and Level (ids, `formatVersion`, Parts with one or more shapes as a tagged union, Sockets with position, pull-out direction and `coveredBy`; a Level with Model id, Socket colours, seed and rule overrides). TS types are inferred from them. The loader turns string ids into indices.
- [x] The prototype's rules module is ported to pure TS with its PRNG copied exactly. `tap(level, state, pin) → { state, events }` emits `pinToBox`, `pinToBuffer`, `boxClosed`, `boxOpened`, `bufferDrained`, `partFell`, `won` and `lost`. Rule numbers come from developer defaults (3 Boxes, Capacity 3, Buffer 5) merged with Level overrides, and `reachable-first` is a named next-colour strategy.
- [x] Undo is a stack of past states outside the reducer, and can undo a loss.
- [x] A tiny Level and Model in the data folders, bundled with an eager glob import, with at least one covered Pin.
- [x] Rendering draws the Model from shapes and the Boxes and Buffer with an orthographic HUD camera, and redraws from rules state after each tap. Clicking a Pin calls `tap()`. Rendering never decides outcomes.
- [x] A few Vitest tests through the content → rules seam: a tap to a Box, a tap to the Buffer, and a Blocked tap refused.

## Comments

Implemented on branch `worktree-20-walking-skeleton`. Notes for later tickets:

- TypeScript is pinned to 6.0 (typescript-eslint 8.72 needs TS < 6.1). `.nvmrc` is 22, the machine's Node, which meets the 20.19+ floor.
- Babylon 9 ships `*.pure` modules. Render code imports only those, and side-effect modules live in `src/render/babylon-side-effects.ts`. Lint rejects a side-effecting Babylon import anywhere else.
- Box events carry `box` (the Box's position in the row). `pinToBuffer.slot` is a Buffer position.
- The prototype's `stuck` status (Model empty, Pins left in the Buffer) is a thrown rule-bug error. Only a Level whose colour totals aren't multiples of Capacity can reach it, which ticket 21's validation will reject.
- `src/render/hud-layout.ts` is a stand-in until ticket 24's pure `layout`.
- The main bundle is about 1.2 MB minified (291 KB gzip), above ADR 0002's rough 0.7 MB. Worth trimming the side-effect imports later.
- Checked in headless Firefox (WebGL2): the cart, three Boxes and the Buffer render, and clicking Pins sends them to a Box or the Buffer, drops a fallen wheel and enables Undo.
