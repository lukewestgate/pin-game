# 27: Peek

**What to build:** Pressing and holding on a Part Peeks it: only that Part turns see-through, so the player can see the Pins beneath and plan ahead. Dragging still turns the car while Peeking. Lifting the finger ends Peek and never counts as a tap. Peek never changes game state. See [spec](../spec.md): Input; Gesture tuning ticket (13).

**Blocked by:** 26 (Gestures: turn, zoom and tap picking).

**Status:** ready-for-agent

- [ ] `holdMs` 240 without passing the slop emits `holdStart`. The Peeked Part is the Part of the Pin under the press if there is one, otherwise the first Part the ray hits. A hold over empty space Peeks nothing and can still turn the car.
- [ ] The Part fades to 0.22 opacity over 120 ms using a depth pre-pass, and fades back at the same rate on `holdEnd`.
- [ ] While Peeking, passing the slop again turns the car. A second finger ends Peek and starts a pinch.
- [ ] Android vibrates 10 ms when Peek starts.
- [ ] Rules state is identical before and after any Peek. A test or the smoke test covers this.
