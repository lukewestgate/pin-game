# Screen layout and HUD

Type: prototype
Status: resolved
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

## Answer

Resolved with the human on 2026-11-15 (prototype: [screen-layout.prototype.html](../prototypes/screen-layout.prototype.html), variant A, with the human's changes to the Boxes and Buffer folded in). No glossary changes.

**Layout: variant A, "Sorting on top".** Top to bottom, inside the safe area:

| Band | Size (CSS px) |
|---|---|
| Margin | 10 |
| Box row | one Box per open Box, 10 apart, centred |
| Gap | 8 |
| Buffer | one row, centred |
| Margin | 10 |
| Model region | everything left |
| Margin | 10 |
| Bottom bar | 48 high: dev Undo on the left, Restart on the right |
| Margin | 10 |

Variants B (Buffer at the bottom) and C (bottom tray) were rejected.

**Boxes are roughly square.** A Box's slots sit in two rows: the top row has ⌈Capacity/2⌉ slots and the rest are centred below. Capacity 3 gives 2 + 1, as the human asked. The rule for other Capacities is a generalisation and can be revisited.
- Box width = min((available width − gaps) / Box count, columns × 46 + 2 × 6). Slot = (Box width − 12) / columns.
- A Pin's head is 0.78 of its slot.

**Buffer Pins are smaller than Box Pins.** Buffer slot = min(52, 0.8 × Box slot, what fits in one row). The last Buffer slot is tinted as a warning, the prototype's default, which the human didn't object to.

**Taken from the level, never hard-coded.** Box count, Capacity and Buffer size come from the level, so changing any of them reflows the layout. The layout is a pure function `layout(screen, safeInsets, level) → rects`, which can sit beside `Timeline` and be unit-tested headless. Every number above is a developer constant.

**Smallest screen to design for: 360 × 640.** Measured with 3 Boxes, Capacity 3 and Buffer 6:

| Screen | Box | Pin in Box | Buffer slot / Pin | Model region | Car circle at 1× |
|---|---|---|---|---|---|
| 360 × 640 | 104 × 104 | 36 | 37 / 29 | 360 × 391 (61%) | 360 |
| iPhone SE 375 × 667 | 104 × 104 | 36 | 37 / 29 | 375 × 398 | 375 |
| iPhone 14 390 × 844 | 104 × 104 | 36 | 37 / 29 | 390 × 514 | 390 |
| Desktop 1280 × 800 (column) | 104 × 104 | 36 | 37 / 29 | 450 × 551 | 450 |

On every portrait phone the car is limited by the screen's width, not its height. The taller square Boxes therefore cost the car no size.

**Safe areas.** The page uses `viewport-fit=cover` and reads the insets from `env(safe-area-inset-*)` through a hidden probe element. The layout function gets them as numbers. The HUD's orthographic camera works in CSS px: one world unit is one CSS px, with the origin at the top left (`orthoLeft = 0`, `orthoRight = W`, `orthoTop = 0`, `orthoBottom = −H`). So HUD meshes are placed straight from the layout's rectangles, which was checked with a Babylon NullEngine.
- **Risk to check on a device:** [PWA facts for Vite and iOS](14-pwa-facts-for-vite-and-ios.md) found an open WebKit bug where the top inset reads 0 on iOS 26.1 and later. With the Boxes at the top, they could slide under the notch on those iPhones. How to handle it belongs with the other iOS quirks in [PWA hosting, caching and updates](15-pwa-hosting-caching-and-updates.md).

**Landscape and desktop: a centred portrait column, so landscape isn't really supported.** The column is 9:16 of the safe height, centred, with plain background on either side. iOS can't lock the screen to portrait (PWA facts for Vite and iOS), so this column is what a rotated phone gets: a small but working game, with the car in a circle of about 190 px. The spread layout was rejected.

**DOM elements** (text and buttons only, as in ADR 0002):
- **Win and lose:** a card in the centre over a dimmed full screen, holding a title, one line of text and one button ("Play again" or "Try again"). It is green for a win and red for a loss, and appears after the Timeline's beat before win or lose.
- **Restart:** a white button, 120 × 48, at the right of the bottom bar.
- **Undo (debug tool):** a button styled pale yellow so it reads as a dev tool, 104 × 48, at the left of the bottom bar.

**Model camera.**
- At 1× zoom, the car's bounding sphere around its turning centre, Pins included, fills the Model region (fit margin 1.0), so no rotation ever clips it.
- The camera is shifted sideways so the turning centre lands at the centre of the Model region. Checked with NullEngine: the centre lands within 0.1 px.
- Zoom runs from 1× to 2.2× by moving the camera closer. There is no zooming out past the fit and no panning. Both numbers are developer constants.
- A Pin head on the car is an estimated 17 px across at 1× on the 360-wide screen and about 37 px at full zoom. This feeds [Gesture tuning](13-gesture-tuning.md)'s tap-target question.
