# Sound in the first version

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 09

## Question

Does the first playable have sound, and if so, how much? The map calls it nice to have. The vision says the final game has sound. Specifically:

- In or out of the first version? If out, rule it out of scope here and only keep a hook open: the `Timeline` steps from Animation sequencing and input during animations are the natural trigger points.
- If in, which steps make a sound: Pin pull-out, Pin landing in a Box or the Buffer, Box close, Part falling away, the Blocked wiggle, win and lose? How are sounds limited when rapid taps make many steps overlap (a voice limit, or pitch going up through a chain)?
- Where do the sounds come from: a CC0 pack (for example Kenney), sounds synthesised in code with Web Audio (jsfxr style), or recorded by hand? What licence and size budget apply?
- Is there a mute toggle, and is it remembered between visits (there is no progress store in the first version)?
- Babylon's audio engine or plain Web Audio, and how it unlocks on first touch on iOS (see PWA facts for Vite and iOS)?

## Answer

Resolved with the human on 2026-11-15 (grilling). Sound is **in, but small**: short effects only, no music. It must **fail quietly**: if audio can't unlock or goes silent, the game plays exactly the same.

- **Which steps make a sound** (`Timeline` steps from [Animation sequencing and input during animations](09-animation-sequencing-and-input.md), plus win and lose):

  | Step | Sound |
  |---|---|
  | Pin pull-out | short soft pop or squeak |
  | Pin lands in a Box slot | bright click ("seated") |
  | Pin lands in the Buffer | duller, lower thunk |
  | Box close | short chime or lid snap |
  | Next Box slides in | silent |
  | Buffer Pin flies to Box | the Box-landing click, so a drain ripples as a run of clicks |
  | Buffer closes gaps | silent |
  | Part falls away | light plastic clatter |
  | Blocked wiggle | soft muted "tock", no buzzer |
  | Win | short happy jingle, about 1–2 s |
  | Lose | short gentle descending sting |
  | Undo, Restart | silent |

  There's no warning sound when the Buffer is nearly full, because the screen already shows it.
- **Limiting rapid taps:** a voice cap per sound (about 4 at once; the oldest voice is cut), plus about ±4% random pitch and slight volume changes. The 1st, 2nd and 3rd Pin to seat in a Box play rising steps of a chord, and the Box-close chime completes it. The climb resets per Box, and there's no global combo. All of these values are developer constants.
- **Timing:** sounds play at the `Timeline` step **start times** (screen time, not tap time), so they match what the player sees. Pull-out still sounds the moment of the tap. Undo cancels every scheduled sound that hasn't played yet. The sound module subscribes to the same scheduled steps as rendering, and it stays out of the pure `rules` and `Timeline` modules.
- **Source:** a CC0 pack (for example Kenney's Interface, Impact or UI Audio), only CC0, with a `CREDITS.md` anyway. Files are mono MP3 at about 96 kbps, chosen because it plays everywhere. The total budget is about 200 KB. The files are precached, so `mp3` is added to the `vite-plugin-pwa` glob patterns, and they're decoded once at load. Picking the actual files is done by ear during the build.
- **Mute:** a speaker toggle in the player-facing part of the bottom bar (next to Restart, not in the dev controls). Sound is on by default. The choice is remembered in `localStorage` behind a small **settings store** interface, shaped like the local progress store in the vision. The colour-blind setting from [Pin colours and colour-blind readability](12-pin-colours-and-colour-blind-readability.md) uses the same store. If `localStorage` is unavailable, the toggle still works for the session. [UI visual style](17-ui-visual-style.md) decides how the button looks.
- **Engine and unlock:** Babylon's AudioEngineV2 with `disableDefaultUI`, keeping its re-unlock when the browser suspends audio. Babylon's own listener is on `click`, which a drag doesn't fire, so the input layer calls `unlockAsync()` on the first `pointerup`, including the end of a rotate drag. Sounds before the unlock are dropped, not queued.
- **iOS:** set `navigator.audioSession.type = 'ambient'` where it's supported, so the game mixes with the player's music and should respect the silent switch (unverified). WebKit bug 291892 (silent after returning from the background) is accepted for now. Both go on the manual device checklist from [PWA hosting, caching and updates](15-pwa-hosting-caching-and-updates.md):
  1. With the silent switch on, the game makes no sound. With it off, sounds play over music that's already playing.
  2. Background the Home Screen app and come back. If sound is gone, note it, but there's no workaround unless this happens often.
