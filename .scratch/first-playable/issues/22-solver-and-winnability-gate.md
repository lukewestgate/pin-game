# 22: Solver, `pnpm solve` and the winnability gate

**What to build:** A Level can only ship if it's proven winnable. The level author runs `pnpm solve` to see each Level's verdict and difficulty report. `pnpm check` and `pnpm build` fail on any Level in the levels folder that isn't proven winnable, and any drift in its report is caught for review. See [spec](../spec.md): Solver and checks, Testing Decisions seam 1.

**Blocked by:** 20 (Walking skeleton).

**Status:** ready-for-agent

- [ ] The prototype's solver is ported to pure TS: a depth-first search over tap orders with a memo of visited states and a node budget, giving `winnable`, `unwinnable` or `unknown`.
- [ ] The report gives the verdict, one winning tap order, nodes explored, random-tap win rate (1000 playouts, fixed seed, the prototype's playout loop copied exactly), share of first taps that can still win, and peak Buffer use along the winning order.
- [ ] `pnpm solve [file…]` (via `tsx`) prints each report, with the win rate shown against the 60–80% band. The band never fails anything.
- [ ] A Vitest gate discovers every file in the levels folder, validates it, and requires `winnable`. `unknown` fails. The timeout is about 30 s per Level.
- [ ] Each shipped Level's report is pinned in a Vitest snapshot.
- [ ] The solver and playouts can be cancelled or bounded, so they can later run in a Worker.
