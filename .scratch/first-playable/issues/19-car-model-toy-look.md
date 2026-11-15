# Car Model toy look

Type: prototype
Status: resolved
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

## Answer

Resolved with the human on 2026-11-15. The human said "i do like the wooden toy", so **C · Wooden toy** is taken whole, with its Socket positions as built in the prototype (`?car=C`). Its self-check passes: same Part ids, Socket counts and covering as [Car level design](07-car-level-design.md), and every inner Pin's pull-out ray hits its covering Part. So the Level, its seeded deal and the 60–80% random-tap target are unchanged. No glossary changes.

**The look:**
- A grained wood body: a deep tub, a nose, engine-bay sides, a dash, mudguards over all four wheels, and rear quarter panels. These are all Core shapes of `chassis`.
- Darker wood dowels for the four pillars, the two axles, the steering wheel and the two bumpers.
- Wooden hubs inside dark rubber tyres, on the four wheels and the spare.
- Each outer plate is painted its own muted tint, held on by its Pins. Seats and rear seat are pale wood. The engine is painted grey. The headlights are painted cream discs.
- Doors are shorter than before (front edge at x 0.45), and the tailgate's lower Socket moved to (−1.76, 1.45, −0.58) to clear the mudguards. All Socket positions are in the prototype's `SK.sockets`.
- Start view: front three-quarter from slightly above (yaw 0.6, pitch −0.35).

**Car colours** (content constants; they replace the table in [UI visual style](17-ui-visual-style.md)):

| Part of the car | Hex |
|---|---|
| Wood (body, hubs, quarters, mudguards) | `#d9aa78` |
| Dark wood (pillars, axles, bumpers, steering wheel) | `#b8865a` |
| Bonnet (slate) | `#8fa7c4` |
| Roof (rose) | `#d8a3a0` |
| Doors (sage) | `#a7c09a` |
| Tailgate (lilac) | `#b4a5cf` |
| Tyre | `#3a3d45` |
| Interior (pale wood) | `#e8cfa6` |
| Engine | `#9aa0a8` |
| Lights | `#fff3c4` |

The spare wheel uses the tyre and wood colours. The plate tints stay far less saturated than the Candy Pins, so the Pins still carry the colour.

**Model format** (recorded in [ADR 0001](../../../docs/adr/0001-models-built-from-primitives-in-data.md)):
- An optional per-shape **`round`**: the edge radius in Model units, clamped to fit the shape. Without it, the renderer default from UI visual style applies (min(0.07, 0.45 × smallest side) for boxes). The wooden car uses 0.05–0.12.
- An optional per-shape **`finish`**, with one value for now: `"wood"`. It multiplies the body colour by a procedural grain texture drawn in code at load time (no image asset). Rounded boxes get box-projected UVs (by the dominant normal axis, one repeat per 1.2 units). Lathed shapes use their own UVs.
- Both stay plain data, so a generator can still write them.

**Handed on:** whether the grain stays readable at small sizes on a real phone, and its cost, goes on the device checklist. The fallback is the same colours without the texture.

## Comments
