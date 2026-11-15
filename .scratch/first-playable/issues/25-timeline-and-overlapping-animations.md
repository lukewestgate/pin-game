# 25: Timeline and overlapping animations

**What to build:** Every rules event is animated, and fast tapping never slows the player down. A tapped Pin pops out at once and flies to its Box or the Buffer. It hovers while its Box closes. Parts fall away, Boxes close and slide in, and Buffer Pins drain in a ripple. Win and lose wait until everything settles. Undo and Restart snap instantly. See [spec](../spec.md): Animation; Animation sequencing ticket (09).

**Blocked by:** 23 (Wooden-toy car and frozen Level), 24 (Layout and HUD reflow).

**Status:** ready-for-agent

- [ ] A pure `Timeline.schedule(events, now, tracks, opts) → { steps, tracks }` with no Babylon or DOM imports. Tracks cover each Box slot and the Buffer (one serial track).
- [ ] Taps go to the rules immediately and are never ignored or queued. Blocked is judged on the rules state, so a Pin is tappable while its covering Part is still falling.
- [ ] Default timings (ms) as constants with one speed multiplier: pull-out 110, flight 380, Part falls 550, Box close 340, slide-in 300, Buffer-to-Box 320, drain stagger 90, Buffer closes gaps 160, beat before win/lose 250.
- [ ] Rendering plays the scheduled steps: pull-out at tap time; flight timed to land when its target is settled; a Part falls (scripted, outward from the centre or along its override) as its last Pin leaves; close → slide-in → drain per slot; drain ripple, then gap closing.
- [ ] Timeline tests: hover while closing then land after the slide-in; a Part falls while its last Pin flies; per-slot order; the 90 ms ripple; banners wait for settling; 30 taps 160 ms apart finish within about 3 s of the last; the multiplier scales every step.
- [ ] Undo and Restart cancel all animations, reset tracks and redraw from state through a draw-from-scratch path (Pins already in a Box are drawn as stand-ins).
- [ ] A headless NullEngine smoke test plays the car's winning order at high speed and checks the scene matches the rules state after settling, and again after an undo.
