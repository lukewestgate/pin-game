# Sound in the first version

Type: grilling
Status: open
Parent: ../map.md
Blocked by: 09

## Question

Does the first playable have sound, and if so, how much? The map calls it nice to have. The vision says the final game has sound. Specifically:

- In or out of the first version? If out, rule it out of scope here and only keep a hook open: the `Timeline` steps from Animation sequencing and input during animations are the natural trigger points.
- If in, which steps make a sound: Pin pull-out, Pin landing in a Box or the Buffer, Box close, Part falling away, the Blocked wiggle, win and lose? How are sounds limited when rapid taps make many steps overlap (a voice limit, or pitch going up through a chain)?
- Where do the sounds come from: a CC0 pack (for example Kenney), sounds synthesised in code with Web Audio (jsfxr style), or recorded by hand? What licence and size budget apply?
- Is there a mute toggle, and is it remembered between visits (there is no progress store in the first version)?
- Babylon's audio engine or plain Web Audio, and how it unlocks on first touch on iOS (see PWA facts for Vite and iOS)?
