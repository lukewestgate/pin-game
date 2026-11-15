# 28: Workbench 3D look: shading and Pins

**What to build:** The car and Pins look like the Workbench style. The car has toon shading and soft bevels, and the Pins are bright pan-head screws with ink outlines and a recessed cross. A threaded shank shows as a Pin unscrews. See [spec](../spec.md): Visual style; UI visual style ticket (17).

**Blocked by:** 23 (Wooden-toy car and frozen Level).

**Status:** ready-for-agent

- [ ] 3-band toon shading (`CellMaterial` or an own ramp in a material plugin), with no raw GLSL.
- [ ] Ink outlines on Pins only (car, Box and Buffer Pins). Parts and HUD objects get none.
- [ ] Renderer-side bevels: rounded boxes use min(0.07, 0.45 × smallest side) unless the shape sets `round`. Cylinders get a lathed rounded edge, min(0.06, 0.2 × diameter, 0.45 × height). The Model data is unchanged.
- [ ] Pins are one instanced mesh with per-instance colour and per-instance Head-mark atlas index. Pan head: diameter 0.24, rim 0.03, quarter-round dome to about 0.076.
- [ ] The Head-mark atlas is drawn in-house. This ticket needs only the cross; ticket 30 adds the drives. It's sampled by the head disc only, through a material plugin. The recess has a wall at colour × 0.3 and a floor at colour × 0.5, shifted.
- [ ] The threaded shank is drawn only during pop-out.
- [ ] 4× MSAA with device pixel ratio capped at about 2.
- [ ] The NullEngine smoke test still passes.
