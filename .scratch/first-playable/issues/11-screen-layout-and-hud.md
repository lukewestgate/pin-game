# Screen layout and HUD

Type: prototype
Status: open
Parent: ../map.md
Blocked by: 06, 07

## Question

How is a portrait phone screen divided between the Model, the Box row and the Buffer, and how does that scale from a small phone to a desktop window? Specifically:

- What is the smallest screen to design for (for example 360 × 640 CSS px), and how big are the 3 Boxes and the Buffer of 5 or 6 slots on it? The car level overrides the Buffer to 6, so the layout must take Box count, Capacity and Buffer size from the level and never hard-code them.
- Where does each sit (Boxes at the top as in the glossary, Buffer above or below the Model?), and how much of the screen does the Model get?
- How are safe areas (notch, rounded corners, home indicator) respected when the Box row and Buffer are drawn in the scene by the orthographic camera (ADR 0002) and not laid out with CSS?
- What fills a landscape or desktop window: the portrait column centred, or a wider layout?
- What do the DOM elements look like and where do they sit: the win and lose banners, a restart button, and the debug undo button?
- How does the Model's starting camera distance and zoom range fit the space it is given?

A rough Babylon prototype to look at in a phone-sized browser window and on a real phone. It uses placeholder Pin colours, because exact hues belong to Pin colours and colour-blind readability.
