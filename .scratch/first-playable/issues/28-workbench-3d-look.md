# 28: Workbench 3D look: shading and Pins

**What to build:** The car and Pins look like the Workbench style. The car has toon shading and soft bevels, and the Pins are bright pan-head screws with ink outlines and a recessed cross. A threaded shank shows as a Pin unscrews. See [spec](../spec.md): Visual style; UI visual style ticket (17).

**Blocked by:** 23 (Wooden-toy car and frozen Level).

**Status:** ready-for-agent

- [x] 3-band toon shading (`CellMaterial` or an own ramp in a material plugin), with no raw GLSL.
- [x] Ink outlines on Pins only (car, Box and Buffer Pins). Parts and HUD objects get none.
- [x] Renderer-side bevels: rounded boxes use min(0.07, 0.45 × smallest side) unless the shape sets `round`. Cylinders get a lathed rounded edge, min(0.06, 0.2 × diameter, 0.45 × height). The Model data is unchanged.
- [x] Pins are one instanced mesh with per-instance colour and per-instance Head-mark atlas index. Pan head: diameter 0.24, rim 0.03, quarter-round dome to about 0.076.
- [x] The Head-mark atlas is drawn in-house. This ticket needs only the cross; ticket 30 adds the drives. It's sampled by the head disc only, through a material plugin. The recess has a wall at colour × 0.3 and a floor at colour × 0.5, shifted.
- [x] The threaded shank is drawn only during pop-out.
- [x] 4× MSAA with device pixel ratio capped at about 2.
- [x] The NullEngine smoke test still passes.

## Implementation notes and deviations

- Headless-tested: bevel formulas, pan-head and outline and shank geometry, atlas pixels, toon bands, render-quality helpers, and (NullEngine) one instanced head mesh, outlines on Pins only, shank only on pop-out. **Needs eyes on a real GPU** (shaders can't compile under NullEngine): the toon plugin, the Head-mark recess look (floor shift direction), outline thickness, and 4x MSAA.
- Toon is an own ramp in a `StandardMaterial` plugin (`src/render/toon.ts`), not `CellMaterial`. Bands: x0.58 / x0.8 / x1.0 at light 0 / 0.5 / 0.85. The plugins do use small GLSL snippets (the only way to hook a plugin), but no raw `ShaderMaterial`.
- "One instanced mesh" is Babylon `InstancedMesh` instances of one head template (with `registerInstancedBuffer` for colour and mark index), not thin instances: Pins need per-instance parenting to moving Parts and enable/disable. Each head carries two child instances: an inverted-hull ink outline and the shank.
- Added `GameView.popOut(pin, length | null)` for the Timeline (ticket 25) to show the shank while a Pin lifts.
- Pin picking: the pick predicate now also requires `isVisible` and `isPickable` (Babylon skips those checks when a predicate is given), so outlines and shanks are never hit.
- The atlas has 8 cells, only the cross filled; it is not mipmapped. Ticket 30 fills the other cells.
- MSAA: 4x comes from the WebGL context's `antialias: true` (browser decides the sample count); the DPR cap is `hardwareScalingFor` in `render-quality.ts`.

