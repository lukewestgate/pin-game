# 29: Workbench HUD look: Boxes, Buffer, banners

**What to build:** The HUD looks like painted tin trays on a dark slate workbench: tinted tin Boxes with dark holes, and a rubber-mat Buffer that warns with amber rings at 2 slots left and a red pulse at 1. Rounded Baloo 2 type and teal pill buttons. Win and lose ribbons slide in over a dimmed scene. See [spec](../spec.md): Visual style; UI visual style ticket (17).

**Blocked by:** 24 (Layout and HUD reflow), 25 (Timeline and overlapping animations).

**Status:** ready-for-agent

- [ ] Boxes are solid tins (colour × 0.92) with 12 px corners, a 3 px front bevel and 14 px depth. Holes are recesses (colour × 0.42) at 0.9 of the slot, with an upper inner shadow and a 35%-white lip. Grey Boxes for "no qualifying colour" are drawn too.
- [ ] The Buffer is a `#1b272d` mat with 10 px corners and 8 px depth, and `#0f1a1f` slots. The warning is a pure function of Buffer count: 2 left → amber `#ffb020` rings on empty slots; 1 left → that slot also pulses red `#ff3b47` (about 0.9 s, opacity 0.25 → 1, scale 1 → 1.08).
- [ ] The background is a CSS radial vignette behind a transparent canvas (`alpha: true`, `premultipliedAlpha: false`, clear alpha 0), filling the letterbox and safe areas.
- [ ] Baloo 2 at weights 600 and 800 is self-hosted via `@fontsource/baloo-2` (Latin woff2), with no font CDN.
- [ ] Bottom bar: dev Undo (yellow pill with a `DEV` tag, 104), a gap, Settings (48), Mute (48) and Restart (112), 6 apart, fitting 360 px. Teal pills `#13a3c4` / `#0b6f86` press down 3 px. Icons are in-house inline SVG (restart, undo, sound on, sound off, colour-blind, settings). Settings and Mute may be inert until tickets 30 and 31.
- [ ] Win and lose: dim `#0008`, a full-width ribbon sliding in from the left with overshoot (about 0.5 s) and a stitch line. Win is gold "CAR STRIPPED!" with sparkles; lose is slate "OUT OF ROOM". Each has one green Play again or Try again button that restarts the Level, and appears after the Timeline's beat.
- [ ] White-on-teal and white-on-slate pass WCAG AA for large text.
