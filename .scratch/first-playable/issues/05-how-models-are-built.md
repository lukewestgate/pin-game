# How Models and Parts are built

Type: grilling
Status: resolved
Parent: ../map.md
Blocked by: 01, 02

## Question

How should Models be built? Options include: modelled in Blender and exported as glTF, with Parts as named nodes and Pins as empties or markers; assembled in code or data from smooth primitives (cylinders, rounded boxes, tori); or made in a custom in-game editor. It must be generator-friendly (a procedural generator could produce the same format later), give the clean round look, and make the covering relations between Parts and Pins easy to write and check.

## Answer

Resolved with the human on 2026-11-15 (grilling). Recorded in [ADR 0001](../../../docs/adr/0001-models-built-from-primitives-in-data.md), and the glossary gained **Level**, **Socket** and **Core**.

- **Geometry comes from primitives in data.** Each Part is a primitive shape with a transform and a body colour. The shapes are cylinder (optional edge bevel), rounded box, torus, capsule and sphere, each with size and segment parameters; Car level design may add more. Body colours come from a small palette kept apart from the Pin colours. Code builds the meshes, so segment counts and smooth normals are under its control. The shape field is a tagged union, so a `{ kind: "mesh", src }` glTF variant can be added later. There is no custom editor in the first version.
- **Model and Level are separate files.**
  - A **Model** holds Parts, Sockets and covering, and has no colours.
  - A **Level** references a Model by id and gives an explicit colour for every Socket, plus a seed and any overrides to the rule numbers.
  - Levels are always concrete: a future generator writes the same explicit files, so a shipped file is exactly what the solver checked.
  - Validation: every Socket has a colour, and each colour's total is a multiple of Capacity.
- **Format:** JSON with a schema checked at load time. Parts and Sockets have stable string ids that are unique within the Model (`wheel-fl`, `wheel-fl.1`), and the loader turns them into indices for the rules engine and solver.
- **Structure:**
  - Each Pin holds exactly one Part.
  - Parts are a flat list with transforms in Model space and no hierarchy; order comes only from covering.
  - A Socket is a position plus a pull-out direction in its Part's local space.
  - Every Pin uses the same instanced shape and differs only by colour.
  - A Part falls outward from the Model's centre, with an optional per-Part override of that direction.
- **Core:** a Part with no Sockets is a Core. It never falls away, and validation fails if a Core covers any Socket. The prototype's existing checks still apply: no Socket is covered by its own Part, and covering has no loops.
- **Covering:** hand-written `coveredBy` lists of Part ids on each Socket are the source of truth. A dev check casts a ray along each Socket's pull-out axis and warns when the Parts it hits don't match the list.
- **Authoring in the first version:** hand-written JSON plus a dev viewer inside the game, behind a dev flag. It reloads when a file changes, labels Part and Socket ids, highlights the Parts covering a selected Socket, shows the ray warnings, and runs the solver.
- **For the vision:** a Blender import with a custom editor for placing Sockets, added to Vision of the final game.
