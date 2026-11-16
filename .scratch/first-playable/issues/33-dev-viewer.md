# 33: Dev viewer

**What to build:** Behind Vite dev mode or `?dev`, the level author gets tools to author and check Models and Levels in the game: Part and Socket id labels, highlighting of the Parts covering a selected Socket, ray-check warnings, a solver panel with the difficulty report, live reload of data files, and an optional next-Box forecast. See [spec](../spec.md): Content format, Solver and checks; How Models are built ticket (05).

**Blocked by:** 22 (Solver and winnability gate), 23 (Wooden-toy car and frozen Level).

**Status:** resolved

- [x] Off for players. On in Vite dev mode or with `?dev`.
- [x] Labels Part and Socket ids. Selecting a Socket highlights the Parts in its `coveredBy` list.
- [x] A ray check casts along each Socket's pull-out axis and warns when the Parts it hits differ from `coveredBy`. Warnings only, never a gate.
- [x] The solver panel runs the solver in a Web Worker, can be cancelled, and shows the full report with the 60–80% band.
- [x] Editing a Model or Level file reloads it in the running game.
- [x] An optional next-Box forecast ("if this Box closed now"), off by default.
- [x] Load or validation errors show in the panel, naming the file and id.

## Implementation notes and deviations

- Pure, tested modules in `src/dev/`: `mode`, `dev-content` (non-throwing loader), `ray-check`, `covering`, `forecast`, `solve-client` (injected Worker). The DOM and Babylon glue (`viewer.ts`, `dev.css`, `solver.worker.ts`) is not unit-tested and was not exercised in a browser.
- Socket selection is a dropdown in the panel, not a tap on a Pin in the scene (keeps gesture code, ticket 26, untouched).
- Live reload relies on Vite's own full-page reload when a data file changes. In dev mode the page boots via `loadDevContent`, so a bad file shows in the panel (file name and id) instead of crashing. No state-preserving HMR.
- The ray check approximates every shape by its local bounding box, so curved or rounded shapes can over-hit. Warnings only.
- The viewer is a lazy chunk; `?dev` enables it in production builds too.
- The build version in the dev bar (story 83) is not part of this ticket.
