# Solver approaches for checking that levels can be won

Type: research
Status: resolved
Parent: ../map.md

## Question

What algorithms are a practical way to check that a level can be won, given these rules?
- Pins are Blocked by Parts that are covered by other Parts.
- Removed Pins go to the matching open Box, otherwise to a Buffer of limited size.
- When a Box closes, the replacement colour is picked by a seeded rule from the colours that still have Pins left.

Cover state-space search (DFS/BFS with memoisation or transposition tables, symmetry reduction, pruning heuristics), rough state-space size for a car-sized Model (~40–80 Pins, 4–6 colours), and how existing published colour-sort or dismantling puzzle generators guarantee solvability (generate from a solved state backwards vs generate-and-verify). Also cover cheap difficulty metrics (number of winning orders, branching factor, Buffer pressure).

Findings go in `../research/03-solver-approaches.md`, with sources cited.

## Answer

Full findings: [research/03-solver-approaches.md](../research/03-solver-approaches.md).

- The state graph has no cycles (every tap removes a Pin). A depth-first search that remembers visited states, treats same-colour Pins within a Part as interchangeable, and has a node budget is enough for 40–80 Pins: under 10 s in a Python experiment on the worst case tried.
- The replacement-colour rule must be a pure function of (seed, close index, qualifying colours) so remembered states stay valid. Otherwise the generator state has to go into the solver's state key.
- Generate-then-check is the common pattern. Building forward along a chosen tap order is a fit for later procedural levels. Building backwards from the solved state (Sokoban style) fits these rules badly.
- **Key finding:** with colour count ≤ Box count, every tap order wins and the Buffer is never used. With 6 colours and 5 Boxes, random tapping still wins about 99% of the time. The Buffer only starts to matter at 8 or more colours. Colour count against Box count (and Buffer size) is the main difficulty knob.
- Difficulty metrics: random-tap win rate, winning-order fraction, branching factor, choke points, lowest peak Buffer use. These only roughly match how hard players find a level, so playtesting is still needed.
