# Peg Game

A puzzle game where the player takes apart a 3D Model by removing its coloured Pins and sorting them into Boxes of the matching colour.

## Language

### Sorting

**Pin**:
A coloured peg on the Model that the player removes by clicking it.
_Avoid_: Peg, screw, bolt

**Box**:
A holder at the top of the screen with one colour and a fixed Capacity. It closes when full, and a new Box replaces it.
_Avoid_: Colour group, slot, bin

**Capacity**:
The number of Pins a Box holds before it closes (default 3).

**Buffer**:
The row of overflow slots (default 7) that holds removed Pins with no matching open Box. When a matching Box appears, the Pins drain into it. A Pin arriving when the Buffer is full loses the level.
_Avoid_: Temp buffer, holding area, tray

### Level

**Model**:
The whole object that a level takes apart, built from Parts.
_Avoid_: Object, level object

**Part**:
One piece of a Model, such as a wheel, axle, panel or seat. It falls away once all the Pins holding it are removed, which can reveal the Parts and Pins behind it.
_Avoid_: Layer, panel (as a general term), piece
