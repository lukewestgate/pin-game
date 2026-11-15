# 23: Wooden-toy car Model and frozen Level

**What to build:** The game boots straight into the real Level: the 30-Pin wooden-toy hatchback in a front three-quarter view from slightly above, playable end to end with the skeleton's snapping. The Level is a frozen, solver-proven deal at about a 70% random-tap win rate. See [spec](../spec.md): The car Model and Level; Car level design and Car Model toy look tickets (07, 19).

**Blocked by:** 21 (Content validation and rules edge cases), 22 (Solver and winnability gate).

**Status:** ready-for-agent

- [ ] The schema gains an optional per-shape `round` (edge radius, clamped to fit) and `finish: "wood"` (procedural grain drawn in code at load time, with no image asset). Rounded boxes get box-projected UVs (one repeat per 1.2 units), and lathed shapes use their own.
- [ ] The car Model JSON matches Car Model prototype variant C: the Part ids, the 16 outer and 14 inner Sockets with their positions (`SK.sockets`), `coveredBy` as in ticket 07, the Cores (chassis, two bumpers, two headlights) and the wooden-toy car colours.
- [ ] The dealing script (a dev script, ported from `car-sweep.cjs`): a seeded uniform shuffle of 6 Pins per colour, where no Part has all its Pins in one colour and every colour has at least one outer Pin. It searches deal and rule seeds for a solver-proven Level at a 60–80% random-tap win rate and picks the one closest to 70%.
- [ ] The frozen Level JSON: 5 colours × 6, 3 Boxes, Capacity 3, a **Buffer 6 override**, `reachable-first`, and an explicit colour for every Socket. The deal seed is not stored.
- [ ] The Level passes the winnability gate, and its first report snapshot matches the random-tap win rate `car-sweep.cjs` measured for that deal.
- [ ] The Model scene builder (JSON to meshes) is separate from HUD and input. It uses smooth normals, about 32 segments on wheels and 12–16 on Pins.
- [ ] Start view yaw 0.6, pitch −0.35. At 1× the bounding sphere (Pins included) fits the view with no clipping at any rotation.
