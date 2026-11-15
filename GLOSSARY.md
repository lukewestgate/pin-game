# Pin Game

A puzzle game where the player takes apart a 3D Model by removing its coloured Pins and sorting them into Boxes of the matching colour.

## Language

### Sorting

**Pin**:
A coloured peg sitting in a Socket on the Model, which the player removes by clicking it. Each Pin holds exactly one Part.
_Avoid_: Peg, screw, bolt

**Head mark**:
The recess drawn on a Pin's head. By default it is the same cross on every Pin, as decoration. With the colour-blind setting on, each colour has its own drive shape (cross, slot, hex, Torx, square, triangle), so Pins can be sorted without colour.
_Avoid_: Screw head, symbol, icon

**Box**:
A holder at the top of the screen with one colour and a fixed Capacity. It closes when full, and a new Box replaces it.
_Avoid_: Colour group, slot, bin

**Capacity**:
The number of Pins a Box holds before it closes (default 3).

**Buffer**:
The row of overflow slots (default 5) that holds removed Pins with no matching open Box. When a matching Box appears, the Pins drain into it. The level is lost the moment a Pin fills the last slot.
_Avoid_: Temp buffer, holding area, tray

### Level

**Level**:
One Model plus a colour for every Socket, a seed, and any overrides of the rule numbers. The same Model can appear in many Levels.
_Avoid_: Stage, puzzle

**Model**:
The whole object that a Level takes apart, built from Parts. It has no Pin colours of its own.
_Avoid_: Object, level object

**Part**:
One piece of a Model, such as a wheel, axle, panel or seat. It falls away once all the Pins holding it are removed, which can reveal the Parts and Pins behind it.
_Avoid_: Layer, panel (as a general term), piece

**Socket**:
A place on a Part where a Pin sits, with a position and a direction the Pin pulls out along. A Level gives each Socket a colour, which makes it a Pin.
_Avoid_: Pin slot, hole, mount

**Core**:
A Part with no Sockets. It never falls away, so it must not cover any Socket.
_Avoid_: Base, chassis (as a general term)

**Blocked**:
A Pin is Blocked while any Part covering it has not yet fallen away. A Blocked Pin cannot be removed.
_Avoid_: Locked, hidden, covered (as a state name)

**Peek**:
Pressing and holding on a Part to see it transparently, showing the Pins beneath so the player can plan ahead.
_Avoid_: X-ray, preview

**Random-tap win rate**:
The share of games won by tapping a random removable Pin each turn. The working measure of how easy a Level is.
_Avoid_: Win rate (alone), difficulty score

### Game (future: not in the first version)

**Campaign**:
The main ordered sequence of hand-made Levels, which gently gets harder.
_Avoid_: Story, world, saga

**Pack**:
An optional themed sequence of Levels, played apart from the Campaign.
_Avoid_: Chapter, world, collection

**Booster**:
A one-off player action that bends the rules for a single Level, such as adding a Buffer slot.
_Avoid_: Power-up, item, cheat

**Endless mode**:
Play on Levels generated on the device from rule numbers the player chooses.
_Avoid_: Procedural mode, infinite mode
