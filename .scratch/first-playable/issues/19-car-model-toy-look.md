# Car Model toy look

Type: prototype
Status: claimed
Parent: ../map.md
Blocked by: 07, 17, 18

## Question

The car from [Car level design](07-car-level-design.md) is thin plates on a flat chassis slab. It doesn't yet feel like a Model that could be a level in the inspiration ([Screwdom 3D visual style](18-screwdom-3d-visual-style.md)), whose Models are chunky, friendly toys: soft vinyl, toy bricks, or wooden blocks with coloured plates screwed on. What should the car look like so that it does, inside the settled Workbench screen ([UI visual style](17-ui-visual-style.md))?

Fixed for this question: the Parts, their Socket counts and the covering from Car level design (17 Parts with Sockets, 5 Cores, 30 Pins, each inner Pin behind one Part). So the solver-checked Level and its 60–80% random-tap target still hold. Only shapes, proportions, rounding, Socket positions on the new surfaces, and body colours may change.

## Prototype

[car-model.prototype.html](../prototypes/car-model.prototype.html), switched by `?car=0|A|B|C`, the bottom bar, or ← →. Tap Pins to take the car apart. The panel can remove all outer Parts at once or strip to the Cores, and can switch the shading and backdrop to compare.

- **0 · Current car:** the baseline.
- **A · Vinyl toy:** a moulded toy. Big soft rounding on every shape, fat tyres, capsule pillars and bumpers. Two tones: cream body, apricot plates on the outer Parts. The headlights are round eyes with pupils, so the stripped chassis still has a face at the win.
- **B · Brick-built:** crisp, lightly bevelled blocks in alternating cream and sand bricks, with sage plates. Square hubs, a stepped roof, square lamps, a slatted grille.
- **C · Wooden toy:** grained wood body, dowel pillars, axles and bumpers, wooden hubs in rubber tyres. Each outer Part is painted in its own muted tint: slate bonnet, rose roof, sage doors, lilac tailgate. This is the inspiration's "coloured plates on wooden blocks".

What all three toy takes share, and what changed against the current car:
- A **solid toy body**: a deep tub, mudguards over the wheels, rear quarter panels, thick pillars, and wheels big enough that the tyres sit on the ground. The current car reads as an open frame.
- **Shorter doors** (Sockets now at x −0.35 and 0.22). The **tailgate's lower Socket moved** to clear the mudguards. Every other Socket keeps its role, and they sit on the new surfaces.
- A built-in **self-check**: same Part ids, Socket counts and covering, and each inner Pin's pull-out ray hits its covering Part (the dev warning from [How Models and Parts are built](05-how-models-are-built.md)). It passes for all four cars.
- The **start view** is now a front three-quarter view from slightly above (yaw 0.6, pitch −0.35). The old start view looked up from the rear-left, from below.

**Format implications for whichever take wins** (to record in [ADR 0001](../../../docs/adr/0001-models-built-from-primitives-in-data.md) when resolved):
- An optional per-shape **`round`** (edge radius in Model units). It overrides UI visual style's renderer default of min(0.07, 0.45 × smallest side), which is too small for a toy look. A uses up to 0.2, B uses 0.045.
- C only: an optional per-shape **`finish: "wood"`**, a procedural grain texture drawn in code, with box-projected UVs on rounded boxes.
- The **car colour table** in UI visual style is replaced by the winning take's colours (listed in the prototype's panel).

## Comments
