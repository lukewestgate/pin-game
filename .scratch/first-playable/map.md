# Map: Peg Game, first playable

Label: wayfinder:map

## Destination

A buildable spec for the **first playable version**: the full Box/Buffer sorting rules plus **one** car Model, playable as a mobile-first PWA (touch first, mouse always works) in the target look. Alongside it, a short **vision** of the final game, so the first version is built to extend (more levels, procedural levels, boosters). When the map is clear, hand off to `/to-spec`.

## Notes

- Vocabulary: use `GLOSSARY.md` (Pin, Box, Capacity, Buffer, Level, Model, Part, Socket, Core, Blocked, Peek). Grilling tickets also call `/domain-modeling`.
- Settled while charting (the baseline every ticket assumes):
  - **Distribution:** installable PWA, no app stores for now. Portrait, mobile-first; desktop mouse must always work.
  - **Controls:** drag rotates the Model around its centre. Tap or click removes a Pin. Pinch or the scroll wheel zooms. No panning. A deliberate press-and-hold on a Part starts **Peek** (only that Part turns see-through). While Peeking, dragging still rotates; releasing ends Peek. Peek never changes game state.
  - **Numbers:** Box count, Capacity, Buffer size and colour count are developer constants, with optional per-level overrides. They must stay tweakable so they can drive later hardness sliders. Defaults: see Sorting rules logic prototype.
  - **Boxes:** never two open Boxes of the same colour. A removed Pin goes to the matching open Box, otherwise to the Buffer. The level is lost the moment a Pin fills the last Buffer slot. When a Box closes, the replacement takes a colour that still has Pins left (on the Model, Blocked or not, or in the Buffer) and has no open Box, preferring reachable colours (see Sorting rules logic prototype). Matching Buffer Pins then drain into it. A position with no qualifying colour shows grey (end of level). Choices are seeded per level, so levels are deterministic.
  - **Pins and Parts:** a Pin is Blocked while any Part covering it is still present, as written in the level data (not decided by what the camera can see). A Part falls away once all its Pins are removed.
  - **Win:** every Pin removed. Each colour's Pin total is a multiple of Capacity.
  - **Winnability:** every level (hand-made or generated) must have at least one winning tap order, checked by a solver. Difficulty = how hard that order is to find.
  - **In the first version:** unlimited undo as a debug tool, plus animations for Pin → Box or Buffer, Buffer → Box, Box close and next Box slide-in, and Part falling away (scripted, no physics). Sound is nice to have.
  - **Generator-friendly:** the level format must be something a procedural generator could produce later, even though no generator ships now.
- The user knows TypeScript/JS, C# and GDScript, and has used Blender.
- Research findings live in `.scratch/first-playable/research/` and prototypes in `.scratch/first-playable/prototypes/`, instead of throwaway branches.

## Decisions so far

<!-- one line per closed ticket: [title](issues/NN-slug.md): gist -->

- [Engine options for a mobile-first 3D PWA](issues/01-engine-options-for-mobile-pwa.md): the strongest candidates are Three.js+TS (smallest), Babylon.js+TS (most built in, headless engine for tests) and Godot 4.7+GDScript (best editor, but iOS risk and multi-MB WebAssembly). Unity is the weakest fit. Peek's hold gesture is custom code in every engine.
- [Achieving the clean cartoon look on mobile web](issues/02-clean-cartoon-look-on-mobile.md): smooth normals plus about 32-segment wheels and 12–16-segment Pins, toon or Lambert shading, inverted-hull outlines, 4× MSAA with DPR capped at about 2, instanced Pins. Peek needs a depth pre-pass. Babylon has the most built in, Godot web the least.
- [Solver approaches for checking that levels can be won](issues/03-solver-approaches-for-winnability.md): a depth-first search over tap orders that remembers visited states is enough. The colour rule must be a pure function of the seed. With colours ≤ Boxes every level is trivially winnable, so colour count against Box count and Buffer size is the main difficulty knob.
- [Sorting rules logic prototype](issues/04-sorting-rules-logic-prototype.md): defaults are 3 Boxes / Capacity 3 / Buffer 5, and every number stays tweakable for later hardness sliders. You lose the moment the last Buffer slot fills. The next Box prefers colours that are reachable now. The next-Box preview is a dev option only. Start the first car at about 5 colours. The prototype's rules module can be lifted into the real engine.
- [How Models and Parts are built](issues/05-how-models-are-built.md): Models are JSON made of primitive shapes (no Blender for now). A Model (Parts, Sockets, covering) is separate from a Level (explicit Socket colours, seed, overrides). Covering is hand-written and checked by a ray-based dev warning. Authoring is hand-written JSON plus a dev viewer.

## Not yet specified

- **Solver in the toolchain:** where winnability checks run beyond the dev viewer (build step, test suite, CLI), and whether the solver also scores difficulty.
- **Screen layout and HUD look:** sizing of the Box row and Buffer on small phones, safe areas, colours readable to colour-blind players (shape or pattern on Pins?).
- **Gesture tuning:** hold threshold for Peek versus tap versus drag, and the size of tap targets on small Pins. Probably needs testing on a real device once a stack exists.
- **Animation and juice approach:** tweening library or engine built-ins, and the timing of Buffer drains relative to Box closes.
- **PWA specifics:** offline caching, hosting, update flow, iOS home-screen quirks.
- **Testing strategy:** how the rules engine, solver and level data get tested.
- **Sound:** whether any sound makes it into the first version, and its source.

## Out of scope

- App store builds and native wrappers (Capacitor/Tauri). Vision only.
- A procedural level generator. Vision only; the first version only keeps the format generator-friendly.
- Player-facing limited undo, boosters, hints, timers. Vision only.
- More than one level, level select, progression, saved progress, monetisation. Vision only.
