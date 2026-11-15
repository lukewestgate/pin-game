# 31: Sound effects and mute

**What to build:** The game has small, soft sound effects in step with what the player sees, and no music. Pins pop, click into Boxes and thunk into the Buffer. Seating Pins climb a chord that the Box-close chime completes. Parts clatter, Blocked taps "tock", and win and lose each have a short sting. A Mute button silences everything and is remembered. If audio fails, the game plays exactly the same. See [spec](../spec.md): Sound; Sound ticket (16).

**Blocked by:** 25 (Timeline and overlapping animations), 30 (Settings sheet and Screw shapes).

**Status:** ready-for-agent

- [ ] Babylon AudioEngineV2 with `disableDefaultUI`, keeping its re-unlock. `unlockAsync()` is called on the first `pointerup` (including a drag's end). Sounds before the unlock are dropped. `navigator.audioSession.type = 'ambient'` is set where supported.
- [ ] The audio module subscribes to scheduled Timeline steps and plays at step start times (pull-out at tap time). It stays out of the rules and Timeline modules.
- [ ] The step → sound map follows the spec (slide-in, gap closing, Undo and Restart silent; no near-full warning).
- [ ] Voice cap of about 4 per sound (the oldest is cut), about ±4% pitch and slight volume jitter. The 1st, 2nd and 3rd seat in a Box climb a chord that the close chime completes, reset per Box. All values are constants.
- [ ] Undo and Restart cancel pending sounds.
- [ ] The Mute button in the bar and the sheet's Sound switch are the same setting in the settings store.
- [ ] CC0 effects only, as mono MP3 at about 96 kbps, about 200 KB total, decoded once at load, with a credits file listing sources. Files are picked by ear.
- [ ] With audio unavailable or failing to unlock, nothing else changes and nothing throws.
