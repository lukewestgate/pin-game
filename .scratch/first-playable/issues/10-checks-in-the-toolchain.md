# Checks in the toolchain

Type: grilling
Status: open
Parent: ../map.md
Blocked by: 06

## Question

Beyond the dev viewer's Web Worker, where do the winnability and content checks run, and what does the test suite cover? Specifically:

- Is every file in `data/levels/` solved in a Vitest test, a `tsx` CLI (`pnpm solve`), a build step, or several of these?
- Does a level that can't be won fail the build?
- Does the solver also report difficulty metrics (random-tap win rate, winning-order fraction, peak Buffer use), and where are they shown?
- What do the `rules` and `content` tests cover (prototype scenarios ported as cases, validation failures, determinism of the seeded colour rule)?

Stack is fixed by Tech stack: Vitest, `tsx`, pure-TS `rules` / `solver` / `content`.
