# Car level design

Type: grilling
Status: open
Parent: ../map.md
Blocked by: 04, 05

## Question

What exactly is the first car Model? Its Parts (wheels, axles, body panels, seats, steering wheel…), which Parts cover which, Pin placement and colours, the colour count, and the difficulty target, all checked against the solver so the level can be won.

Note: see the key finding in Solver approaches for checking that levels can be won. The colour count has to exceed the Box count for the level to be more than trivial. Sorting rules logic prototype set the defaults to 3 Boxes / Capacity 3 / Buffer 5 with the reachable-first next-colour rule. It suggests about 5 colours as the starting point; 4–6 is the interesting range. The prototype's level format and `solve()` can check candidate layouts.

Note: How Models and Parts are built settled the format. The car is a Model in JSON made of primitive Parts with Sockets and `coveredBy` lists, plus a separate Level that colours every Socket. Add shapes to the primitive set if the car needs them.
