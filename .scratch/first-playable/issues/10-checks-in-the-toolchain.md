# Checks in the toolchain

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 06

## Question

Beyond the dev viewer's Web Worker, where do the winnability and content checks run, and what does the test suite cover? Specifically:

- Is every file in `data/levels/` solved in a Vitest test, a `tsx` CLI (`pnpm solve`), a build step, or several of these?
- Does a level that can't be won fail the build?
- Does the solver also report difficulty metrics (random-tap win rate, winning-order fraction, peak Buffer use), and where are they shown?
- What do the `rules` and `content` tests cover (prototype scenarios ported as cases, validation failures, determinism of the seeded colour rule)?

Stack is fixed by Tech stack: Vitest, `tsx`, pure-TS `rules` / `solver` / `content`.

## Answer

Resolved with the human on 2026-11-15 (grilling). The glossary gained **Random-tap win rate**. No ADR, because none of this is hard to reverse.

**Gates**

- **Winnability gate: a Vitest test.** It finds every file in `data/levels/`, loads and validates it, and requires the solver to prove it winnable. A solver that runs out of its node budget (*unknown*) fails too: a level only ships if it is proven winnable. The test has a generous timeout of about 30 s per level. If a future level hits the budget, simplify the level or improve the solver rather than letting it through.
- **`pnpm solve [file…]`:** a `tsx` script for authoring. It prints each level's verdict and report, with the random-tap win rate shown next to the 60–80% band. It uses the same pure `solver` as the test.
- **No Vite build step.** It would tie production builds to the solver and duplicate the test.
- **`pnpm check`** runs `tsc --noEmit`, ESLint, `vitest run` and Prettier `--check`. `pnpm build` runs `check` first, so a level that can't be won fails the build through the tests. There is no pre-commit hook, and no CI until a remote and hosting exist (see "PWA specifics" in the fog).

**Difficulty report**

- **What the solver reports:** the verdict, one winning tap order, nodes explored, the random-tap win rate (1000 playouts with a fixed seed, so the number is the same on every run), the share of first taps that can still win, and the peak Buffer use along the winning order found.
- **Left out:** the exact winning-order fraction and the lowest possible peak Buffer, because both need a full search of every tap order. They are left for the level editor in the vision.
- **Where it's shown:** `pnpm solve` and the dev viewer's solver panel.
- **The 60–80% band never fails a test.** It is a design goal checked by the dealing script that freezes a level. Future Campaign levels ramp up in difficulty, so one global band would be wrong for them, and a per-level target would change the Level format before the editor needs it.
- **Drift is caught by a snapshot.** Each shipped level's report is pinned in a Vitest snapshot. Any change to the rules, the next-colour strategy or the level data that moves the numbers fails the snapshot. You review the diff and accept it with `vitest -u`.
- **Matching the prototype:** the port copies the prototype's PRNG and playout loop exactly. The first snapshot for the frozen car level must match the random-tap win rate `car-sweep.cjs` measured for it. After that, the snapshot takes over.

**What the tests cover**

- **Rules: a named test for each edge case**, each on a tiny hand-built Level, checking both the resulting state and the exact list of events:
  - the level is lost the moment a Pin fills the last Buffer slot
  - a grey Box appears when no colour qualifies
  - a chain of drain → close → replacement
  - a Blocked tap is refused and changes nothing
  - taps after a win or loss are refused
  - there are never two open Boxes of the same colour
  - the reachable-first preference
  - a per-level override (such as Buffer 6) takes effect
  - undo works, including undoing a loss
- **Rules: invariants and determinism.** Random playouts with fixed seeds run over the car level and a few generated Levels. After every tap they check:
  - every Pin is in exactly one place (on the Model, in the Buffer or in a Box)
  - the Buffer never holds more Pins than its size
  - open Box colours are all different
  - replaying the same taps gives identical states and events
  - the next-colour strategy is a pure function of (seed, pick number, state)

  There is no property-testing dependency.
- **Content: one failing case per check**, each with an inline Model or Level:
  - the Zod shape is wrong
  - an unknown Model id
  - a Socket with no colour
  - a colour total that isn't a multiple of Capacity
  - a loop in the covering
  - a Core that covers a Socket
  - a Socket covered by its own Part
  - duplicate ids

  Each test checks that the error names the file and the Part or Socket id.
- **Timeline:** unit tests on scheduled times:
  - a Pin hovers while its Box closes, then lands after the next Box slides in
  - a Part falls while its last Pin is still flying
  - steps run in order per Box slot: close → slide-in → drain
  - the 90 ms drain ripple
  - win and lose banners wait until everything has settled
  - 30 taps 160 ms apart finish within about 3 s of the last tap
  - the speed multiplier scales every step
- **Render:** one headless NullEngine smoke test. It plays the car's winning order with fast animations and checks the scene matches the rules state after everything settles, and again after an undo. There are no screenshot or pixel tests.
- **Input:** telling tap, drag and press-and-hold apart is a pure classifier with its thresholds as constants, tested in isolation. The threshold values stay in the "Gesture tuning" fog.
- **Not added:** the ray check for covering stays a warning in the dev viewer only, because the hand-written `coveredBy` lists are the source of truth. There are no coverage thresholds.
