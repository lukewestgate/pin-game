# Vision: Pin Game, the final game

From [Vision of the final game](issues/08-vision-of-the-final-game.md). This is a lift-ready section for the spec. It describes where the game is headed, so the first version is built to extend. None of it ships in the first version unless the spec says so.

## The final game

A relaxed puzzle game about taking things apart. The backbone is a hand-made **Campaign** of Levels that gets gently harder. Most Levels feel mindless and easy, with an occasional spike (a "hard" slot every few Levels) and never a steep climb. The Models come from a **random spread of subjects**: vehicles first because they suit primitives, then robots, furniture, appliances and so on. Optional themed **Packs** sit alongside the Campaign. Each Model hosts many Levels (different colour deals and rule numbers), so new Models add variety and new deals provide most of the volume.

Next to the Campaign is **Endless mode**. Levels are generated and solved on the device, and player-facing **hardness sliders** drive the rule numbers (Boxes, Capacity, Buffer, colour count, Pins per colour, next-colour rule). Sliders exist only here, because a hand-made Level is only proven winnable for its own numbers.

Players get limited undo and **Boosters** (candidates: limited undo, +1 Buffer slot, remove any Pin even if Blocked). A player-visible next-Box preview can arrive as an alternative next-colour rule that commits to colours in advance (a queue). The game has sound. Progress is saved locally, and accounts with cloud sync may come later. A store wrapper (Capacitor) is a maybe-later. No monetisation is planned, and the design leaves no room for ads or currency.

Levels are cheap to make with a separate **level editor**:
- Build Models from primitives, or import them from Blender as glTF.
- Place Sockets by clicking, and auto-fill covering from the ray check.
- Pick a Model and rule numbers, and auto-deal the colours.
- Watch difficulty update in real time: the solver's verdict, and the random-tap win rate labelled against the target band.
- Freeze the result to Level JSON.

## Extension points the first version keeps open

Each point names the first-version decision that keeps it cheap.

1. **Rule numbers are parameters, never constants inside `rules`.** Box count, Capacity, Buffer size, colour count, Pins per colour and the next-colour rule come from the Level config (default plus override). This makes sliders and generated Levels possible. *(Sorting rules logic prototype; Car level design's Buffer 6 override is used from day one.)*
2. **The next-colour rule is a named, swappable strategy.** The reachable-first rule is one variant. A `"queue"` variant (committed colours, so a truthful preview) can be added later without changing the others. Every variant stays a pure function of the seed, so the solver's memo keeps working. *(Sorting rules logic prototype; Solver approaches.)*
3. **Player actions are pure rules actions.** `tap(level, state, pin) → { state, events }` is the template. A later `applyBooster(level, state, booster) → { state, events }` has the same shape. When the first Booster needs to change a rule number mid-level (for example +1 Buffer), that number moves from the Level into the state. Undo stays a stack of past states, so limited undo is just a cap on it. *(Tech stack.)*
4. **`rules`, `solver` and `content` are pure TS that runs headless.** A generator, a CLI, the editor and an Endless-mode Worker all import them. The solver and the random-tap playouts can be cancelled and run in a Worker within a time budget, which the dev viewer's Worker already almost covers. *(Tech stack.)*
5. **Building a Model's scene from JSON is separate from the game's HUD and input.** The editor reuses it, as a second Vite entry (`editor.html`) in the same package. *(Tech stack layout; the dev viewer.)*
6. **The shape field is a tagged union.** A `{ kind: "mesh", src }` glTF variant can be added for Blender imports, and a Part can already have several shapes. *(How Models and Parts are built; ADR 0001.)*
7. **Model and Level are separate, concrete files.** One Model hosts many Levels. A generator writes the same explicit Level JSON, so a shipped or generated file is exactly what the solver checked. Car level design's dealing script is the seed of the generator and of the editor's auto-deal. *(How Models and Parts are built; Car level design.)*
8. **Stable ids and versioned formats.** Level and Model ids are never reused, and files carry a `formatVersion`. Saves store only Level id, completion and best stats, never mid-level state across format changes.
9. **Progress goes through a small progress store interface** (`load()`, `recordResult(levelId, result)`). The first version implements it locally. A cloud-backed store for accounts can replace it later without touching the game.
10. **Campaign order is data.** `data/campaign.json` is an ordered list of Level ids. Each slot carries a target random-tap band (normal 60–80%, an occasional "hard" slot around 30–50%) that the editor deals against. The band is a Level-making input, never a rule. Packs are more lists of the same shape. The first version may ship a one-entry Campaign or none.
11. **No raw GLSL**, so a later move to Babylon's WebGPU engine is mostly a matter of how the engine is created. *(Tech stack.)*
12. **Nothing in the core depends on APIs that only exist in a PWA**, beyond what a Capacitor WebView provides, so a store wrapper stays possible. *(Distribution baseline.)*
