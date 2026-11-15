# Car level design

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 04, 05

## Question

What exactly is the first car Model? Its Parts (wheels, axles, body panels, seats, steering wheel…), which Parts cover which, Pin placement and colours, the colour count, and the difficulty target, all checked against the solver so the level can be won.

Note: see the key finding in Solver approaches for checking that levels can be won. The colour count has to exceed the Box count for the level to be more than trivial. Sorting rules logic prototype set the defaults to 3 Boxes / Capacity 3 / Buffer 5 with the reachable-first next-colour rule. It suggests about 5 colours as the starting point; 4–6 is the interesting range. The prototype's level format and `solve()` can check candidate layouts.

Note: How Models and Parts are built settled the format. The car is a Model in JSON made of primitive Parts with Sockets and `coveredBy` lists, plus a separate Level that colours every Socket. Add shapes to the primitive set if the car needs them.

## Answer

Resolved with the human on 2026-11-15 (grilling), checked against the solver in [car-sweep-results.md](../prototypes/car-sweep-results.md). ADR 0001 is amended so a Part can have several shapes.

**Difficulty target.** The game is meant to feel mindless and relatively easy. The first level passes when the solver proves it can be won **and** its random-tap win rate (the prototype's `playouts`, measured over 1000 playouts) is **60–80%**. This band is the first difficulty to test with. The share of winning first taps can be recorded but doesn't gate.

**Model: a chunky cartoon hatchback** with big wheels and a cabin seen through open windows (no glass). The body is neutral so the Pins carry all the saturated colour: cream body, dark grey tyres, light grey hubs and interior, mid-grey chassis. The 5 exact Pin hues are left to the colour-blind work in the "Screen layout and HUD look" fog. _(Look superseded by [Car Model toy look](19-car-model-toy-look.md): a wooden toy with painted plates. Parts, Sockets and covering unchanged.)_

**Parts and Sockets (30 Pins).** There are two depths, outer and inner, plus Cores. There are no cross-links, and each inner Pin is covered by exactly one Part, along its pull-out ray.

| Depth | Part id | Sockets | Pull-out | Covered by |
|---|---|---|---|---|
| Outer | `wheel-fl`, `wheel-fr`, `wheel-rl`, `wheel-rr` | 1 each (centre nut) = 4 | outward along the axle | – |
| Outer | `bonnet` | 2 | up | – |
| Outer | `roof` | 2 | up | – |
| Outer | `door-l`, `door-r` | 2 each = 4 | sideways out | – |
| Outer | `tailgate` | 2, at its corners | backward | – |
| Outer | `spare-wheel` (mounted on the tailgate) | 2 | backward | – (covers nothing) |
| Inner | `axle-front`, `axle-rear` | 2 each, one per end = 4 | outward along the axle | that end's wheel |
| Inner | `engine` | 3 | up | `bonnet` |
| Inner | `seat-l`, `seat-r` | 2 each = 4 | sideways | that side's door |
| Inner | `steering-wheel` | 1 | up | `roof` |
| Inner | `rear-seat` | 2 | backward | `tailgate` |
| Core | `chassis`, `bumper-front`, `bumper-rear`, `headlight-l`, `headlight-r` | 0 | – | – |

16 Pins can be tapped from the start. The Cores stay on screen at the win as a stripped chassis with bumpers and lights.

**Format change: a Part has one or more shapes**, each with its own primitive, transform and body colour. This lets seats have a backrest, the steering wheel a column, and the wheels a contrasting hub. The Part is still the unit that holds Pins and falls away. Recorded in ADR 0001. The sub-shapes are called "shapes", not "pieces", because the glossary lists *piece* under *Avoid* for Part. No new primitive kinds are needed.

**Level.**
- 5 colours × 6 Pins, 3 Boxes, Capacity 3, the reachable-first rule.
- **Buffer 6 as a per-level override.** The global default stays 5, so the default remains the harder baseline for future levels and the override path is exercised from day one.
- Why Buffer 6: on this car, 3 / 5 gives a median random-tap win rate of 36% (6 of 120 deals in the band). 3 / 6 gives a median of 65% (61 of 120 in the band). 3 / 7 gives 87%, and 4 Boxes makes it trivial (98%+). Every level swept was solver-proven winnable.

**Dealing procedure (a dev script, not shipped).**
- Seeded uniform shuffle of 6 Pins per colour over the 30 Sockets, with two constraints:
  - no Part has all its Pins in one colour
  - every colour has at least one outer Pin
- Search deal seeds together with the Level's rule seed. Keep those that are solver-proven and land at a 60–80% random-tap win rate, and pick the one closest to 70%.
- Freeze it as the explicit Level JSON (every Socket's colour plus the rule seed). The deal seed isn't stored.
- [car-sweep.cjs](../prototypes/car-sweep.cjs) already does this against the prototype's rules module and is the starting point.

**Later difficulty levers** (for the vision, not this level): cover the tailgate with the spare wheel (a 3-deep stack at the back), more inner Parts or cross-links, Buffer 5, more colours.
