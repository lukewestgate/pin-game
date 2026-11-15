# Gesture tuning

Type: prototype
Status: open
Parent: ../map.md
Blocked by: 06, 07

## Question

What are the starting values for the pure tap / drag / press-and-hold classifier (Checks in the toolchain), and how are small Pins made easy to hit? Specifically:

- How long must a press last to start Peek (for example 350 to 500 ms), and how far can the finger move before a press counts as a drag and not a tap or hold?
- Does a drag that starts on a Pin rotate the Model (it should, per the map's Controls), and does a tap that wobbles a few pixels still count?
- How big is a Pin's tap target compared with its drawn size? Does a tap that misses every Pin pick the nearest unblocked Pin within some radius in screen space, and how are two Pins close together told apart?
- How do pinch zoom and the scroll wheel map to the zoom range, and how does a second finger landing in the middle of a hold or drag behave?
- What feedback does each gesture give: a Pin highlight on press, Peek fade-in time, the Blocked wiggle?

The values must be judged on a real phone, so the prototype is served to a phone over the local network. The decision can be "start with these values and tune them in the build" if the phone test is good enough. All values stay developer constants.
