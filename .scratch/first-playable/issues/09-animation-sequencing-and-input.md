# Animation sequencing and input during animations

Type: prototype
Status: open
Parent: ../map.md
Blocked by: 06

## Question

How do the event animations from one tap (`pinToBox` / `pinToBuffer`, `boxClosed`, `boxOpened`, `bufferDrained`, `partFell`, `won` / `lost`) play out in time, and what can the player do while they play? Specifically:

- Do events play strictly in sequence or overlap (for example, does a Box close while the Pin is still flying)?
- How long does each one take, and how are drained Buffer Pins staggered?
- Can the player tap the next Pin before the previous chain finishes? Does the rules state run ahead of the animation, or are taps queued or locked?
- How does undo interrupt an animation that's playing?

Rough Babylon prototype, built on the event list from Tech stack, so the feel can be judged in a browser.
