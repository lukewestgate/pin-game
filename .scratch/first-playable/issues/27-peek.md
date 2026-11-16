# 27: Peek

**What to build:** Pressing and holding on a Part Peeks it: only that Part turns see-through, so the player can see the Pins beneath and plan ahead. Dragging still turns the car while Peeking. Lifting the finger ends Peek and never counts as a tap. Peek never changes game state. See [spec](../spec.md): Input; Gesture tuning ticket (13).

**Blocked by:** 26 (Gestures: turn, zoom and tap picking).

**Status:** resolved

- [x] `holdMs` 240 without passing the slop emits `holdStart`. The Peeked Part is the Part of the Pin under the press if there is one, otherwise the first Part the ray hits. A hold over empty space Peeks nothing and can still turn the car.
- [x] The Part fades to 0.22 opacity over 120 ms using a depth pre-pass, and fades back at the same rate on `holdEnd`.
- [x] While Peeking, passing the slop again turns the car. A second finger ends Peek and starts a pinch.
- [x] Android vibrates 10 ms when Peek starts.
- [x] Rules state is identical before and after any Peek. A test or the smoke test covers this.

## Notes

- `gestureStep` already classified hold, turning while held and the second-finger `holdEnd` then pinch (ticket 26, tested in `test/gestures.test.ts`), so this ticket only wired intents: `input.ts` calls `peekAt` / `peekEnd` on the host, and `game-view.ts` does the fade.
- Part materials are shared by colour, so a Peeked Part's meshes get cloned materials (`needDepthPrePass`, alpha stepped by the pure `peekStep`), and the shared ones come back once solid. Ticket 28 swapping to toon materials must keep this clone-and-restore.
- Peek only starts from a press inside the Model region. The 10 ms vibration and the DOM glue are not unit tested. The rules-state check is a view test (the view only reads `State`).
