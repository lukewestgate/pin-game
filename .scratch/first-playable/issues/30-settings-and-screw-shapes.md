# 30: Settings sheet and colour-blind Screw shapes

**What to build:** The player opens a settings sheet from the bottom bar and can turn on "Screw shapes (colour-blind help)". Each Pin colour then gets its own drive recess (cross, slot, hex, Torx, square, triangle) on the car, in the Boxes and in the Buffer, and empty Box holes show their colour's drive faintly. It switches mid-Level with no reload, and the choice is remembered. See [spec](../spec.md): Settings, Visual style; Pin colours ticket (12).

**Blocked by:** 28 (Workbench 3D look), 29 (Workbench HUD look).

**Status:** ready-for-agent

- [x] A small settings store interface (load/get/set), backed by `localStorage`, holding `sound` (default on) and `screwShapes` (default off). It falls back to memory if storage is unavailable. Tested headless with a fake storage.
- [x] The settings sheet opens above the Settings button with two switches, "Sound" and "Screw shapes (colour-blind help)", and has room for more.
- [x] The Head-mark atlas gains the six drives in palette order. With the setting on, the per-instance index selects the colour's drive; off gives the cross on every Pin. Switching changes only atlas indices, with no rebuild.
- [x] With the setting on, empty Box holes show the drive faintly (black at about 25%).
- [x] The setting survives a reload.

## Implementation notes and deviations

- Settings store: `src/settings/store.ts` (get/set plus `subscribe`, which the checklist did not list). Tested headless with a fake and a throwing storage. The store keeps one JSON blob under `pin-game:settings`.
- The Sound switch writes `sound` to the store, but the bar's Mute button is still inert (ticket 31), so the two are not yet linked and nothing plays or mutes.
- Drives are in `head-mark-atlas.ts` (cell = colour index; `markIndexFor` wraps colours past the sixth, since the game uses five). The pin factory tracks every live head's colour, so `setScrewShapes` rewrites only `markIndex` buffers.
- Empty Box holes: one quad per hole (`box-N-mark-I`), drawn from a second black-at-25% texture made from the same atlas; they are enabled or disabled by the setting and hidden behind seated Pins. Quads are built for every hole of a coloured Box, not only empty ones.
- The sheet closes on a second Settings tap or a canvas press. **Needs eyes on a real GPU/browser**: drive shapes and legibility at Pin size, the faint hole marks (UV orientation), and the sheet position.
