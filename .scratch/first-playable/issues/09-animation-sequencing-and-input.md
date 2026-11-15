# Animation sequencing and input during animations

Type: prototype
Status: resolved
Parent: ../map.md
Blocked by: 06

## Question

How do the event animations from one tap (`pinToBox` / `pinToBuffer`, `boxClosed`, `boxOpened`, `bufferDrained`, `partFell`, `won` / `lost`) play out in time, and what can the player do while they play? Specifically:

- Do events play strictly in sequence or overlap (for example, does a Box close while the Pin is still flying)?
- How long does each one take, and how are drained Buffer Pins staggered?
- Can the player tap the next Pin before the previous chain finishes? Does the rules state run ahead of the animation, or are taps queued or locked?
- How does undo interrupt an animation that's playing?

Rough Babylon prototype, built on the event list from Tech stack, so the feel can be judged in a browser.

## Assets

- [animation-sequencing.prototype.html](../prototypes/animation-sequencing.prototype.html): open it in a browser (loads Babylon from its CDN). It has a pure `Rules` port with structured events, a pure `Timeline` scheduler, and switchable sequencing and tap modes, timings and walkthroughs.

## Answer

Resolved with the human on 2026-11-15 (prototype). The deciding requirement is that **tapping Pins quickly never slows the player down**, so animations overlap. The other defaults in the prototype were accepted as they are.

- **Taps are played at once.** Every tap goes to the rules immediately (`tap()` as in Tech stack) and is never ignored or queued. The rules state runs ahead of the screen, and only the animations wait.
  - Ignored taps were rejected because they drop a fast player's taps, so the tap order falls apart.
  - Queued taps were rejected because a Pin freed by a tap still in the queue counts as Blocked, so tapping it does nothing.
- **Animations overlap.** Each step waits only for the Box slot or Buffer it touches, not for the whole previous chain. This is scheduled by a pure `Timeline.schedule(events, now, tracks, opts) → { steps, tracks }`, where tracks record when each Box slot and the Buffer are free again. It is a pure module (no Babylon, no DOM) in or beside `src/render`, so it can be unit-tested headless.
  - The Pin pulls out of its Socket the moment it is tapped, so every tap is answered visibly.
  - Its flight is timed to land the moment its target is settled. A Pin heading for a Box that is closing hovers until the next Box has slid in.
  - A Part falls as soon as its last Pin is out, while that Pin is still flying.
  - Box close, then slide-in of the next Box, then the Buffer drain run in order per slot.
  - Drained Pins leave in a ripple (stagger), then the Buffer closes its gaps. The Buffer is a single serial track.
  - Won and lost banners wait until everything has settled.
  - In the prototype, 30 taps 160 ms apart finish animating about 2–3 s after the last tap, against about 28 s when played one after another.
- **Default timings (ms):** developer constants plus one speed multiplier.

  | Step | ms |
  |---|---|
  | Pin pull-out | 110 |
  | Pin flight | 380 |
  | Part falls away | 550 |
  | Box close | 340 |
  | Next Box slides in | 300 |
  | Buffer Pin flight to Box | 320 |
  | Drain stagger | 90 |
  | Buffer closes gaps | 160 |
  | Beat before win/lose | 250 |

- **Blocked is judged on the rules state.** It runs ahead, so a Pin is tappable as soon as its covering Part has lost its last Pin, even while that Part is still visibly falling. Tapping a Blocked Pin plays a wiggle and changes nothing.
- **Undo snaps.** It cancels every running animation, resets the tracks and redraws the previous state at once. This is acceptable because undo is a debug tool. Rendering therefore needs a "draw this state from scratch" path; Pins already in a Box are drawn as stand-ins.
- **Evidence:** the prototype linked above. Its `Rules` and `Timeline` script blocks are the parts worth lifting. A headless NullEngine smoke test confirmed that the screen matches the rules after settling in every mode, including after undo.
