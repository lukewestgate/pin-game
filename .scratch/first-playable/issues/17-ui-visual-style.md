# UI visual style

Type: prototype
Status: resolved
Parent: ../map.md
Blocked by: 11, 12, 18

## Question

What does the UI look like, on top of the layout fixed in [Screen layout and HUD](11-screen-layout-and-hud.md)? That ticket decided where things sit and how big they are. It left every visual as a placeholder.

The human's inspiration is **Screwdom 3D**. The first playable takes on the *qualities* of that look in its own original art. It doesn't copy that game's specific UI, icons, assets, layout details or branding. Start the session by having the human name what they like about it, with screenshots added under `../research/` if they want. Then turn those qualities into decisions:

- **Boxes and Buffer as objects:**
  - Material and shading, matching the toon or Lambert look from [Achieving the clean cartoon look on mobile web](02-clean-cartoon-look-on-mobile.md).
  - Rounded corners and depth, and outlines.
  - How an empty slot reads, and how a Box shows its colour.
  - How the Buffer's warning reads as it fills.
- **Background** behind the car: flat colour, gradient or a simple floor or backdrop. It must also fill the letterbox of the centred landscape column.
- **Type:** font (it must be free to self-host, for offline PWA use), weights and sizes for the banners and buttons.
- **Buttons and icons:** the shape and style of Restart and the dev Undo, and where the icons come from (drawn in-house, or a free icon set with a licence that fits).
- **Win and lose banners:** look, and any small flourish such as a bounce-in. Animation timing stays with [Animation sequencing and input during animations](09-animation-sequencing-and-input.md).
- **Colour roles** beyond the Pins: UI accent, ink, surfaces, success and fail. Built from the hues chosen in [Pin colours and colour-blind readability](12-pin-colours-and-colour-blind-readability.md).

Also from Pin colours and colour-blind readability: the **Pin head's form**. The inspiration's heads are wide, flat, slightly domed discs, while the prototype's Pin is a tapered cylinder. The form must keep the Head mark readable on top. Also decide where the player switches on the **colour-blind setting** (one drive recess per colour), since the first playable has no settings screen yet.

A rough Babylon prototype, built on `../prototypes/screen-layout.prototype.html` with variant A's layout fixed, showing two or three original styles to switch between.

_Added by [Gesture tuning](13-gesture-tuning.md): the press highlight (Pin grows 1.25× with a white outline) and the red flash on the Part covering a Blocked Pin are settled as behaviour and timing. Their look can be restyled here. A Pin head form that changes the drawn head size also changes the tap target (max(head × 1.6, 36 px)), so check that close Pins can still be told apart._

_Added by [PWA hosting, caching and updates](15-pwa-hosting-caching-and-updates.md): the **app icon** art (one SVG that `@vite-pwa/assets-generator` turns into the 192/512 `any`, 512 `maskable` and 180 `apple-touch-icon` set, with the maskable art inside the 40%-radius safe zone) and the manifest's `theme_color` and `background_color`. The placeholder is a Candy-red Pin head with the cross recess on a neutral background. The game is named **Pin Game**. The font must be precached with the build, so no font CDN._

_Added by [Sound in the first version](16-sound-in-the-first-version.md): a **mute toggle** (speaker icon, on and off states) sits in the player-facing part of the bottom bar next to Restart, outside the dev controls. Style it with the other buttons. Its state and the colour-blind setting share one `localStorage` settings store, so the colour-blind switch can sit beside it if that's where it ends up._

_Added by [Screwdom 3D visual style](18-screwdom-3d-visual-style.md): start from its 15 **qualities to carry over** ([findings](../research/05-screwdom-3d-visual-style.md), section 10) rather than from scratch. One clash to settle: the inspiration has **no ink outlines** and soft Lambert-like shading, but [Achieving the clean cartoon look on mobile web](02-clean-cartoon-look-on-mobile.md) planned inverted-hull outlines. Decide outlines on or off (or on the Pins only), and toon or Lambert. Wood grain is that game's most recognisable choice, so make any material accent our own._

## Answer

Resolved with the human on 2026-11-15. Prototype: [ui-visual-style.prototype.html](../prototypes/ui-visual-style.prototype.html), style **B, Workbench**, taken whole. The human said "i like workbench". So every pick in that style stands as its default: toon shading, outlines on the Pins only, bevels on, pan-head Pins, the colour-blind switch in a settings sheet. Any of these can still be changed with the prototype's mix-and-match buttons. No glossary changes.

**The idea:** painted tin trays on a dark slate workbench. This is our own material accent in place of the inspiration's wood. Saturated colour stays on the Pins and Box tins only. The car is muted, and the dark backdrop makes the Pins stand out.

**Departures from the inspiration's qualities** ([findings](../research/05-screwdom-3d-visual-style.md), section 10), made on purpose:
- A dark backdrop instead of a pale one.
- Toon shading instead of Lambert.
- Ink outlines on the Pins, where the inspiration has none.

**Shading and outlines** (this settles the clash with [Achieving the clean cartoon look on mobile web](02-clean-cartoon-look-on-mobile.md)):
- **Toon, 3 bands.** The prototype uses Babylon's `CellMaterial`. The build may use `CellMaterial` or its own ramp in a material plugin, but it must keep 3 bands.
- **Ink outlines on Pins only**, on car Pins and Box/Buffer Pins alike. The car's Parts and the HUD objects get none.
- **Bevels on**, done by the renderer. Box shapes become rounded boxes with bevel = min(0.07, 0.45 × their smallest side), in Model units. Cylinders get a lathed rounded edge with bevel = min(0.06, 0.2 × diameter, 0.45 × height). The Model data doesn't change ([ADR 0001](../../../docs/adr/0001-models-built-from-primitives-in-data.md) still holds). The prototype has a builder for a convex rounded box, and its normals were checked headless.
- **Car colours:**

  | Part of the car | Hex |
  |---|---|
  | Body | `#efe2c9` |
  | Tyre | `#2f3238` |
  | Hub | `#c9ccd1` |
  | Interior | `#b9b3a8` |
  | Chassis | `#8a9099` |
  | Engine | `#9aa0a8` |
  | Lights | `#fff3c4` |

  They replace the earlier placeholders, and they're content constants.

**Pin head: pan head.**
- **Form:** a flat rim 0.03 high, then a quarter-round dome to a total height of about 0.076. It has the same diameter as before (0.24), so the tap targets (max(head × 1.6, 36 px)) and the measured head sizes don't change.
- **Shank:** a threaded shank is drawn only while a Pin pops out, so pulling a Pin reads as unscrewing. At rest only the head shows.
- **Head mark:** drawn as a recess with a visible inner wall. The wall tone is the Pin colour × 0.3, and a floor tone of × 0.5 is shifted down inside the shape, so the upper edge reads as shadow. This replaces the flat × 0.42 mark from [Pin colours and colour-blind readability](12-pin-colours-and-colour-blind-readability.md). The atlas and per-instance index approach is unchanged.

**Boxes** (sizes in CSS px):
- **Body:** a solid tinted tin (Pin colour × 0.92) with 12 px corners, a 3 px front bevel and 14 px of depth. The whole tin shows the colour, with no separate panel.
- **Empty hole:** a dark recess (Box colour × 0.42) with an inner shadow on its upper edge and a lighter lip around it (Box colour mixed 35% with white). It is drawn at 0.9 of the slot.
- **Colour-blind setting on:** the colour's drive shows faintly in its empty holes, black at about 25%.

**Buffer:**
- A black rubber mat (`#1b272d`) with 10 px corners, 8 px deep. Its slots are near-black recesses (`#0f1a1f`) with an inner shadow.
- **Warning:**
  - With 2 slots left, every empty slot gets an amber ring (`#ffb020`).
  - With 1 slot left, that slot also pulses a red ring (`#ff3b47`, about every 0.9 s, opacity 0.25 → 1, scale 1 → 1.08).
  - This replaces the placeholder from Screen layout and HUD, where the last slot was always tinted. It's still not a game state: it's a pure function of the Buffer count.

**Background:**
- A CSS radial vignette behind a transparent canvas: `radial-gradient(120% 75% at 50% 48%, #5a7783, #34505b 55%, #1f2f36)`.
- It fills the landscape letterbox and the safe areas with no extra mesh. The engine is created with `alpha: true, premultipliedAlpha: false` and a clear colour with 0 alpha.

**Type:**
- **Baloo 2**, weights 600 and 800, under the SIL OFL 1.1. It's self-hosted through `@fontsource/baloo-2` (Latin subset woff2) and precached, with no font CDN.
- Banner title 800, 38 px, all-caps. Banner text 600, 16 px. Button labels 800, 16 px (the Play again / Try again buttons are 20 px).

**Buttons and icons:**
- **Player buttons:** teal pills (`#13a3c4`) with a darker 4 px bottom edge (`#0b6f86`) and a soft drop shadow. They press down 3 px. Icons and labels are white.
- **Dev Undo:** a yellow pill (`#f1d36b`, edge `#a88a20`) with a small `DEV` tag.
- **Confirm buttons on the banners:** green (`#3ccf4e`, edge `#228a31`).
- **Icons:** drawn in-house as inline SVG, simple filled shapes with thick round strokes: restart, undo, sound on, sound off, colour-blind (a disc with a hex recess) and settings (two sliders). There's no icon-set licence to track. A state badge sits in a corner when needed.

**Bottom bar.** Left to right: dev Undo (104), a gap, then Settings (48), Mute (48) and Restart (112), 6 apart. That fits 360 px with 16 to spare.
- The **colour-blind setting** lives in a small **settings sheet** that opens above the Settings button. The sheet has two switches, "Sound" and "Screw shapes (colour-blind help)", both stored in the one `localStorage` settings store.
- Mute also stays in the bar next to Restart, as [Sound in the first version](16-sound-in-the-first-version.md) asked. The sheet's Sound switch is the same setting.
- The sheet has room for more settings later.

**Win and lose banners:**
- The scene dims (`#0008`). A full-width ribbon slides in from the left with a slight overshoot (about 0.5 s), with a dashed stitch line inside its edge.
  - **Win:** a gold ribbon (`#ffd60a`, edge `#b39300`) with ink text "CAR STRIPPED!", plus small pale sparkles.
  - **Lose:** a slate ribbon (`#5a6b75`) with white text "OUT OF ROOM", no reward colours and no sparkles.
  - Each has one green button, "Play again" or "Try again".
- The copy is a placeholder. Timing before the banner stays with [Animation sequencing and input during animations](09-animation-sequencing-and-input.md).

**Colour roles** (built from Candy):

| Role | Hex |
|---|---|
| Ink (text on light) | `#13202a` |
| Surface (sheets, cards) | `#2c3f49` |
| Accent (buttons) | `#13a3c4` |
| Go / confirm | `#3ccf4e` |
| Reward / win | `#ffd60a` |
| Fail / warning | `#ff3b47` |
| Amber warning | `#ffb020` |

**Feedback looks:**
- The press highlight (1.25×, white outline) and the red flash on a Blocked Pin's Part stay as settled in [Gesture tuning](13-gesture-tuning.md). White reads well on the dark scene.
- Arc trails, the Socket glow and sparkles at the pop-out are still open to the build. They should be small and pale, as in the findings.

**App icon and manifest:**
- **Icon:** a Candy-red head with the cross recess and a soft highlight, on the slate gradient. One SVG for `@vite-pwa/assets-generator`. In the maskable version the head's radius is 150 of 512, inside the 204.8 safe circle. The prototype previews 192 `any`, 512 `maskable` and 180 `apple-touch-icon`.
- **`theme_color`:** `#34505b`. **`background_color`:** `#1f2f36`.

**Handed on:**
- **iOS status bar (device check).** [ADR 0003](../../../docs/adr/0003-pwa-status-bar-and-update-mode.md) ships `default`, which on an installed iOS app gives a light status bar above the page. Over the dark slate scene this may look like a white strip. Add this to the manual device checklist. If it looks wrong, `black` (an opaque dark bar, with the page still starting below it, so the inset bug still can't bite) is the nearest fix. Like any change to the tag, it needs a reinstall, so decide it before the first deploy.
- **Contrast.** White labels on the teal accent and white text on the slate ribbon should pass a contrast check in the build (WCAG AA for large text at least).
