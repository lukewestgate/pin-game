# Models are built from primitive shapes in JSON, not modelled in Blender

Models are JSON data: each Part is one or more primitive shapes (cylinder, rounded box, torus, capsule, sphere), each with its own transform and body colour, and code builds the meshes at load time. We chose this over Blender → glTF because a future procedural generator can write the same format directly, the loader controls segment counts and smooth normals (so round things stay round), and Sockets and covering live in the same file as the geometry instead of having to survive an export round trip. Models are also kept apart from Levels: a Model has no colours, and a Level gives a colour to every Socket.

## Consequences

- Car bodies are limited to rounded boxes, capsules and the like. That suits the cartoon look, but rules out sculpted shapes for now.
- The Part shape field is a tagged union, so a `{ kind: "mesh", src }` glTF variant can be added later, together with an editor for placing Sockets (see the Vision of the final game ticket), without breaking existing Models.
- Amended by Car level design (2026-11-15): a Part was first a single primitive. It is now a list of one or more shapes, because single primitives couldn't make a seat with a backrest, a steering wheel with a column, or a wheel with a contrasting hub. The Part is still the unit that holds Pins and falls away. The sub-shapes are called "shapes", not "pieces" (the glossary lists *piece* under *Avoid* for Part).
