# 26: Gestures: turn, zoom and tap picking

**What to build:** The car handles well by touch and by mouse. Dragging turns it like a turntable. Pinch, the wheel and a trackpad pinch zoom it from 1× to 2.2× with no panning. Taps reliably take the intended Pin, with forgiving targets and a tap assist. A Blocked Pin answers a tap with a wiggle and a red flash. See [spec](../spec.md): Input; Gesture tuning ticket (13).

**Blocked by:** 23 (Wooden-toy car and frozen Level), 24 (Layout and HUD reflow).

**Status:** ready-for-agent

- [ ] A pure `gestureStep(state, event, K) → { state, out }`, fed pointer events and a per-frame `tick`, emitting the spec's intents. The DOM glue lives in the input module.
- [ ] A pure `pickPin(x, y, candidates, K) → { id, how }`. Render builds the candidates (projected head, drawn radius, visibility by one ray to the head, Blocked from rules state, depth).
- [ ] Constants: slop 10 px touch and 4 px mouse, `catchUp`, target radius max(head × 1.6, 18 px), assist 18 px only to tappable Pins, `preferUnblocked`, turntable at 200° per Model-region width with pitch limited to ±1.4 rad, `pinchGain` 1, wheel gain 0.0015 (line deltas count as 16 px), trackpad pinch 0.01 via `ctrlKey`.
- [ ] A tap is located where the press started. Picking happens only inside the Model region, and hidden Pins are never picked. A second finger turns any gesture into a pinch, the leftover finger is ignored until lifted, and a third finger is ignored. Mouse uses the left button only, with no context menu.
- [ ] Feedback: press highlight at 1.25× with a white outline (cancelled on drag). The Blocked tap shakes the Pin perpendicular to its pull-out (3 decaying cycles, 320 ms, 0.05 units) and flashes the covering Part red for 350 ms. Android vibrates 18 ms.
- [ ] CSS: `touch-action: none` on the canvas, `overscroll-behavior: none` on html and body, and `-webkit-touch-callout: none` plus `user-select: none` (and prefixed) everywhere.
- [ ] Table tests for `gestureStep` (6 px wobble is a tap; release after `holdMs` with no tick is a hold; second finger during a hold → `holdEnd` then a pinch; pinch then lift one finger; mouse past 4 px is a drag) and for `pickPin` (direct hit; tappable wins on overlap; Blocked direct hit wiggles; no assist to Blocked; hidden never picked).
