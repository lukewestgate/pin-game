# Research: the clean cartoon look on mobile web

Ticket: [`../issues/02-clean-cartoon-look-on-mobile.md`](../issues/02-clean-cartoon-look-on-mobile.md)
Date: 2026-11-15. Sources are official docs and engine source (three.js `dev`, Babylon.js `master`, Godot `stable` docs) unless noted otherwise.

The question: how to render a low-detail cartoon **Model** (for example a car built from **Parts** with coloured **Pins**) so round things look truly round, using only simple coloured materials, cheaply enough for a phone browser. It also asks how **Peek** transparency fits in.

---

## 1. Making round things look round

A curved surface can show facets in two separate ways. They need separate fixes:

1. **Shading facets** (flat bands of light across a surface). Smooth vertex normals fix these.
2. **Silhouette facets** (a polygonal outline, for example a hexagonal wheel rim). Normals do nothing here. Only more segments along the curve, or a non-mesh shape, fix these.

### 1a. Smooth vertex normals (fixes shading facets)

- three.js `computeVertexNormals()`: "For indexed geometries, the method sets each vertex normal to be the average of the face normals of the faces that share that vertex. For non-indexed geometries ... the same as the face normal" (flat). So geometry must be **indexed / vertex-merged** to shade smoothly. https://threejs.org/docs/pages/BufferGeometry.html
- `BufferGeometryUtils.mergeVertices(geometry, tolerance = 1e-4)` merges duplicate vertices, and `toCreasedNormals(geometry, creaseAngle = Math.PI/3)` gives "smooth normals everywhere except faces that meet at an angle greater than the crease angle" (default 60°). This keeps hard edges on things like a car body while wheels stay smooth. https://github.com/mrdoob/three.js/blob/dev/examples/jsm/utils/BufferGeometryUtils.js
- glTF: "When normals are not specified, client implementations MUST calculate flat normals." So an asset exported from Blender without normals will **always look faceted** in every engine. Export with normals, using Shade Smooth or a crease angle in Blender. https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html (section 3.7.2.1)
- Blender notes that Subdivision Surface "is a different operation than its companion, Smooth Shading". https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/subdivision_surface.html

### 1b. Segment counts (fixes silhouette facets)

Engine defaults, for reference:
- three.js `SphereGeometry`: `widthSegments = 32`, `heightSegments = 16`. That gives about 32×14×2 + 2×32 = **960 triangles**. https://threejs.org/docs/pages/SphereGeometry.html
- A 32-segment capped cylinder is about **128 triangles** (32×2 for the sides + 32×2 for the caps). This is arithmetic from the same parameter scheme.

How many segments make a silhouette look round depends on **on-screen radius in physical pixels**, not world size. A regular n-gon inscribed in a circle of radius R deviates from the true circle by the sagitta `s = R(1 − cos(π/n))`. This is standard geometry, worked out here rather than taken from a source. If you require s ≤ 0.5 px (sub-pixel, so invisible once antialiased):

| On-screen radius (physical px) | Min segments for ≤0.5 px error | Error with 32 segs | Error with 16 segs |
|---|---|---|---|
| 20 (a Pin head) | 15 | 0.10 px | 0.38 px |
| 40 | 20 | 0.19 px | 0.77 px |
| 60 | 25 | 0.29 px | 1.15 px |
| 100 (a wheel, zoomed) | 32 | 0.48 px | 1.92 px |
| 150 | 39 | 0.72 px | 2.88 px |
| 250 (wheel at full zoom) | 50 | 1.20 px | 4.80 px |

Takeaways:
- **32 radial segments** is a sensible default for wheels and tyres up to about 100 px radius.
- Pin heads at about 20 px need only **12–16 segments**.
- Pinch-zoom is the case to budget for. A wheel at full zoom on a 3× phone can reach a few hundred physical pixels, which calls for **48–64 segments**. The alternative is to cap the zoom.
- Capping devicePixelRatio (section 5) also shrinks R, so it lowers the segments needed.

### 1c. Subdivision surfaces

Blender's Subdivision Surface (Catmull-Clark, via OpenSubdiv) "enables you to create complex smooth surfaces while modeling simple, low-vertex meshes". It warns that higher levels mean more vertices and memory. https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/subdivision_surface.html

Each Catmull-Clark level splits every quad into 4, so face count grows ×4 per level. A 500-quad cage becomes 2k / 8k / 32k quads at levels 1 / 2 / 3. In practice subdivision is an **authoring tool**: model a low cage in Blender, apply level 1–2 (or bake to the target segment counts above), and export the result. None of the engines researched offers runtime subdivision as a standard material feature for WebGL. Subdividing at runtime would buy nothing for static Parts anyway.

### 1d. Analytic / SDF shapes

Signed distance fields give mathematically exact spheres, capsules, rounded boxes, tori and revolved 2D profiles, with no facets at any zoom. Inigo Quilez's reference lists exact SDF primitives and shows that revolving or extruding a 2D SDF "produces the correct SDF and is also faster to compute" than 3D booleans. https://iquilezles.org/articles/distfunctions/

Costs and trade-offs. These follow from how raymarching works and are not stated in a single source:
- Each covered pixel runs a loop of SDF evaluations, so cost scales with pixels × steps, and Model complexity multiplies it. That is the wrong cost shape for a high-DPI phone.
- Engine picking (three.js `Raycaster`, Babylon `scene.pick`) works on triangles. Tapping a Pin would need custom ray–SDF intersection.
- Engine transparency sorting, shadows and outlines don't apply automatically.

A middle ground is **analytic impostors**: a quad or low-poly proxy whose fragment shader computes an exact sphere or cylinder surface and depth. That suits only the simplest primitives, such as round Pin heads. The research found no engine-built-in version of this in three.js or Babylon.

---

## 2. Triangle and draw-call budgets for a car-sized Model

No WebGL engine documents a phone triangle budget. The closest primary vendor numbers are Meta's for Quest headsets. Those use Qualcomm Adreno mobile GPUs, rendering **stereo at 72 fps+**, which is much harder than one portrait view at 60 fps:

- Triangles per frame: Quest 1 350k–500k, Quest 2 / Pro 750k–1M, Quest 3 / 3S 1.3M–1.8M.
- Draw calls: Quest 2 80–200 ("busy") to 400–600 ("light").

Meta calls these "internally-recommended ranges". https://developers.meta.com/horizon/documentation/unity/unity-perf/

Meta's WebXR guidance stresses that per-draw-call **CPU** cost is what bites in browsers, and recommends batching or instancing. https://developers.meta.com/horizon/documentation/web/webxr-perf-bp/ MDN: "Batching draw calls into fewer, larger draw calls will generally improve performance." https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

Arm (Mali) guidance warns that very small triangles reduce hidden-surface-removal efficiency and add overhead. https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/hidden-surface-graphics-removal-methods-in-mali-gpus Over-tessellating flat panels is waste. Spend triangles only on curves.

Worked estimate for a cartoon car, using the segment counts above:

| Item | Count | Tris each | Total |
|---|---|---|---|
| Body / panels (creased, bevelled low-poly) | ~10 Parts | 200–800 | 2k–8k |
| Tyres (torus-like, 48 × 12) | 4 | ~1,150 | ~4.6k |
| Hubs / axles (32-seg cylinders) | 6 | ~130 | ~0.8k |
| Pins (16 × 8 sphere head + 12-seg shaft) | 30–60 | ~250 | 7.5k–15k |
| **Total** | | | **~15k–30k** |

That is under 5% of Meta's Quest 1 lower bound. Raw triangle count is unlikely to be the limit. The real costs are **fill rate** (devicePixelRatio, overdraw, transparency, post-processing) and **draw calls**: about 60 Pins plus Parts gives about 100 draw calls before outlines. Instancing the Pins (one `InstancedMesh` per Pin shape, colour as an instance attribute) brings that close to the number of Parts.

---

## 3. Materials and lighting

| Option | What it is | Cost | Fit for "simple coloured, cartoony" |
|---|---|---|---|
| Unlit (`MeshBasicMaterial`, Babylon `disableLighting`/emissive, Godot `SHADING_MODE_UNSHADED`) | Flat colour, no light | Cheapest. Godot: "the fastest to render, but it disables all interactions with lights" (https://docs.godotengine.org/en/stable/classes/class_basematerial3d.html) | Shapes read flat. Round things lose their roundness cue unless outlines or a fake rim are added |
| Toon / cel ramp | Light quantised into bands | About as cheap as Lambert | Strong cartoon read. Bands make curvature visible, so smooth normals matter |
| Lambert | Diffuse only | three.js: "performance will be greater ... over MeshPhongMaterial, MeshStandardMaterial or MeshPhysicalMaterial"; uses per-fragment shading (https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshLambertMaterial.js) | Soft, clean, toy-like |
| Matcap | Lighting baked in a sphere texture | One texture lookup, no lights | three.js: "does not respond to lights since the matcap image file encodes baked lighting" (https://threejs.org/docs/pages/MeshMatcapMaterial.html). Very cheap "clay/toy" look; one matcap tinted per colour |
| PBR (`MeshStandardMaterial`, Babylon `PBRMaterial`) | Physically based | Most expensive per pixel; wants an environment map | Overkill for flat colours |

Engine specifics:
- **three.js `MeshToonMaterial`**: "A material implementing toon shading." The `gradientMap` needs `minFilter`/`magFilter = NearestFilter` for hard bands. https://threejs.org/docs/pages/MeshToonMaterial.html
- **Babylon `CellMaterial`** (materials library): `computeHighLevel = true` gives up to 5 lighting levels, `false` gives 2. https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/cellShadingMat
- **Godot `BaseMaterial3D`**: `DIFFUSE_TOON` "uses a hard cut for lighting, with smoothing affected by roughness"; `SPECULAR_TOON` is a "toon blob". https://docs.godotengine.org/en/stable/classes/class_basematerial3d.html

**Shadows.** In three.js shadow maps, "for every light that casts shadows all objects marked to cast shadows are rendered from the point of view of the light". Point-light shadows draw the scene 6 times. The manual suggests one shadowing directional light, or **fake shadows**: a plane with a grayscale blob texture under the object. https://threejs.org/manual/#en/shadows (source: https://github.com/mrdoob/three.js/blob/dev/manual/pages/shadows.html) For a single Model that rotates in place, a blob shadow plus toon, Lambert or matcap shading gives soft grounding at almost no cost.

---

## 4. Outlines

| Technique | How | Cost | Notes |
|---|---|---|---|
| **Inverted hull** | Redraw each mesh with front faces culled, vertices pushed out along normals, flat colour | +1 draw per mesh, vertex-only extra work; no extra render targets | Needs **smooth normals**: with split normals the hull cracks at hard edges. Works with MSAA |
| three.js `OutlineEffect` | Inverted hull for the whole scene. Shader offsets clip-space position along the normal (`pos + norm * thickness * pos.w`), so thickness is roughly constant on screen; `BackSide`; default `defaultThickness = 0.003` | Calls `renderer.render(scene)` then `renderOutline(scene)`, so the scene is drawn **twice** | WebGL only; WebGPU uses `ToonOutlinePassNode`. https://github.com/mrdoob/three.js/blob/dev/examples/jsm/effects/OutlineEffect.js |
| Babylon `mesh.renderOutline` | Per-mesh hull: offsets position by `normal * outlineWidth` (default `0.02`, object units), depth write off, `zOffset`. For **alpha-blended** meshes it first writes the mesh to the **stencil** so the outline doesn't show through the transparent interior | +1 draw per outlined mesh (+1 stencil-only draw if transparent) | Stencil handling suits Peek. https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Rendering/outlineRenderer.pure.ts, https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Shaders/outline.vertex.fx |
| Godot `grow` + `next_pass` | `grow_amount` "grows object vertices in the direction of their normals ... to create mesh-based outlines using a second material pass" with `CULL_FRONT` | +1 draw per mesh | https://docs.godotengine.org/en/stable/classes/class_basematerial3d.html |
| Godot 4.5 stencil outline | `stencil_mode` Outline / X-Ray presets set a next-pass stencil material; `stencil_outline_thickness` default 0.01; marked **Experimental** | Stencil + extra pass | Release: https://godotengine.org/releases/4.5/. Compatibility (web) support was only confirmed in PR discussion, not docs: https://github.com/godotengine/godot-docs/pull/11373 |
| Post-process edge detection (three.js `OutlinePass`) | Render mask + depth of selected objects, then edge-detect and blur | Two extra scene renders + about 8 full-screen quad passes + several `HalfFloat` render targets (`downSampleRatio = 2`) | Built for highlight/selection glow, not a whole-scene ink line. Heavy for mobile fill rate. https://github.com/mrdoob/three.js/blob/dev/examples/jsm/postprocessing/OutlinePass.js |
| Babylon `HighlightLayer` | Glow-style highlight via stencil + blurred render targets | Extra RTs; docs: `mainTextureRatio` / `blurTextureSizeRatio` "the smaller, the faster" | Good for a "selected Part" glow, not ink lines. https://doc.babylonjs.com/features/featuresDeepDive/mesh/highlightLayer |
| GL line primitives (edges renderer, wireframe) | Draw edges as `GL_LINES` | Cheap | Line width is platform-limited; you must query `ALIASED_LINE_WIDTH_RANGE` (https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth). In practice 1 px, which vanishes on a 3× display |
| Fresnel/rim darkening in the material | Darken where `dot(N, V)` is near 0 | Free (same pass) | Soft "outline-ish" edge on round shapes only. Fails on flat panels |

---

## 5. Anti-aliasing and devicePixelRatio

**MSAA**
- three.js: `antialias` "Whether to use the default MSAA or not", default `false`. https://threejs.org/docs/pages/WebGLRenderer.html This applies only to the canvas framebuffer. Render targets have their own `samples` (default `0` = off). Once you add any post-processing (`EffectComposer`), you have to set `samples` on its targets or MSAA is lost. https://github.com/mrdoob/three.js/blob/dev/src/core/RenderTarget.js
- Babylon: `Engine(antialias, ...)` enables canvas MSAA. `DefaultRenderingPipeline.samples` sets MSAA for its targets: "setting this to 4 will provide 4x anti aliasing. (default: 1)". https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.pure.ts
- On tile-based mobile GPUs, Arm says 4× MSAA can be close to free ("typically 1-2 % speed hit") when samples resolve on-tile and are never stored. https://arm-software.github.io/vulkan-sdk/multisampling.html An Arm forum reply notes the cost is content-dependent and higher than it used to be on newer Mali. https://community.arm.com/support-forums/f/graphics-gaming-and-vr-forum/56051/some-questions-about-msaa-on-mali-g77 The browser's default canvas framebuffer is the path most likely to get this on-tile resolve. Off-screen post-processing targets cost more.
- Godot: MSAA is "very effective on geometry edges", medium cost, 2× or 4× recommended. It doesn't help alpha-scissor or specular aliasing. Supported in all renderers, including Compatibility. https://docs.godotengine.org/en/stable/tutorials/3d/3d_antialiasing.html

**FXAA / SMAA (post-process)**
- Godot: FXAA is "very low" cost but adds moderate blur. Godot web export uses the Compatibility renderer, which does **not** support FXAA, SMAA or TAA. https://docs.godotengine.org/en/stable/tutorials/3d/3d_antialiasing.html, https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
- Babylon: `FxaaPostProcess` or `DefaultRenderingPipeline.fxaaEnabled`. https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses
- Any post-process AA needs an extra full-screen pass and render target, which spends the fill rate the phone has least of. For flat-colour cartoon art with hard silhouettes, MSAA on the main framebuffer handles exactly the edges that show.

**devicePixelRatio**
- The three.js manual notes that a 3× phone has "9 pixels" per CSS pixel, "That means they have to do 9x the rendering", and that rendering at 1× is "probably what you want" for heavy apps. It also shows capping the drawing buffer at a max pixel count. https://threejs.org/manual/#en/responsive (source: https://github.com/mrdoob/three.js/blob/dev/manual/pages/responsive.html)
- MDN suggests rendering to a smaller back buffer and upscaling as "a common (and easy) way to trade off quality for speed". For exact sizing it recommends `ResizeObserver` with `device-pixel-content-box`, which avoids moiré from rounding. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- Babylon does **not** match devicePixelRatio by default (`adaptToDeviceRatio = false`, "focuses on performance rather than quality", "can look low-res"). https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene The engine option `limitDeviceRatio` caps it: hardware scaling = `1 / min(limitDeviceRatio, devicePixelRatio)`. `setHardwareScalingLevel(0.5)` renders at twice canvas size. https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Engines/abstractEngine.pure.ts
- MDN also warns that `alpha:false` on the context "can be expensive" on some platforms. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

The common pattern, which combines the sources above: cap DPR at about **1.5–2**, with MSAA 4× on the main framebuffer. At DPR 2 plus MSAA, edges look clean, and rendering costs 44% of native-3× pixel work (4/9). It also lowers the segment counts needed (section 1b).

---

## 6. Peek transparency: sorting and depth

**What engines do**
- three.js sorts transparent objects **per object**, not per triangle. Order is `groupOrder`, then `renderOrder`, then the clip-space z of the object's bounding-sphere centre (back to front). https://github.com/mrdoob/three.js/blob/dev/src/renderers/webgl/WebGLRenderLists.js, https://github.com/mrdoob/three.js/blob/dev/src/renderers/WebGLRenderer.js
- The three.js manual says the same: "for individual triangles sorting would be extremely slow". Its own example is a car: to sort windows correctly "you'd have to make each window its own object". https://threejs.org/manual/#en/transparency (source: https://github.com/mrdoob/three.js/blob/dev/manual/pages/transparency.html)
- three.js `Material.forceSinglePass`: double-sided transparent objects are drawn with "two draw calls (back faces first, then front faces)" by default. `alphaHash` approximates blending with noise "without the associated problems of sorting". https://threejs.org/docs/pages/Material.html
- Babylon sorts alpha-blended meshes "first by alpha index, and then by depth". It offers `needDepthPrePass`, `separateCullingPass` (back then front faces), and beta OIT (`scene.useOrderIndependentTransparency`, WebGL2/WebGPU only, renders transparent meshes multiple times). https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering
- Godot: `TRANSPARENCY_ALPHA` "is the slowest to render". `TRANSPARENCY_ALPHA_DEPTH_PRE_PASS` discards alpha < 0.99 in a depth prepass. `TRANSPARENCY_ALPHA_HASH` is dithered. https://docs.godotengine.org/en/stable/classes/class_basematerial3d.html
- glTF BLEND: "There is no perfect and fast solution that works for all cases." https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html (5.19.9 / 3.9)

**How this maps onto Peek.** The game's own case is unusually easy:
- **Only one Part is transparent at a time.** Every other Part and every Pin stays opaque, and engines draw opaque objects first. So everything *behind* the Peeked Part is already in the colour and depth buffers when it blends, and no inter-object sorting problem exists.
- The remaining problem is **self-overlap inside the Peeked Part**: a curved panel or a closed shape whose back faces sit behind its front faces. Fixes, cheapest first:
  - (a) Single-sided, `depthWrite: false`. Cheapest. Inner faces may show through each other, which may even read as "glassy".
  - (b) A **depth pre-pass** on just that Part: draw it once with colour writes off, then blended. Only the nearest surface shows, as clean as "the Part turned to frosted glass". This is Babylon's `needDepthPrePass`, Godot's `ALPHA_DEPTH_PRE_PASS`, or in three.js a second mesh sharing the geometry with `colorWrite: false` and a lower `renderOrder`.
  - (c) Back-then-front two-pass. three.js does this by default for `DoubleSide` + transparent; Babylon has `separateCullingPass`.
- **Alpha hash / dither** avoids sorting entirely. It looks noisy without TAA, and TAA isn't available on Godot web or as a cheap default in three.js. It clashes with a clean cartoon look.
- **Outlines plus transparency.** An inverted-hull outline drawn behind a transparent Part shows through its interior. Babylon's outline renderer solves this with its stencil step (section 4). In three.js, hide or fade the outline mesh for the Peeked Part, or stencil it.
- **MSAA and alpha-to-coverage.** three.js `alphaToCoverage` needs an MSAA context and smooths alpha-test edges only. https://threejs.org/docs/pages/Material.html It isn't needed for a uniformly faded Part.
- **Picking while Peeking.** Peek never changes game state, and Pins under a Peeked Part are still Blocked. Picking should keep using the Blocked rule from the level data, not "what the ray hits first". That is a game-logic point, noted here because transparency tempts you to let rays pass through.

---

## 7. Godot differences (summary)

- Web export: "Godot 4 can only target WebGL 2.0 (using the Compatibility rendering method)". Safari has WebGL 2 issues. Native mobile exports "perform significantly better". Built-in PWA export option. https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
- Compatibility renderer: MSAA 3D yes; FXAA, SMAA, TAA and custom CompositorEffects no; 8 omni/spot lights per mesh. https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html
- Outline via `grow` + `next_pass` works today. The 4.5 stencil Outline / X-Ray presets are Experimental, and Compatibility support is confirmed only in PR discussion.
- Toon diffuse/specular modes are built into `BaseMaterial3D`. The renderer comparison page doesn't list them as restricted.

---

## Implications for the decision

These are not decisions, only what the evidence points toward:

- **Roundness:** The research points to authored meshes with **smooth/creased normals** (Blender Shade Smooth, export normals) and **about 32 segments on wheels, 12–16 on Pin heads**, with zoom capped so on-screen radii stay in the table's range. SDF or analytic rendering buys perfect curves but costs picking, sorting and outlines. Facets will appear anyway if normals are missing from the glTF.
- **Budget:** A car Model is likely to land around **15k–30k triangles**, far below the closest vendor budgets. Fill rate and draw calls are the real constraints. That favours **instanced Pins**, capped DPR, and few full-screen passes.
- **Look:** The cheap cartoon options are **toon ramp, Lambert or matcap plus a blob shadow**, all of which avoid real-time shadow maps and PBR. Whether shading bands are wanted is an art call. The cost difference is small.
- **Outlines:** On mobile, **inverted hull** (three.js `OutlineEffect`, Babylon `renderOutline`, Godot `grow`) beats post-process edge detection for cost and MSAA compatibility. Babylon's built-in version already handles transparent meshes, which helps Peek.
- **AA:** Canvas **MSAA 4× with DPR capped at about 2** fits flat-colour art and tile-based GPUs. Adding post-processing makes MSAA a manual concern in three.js and Babylon. Godot web has MSAA only.
- **Peek:** One transparent Part over an opaque scene is the easy case. A **per-Part depth pre-pass** (built into Babylon and Godot, two meshes in three.js) gives the cleanest "see-through Part" for one extra draw. Outline handling under Peek needs a deliberate choice.
- **Engine:** Babylon has the most of this built in: depth pre-pass, stencil-aware outlines, DPR limit. three.js needs a few small hand-rolled pieces but is lighter. Godot web is constrained to the Compatibility renderer, with weaker Safari support.
