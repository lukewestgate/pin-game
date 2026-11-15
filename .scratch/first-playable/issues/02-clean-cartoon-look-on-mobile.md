# Achieving the clean cartoon look on mobile web

Type: research
Status: resolved
Parent: ../map.md

## Question

How do you render low-detail cartoon Models where round things look truly round (no visible facets) using only simple coloured materials, cheaply enough for a mobile browser? Cover:
- smooth vertex normals vs subdivision vs analytic or SDF shapes
- triangle budgets for a car-sized Model
- material and lighting choices (unlit or toon/cel ramp vs simple Lambert/PBR with soft shadows, matcaps)
- outline techniques and their cost
- anti-aliasing on mobile (MSAA vs FXAA, device pixel ratio caps)
- how transparency for Peek interacts with these (sorting, depth)

Focus on Three.js and Babylon.js; note anything that differs in Godot.

Findings go in `../research/02-clean-cartoon-look.md`, with sources cited.

## Answer

Full findings: [research/02-clean-cartoon-look.md](../research/02-clean-cartoon-look.md).

- **Roundness** has two causes. Smooth or creased vertex normals fix flat shading bands (always export normals in glTF). Enough segments fix a polygonal outline: about 32 for a wheel up to ~100 px radius on screen, 12–16 for Pin heads, 48–64 for close zoom on a high-density phone. SDF/analytic shapes break picking, transparency sorting and outlines, so avoid them.
- **Budget:** a car is roughly 15k–30k triangles (an estimate), far under mobile limits. The real constraints are fill rate and draw calls, so instance the Pins.
- **Look:** toon ramp, Lambert or matcap shading plus a blob shadow are all cheap. For outlines use an inverted hull (one extra draw per mesh). Avoid three.js `OutlinePass` on phones.
- **Anti-aliasing:** 4× MSAA is nearly free on tile-based mobile GPUs. Cap DPR at about 1.5–2. Post-processing turns MSAA off unless render-target `samples` is set. Godot web has no FXAA, SMAA or TAA.
- **Peek:** one see-through Part over an opaque scene is easy. Use a depth pre-pass on that Part to stop it overlapping itself, and stencil outlines so they don't show through. Babylon has the most built in, three.js needs small hand-built pieces, Godot web is the most constrained.
