# 23: Wooden-toy car Model and frozen Level

**What to build:** The game boots straight into the real Level: the 30-Pin wooden-toy hatchback in a front three-quarter view from slightly above, playable end to end with the skeleton's snapping. The Level is a frozen, solver-proven deal at about a 70% random-tap win rate. See [spec](../spec.md): The car Model and Level; Car level design and Car Model toy look tickets (07, 19).

**Blocked by:** 21 (Content validation and rules edge cases), 22 (Solver and winnability gate).

**Status:** resolved

- [x] The schema gains an optional per-shape `round` (edge radius, clamped to fit) and `finish: "wood"` (procedural grain drawn in code at load time, with no image asset). Rounded boxes get box-projected UVs (one repeat per 1.2 units), and lathed shapes use their own.
- [x] The car Model JSON matches Car Model prototype variant C: the Part ids, the 16 outer and 14 inner Sockets with their positions (`SK.sockets`), `coveredBy` as in ticket 07, the Cores (chassis, two bumpers, two headlights) and the wooden-toy car colours.
- [x] The dealing script (a dev script, ported from `car-sweep.cjs`): a seeded uniform shuffle of 6 Pins per colour, where no Part has all its Pins in one colour and every colour has at least one outer Pin. It searches deal and rule seeds for a solver-proven Level at a 60–80% random-tap win rate and picks the one closest to 70%.
- [x] The frozen Level JSON: 5 colours × 6, 3 Boxes, Capacity 3, a **Buffer 6 override**, `reachable-first`, and an explicit colour for every Socket. The deal seed is not stored.
- [x] The Level passes the winnability gate, and its first report snapshot matches the random-tap win rate `car-sweep.cjs` measured for that deal.
- [x] The Model scene builder (JSON to meshes) is separate from HUD and input. It uses smooth normals, about 32 segments on wheels and 12–16 on Pins.
- [x] Start view yaw 0.6, pitch −0.35. At 1× the bounding sphere (Pins included) fits the view with no clipping at any rotation.

## Comments

Implemented on branch `worktree-agent-a1c0d55e5d5423406`. Deviations:

- The schema already had `round` and `finish` (added earlier), so no schema change was needed; the renderer now honours them.
- Level id `wooden-car-1` (deal seed 39, rule seed 2, win rate 70.0 percent). `pnpm deal [deals] [ruleSeeds]` searches 40 deals x 3 rule seeds and prints Level JSON; it measures with playout seed 1 (the report default). Re-measured with the prototype rules module (`car-sweep.cjs` logic, playout seed 1): 0.700, matching the pinned snapshot.
- Socket ids are `<part>` for single-Socket Parts and `<part>-<n>` otherwise. Shapes were converted from prototype variant C by a throwaway script.
- Boxes use a ported rounded-box mesh and cylinders are lathed with rounded rims (as in the prototype), both with smooth normals. The wood grain is a `RawTexture` filled by `grainPixels`, so it builds headless (no canvas).
- The bounding sphere now includes Pin heads. `tiny-cart-1` stays bundled as a test fixture; `main.ts` boots `wooden-car-1`.
- Not checked visually in a browser (none available); the fit is covered by a projection test at the start view. Grain look on a phone stays on the device checklist.