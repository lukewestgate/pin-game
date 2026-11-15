# Gesture tuning

Type: prototype
Status: resolved
Parent: ../map.md
Blocked by: 06, 07

## Question

What are the starting values for the pure tap / drag / press-and-hold classifier (Checks in the toolchain), and how are small Pins made easy to hit? Specifically:

- How long must a press last to start Peek (for example 350 to 500 ms), and how far can the finger move before a press counts as a drag and not a tap or hold?
- Does a drag that starts on a Pin rotate the Model (it should, per the map's Controls), and does a tap that wobbles a few pixels still count?
- How big is a Pin's tap target compared with its drawn size? Does a tap that misses every Pin pick the nearest unblocked Pin within some radius in screen space, and how are two Pins close together told apart?
- How do pinch zoom and the scroll wheel map to the zoom range, and how does a second finger landing in the middle of a hold or drag behave?
- What feedback does each gesture give: a Pin highlight on press, Peek fade-in time, the Blocked wiggle?

The values must be judged on a real phone, so the prototype is served to a phone over the local network. The decision can be "start with these values and tune them in the build" if the phone test is good enough. All values stay developer constants.

## Answer

Resolved with the human on 2026-11-15 after testing on a phone (prototype: [gesture-tuning.prototype.html](../prototypes/gesture-tuning.prototype.html)). The verdict is "start with these values and tune them in the build". The human changed two of the proposed defaults: **hold to Peek 400 → 240 ms**, and **turning free → turntable**. The aim test's numbers weren't reported, so the tap-target values are the prototype's proposal, kept as is. No glossary changes.

**Two pure modules, ready to lift into `src/input`** (both are separate `<script>` blocks in the prototype, with no DOM):
- `gestureStep(state, event, K) → { state, out }` is the tap / drag / hold / pinch classifier.
  - Time comes in on each event, and the page feeds it a `tick` every frame, so it can be tested headless.
  - Its intents are `press`, `pressCancel`, `tap`, `dragStart`, `drag`, `dragEnd`, `holdStart`, `holdEnd`, `pinchStart`, `pinch` and `pinchEnd`.
- `pickPin(x, y, candidates, K) → { id, how }` decides which Pin a tap means.
  - It takes screen-space candidates (`x`, `y`, drawn radius, visible, Blocked, depth).
  - The render layer builds those candidates: it projects each head and casts one ray to the head to test visibility.
  - Blocked comes from the rules state, never from what the camera can see.

**Starting values** (all developer constants):

| Constant | Value | Meaning |
|---|---|---|
| `holdMs` | **240** | A press held this long without moving starts Peek. It is short, so a slow tap may turn into a Peek; watch for this in the build. |
| `slopTouchPx` / `slopMousePx` | 10 / 4 | How far a finger or mouse can move before a press becomes a drag. A tap that wobbles less than this still counts. |
| `catchUp` | true | When a drag starts, the car turns by the distance already moved, so it doesn't lag behind the finger. |
| `targetScale` / `minTargetPx` | 1.6 / 36 | Tap target radius = max(drawn head radius × 1.6, 18 px). |
| `assistPx` | 18 | A tap that hits no target takes the nearest **tappable** Pin whose target edge is within 18 px. It never assists to a Blocked Pin. |
| `preferUnblocked` | true | Where targets overlap, a tappable Pin beats a Blocked one. Otherwise the closest centre (relative to target size) wins, then the nearer Pin. |
| `ambiguityPx` | 0 (off) | Refusing too-close taps was available and wasn't wanted. |
| `turnDeg` / `turnMode` | 200 / **turntable** | A drag across the Model region's width turns the car 200°. Horizontal drags spin it about its own upright axis. Vertical drags tilt it about the screen's horizontal axis, limited to ±1.4 rad (about ±80°). |
| `zoomMax` | 2.2 | Same as Screen layout and HUD. |
| `pinchGain` | 1 | Zoom = zoom at pinch start × (finger gap ratio)^1, so zoom follows the fingers. It ignores the pinch midpoint (no panning). |
| `wheelGain` / `padGain` | 0.0015 / 0.01 | Mouse wheel: zoom × e^(−deltaY × gain). Line-mode deltas count as 16 px. A trackpad pinch arrives as `ctrlKey` wheel events and uses `padGain`. |

**Answers to the ticket's questions:**
- **A drag that starts on a Pin** turns the Model once it passes the slop, like any drag. A tap that wobbles less than the slop still counts as a tap, located where the press **started**.
- **Tap that misses every Pin:** the assist above. Close Pins are told apart by distance relative to target size, with tappable Pins first.
  - Picking is only allowed inside the Model region. Hidden Pins (their head ray is blocked) are never picked.
  - The closest visible pair at 1× on a 390-wide screen is about 12 px apart, against 18–21 px heads. The relative-distance tie-break handles it; recheck it if the Pin head form changes.
- **Hold:** after `holdMs` without passing the slop, Peek starts on the Part under where the press began.
  - If a Pin is under it, Peek shows that Pin's Part (`peekPinPart`); otherwise it's the Part the ray hits first.
  - A hold over empty space Peeks nothing and can still turn the car.
  - While Peeking, the finger turns the car once it passes the slop again. Lifting it ends Peek and never counts as a tap.
- **Second finger:**
  - On a press, a hold (Peek) or a drag, a second finger ends that gesture and starts a pinch.
  - When one finger of a pinch lifts, the other does nothing until it is lifted, so the last finger leaving doesn't jolt the car. A new second finger starts a new pinch.
  - A third finger is ignored.
  - With a mouse, only the left button counts and the context menu is suppressed.
- **Feedback:**
  - On press, the Pin a tap would take grows to 1.25× and gets a white outline; this is cancelled when the press becomes a drag or a hold.
  - Peek fades the Part to 0.22 opacity over 120 ms using a depth pre-pass, and fades back at the same rate.
  - A Blocked tap shakes the Pin sideways, perpendicular to how it pulls out (3 decaying cycles, 320 ms, 0.05 units), and flashes the covering Part red for 350 ms.
  - Android also vibrates (18 ms on a Blocked tap, 10 ms when Peek starts). iOS Safari has no vibrate, so it is silent there.
  - How the highlight and flash *look* can be restyled in [UI visual style](17-ui-visual-style.md). The behaviour and timings are settled here.

**Tests, per [Checks in the toolchain](10-checks-in-the-toolchain.md):** the cases the prototype was checked against make a ready-made Vitest table for `gestureStep`:
- a 6 px wobble is still a tap
- a press released after `holdMs` with no tick in between is a hold, not a tap
- a second finger during a hold → `holdEnd`, then a pinch; with `ignore`, nothing happens
- pinch then lift one finger → wait, or resume
- a mouse past 4 px is a drag

For `pickPin`: a direct hit, overlap where the tappable Pin wins, a Blocked direct hit that wiggles, no assist to a Blocked Pin, and hidden Pins never picked.

**Not done:** the aim test's offsets weren't measured. If taps feel off in the build, run the prototype's aim test (about 30 taps) and size `minTargetPx` from the 90th-percentile offset.
