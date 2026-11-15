# UI visual style

Type: prototype
Status: open
Parent: ../map.md
Blocked by: 11, 12

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
