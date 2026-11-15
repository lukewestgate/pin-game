# 33: Dev viewer

**What to build:** Behind Vite dev mode or `?dev`, the level author gets tools to author and check Models and Levels in the game: Part and Socket id labels, highlighting of the Parts covering a selected Socket, ray-check warnings, a solver panel with the difficulty report, live reload of data files, and an optional next-Box forecast. See [spec](../spec.md): Content format, Solver and checks; How Models are built ticket (05).

**Blocked by:** 22 (Solver and winnability gate), 23 (Wooden-toy car and frozen Level).

**Status:** ready-for-agent

- [ ] Off for players. On in Vite dev mode or with `?dev`.
- [ ] Labels Part and Socket ids. Selecting a Socket highlights the Parts in its `coveredBy` list.
- [ ] A ray check casts along each Socket's pull-out axis and warns when the Parts it hits differ from `coveredBy`. Warnings only, never a gate.
- [ ] The solver panel runs the solver in a Web Worker, can be cancelled, and shows the full report with the 60–80% band.
- [ ] Editing a Model or Level file reloads it in the running game.
- [ ] An optional next-Box forecast ("if this Box closed now"), off by default.
- [ ] Load or validation errors show in the panel, naming the file and id.
