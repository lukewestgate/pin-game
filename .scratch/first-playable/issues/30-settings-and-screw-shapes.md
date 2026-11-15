# 30: Settings sheet and colour-blind Screw shapes

**What to build:** The player opens a settings sheet from the bottom bar and can turn on "Screw shapes (colour-blind help)". Each Pin colour then gets its own drive recess (cross, slot, hex, Torx, square, triangle) on the car, in the Boxes and in the Buffer, and empty Box holes show their colour's drive faintly. It switches mid-Level with no reload, and the choice is remembered. See [spec](../spec.md): Settings, Visual style; Pin colours ticket (12).

**Blocked by:** 28 (Workbench 3D look), 29 (Workbench HUD look).

**Status:** ready-for-agent

- [ ] A small settings store interface (load/get/set), backed by `localStorage`, holding `sound` (default on) and `screwShapes` (default off). It falls back to memory if storage is unavailable. Tested headless with a fake storage.
- [ ] The settings sheet opens above the Settings button with two switches, "Sound" and "Screw shapes (colour-blind help)", and has room for more.
- [ ] The Head-mark atlas gains the six drives in palette order. With the setting on, the per-instance index selects the colour's drive; off gives the cross on every Pin. Switching changes only atlas indices, with no rebuild.
- [ ] With the setting on, empty Box holes show the drive faintly (black at about 25%).
- [ ] The setting survives a reload.
