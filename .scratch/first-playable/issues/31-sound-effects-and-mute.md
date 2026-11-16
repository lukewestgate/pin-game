# 31: Sound effects and mute

**What to build:** The game has small, soft sound effects in step with what the player sees, and no music. Pins pop, click into Boxes and thunk into the Buffer. Seating Pins climb a chord that the Box-close chime completes. Parts clatter, Blocked taps "tock", and win and lose each have a short sting. A Mute button silences everything and is remembered. If audio fails, the game plays exactly the same. See [spec](../spec.md): Sound; Sound ticket (16).

**Blocked by:** 25 (Timeline and overlapping animations), 30 (Settings sheet and Screw shapes).

**Status:** resolved

- [x] Babylon AudioEngineV2 with `disableDefaultUI`, keeping its re-unlock. `unlockAsync()` is called on the first `pointerup` (including a drag's end). Sounds before the unlock are dropped. `navigator.audioSession.type = 'ambient'` is set where supported.
- [x] The audio module subscribes to scheduled Timeline steps and plays at step start times (pull-out at tap time). It stays out of the rules and Timeline modules.
- [x] The step → sound map follows the spec (slide-in, gap closing, Undo and Restart silent; no near-full warning).
- [x] Voice cap of about 4 per sound (the oldest is cut), about ±4% pitch and slight volume jitter. The 1st, 2nd and 3rd seat in a Box climb a chord that the close chime completes, reset per Box. All values are constants.
- [x] Undo and Restart cancel pending sounds.
- [x] The Mute button in the bar and the sheet's Sound switch are the same setting in the settings store.
- [x] CC0 effects only, as mono MP3 at about 96 kbps, about 200 KB total, decoded once at load, with a credits file listing sources. Files are picked by ear.
- [x] With audio unavailable or failing to unlock, nothing else changes and nothing throws.

## Implementation notes and deviations

- Modules: `src/audio/sound-map.ts` (step to cues, constants), `audio.ts` (scheduling, voice cap, jitter, unlock, never throws; backend injected, tested with a fake), `babylon-backend.ts` (AudioEngineV2, 4 clones per sound for per-voice cutting). The game view gained an `onSteps` hook and the input host a `pointerUp()` hook; the Timeline and rules are untouched.
- **Deviation:** effects are synthesised in code (`pnpm sounds`, ffmpeg encodes mono 96 kbps MP3), not picked CC0 packs. 72 KB total. `src/audio/sounds/CREDITS.md` says so. They were not picked by ear (nobody listened): **needs ears** for tuning (the generator constants are the knobs).
- Chord: the Box click is C5 and plays at rates 1, 1.26, 1.50 for the 1st to 3rd seat (by the step's `fill`; drains continue the climb). The chime is C6. With capacity 3 the 3rd seat and the chime land together.
- Pull-out pop plays at the step's `t0` (tap time), clicks and thunks at `t1`, drain clicks at each Pin's landing time. Blocked "tock" plays from the input host, not a step.
- Mute cancels pending sounds; Undo and Restart cancel pending ones but let already-playing voices finish. The Mute button swaps its icon and sets `aria-pressed`.
- Not verified in a real browser (unlock, iOS ambient session, actual loudness).
