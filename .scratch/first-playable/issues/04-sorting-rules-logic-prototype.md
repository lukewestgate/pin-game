# Sorting rules logic prototype

Type: prototype
Status: resolved
Parent: ../map.md

## Question

Do the sorting rules feel right when played? Build a logic prototype: a single HTML file, no 3D, with an abstract Model as a list of Parts, their Pins and covering relations. It covers Boxes, the Buffer, drains, the replacement-colour rule from the map's Notes, Blocked Pins, win/loss and unlimited undo. Answer:
- Do 5 Boxes / Capacity 3 / Buffer 7 feel right?
- Does the seeded replacement-colour rule ever produce a level that can't be won, or that feels unfair?
- Do the edge cases behave as expected (grey positions at the end, several drains from one close, losing on the Pin that overfills the Buffer)?
- The solver research found that with colours ≤ Boxes every tap order wins, and the Buffer only matters at roughly 8+ colours with 5 Boxes. What colour count and Box count make the default level interesting? Should the defaults change (e.g. fewer Boxes, a smaller Buffer)?

## Comments

- 2026-11-15: Prototype built. Assets: [sorting-rules.prototype.html](../prototypes/sorting-rules.prototype.html) (open by double-click) and [sweep-results.md](../prototypes/sweep-results.md) (headless sweep of colours × Boxes × Buffer × next-colour rule). Waiting on the human's play-through before resolving.

## Answer

Resolved with the human on 2026-11-15, after playing the [prototype](../prototypes/sorting-rules.prototype.html) and reading the [sweep results](../prototypes/sweep-results.md).

- **Default numbers: 3 Boxes, Capacity 3, Buffer 5** (was 5 / 3 / 7). It fits a portrait phone, and 4–6 colours is the interesting range: random tapping wins 82% of games at 4 colours, 32% at 5 and 0% at 6 (6 Pins per colour, rule as written). Fewer colours are easier to tell apart on a small screen and kinder to colour-blind players. **Suggested start for the first car: 5 colours.**
- **Every number stays tweakable.** Box count, Capacity, Buffer size, colour count, Pins per colour and the next-colour rule must remain plain parameters (a developer constant plus a per-level override). Later they should be able to drive player-facing **hardness sliders**. Don't hard-code them anywhere in the rules engine or the layout.
- **Losing:** the level is lost **the moment a Pin fills the last Buffer slot** (not on the Pin after that). A Buffer of 5 safely holds 4.
- **Next-colour rule: "prefer colours you can reach now".** A colour qualifies as before: it still has Pins left (on the Model, Blocked or not, or in the Buffer) and no open Box. Among the qualifying colours, prefer those in the Buffer or with at least one Pin that isn't Blocked. Only if none qualify that way, choose from all qualifying colours. The seeded pick among them stays a pure function of (seed, pick number, state), so the solver's memo still works. Why: the rule as written opens Boxes for buried colours. At 3 / 3 / 5 that made 1 in 12 random levels unwinnable at 5 colours and 2–3 in 12 at 6–8 colours. The reachable-first rule produced none up to 7 colours (one cell at 8 colours had 2 in 12), and it is harder than the "prefer Buffer colours" alternative (56% vs 71% random-tap win rate at 5 colours). The solver still checks every level.
- **Next Box preview: a dev option only, off by default.** The player doesn't need to see the next colour. The dev preview is only a forecast ("if this Box closed now"). A player-facing preview that never lies would need the rule to commit to the next colour in advance (a queue). That's left for the vision.
- **Edge cases behave as intended.** Grey Boxes appear when no colour qualifies, which is the normal end of a level. One close can set off a chain of drain → close → replacement. Blocked taps are refused with no change of state. Taps after a win or loss are refused. Unlimited undo works, including undoing a loss.
- **Liftable artefact:** the `<script id="rules">` module in the prototype (`makeLevel`, `initialState`, `tap`, `solve`, `playouts`) is a pure reducer and solver shaped for the real rules engine. The generator and the HTML shell are throwaway.
