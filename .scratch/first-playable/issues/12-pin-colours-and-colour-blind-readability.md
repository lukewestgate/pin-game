# Pin colours and colour-blind readability

Type: prototype
Status: open
Parent: ../map.md
Blocked by: 02, 07

## Question

Which 5 Pin hues does the car level use, and how do players who can't tell some of them apart still sort Pins? Specifically:

- Which 5 saturated hues read clearly against the neutral car body (cream, greys) under the toon shading from Achieving the clean cartoon look on mobile web, and stay distinct under simulated protanopia, deuteranopia and tritanopia?
- Is colour alone enough, or does each colour also get a second cue? Candidates are a shape on the Pin head, a pattern or symbol, or a symbol only on the Box and Buffer slot. Since every Pin uses the same instanced shape (How Models and Parts are built), a cue on the Pin must work with instancing, for example through a per-instance texture index.
- Is the cue always on, or a setting?
- Colour count is a hardness slider in the vision's Endless mode, and the solver research found the Buffer starts to matter at about 8 colours. How far past 5 must the palette extend while staying readable?

A rough Babylon prototype showing the car's Pins, the Box row and the Buffer in each candidate palette, with a colour-blind simulation toggle.
