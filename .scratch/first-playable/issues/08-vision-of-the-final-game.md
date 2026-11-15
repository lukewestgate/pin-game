# Vision of the final game

Type: grilling
Status: open
Parent: ../map.md
Blocked by: 05, 06

## Question

What does the final game look like, and what must the first version leave room for? A sequence of Models getting harder (more colours, more Parts, deeper covering), endless procedural levels, level select and saved progress, player undo and boosters, sound, a possible future app-store wrapper, **player-facing hardness sliders** driven by the rule numbers (Boxes, Capacity, Buffer, colours, Pins per colour, next-colour rule), and a Blender import plus a custom editor for placing Sockets (the shape field's glTF mesh variant, see How Models and Parts are built), and possibly a player-visible next-Box preview (which would need the rule to commit to colours in advance, as a queue). Turn this into a short vision section for the spec, listing the extension points the first version's design has to keep open.

Note: Tech stack added two extension points. A later move to Babylon's WebGPU engine (kept cheap by writing no raw GLSL), and pure-TS `rules`/`solver`/`content` modules that a generator or CLI can import headless.
