# Spec: Pin Game, first playable

Status: ready-for-agent

Synthesised from the resolved [first-playable map](map.md), its 19 tickets, the [vision](vision.md), `GLOSSARY.md` and ADRs 0001–0003. Where this spec is brief, the linked ticket's `## Answer` holds the exact numbers and is authoritative.

## Problem Statement

There is a clear design for Pin Game (a relaxed puzzle where you take a 3D Model apart by removing its coloured Pins and sorting them into Boxes), but nothing exists to play. Every design question for a first version has been answered across research, prototypes and grilling, but the answers are spread over 19 tickets and a dozen throwaway HTML prototypes. A player can't install it on a phone, and the developer has no codebase that enforces the decisions: pure rules shared by the solver and the screen, solver-proven Levels, numbers that stay tweakable for later hardness sliders, and a format a future generator could write.

## Solution

Build the first playable version of **Pin Game**: an installable, offline, mobile-first PWA (portrait, touch first, mouse always works) with the full Box/Buffer sorting rules and **one** Level on **one** Model, the wooden-toy hatchback with 30 Pins in 5 colours. The player turns the car by dragging, zooms by pinching or scrolling, taps Pins to remove them, and holds on a Part to Peek beneath it. Removed Pins fly to the matching open Box, or to the Buffer when no Box matches. Closing Boxes are replaced, Buffer Pins drain into new Boxes, and Parts fall away once their last Pin is out. The Level is won when every Pin is removed, and lost the moment a Pin fills the last Buffer slot. It looks like the **Workbench** style (painted tin Boxes on a dark slate vignette, toon-shaded, Pins with ink outlines) with a **wooden toy** car, and it has small sound effects, a mute toggle, a colour-blind setting, and dev-only undo and tools.

Under the hood, the rules, solver and content loader are pure TypeScript that run headless. The level ships only when the solver has proven it winnable, the build fails otherwise, and every extension point in the vision stays open.

## User Stories

### Playing the Level

1. As a player, I want to open the game and see the car straight away in a front three-quarter view from slightly above, so that I can start playing with no menus.
2. As a player, I want to tap a Pin to remove it, so that I can take the car apart.
3. As a player, I want a removed Pin to fly to the open Box of its colour, so that I can see my sorting progress.
4. As a player, I want a removed Pin with no matching open Box to go to the Buffer, so that I can keep playing when no Box matches.
5. As a player, I want there never to be two open Boxes of the same colour, so that it's always clear where a Pin goes.
6. As a player, I want a Box to close when it reaches its Capacity and a new Box to slide in, so that the sorting keeps moving.
7. As a player, I want Buffer Pins of the new Box's colour to drain into it automatically, so that I'm rewarded for planning ahead.
8. As a player, I want one close to be able to set off a chain of drain, close and replacement, so that good play feels satisfying.
9. As a player, I want a new Box to prefer a colour I can reach now (in the Buffer or with an unblocked Pin), so that the game rarely opens Boxes for buried colours.
10. As a player, I want a Box to show grey when no colour qualifies, so that I can see that colour has nothing left to sort.
11. As a player, I want a Part to fall away once all its Pins are removed, so that I can reach the Parts and Pins behind it.
12. As a player, I want a Pin to stay Blocked while any Part covering it is still present, so that the car comes apart in a sensible order.
13. As a player, I want tapping a Blocked Pin to wiggle it, flash its covering Part red and play a soft "tock", with nothing changing, so that I learn why it didn't come out.
14. As a player, I want to win when every Pin is removed, so that I know when I've finished.
15. As a player, I want to lose the moment a Pin fills the last Buffer slot, so that the rule is easy to understand.
16. As a player, I want win and lose banners to wait until every animation has settled, so that the ending doesn't cut off the action.
17. As a player, I want a gold "CAR STRIPPED!" ribbon with sparkles on a win, and a slate "OUT OF ROOM" ribbon on a loss, each with one button to play again, so that the result is clear and I can retry at once.
18. As a player, I want a Restart button, so that I can start the Level over at any time.
19. As a player, I want the stripped chassis, bumpers and headlights (the Cores) to stay on screen after a win, so that the result looks finished.
20. As a player, I want the Level to be the same every time I play it, so that I can learn it and improve.
21. As a player, I want the Level to always have at least one winning tap order, so that a loss is never the game's fault.
22. As a player, I want the Level to feel relaxed and fairly easy (a random tapper wins about 60–80% of the time), so that it's mindless fun.

### Speed and feel

23. As a fast player, I want every tap to register at once and never be dropped or queued, so that the game never slows me down.
24. As a fast player, I want a Pin to pop out of its Socket the moment I tap it, so that every tap gets a visible response.
25. As a fast player, I want a Pin freed by an earlier tap to be tappable as soon as its covering Part has lost its last Pin, even while that Part is still falling, so that I can chain taps.
26. As a fast player, I want animations to overlap, with each step waiting only for the Box slot or Buffer it touches, so that 30 quick taps finish animating within about 3 s of the last one.
27. As a player, I want a Pin heading for a closing Box to hover until the next Box has slid in, so that the motion reads correctly.
28. As a player, I want drained Buffer Pins to leave in a quick ripple and the Buffer to close its gaps, so that the drain is easy to follow.
29. As a player, I want a threaded shank to show while a Pin pops out, so that removing it reads as unscrewing.

### Camera, gestures and Peek

30. As a touch player, I want dragging to turn the car like a turntable (horizontal spins it, vertical tilts it within about ±80°), so that I can see every side.
31. As a touch player, I want pinching to zoom from 1× to 2.2×, following my fingers, so that I can aim at small Pins.
32. As a desktop player, I want the scroll wheel and trackpad pinch to zoom, and left-click to tap, so that the game works fully with a mouse.
33. As a player, I want the car never to clip at any rotation at 1× zoom, so that I always see the whole Model.
34. As a player, I want no panning, so that the car always stays centred.
35. As a player, I want a small wobble during a tap to still count as a tap, so that taps aren't lost to shaky fingers.
36. As a player, I want a tap that just misses to take the nearest tappable Pin within a short distance, so that small Pins are easy to hit.
37. As a player, I want a tappable Pin to win over a Blocked one when their targets overlap, so that my tap does something useful.
38. As a player, I want hidden Pins (behind other geometry from my view) never to be picked, so that I don't remove a Pin I can't see.
39. As a player, I want the Pin I'm about to tap to grow slightly with a white outline when I press, so that I know what I'm aiming at.
40. As a player, I want pressing and holding on a Part for about a quarter of a second to Peek it (it fades to see-through), so that I can see the Pins beneath and plan ahead.
41. As a player, I want to keep turning the car while Peeking, and for lifting my finger to end Peek without counting as a tap, so that Peek never changes the game.
42. As a player, I want a second finger to turn any gesture into a pinch, and the remaining finger after a pinch to be ignored until lifted, so that the car never jolts.
43. As an Android player, I want a short vibration on a Blocked tap and when Peek starts, so that I get tactile feedback.

### Screen and layout

44. As a player, I want the Box row and then the Buffer at the top, the car in the middle and the buttons at the bottom, so that the layout is easy to scan.
45. As a player, I want Boxes to be roughly square with their slots in two rows (2 + 1 for Capacity 3), so that they read as trays.
46. As a player, I want Buffer Pins drawn a little smaller than Box Pins, so that I can tell the Buffer and the Boxes apart.
47. As a player, I want amber rings on the empty Buffer slots when 2 are left and a pulsing red ring on the last one, so that I can see danger coming.
48. As a player on a small phone (360 × 640), I want everything to fit and stay usable, so that the game works on cheap devices.
49. As a player with a notch, I want the HUD to sit inside the safe area, so that nothing hides under the status bar.
50. As a player who rotates their phone or plays on desktop, I want a centred portrait column, so that the game still works.

### Look

51. As a player, I want a wooden toy car with muted painted plates and bright Candy-coloured Pins, so that the Pins stand out and the car looks charming.
52. As a player, I want bright, distinct Pin colours (red, yellow, green, blue, pink), so that I can sort at a glance.
53. As a player, I want every Pin head to look like a pan-head screw with a recessed cross, so that the screw theme reads clearly.
54. As a player, I want tinted tin Boxes with dark holes and a rubber-mat Buffer on a dark slate vignette, so that the game has a consistent workbench look.
55. As a player, I want toon shading with ink outlines on the Pins only, so that the Pins pop against the car.
56. As a player, I want rounded, friendly type (Baloo 2) and chunky teal pill buttons, so that the UI feels playful.

### Accessibility and settings

57. As a colour-blind player, I want a setting that gives each colour its own drive recess (cross, slot, hex, Torx, square, triangle), so that I can sort without relying on colour.
58. As a colour-blind player, I want empty Box holes to show their colour's drive faintly when that setting is on, so that I know which Pins each Box wants.
59. As a colour-blind player, I want to switch that setting mid-Level with no reload, so that I can try it straight away.
60. As a player, I want a settings sheet above a Settings button holding "Sound" and "Screw shapes (colour-blind help)" switches, so that I can find the options.
61. As a player, I want a mute toggle in the bottom bar next to Restart, so that I can silence the game quickly.
62. As a player, I want my mute and colour-blind choices remembered between visits, so that I don't have to set them again.
63. As a player in a private window where storage fails, I want the toggles to still work for the session, so that nothing breaks.

### Sound

64. As a player, I want short, soft effects for pull-out, Box landing, Buffer landing, Box close, Part falling, the Blocked tap, win and lose, so that the game feels tactile.
65. As a player, I want Pins seating in a Box to climb a chord that the Box-close chime completes, so that filling a Box feels rewarding.
66. As a fast player, I want rapid sounds capped and slightly varied, so that quick tapping doesn't turn into noise.
67. As a player, I want sounds to play when I see the matching animation, so that sound and picture agree.
68. As a player listening to music, I want the game's sounds to mix with my music, so that I can play along to my own audio.
69. As a player whose audio fails or never unlocks, I want the game to play exactly the same, so that sound is never required.

### Installing and offline

70. As a player, I want to install Pin Game to my home screen on Android and iOS with a proper icon and name, so that it feels like an app.
71. As a player, I want the game to work fully offline after the first load, so that I can play anywhere.
72. As a player, I want updates to apply silently only at a safe moment (before my first tap, or once a banner shows), so that an update never wipes a Level in progress.
73. As a player, I want no browser zoom, pull-to-refresh, long-press callout or text selection while I play, so that gestures behave like a native game.

### Developer and level author

74. As the developer, I want an unlimited Undo button in the bottom bar, styled as a dev tool, which also undoes a loss, so that I can explore a Level quickly.
75. As the developer, I want Undo to snap straight to the previous state, cancelling running animations and pending sounds, so that debugging is instant.
76. As the developer, I want Box count, Capacity, Buffer size, colour count and the next-colour rule to be developer constants with per-Level overrides, so that I can tune difficulty and later drive hardness sliders.
77. As the developer, I want the car Level to use a Buffer 6 override from day one, so that the override path is exercised.
78. As the developer, I want every animation timing to be a constant with one speed multiplier, so that I can tune feel and run fast tests.
79. As the developer, I want every gesture threshold and layout number to be a constant, so that I can tune them on a device.
80. As the developer, I want a dev viewer behind dev mode or a `?dev` flag that labels Part and Socket ids, highlights the Parts covering a selected Socket, shows ray-check warnings and runs the solver in a Worker, so that I can author Models and Levels.
81. As the developer, I want the dev viewer to reload when a Model or Level file changes, so that authoring is fast.
82. As the developer, I want an optional next-Box forecast in dev mode, off by default, so that I can see what the rule would pick.
83. As the developer, I want the dev bar to show the build version or hash, so that I can check which version a device is running.
84. As the level author, I want Models and Levels as separate, hand-written JSON files checked against a schema at load time, so that one Model can host many Levels.
85. As the level author, I want load errors to name the file and the Part or Socket id, so that I can fix mistakes quickly.
86. As the level author, I want validation to reject Sockets with no colour, colour totals that aren't multiples of Capacity, covering loops, Cores that cover Sockets, Sockets covered by their own Part, duplicate ids and unknown Model ids, so that broken content never ships.
87. As the level author, I want `pnpm solve` to print each Level's verdict, a winning tap order, nodes explored, the random-tap win rate next to the 60–80% band, the share of winning first taps and the peak Buffer use, so that I can judge difficulty.
88. As the level author, I want a dealing script that searches seeded deals for a solver-proven Level near a 70% random-tap win rate and freezes it to explicit JSON, so that making a Level is repeatable.
89. As the developer, I want the build to fail if any shipped Level isn't proven winnable (including when the solver runs out of budget), so that an unwinnable Level can never deploy.
90. As the developer, I want each shipped Level's difficulty report pinned in a snapshot, so that any change to the rules or data that moves the numbers is caught for review.
91. As the developer, I want `pnpm check` (typecheck, lint, tests, Prettier) to run before every build, and CI to deploy to GitHub Pages on every push to `main` and run `pnpm check` on PRs, so that broken builds never ship.
92. As the developer, I want lint to forbid engine and DOM imports in the rules, solver and content modules, so that they always run headless.
93. As a future maintainer, I want stable Level and Model ids and a `formatVersion` on every file, so that saves and a generator can depend on them later.
94. As a future maintainer, I want the next-colour rule to be a named, swappable strategy, so that a `queue` variant with a truthful preview can be added without touching the others.

## Implementation Decisions

### Stack and structure (ADR 0002)

- Babylon.js + TypeScript on the WebGL2 engine, with deep ES-module imports for tree-shaking and side-effect imports collected in one place. No hand-written GLSL, so a later move to WebGPU stays cheap.
- Vite + pnpm, Node pinned (20.19 or later for `vite-plugin-pwa` 2; the tech-stack ticket proposed 24 LTS, which satisfies this) in `.nvmrc`, `engines` and `packageManager`. `tsx` for scripts, Vitest for tests. TS `strict` plus `noUncheckedIndexedAccess`, ESLint (typescript-eslint) and Prettier.
- One package, no monorepo. Modules:
  - **rules**: pure reducer. No engine or DOM imports (lint-enforced).
  - **solver**: pure depth-first search over tap orders with a memo of visited states and a node budget, plus seeded random-tap playouts. Same purity rule.
  - **content**: Zod schemas for Model and Level (TS types inferred from them), the loader that turns string ids into indices, and the cross-field validation. Same purity rule.
  - **render**: Babylon scene. The Model scene builder (JSON to meshes) is kept separate from the HUD and input, so a future editor can reuse it. Holds the pure **Timeline** scheduler and the pure **layout** function, which have no Babylon or DOM imports.
  - **input**: the pure `gestureStep` classifier and `pickPin` picker, plus the DOM glue that feeds them pointer events and a per-frame tick.
  - **audio**: subscribes to scheduled Timeline steps. It stays out of rules and Timeline.
  - **dev**: dev viewer and dev panel, behind Vite dev mode or `?dev`.
  - An entry point wires these together.
- Model and Level data live in data folders and are bundled with an eager glob import, so they're versioned with the code.

### Rules engine (from the Sorting rules logic prototype)

- Port the prototype's rules module (`makeLevel`, `initialState`, `tap`, `solve`, `playouts`) to TypeScript, keeping it a pure function design. Copy its PRNG and playout loop exactly, so the numbers match `car-sweep.cjs`.
- Interface: `tap(level, state, pin) → { state, events[] }`. Event kinds: `pinToBox`, `pinToBuffer`, `boxClosed`, `boxOpened`, `bufferDrained`, `partFell`, `won`, `lost`. A tap on a Blocked Pin, or any tap after a win or loss, is refused with no state change.
- Undo is a stack of past states held outside the reducer (unlimited in the first version, and it can undo a loss).
- **Rule numbers** come from the Level config: global developer defaults of **3 Boxes, Capacity 3, Buffer 5**, merged with optional per-Level overrides. Nothing in rules or layout hard-codes them.
- **Lose** the moment a Pin fills the last Buffer slot. **Win** when every Pin is removed.
- **Blocked**: a Pin is Blocked while any Part in its Socket's `coveredBy` list is still present. It's judged on rules state, never on what the camera sees. A Part falls away (`partFell`) when its last Pin is removed. Cores never fall.
- **Next-colour rule** is a named, swappable strategy. The first version ships `reachable-first`: a colour qualifies if it has Pins left (on the Model, Blocked or not, or in the Buffer) and no open Box. Prefer qualifying colours that are in the Buffer or have at least one unblocked Pin, and fall back to all qualifying colours. The seeded pick is a pure function of (seed, pick number, state), so the solver memo stays valid. With no qualifying colour, the Box is grey.
- After a Box opens, matching Buffer Pins drain into it, which can chain into close and replacement.
- The dev-only next-Box forecast is computed as "if this Box closed now". It's off by default and never shown to players.

### Content format (ADR 0001, amended twice)

- **Model** file: `id`, `formatVersion`, a flat list of Parts with Model-space transforms and no hierarchy. Each Part has a stable string id, one or more **shapes** (tagged union of cylinder, rounded box, torus, capsule and sphere, each with its own transform, body colour, size and segment parameters, an optional `round` edge radius and an optional `finish: "wood"`), an optional fall-direction override (default: outward from the Model's centre), and its Sockets. A Socket has a stable id, a position and a pull-out direction in its Part's local space, and a hand-written `coveredBy` list of Part ids. A Model has no Pin colours.
- **Level** file: `id`, `formatVersion`, a Model id, an explicit colour for every Socket, a rule seed, and optional overrides of the rule numbers (and of the next-colour strategy). Levels are always concrete: no deal seed or generation step is stored.
- A Part with no Sockets is a **Core**. Each Pin holds exactly one Part.
- Cross-field validation, run as plain functions after Zod parsing: every Socket has a colour; each colour's total is a multiple of Capacity; covering has no loops; no Core covers a Socket; no Socket is covered by its own Part; ids are unique; the Model id exists. Errors name the file and the Part or Socket id.
- A dev-only ray check casts along each Socket's pull-out axis and warns when the Parts it hits differ from `coveredBy`. It's a warning, never a gate. `coveredBy` is the source of truth.
- The Pin palette (**Candy**, in order: red `#ff3b47`, yellow `#ffd60a`, green `#3ccf4e`, blue `#2f6bff`, pink `#ff6fc8`, orange `#ff9419`, purple `#9b4dff`, cyan `#1ec8ef`, white `#ffffff`, black `#1b1b22`) is a content constant. A Level with *n* colours uses the first *n*. Level colours reference palette indices.

### The car Model and Level (Car level design; Car Model toy look)

- A chunky wooden-toy hatchback, 30 Sockets. Outer (tappable at start, 16): four wheels (1 each), bonnet (2), roof (2), two doors (2 each), tailgate (2), spare wheel (2). Inner (14, each covered by exactly one Part along its pull-out ray): two axles (2 each, covered by that end's wheel), engine (3, bonnet), two seats (2 each, that side's door), steering wheel (1, roof), rear seat (2, tailgate). Cores: chassis, two bumpers, two headlights. Part ids and Socket positions are taken from the Car Model prototype (variant C, its `SK.sockets`).
- Car colours are content constants: wood `#d9aa78`, dark wood `#b8865a`, bonnet `#8fa7c4`, roof `#d8a3a0`, doors `#a7c09a`, tailgate `#b4a5cf`, tyre `#3a3d45`, interior `#e8cfa6`, engine `#9aa0a8`, lights `#fff3c4`. The wood grain is a procedural texture drawn in code at load time. Rounded boxes get box-projected UVs (one repeat per 1.2 units), and lathed shapes use their own UVs.
- Start view: yaw 0.6, pitch −0.35.
- The Level: 5 colours × 6 Pins, 3 Boxes, Capacity 3, **Buffer 6 override**, `reachable-first`. Dealt by a dev script (ported from `car-sweep.cjs`): a seeded uniform shuffle, where no Part has all its Pins in one colour and every colour has at least one outer Pin. Search deal and rule seeds for a solver-proven Level at a 60–80% random-tap win rate (1000 playouts), pick the one closest to 70%, and freeze it as explicit Level JSON.

### Animation (Animation sequencing and input)

- Every tap goes to the rules at once. The rules state runs ahead of the screen, and taps are never ignored or queued.
- A pure `Timeline.schedule(events, now, tracks, opts) → { steps, tracks }`. Tracks record when each Box slot and the Buffer (a single serial track) are free again. The pull-out starts at tap time. The flight is timed to land when its target is settled, hovering while a Box closes. A Part falls as soon as its last Pin is out. Per slot, the order is close → slide-in → drain. Drains ripple with a stagger, then the Buffer closes its gaps. Win and lose wait for everything to settle, plus a beat.
- Default timings (ms), all constants with one speed multiplier: pull-out 110, flight 380, Part falls 550, Box close 340, next Box slides in 300, Buffer-to-Box flight 320, drain stagger 90, Buffer closes gaps 160, beat before win/lose 250.
- Parts fall with scripted motion, no physics. Rendering only plays scheduled steps and never decides outcomes.
- Undo (and Restart) cancel all animations and pending sounds, reset the tracks and redraw from state. Rendering needs a "draw this state from scratch" path, with Pins already in a Box drawn as stand-ins.

### Layout and HUD (Screen layout and HUD)

- A pure `layout(screen, safeInsets, level) → rects`, in CSS px. Top to bottom inside the safe area: margin 10, Box row (Boxes 10 apart, centred), gap 8, Buffer row, margin 10, Model region (the rest), margin 10, bottom bar 48, margin 10. It reflows from the Level's Box count, Capacity and Buffer size. Every number is a constant.
- Box width = min((available width − gaps) / Box count, columns × 46 + 12). The top row has ⌈Capacity/2⌉ slots. Slot = (Box width − 12) / columns, and a Pin head is 0.78 of its slot. Buffer slot = min(52, 0.8 × Box slot, what fits in one row).
- Design target 360 × 640. Landscape and desktop get a centred portrait column, 9:16 of the safe height.
- The Box row and Buffer are drawn in the Babylon scene by a second, orthographic camera in CSS px (origin at the top left, one unit = one CSS px), so a Pin flies from the Model to its Box as one instanced mesh. The DOM holds only text, buttons, the settings sheet and the dev panel.
- Safe-area insets are read from `env(safe-area-inset-*)` through a hidden probe element and passed to `layout` as numbers.
- Model camera: at 1×, the bounding sphere around the turning centre (Pins included) fills the Model region with no clipping at any rotation. It's offset sideways so the turning centre sits at the region's centre. Zoom runs from 1× to 2.2× by dollying the camera. No panning.

### Input (Gesture tuning)

- A pure `gestureStep(state, event, K) → { state, out }`. Time arrives on each event, plus a per-frame `tick`. Intents: `press`, `pressCancel`, `tap`, `dragStart`, `drag`, `dragEnd`, `holdStart`, `holdEnd`, `pinchStart`, `pinch`, `pinchEnd`.
- A pure `pickPin(x, y, candidates, K) → { id, how }`. The render layer builds screen-space candidates (position, drawn radius, visible by one ray to the head, Blocked from rules state, depth).
- Starting constants: `holdMs` 240, slop 10 px for touch and 4 px for mouse, `catchUp` on, tap target radius = max(drawn head radius × 1.6, 18 px), assist 18 px (only to tappable Pins), `preferUnblocked` on, no ambiguity refusal, turntable turning at 200° per Model-region width with pitch limited to ±1.4 rad, `pinchGain` 1, wheel gain 0.0015 (line-mode deltas count as 16 px), trackpad pinch gain 0.01 via `ctrlKey` wheel events.
- A tap is located where the press started. Picking happens only inside the Model region. A hold Peeks the Part of the Pin under the press, or else the first Part the ray hits. A hold over empty space Peeks nothing. A second finger ends any gesture and starts a pinch. After a pinch, the remaining finger is ignored until lifted. A third finger is ignored. Mouse uses the left button only, with the context menu suppressed.
- Feedback: press highlight at 1.25× with a white outline. Peek fades the Part to 0.22 opacity over 120 ms with a depth pre-pass. A Blocked tap shakes the Pin perpendicular to its pull-out (3 decaying cycles, 320 ms, 0.05 units) and flashes the covering Part red for 350 ms. Android vibrates 18 ms on a Blocked tap and 10 ms when Peek starts.
- CSS: `touch-action: none` on the canvas, `overscroll-behavior: none` on html/body, and `-webkit-touch-callout: none` plus `user-select: none` (prefixed too) everywhere.

### Visual style (UI visual style: Workbench; Car Model toy look)

- 3-band toon shading (`CellMaterial` or an own ramp in a material plugin). Ink outlines on Pins only (car, Box and Buffer Pins). Renderer-side bevels: rounded boxes use min(0.07, 0.45 × smallest side) unless a shape sets `round`. Cylinders get a lathed rounded edge, min(0.06, 0.2 × diameter, 0.45 × height). Smooth normals, about 32 segments on wheels and 12–16 on Pins, 4× MSAA, device pixel ratio capped at about 2.
- Pins are one instanced mesh with a per-instance colour and a per-instance Head-mark atlas index. Pan head: diameter 0.24, flat rim 0.03, quarter-round dome to about 0.076. The threaded shank shows only during pop-out. The Head mark is a recess (wall = colour × 0.3, floor = colour × 0.5, shifted). The atlas holds the cross plus six drives, drawn in-house, and is sampled only by the head disc through a material plugin. Switching the colour-blind setting only changes atlas indices.
- Boxes: a solid tinted tin (colour × 0.92) with 12 px corners, 3 px front bevel and 14 px depth. Holes are dark recesses (colour × 0.42) at 0.9 of the slot, with an upper-edge inner shadow and a lip (35% white). With the colour-blind setting on, the drive shows faintly in empty holes (black at about 25%).
- Buffer: a rubber mat `#1b272d` with 10 px corners and 8 px depth, and slots `#0f1a1f`. The warning is a pure function of Buffer count: 2 left → amber rings `#ffb020` on empty slots. 1 left → that slot also pulses red `#ff3b47` (about every 0.9 s, opacity 0.25 → 1, scale 1 → 1.08).
- Background: a CSS radial vignette `radial-gradient(120% 75% at 50% 48%, #5a7783, #34505b 55%, #1f2f36)` behind a transparent canvas (engine `alpha: true`, `premultipliedAlpha: false`, clear alpha 0).
- Type: Baloo 2 at weights 600 and 800, self-hosted from `@fontsource/baloo-2` (Latin woff2) and precached.
- Bottom bar, left to right: dev Undo (yellow pill with a `DEV` tag, 104), a gap, Settings (48), Mute (48), Restart (112), 6 apart. Player buttons are teal pills `#13a3c4` with a `#0b6f86` edge and press down 3 px. Confirm buttons are green `#3ccf4e` with a `#228a31` edge. Icons are in-house inline SVG. In the first version, Undo is always shown but styled as a dev tool. It becomes player-facing limited undo only in the vision.
- Win/lose: the scene dims (`#0008`). A full-width ribbon slides in from the left with overshoot (about 0.5 s) and a stitch line. Win is gold `#ffd60a` / `#b39300` with "CAR STRIPPED!" and sparkles. Lose is slate `#5a6b75` with "OUT OF ROOM". Each has one green "Play again" or "Try again" button. The copy is a placeholder.
- Colour roles: ink `#13202a`, surface `#2c3f49`, accent `#13a3c4`, go `#3ccf4e`, reward `#ffd60a`, fail `#ff3b47`, amber `#ffb020`. White-on-teal and white-on-slate must pass WCAG AA for large text.

### Settings

- A small **settings store** interface (load/get/set) backed by `localStorage`, holding `sound` (default on) and `screwShapes` (colour-blind help, default off). It's shaped like the future progress store. If storage is unavailable, it falls back to memory for the session.
- The settings sheet opens above the Settings button with two switches. The sheet's Sound switch and the bar's Mute button control the same setting.

### Sound (Sound in the first version)

- Babylon AudioEngineV2 with `disableDefaultUI`, keeping its re-unlock. The input layer calls `unlockAsync()` on the first `pointerup` (including the end of a drag). Sounds before the unlock are dropped. Set `navigator.audioSession.type = 'ambient'` where supported.
- Sounds start at Timeline step start times, and pull-out plays at tap time. Mapping: pull-out pop, Box landing click, Buffer landing thunk, Box close chime, Buffer-to-Box flight plays the Box click, Part falling clatter, Blocked "tock", win jingle (about 1–2 s), lose sting. Slide-in, gap closing, Undo and Restart are silent. There's no near-full warning sound.
- Voice cap of about 4 per sound (the oldest is cut), about ±4% random pitch and slight volume variation. The 1st, 2nd and 3rd Pin seated in a Box climb a chord that the close chime completes, reset per Box. All of these are constants.
- CC0 effects only, as mono MP3 at about 96 kbps, about 200 KB in total, decoded once at load, with a credits file. Undo cancels pending sounds. If audio fails, nothing else changes.

### PWA, hosting and updates (ADR 0003)

- `vite-plugin-pwa` 2.0.0 with `generateSW`. Glob patterns cover js, css, html, json, mp3, woff2, the webmanifest and icons. No runtime network use at all.
- `registerType: 'prompt'`. There's no toast: on `onNeedRefresh`, call `updateSW()` only at a safe moment (the current Level has zero taps, or a banner is showing). Call `registration.update()` on `visibilitychange` → visible. The service worker is off in `pnpm dev`.
- `viewport-fit=cover`. `apple-mobile-web-app-status-bar-style: default` and `apple-mobile-web-app-capable`, both in the first deploy.
- Manifest: name and short_name "Pin Game", a fixed `id`, `start_url: './'`, `scope: './'`, `display: standalone`, `orientation: portrait`, `theme_color` `#34505b`, `background_color` `#1f2f36`. Icons are 192 and 512 `any`, a separate 512 `maskable` (head radius 150/512) and a 180 `apple-touch-icon`, all generated by `@vite-pwa/assets-generator` from one SVG: a Candy-red Pin head with a cross recess on the slate gradient.
- Hosting: GitHub Pages from a public `pin-game` repo. Vite `base` comes from an env var that CI sets to `/pin-game/`, and stays `/` locally. One workflow: on push to `main`, `pnpm install --frozen-lockfile`, `pnpm build` (which runs `pnpm check`), then upload and deploy the Pages artifact. On PRs, run `pnpm check` only. The CI workflow is added when the remote is created.
- `navigator.storage.persist()` is not called yet, since there is no saved progress.

### Solver and checks (Checks in the toolchain)

- The solver report: verdict (`winnable`, `unwinnable`, `unknown` on budget), one winning tap order, nodes explored, random-tap win rate (1000 playouts, fixed seed), share of first taps that can still win, and peak Buffer use along the winning order.
- `pnpm solve [file…]` prints reports, with the win rate shown next to the 60–80% band. The band never fails a test.
- `pnpm check` = `tsc --noEmit`, ESLint, `vitest run`, Prettier `--check`. `pnpm build` runs `check` first. No pre-commit hook.
- The dev viewer runs the solver in a Web Worker (worst cases take about 10 s).

### Extension points kept open (from the vision)

All twelve in [vision.md](vision.md) apply: rule numbers as parameters, a swappable next-colour strategy, player actions shaped like `tap` (a future `applyBooster`), headless rules/solver/content, a Model scene builder separate from the HUD, the tagged-union shape field, separate concrete Model and Level files, stable ids and `formatVersion`, a progress store interface (not built yet), campaign order as data (not built yet), no raw GLSL, and no PWA-only APIs in the core.

## Testing Decisions

**What makes a good test here:** it drives a module through its public interface and checks external behaviour (resulting state, emitted events, scheduled times, rectangles, intents, picked ids), never internal fields or private helpers. Tests use tiny hand-built inline Models and Levels unless they are about the shipped car. There are no screenshot or pixel tests, no coverage thresholds and no property-testing dependency: seeded loops cover the invariants.

**Seams (confirmed with the human):**

1. **Primary seam: content → rules.** Load a Level (inline or from the levels folder) through the content loader, then drive `tap()` and the undo stack, asserting on state plus the exact event list. The solver gate and the report snapshot also use this seam.
   - Named edge cases, each on a tiny Level: lose the moment the last Buffer slot fills; a grey Box when no colour qualifies; a drain → close → replacement chain; a Blocked tap refused with no change; taps after a win or loss refused; never two open Boxes of one colour; the reachable-first preference; a per-Level override (Buffer 6) takes effect; undo, including undoing a loss.
   - Invariants over seeded random playouts on the car and a few generated Levels, after every tap: every Pin is in exactly one place; the Buffer never exceeds its size; open Box colours are distinct; replaying taps gives identical states and events; the next-colour strategy is a pure function of (seed, pick number, state).
   - Content validation: one failing case per check (bad Zod shape, unknown Model id, Socket with no colour, colour total not a multiple of Capacity, covering loop, Core covering a Socket, Socket covered by its own Part, duplicate ids). Each asserts that the error names the file and the Part or Socket id.
   - **Winnability gate:** a test discovers every file in the levels folder, validates it, and requires a `winnable` verdict. `unknown` fails. The timeout is about 30 s per Level.
   - **Difficulty snapshot:** each shipped Level's report is pinned in a Vitest snapshot. The first car snapshot must match the random-tap win rate that `car-sweep.cjs` measured for the frozen deal.
2. **Timeline seam:** `Timeline.schedule`, asserting on scheduled start and end times: a Pin hovers while its Box closes and lands after the slide-in; a Part falls while its last Pin is still flying; close → slide-in → drain run in order per slot; a 90 ms drain ripple; banners wait for everything to settle; 30 taps 160 ms apart finish within about 3 s of the last; the speed multiplier scales every step.
3. **Layout seam:** `layout(screen, safeInsets, level)`, asserting on rects: the 360 × 640 and iPhone sizes from the Screen layout ticket's table (Box 104, Pin in Box 36, Buffer slot 37 with 3/3/6); reflow when Box count, Capacity or Buffer size change; safe insets applied; the landscape centred column.
4. **Gesture seam:** `gestureStep` table tests (a 6 px wobble is still a tap; a press released after `holdMs` with no tick between is a hold; a second finger during a hold → `holdEnd` then a pinch; pinch then lift one finger → ignored until lifted; a mouse past 4 px is a drag). `pickPin` tests (direct hit; overlap where the tappable Pin wins; a Blocked direct hit returns a wiggle; no assist to a Blocked Pin; hidden Pins never picked).
5. **Render smoke test:** one headless Babylon NullEngine test plays the car's winning tap order at a high speed multiplier, lets everything settle, and checks that the scene (Pin positions in Boxes, Buffer, Model; fallen Parts) matches the rules state. It repeats the check after an undo.

**Prior art:** the prototypes in `.scratch/first-playable/prototypes/` hold liftable pure modules and the cases they were checked against: the rules module and solver (sorting-rules), `Timeline` (animation-sequencing, including a NullEngine screen-matches-rules check), `gestureStep` and `pickPin` (gesture-tuning), layout maths and the NullEngine ortho-camera check (screen-layout), the rounded-box builder with headless normal checks (ui-visual-style), and the dealing sweep (`car-sweep.cjs`, with results in `car-sweep-results.md`).

**Not automated:** the covering ray check (a dev warning only), the service worker and offline behaviour (checked with `pnpm build && pnpm preview`), and everything on the manual device checklist below.

## Out of Scope

- More than one Level or Model, level select, Campaign and Pack files, progression and saved progress (the progress store interface and `storage.persist()` wait for these).
- A procedural level generator and Endless mode with hardness sliders. The format only stays generator-friendly.
- Player-facing limited undo, Boosters, hints, timers, and a player-facing next-Box preview (the `queue` strategy).
- The separate level editor, glTF/Blender import, and click-to-place Sockets.
- Accounts and cloud sync, store wrappers (Capacitor/Tauri), and monetisation.
- Music. Sound covers small effects only.
- Real landscape or spread layouts beyond the centred portrait column.
- Physics for falling Parts (motion is scripted).
- A 7th to 10th drive recess for colours beyond 6 (Endless only).
- Preview deploys, release tags, pre-commit hooks, Playwright or other service-worker tests.

## Further Notes

**Manual device checklist after the first deploy** (from PWA hosting, Sound and UI visual style):

1. Android install: the install prompt appears, and the maskable icon looks right.
2. iOS install: the icon and name are right.
3. Airplane mode, cold launch: the Level plays fully offline.
4. Push a trivial change. Mid-Level, the app doesn't reload. After a win or loss (or on a fresh Level), the new version is live and the dev bar's version changes.
5. Notched iPhone on iOS 26.1+: the Box row sits clear of the status bar, and `100vh` fills the screen with no gap.
6. Pinch, double-tap, pull-down and long-press: no browser zoom, refresh, callout or selection.
7. Rotate: Android stays portrait, and iOS shows the centred column.
8. Silent switch on: no sound. Off: the game's sounds play over music that's already playing.
9. Background the Home Screen app and return. Note whether sound is gone (WebKit bug 291892, accepted for now).
10. The iOS `default` status bar over the dark slate scene: if it reads as an ugly white strip, switch to `black` **before** the first deploy (any change to the tag costs a reinstall).
11. Wood grain readability and cost on a real phone. The fallback is the same colours without the texture.
12. Taps feel accurate. If not, run the gesture prototype's aim test (about 30 taps) and size `minTargetPx` from the 90th-percentile offset. Also watch whether a 240 ms hold turns slow taps into Peeks.

**Tuning is expected.** Gesture thresholds, animation timings, sound values and layout numbers are starting values, all developer constants, to be adjusted in the build.

**Naming:** the game is **Pin Game**. The repo folder is still "peg-game". Use the glossary terms in code and UI (Pin, not peg or screw; Box; Buffer; Part; Socket; Core; Blocked; Peek).

**Suggested build order** (for slicing into tickets): rules + content + solver with the gate and snapshot → the frozen car Level → Model scene builder and camera → layout and HUD scene → Timeline and animations → input and Peek → visual style polish → settings and sound → PWA, icons and CI.
