# Research: solver approaches for checking that levels can be won

Ticket: [../issues/03-solver-approaches-for-winnability.md](../issues/03-solver-approaches-for-winnability.md)
Rules assumed: the "Settled while charting" list in [../map.md](../map.md) (Notes). Vocabulary: [GLOSSARY.md](../../../GLOSSARY.md).

Sections 1–4 summarise published sources, with a citation on each claim. Section 5 is **my own analysis and a throwaway experiment**, labelled as such. Section 6 lists implications for the decision. It does not make the decision.

---

## 1. What kind of problem this is

- **Our game is a deterministic, single-player search with perfect information.** The level data says which Parts cover which Pins, Peek lets the player see under Parts, and the replacement-Box colour comes from a seeded rule. So the only branching is **which unblocked Pin to tap next**. There are no chance nodes. (Own reading of map.md.)
- **The closest studied relatives are NP-complete, so no fast exact algorithm should be expected in general.**
  - Ball sort and water sort puzzles are NP-complete even with two colours. Even for instances that are trivially solvable, finding a *shortest* solution is NP-complete. Some special cases can be solved in polynomial time. Source: Ito et al., *Sorting Balls and Water: Equivalence and Computational Complexity*, FUN 2022, https://arxiv.org/abs/2202.09495 (also https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.FUN.2022.16).
  - Mahjong solitaire is the closest relative in structure: tiles are blocked by tiles above or beside them, and you remove matching sets. With perfect information ("peeking" allowed), deciding whether every tile can be removed is NP-complete. With hidden tiles, playing to maximise the chance of winning is PSPACE-complete. Sources: https://en.wikipedia.org/wiki/Mahjong_solitaire (it cites Eppstein's *Computational Complexity of Games and Puzzles* and Condon, Feigenbaum, Lund & Shor, SIAM J. Comput. 26(2), 1997). Deciding whether a Shisen-Sho board can be solved is also NP-complete: van Rijn, https://arxiv.org/abs/2010.09014.
  - Sigmar's Garden, a tile-matching game with a "free tile" rule, is NP-complete. The proof adapts the Mahjong solitaire construction. Ruigrok, Leiden BSc thesis 2025, https://theses.liacs.nl/pdf/2024-2025-RuigrokMMax.pdf.
  - *Own note:* I found no complexity result for the "Box row + limited Buffer + covering Parts" combination that screw-sort and triple-tile games use. It is very likely NP-hard in general, because it contains Mahjong-style blocking. But at 40–80 Pins the worst-case complexity matters less than the size of the real search space (Section 5).
- **The state graph has no cycles.** Every tap removes one Pin, so a winning order is always exactly N taps long. This rules out the main difficulty Taylor & Parberry describe for Sokoban, where moves cannot be undone and you must store every visited state to avoid repetition (https://ianparberry.com/techreports/LARC-2011-01.pdf, §3). (Own analysis.)

## 2. Search techniques used by existing solvers

| Technique | Who uses it | Notes |
|---|---|---|
| Plain DFS / BFS | Water-sort solver https://github.com/tanjuntao/water-sort-puzzle: DFS by default ("sub-optimal solution in a REALLY short time"), BFS for shorter solutions | For a yes/no winnability check, DFS that stops at the first win is the cheapest option. |
| BFS / A*-like search with a hashed visited set | Kociemba's optimal colour-sort solver, https://github.com/hkociemba/WaterBallSortPuzzleOptimalSolver: "resembles both A* and breadth first search", stores 32-bit hashes of generated nodes in a 2^32-bit array; solves the common commercial variants optimally in under a second, and up to 14 colours "within seconds" | Optimality isn't needed for us, since every win is N taps long. |
| Backtracking + memoisation + node budget | The "[Dot]" Sigmar's Garden generator described in Ruigrok 2025 (link above, §7): backtracking with memoisation; it rejects a candidate after visiting 500 positions without a win, which "significantly speeds up" generation | A budget turns the solver into a fast filter, at the cost of rejecting some levels that could be won. |
| Up-front pruning scan + "critical groups" | De Bondt's Mahjong solitaire solver, which was orders of magnitude faster than earlier solvers (summary in Ruigrok 2025 §3; solver page https://www.math.ru.nl/~debondt/mjsolver.html) | It detects impossible positions before recursing. Our equivalent is a quick check for "Buffer must overflow". |
| SAT encoding | Ruigrok 2025 §6 encodes Sigmar's Garden removal order as CNF and reads a solution off the SAT model | Possible, but overkill at our size. |
| Repeated-state pruning keyed on depth | Fruit Dating solver, author's blog https://sbcgamesdev.blogspot.com/2014/10/procedural-generation-of-puzzle-game.html: it prunes a revisited state unless it was reached in fewer moves | Our graph is layered by number of Pins removed, so a plain "seen" set is enough. |
| Incremental hashing for transposition tables | Zobrist hashing: XOR a random key per (piece, square), updated incrementally on each move, https://www.chessprogramming.org/Zobrist_Hashing | Fits us directly: one random key per Pin removed, plus keys for the Buffer and Box contents. |

**Symmetry reduction.** Sources on colour-sort solvers mention canonicalising the order of identical containers. Kociemba's README does not spell out its details, so I am not attributing a specific method to it. For our rules, the symmetry that pays off is different (own analysis): **Pins with the same colour and the same "held Parts / covering Parts" are interchangeable.** If a Pin is Blocked only through covering Parts, and only causes a Part to fall when it is the last Pin of that Part, then which of two red Pins on the same panel you tap first never matters. Always tapping the lowest-index Pin of each class makes the state key canonical for free (implemented in the experiment below).

## 3. How published generators guarantee solvability

Three patterns appear in primary sources:

1. **Generate, then verify with a solver (by far the most common).**
   - Simple Color Sort, a ball-sort and water-sort generator for Unity, creates a puzzle and then "proves it can be sorted". Its solver "searches every position a puzzle can reach", and a puzzle that runs past the search budget "is marked as not fully proven rather than guessed": https://github.com/livingfailure93/simple-color-sort-docs.
   - Fruit Dating builds levels randomly, checks each with the solver, then tweaks them by hand and re-checks, because "a small change may lead to an unsolvable level": https://sbcgamesdev.blogspot.com/2014/10/procedural-generation-of-puzzle-game.html.
   - Sigmar's Garden "[Dot]": random placement, then solver accept or reject (Ruigrok 2025 §7).
   - Random deals are often unwinnable. De Bondt measured that about 2.95% of random "turtle" Mahjong deals cannot be won even with peeking, and other layouts range from about 1.8% to 100% unwinnable: https://www.math.ru.nl/~debondt/mjsolver.html. Taylor & Parberry report that fully random Sokoban levels are "extremely likely to be unsolvable, or if they are solvable, then they are likely to be very easy" (LARC-2011-01, §1).
2. **Generate backwards from the solved state (reverse play).**
   - Taylor & Parberry, Sokoban: "Any state reachable when moving in reverse will be solvable when played normally". They search for the state farthest from the goal and use repeated iterative deepening to keep memory bounded: https://ianparberry.com/techreports/LARC-2011-01.pdf §3.
3. **Constructive forward placement along an intended solution order.**
   - Sigmar's Garden "[Hru]": it first builds a stack of pairs that fixes the order of placement, rejects placements that deadlock (the second tile of a pair blocking the first), and falls back to backtracking with a cap of 1000 backtracks per template (Ruigrok 2025 §7).
   - Ruigrok's own generator places tiles outwards from the initial "removable frontier" in linear time. It only places a tile where removability can't be undone, and generates a guaranteed-solvable puzzle in under 0.0005 s. It also notes that its puzzles came out *easier* than the original game's, which suggests the original uses extra constraints (§7–8).

*Own analysis: why reverse play fits our rules badly.* Moving backwards through a Box close requires knowing which colour the seeded rule *would have* picked. That depends on the colours still left on the Model and in the Buffer in the forward direction, and the Buffer drain cascades forward. You could model the reverse step, but every reverse move must be re-checked against the forward rule. Pattern 3 avoids this: fix an intended tap order first (a linear extension of the covering order), then assign colours to Pins while **forward-simulating** that order, so the Buffer never overflows. The level is solvable by construction, and the solver is then used only for scoring.

## 4. Cheap difficulty metrics

- **A brute-force solver tells you whether a level can be won, not how hard it is.** Snellman, author of the Linjat generator: such a solver "can't give any idea of how challenging the puzzle actually is". He prefers a "deep and narrow" solution tree and measures depth and width with a human-like layered solver: https://snellman.net/blog/archive/2019-05-14-procedural-puzzle-generator.
- **Static measures are weak predictors.** In studies of human solving on Sokoban-like transport puzzles, differences in difficulty "cannot be easily captured by static metrics like size of the state space or the length of a solution". State-space *structure* matters, such as bottlenecks. Jarušek & Pelánek, FLAIRS 2011 / STAIRS 2010: https://www.fi.muni.cz/~xpelanek/publications/stairs2010-final.pdf, https://www.fi.muni.cz/reports/2010/abstract/FIMU-RS-2010-01.html.
- **Random or simulated play as a proxy.**
  - De Bondt's work notes that the number of random attempts needed to solve a deal can serve as a difficulty measure (summarised in Ruigrok 2025 §3).
  - King (Candy Crush) used an MCTS bot's pass rate to predict human pass rates. Poromaa, KTH thesis 2017: https://openaccess.library.uitm.edu.my/Record/ndltd-UPSALLA1-oai-DiVA.org-kth-206595.
  - King later found that a network trained on player data predicted difficulty better than MCTS, at a fraction of the compute. Gudmundsson et al. 2018: https://www.gwern.net/doc/reinforcement-learning/imitation-learning/2018-gudmundsson.pdf.
- **Shortest-solution length** is Fruit Dating's metric (blog above). It is meaningless for us, because every win is exactly N taps.

Candidate metrics for our rules (own analysis; all fall out of one memoised exhaustive pass, or a few hundred random playouts):

| Metric | How to compute | What it captures |
|---|---|---|
| **Random-tap win rate** | Share of uniform-random tap orders (over unblocked Pins) that win; Monte Carlo, about 300 playouts | Overall forgivingness. Cheapest metric, and needs no exhaustive search. |
| **Winning-order count / total-order count** | Dynamic programming over the memoised state DAG: count(s) = Σ count(child). The numbers are huge (on the order of N!), so use BigInt or log-space | Exact version of the above. Needs the full state space to be enumerated. |
| **Branching factor** | Mean (and minimum) number of unblocked Pin *classes* along winning paths | How many choices a player faces. |
| **"Safe move" share / narrowness** | At each state on a winning path: winning moves ÷ available moves. Report the minimum and how many "chokepoints" have only 1–2 winning moves | Snellman's "deep and narrow" idea, and a rough stand-in for Jarušek & Pelánek's bottlenecks. |
| **Buffer pressure** | Minimum over winning paths of the maximum Buffer occupancy (a minimax over the DAG); also the mean maximum in random playouts | How close the best play comes to losing. Tunable through Buffer size. |

## 5. Own analysis: state-space size for this rule set

**All numbers in this section are mine, from back-of-envelope reasoning and a throwaway Python experiment. They are not from sources.** The scratch script lives outside the repo, in the session scratchpad, and is not project code.

### 5.1 What a state is

- **Pins removed (set R).** This alone decides which Parts have fallen and which Pins are Blocked.
- **Buffer contents** as a multiset of colours (≤ 7 Pins).
- **Open Boxes:** colour and fill (0–2) of each of the 5 Boxes, or grey.
- **The seeded rule's position.** If the rule is a pure function of (level seed, number of Box closes so far, qualifying colour set), then the number of closes = (|R| − Buffer size − Σ Box fills) / 3, which can be derived from the rest of the key. **If the rule consumes RNG draws in some other way, the RNG state must go into the key**, or memoisation becomes wrong. This is why the seeded-determinism subtlety matters: it makes the game a plain deterministic search, but only if the rule is defined in a memo-friendly way.

Branching is only over which unblocked Pin to tap. Box colours, Buffer drains and drain cascades are deterministic consequences of the tap. (A drain can fill and close the new Box at once, triggering another replacement.)

### 5.2 Size bounds (N = number of Pins)

| Model (synthetic, layered) | Naïve 2^N | Same-class symmetry bound | Reachable R sets (respecting covering) |
|---|---|---|---|
| 42 Pins, 4 colours, 4 layers, 8–12 Parts | 10^12.6 | ~10^10.5 | 10^4.0 – 10^6.2 |
| 60 Pins, 5 colours, 5 layers, 16–17 Parts | 10^18.1 | ~10^16 | 10^5.7 – 10^6.9 |
| 78 Pins, 6 colours, 6 layers, 19–21 Parts | 10^23.5 | ~10^21 | 10^6.3 – 10^11.9 |
| 60 Pins, 5 colours, **1 layer** (nothing covered) | 10^18.1 | ~10^15.5 | 10^15.3 – 10^15.7 |

- "Reachable R sets" counts removed-sets that respect the covering order, after canonicalising same-class Pins. It was computed exactly by enumerating the sets of fallen Parts on random layered Models, with 2–6 Pins per Part and each Part covered by 1–2 Parts in the layer above.
- On top of that, the Buffer and Box part of the key can multiply the count by at most about 1.7k Buffer multisets (for 6 colours: C(13,6) = 1716) times a few Box configurations. In practice most of these combinations are not reachable for a given R.
- **Takeaway:** layering (Parts covering Parts) is what keeps the space small. A flat Model with everything exposed is the worst case, around 10^15 states, and exhaustive enumeration of that is out of reach. But **a first-win DFS on such a Model succeeds almost at once** (5.3), because almost every order wins.

### 5.3 Experiment: first-win DFS with memo, 5 Boxes, Capacity 3, Buffer 7

Random layered Models. DFS that stops at the first win, memoises dead states, and tries one Pin per class. Python, single thread.

| Colours | Pins | Solvable | DFS nodes | Time | Random-tap win rate | Mean max Buffer (random) |
|---|---|---|---|---|---|---|
| 5 | 60 | 3/3 | 60 (no backtracking) | <0.1 s | 100% | 0.0 |
| 6 | 78 | 3/3 | 78 | <0.1 s | 99–100% | 3.3–4.0 |
| 8 | 72 | 3/3 | 72–122 | <0.1 s | 1–82% | 6.1–7.0 |
| 10 | 78 | 3/3 | 4k–164k | 0.2–9.8 s | 0% | 7.0 |
| 13 | 78 | 1/3 | 0.3k–33k | ≤1.6 s | 0% | 7.0 |

- **Key finding: with colours ≤ Boxes (≤ 5 colours with 5 Boxes), the rules make every order a winner.** The replacement rule always picks a colour that has Pins left and no open Box. So every colour still in play always has an open Box, no Pin ever goes to the Buffer, and the level cannot be lost.
  - With 6 colours, exactly one colour is "missing" at any time. The Buffer gets used, but random tapping still almost always wins.
  - The Buffer only starts to bite at roughly 8+ colours, or with fewer Boxes. This conclusion follows from the rules as written. The numbers above are an illustration, not proof.
- **The solver cost is trivial at the target size.** Even the hardest case (10 colours, 78 Pins) took under 10 s in unoptimised Python. A TypeScript version with bitsets and Zobrist keys would be expected to run much faster (not measured).
- **The random-tap win rate separates levels well**: 100% at ≤ 6 colours and roughly 0% at ≥ 10. Branch counts from exhaustive search only become interesting in the 8–10 colour band.
- **Caveat:** the synthetic Models assume every Pin in a Part shares that Part's blockers. A real car Model might have Pins covered individually, for example a Pin under one panel edge only. That breaks the per-Part symmetry classes into smaller ones and grows the space. Recheck with real level data.

## 6. Implications for the decision

These are inputs for whoever closes the ticket, not decisions.

- **A plain DFS with a transposition table and same-class Pin symmetry looks sufficient** for checking winnability at 40–80 Pins. Exotic methods (SAT, A*, IDA*) look unnecessary at this size. A node budget, in the style of [Dot] or Simple Color Sort, gives a "not proven" result instead of a hang.
- **The seeded replacement rule should be defined as a pure function of (seed, close index, qualifying colours)**, or similar, so that the solver state stays small and memoisation stays valid. This constrains the level format and rules ticket (04), not just the solver.
- **The default numbers (5 Boxes, 4–6 colours) produce levels that are trivially winnable, or nearly so, under the current rules.** If difficulty is meant to come from Buffer pressure, then colour count versus Box count, or Buffer size, is the main difficulty knob. That is worth raising in the rules prototype (ticket 04) and the car level design (ticket 07).
- **Solvability: generate-and-verify is the industry norm and is cheap here.** A constructive "pick a tap order, then assign colours while forward-simulating" generator would guarantee solvability by construction and fits the deterministic rules better than reverse play. Ruigrok's result suggests that constructive generators tend to produce easy levels unless extra constraints are added.
- **Difficulty scoring can reuse the same memoised search.** Candidates: win-order fraction, chokepoint count, minimum-maximum Buffer pressure. The random-tap win rate is the cheapest single number. Sources warn that solver-derived metrics only approximate how hard humans find a level (Snellman; Jarušek & Pelánek), so playtest calibration is still needed.
- **Where the solver runs** (build step, editor or test suite) is not constrained by cost. A sub-second check at ≤ 6 colours would fit in a unit test or an editor save hook.
