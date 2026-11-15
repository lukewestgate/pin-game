# Pin colours and colour-blind readability

Type: prototype
Status: resolved
Parent: ../map.md
Blocked by: 02, 07

## Question

Which 5 Pin hues does the car level use, and how do players who can't tell some of them apart still sort Pins? Specifically:

- Which 5 saturated hues read clearly against the neutral car body (cream, greys) under the toon shading from Achieving the clean cartoon look on mobile web, and stay distinct under simulated protanopia, deuteranopia and tritanopia?
- Is colour alone enough, or does each colour also get a second cue? Candidates are a shape on the Pin head, a pattern or symbol, or a symbol only on the Box and Buffer slot. Since every Pin uses the same instanced shape (How Models and Parts are built), a cue on the Pin must work with instancing, for example through a per-instance texture index.
- Is the cue always on, or a setting?
- Colour count is a hardness slider in the vision's Endless mode, and the solver research found the Buffer starts to matter at about 8 colours. How far past 5 must the palette extend while staying readable?

A rough Babylon prototype showing the car's Pins, the Box row and the Buffer in each candidate palette, with a colour-blind simulation toggle.

## Answer

Resolved with the human on 2026-11-15. Prototype: [pin-colours.prototype.html](../prototypes/pin-colours.prototype.html), palette **Candy**, variant **E**, with variant **F** as the colour-blind setting. Scoring script: [pin-palette-check.cjs](../prototypes/pin-palette-check.cjs). Glossary: added **Head mark**.

**Palette: Candy.** The human wanted the Pins to match their inspiration (Screwdom 3D) as closely as possible. Candy has its bright, saturated toy-colour quality, with original hex values that weren't sampled from that game. The order matters: a level with *n* colours uses the first *n*.

| # | Name | Hex |
|---|---|---|
| 1 | red | `#ff3b47` |
| 2 | yellow | `#ffd60a` |
| 3 | green | `#3ccf4e` |
| 4 | blue | `#2f6bff` |
| 5 | pink | `#ff6fc8` |
| 6 | orange | `#ff9419` |
| 7 | purple | `#9b4dff` |
| 8 | cyan | `#1ec8ef` |
| 9 | white | `#ffffff` |
| 10 | black | `#1b1b22` |

- The car level's 5 colours are red, yellow, green, blue and pink. Pink takes purple's place in the first five because blue and purple merge for red-green colour-blind players (1.6 apart).
- The palette is a developer constant, like the other numbers, and lives with the content.

**How far apart the colours are.** These are the smallest OKLab distances ×100 between any two colours in play. Machado 2009 simulations, severity 1.0. Rough guide: about 12 or more reads clearly, 7–12 makes you look twice, and under 7 gets confused.

| Colours | Normal | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|
| 5 | 16.8 red/pink | 7.8 yellow/green | 8.0 red/green | 12.8 red/pink |
| 6 | 15.9 yellow/orange | 7.8 | 5.3 green/orange | 4.5 pink/orange |
| 7–10 | 14.7 blue/purple | 1.6 blue/purple | 2.7 blue/purple | 4.5 |

- **Normal vision:** Candy stays readable up to 10 colours, so it covers the Endless colour-count slider.
- **Colour-blind players:** colour alone is marginal at 5 colours and fails from 6–7, which is what the colour-blind setting is for.
- **Against the car body:** the closest Pin-to-body pair is yellow on cream (14.5) with normal vision. With deuteranopia it is pink on the grey interior (5.3); the outline and head mark help there.
- **Other palettes we tried:**
  - A score-led palette (red, yellow, sky, blue, black) reached 18.4 even for colour-blind players. It was set aside for the look.
  - No set of five fully saturated hues in the pool scored above 3.4 across all three kinds of colour blindness.

**Second cue: a Head mark on every Pin.**
- **Default (variant E):** every Pin head shows the same cross recess, drawn in the Pin's colour × 0.42. It is decoration that makes Pins read as screws. Sorting is by colour alone.
- **Colour-blind setting (variant F), off by default:** each colour gets its own drive recess, in palette order: cross, slot, hex socket, Torx (six-point star), square and triangle. The screw look then doubles as the cue. Empty Box slots show their colour's recess faintly. Box and Buffer Pins show it like car Pins.
- **Only 6 drive types**, so colours 7–10 repeat a drive. That only matters in Endless (vision only). A 7th to 10th recess shape gets decided when Endless is built.
- **Rejected:**
  - Arbitrary symbols (B): they look busy and don't fit the theme.
  - A different head shape per colour (C): it costs one instanced mesh per shape and has only 6 shapes.
  - Symbols only in the Box row and Buffer (D): they don't help choose what to tap.
  - Colour only with no mark (A): the human wants the screw look.
- **Settings store:** where the setting is kept, and how the player reaches it, is left to the spec. The first playable has no settings screen yet. A local setting behind an interface like the progress store in Vision of the final game is the obvious fit.

**Rendering.**
- Head marks are textures in one atlas: the cross plus six drives, drawn in-house as simple filled paths. Pins stay one instanced mesh, with a per-instance colour and a per-instance atlas index.
- Only the head disc samples the atlas. The prototype uses a separate decal disc on each Pin. The real build folds the mark into the Pin's material, for example through a Babylon material plugin reading the instance attributes.
- Setting on vs off changes only the atlas index, so it can be switched mid-level with no rebuild.

**Handed on.**
- [UI visual style](17-ui-visual-style.md) gets:
  - The Pin head's form. The reference's heads are wider, flatter, slightly domed discs, where ours are a tapered cylinder.
  - Box tints and UI colour roles built from Candy.
  - Lambert or cel shading. This ticket didn't decide it.
