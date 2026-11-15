# Car colour-deal sweep (2026-11-15)

Throwaway evidence for the Car level design ticket. Script: [car-sweep.cjs](car-sweep.cjs), run with `node car-sweep.cjs sorting-rules.prototype.html 3x5,3x6,3x7,4x5,4x6`. It loads the prototype's rules module, builds the hatchback from the ticket (17 Parts with Sockets, 30 Pins, 16 outer / 14 inner, each inner Pin covered by one Part), and deals 5 colours × 6 Pins with constraints (no Part has all its Pins in one colour; every colour has an outer Pin). 40 deals × 3 rule seeds = 120 levels per setting, Capacity 3, reachable-first rule, 1000 random playouts each.

| Boxes / Buffer | Unwinnable | Random-tap win % (min / p25 / median / p75 / max) | In the 60–80% band |
|---|---|---|---|
| 3 / 5 | 0 | 13 / 27 / 36 / 48 / 68 | 6 / 120 |
| 3 / 6 | 0 | 27 / 53 / 65 / 76 / 90 | 61 / 120 |
| 3 / 7 | 0 | 50 / 78 / 87 / 93 / 99 | 33 / 120 |
| 4 / 5 | 0 | 83 / 95 / 98 / 100 / 100 | 0 / 120 |
| 4 / 6 | 0 | 93 / 99 / 100 / 100 / 100 | 0 / 120 |

The car is harder than the generated 4-layer Models in [sweep-results.md](sweep-results.md) at the same numbers (36% vs 56% median at 3 / 5). A likely cause is that each inner Part sits behind exactly one outer Part, so whole groups of Pins unlock together.
