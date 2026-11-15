# Screwdom 3D visual style

Type: research
Status: resolved
Parent: ../map.md
Blocked by:

## Question

What are the visual qualities of **Screwdom 3D** (the human's inspiration), described well enough that [UI visual style](17-ui-visual-style.md) can turn them into original decisions? Cover: the Model's art style (shapes, materials, shading, outlines, lighting), the screws (head form, recess, colours), the boxes and holding slots, the background, the HUD (type, buttons, icons, banners), the colour roles, and the motion and feedback. Also cover any recognisable conventions of the screw-sorting genre in general.

Describe qualities, not assets: the first playable makes its own art and doesn't reuse that game's UI, icons, branding or exact values.

## Answer

Resolved by research on 2026-11-15. Findings: [05-screwdom-3d-visual-style.md](../research/05-screwdom-3d-visual-style.md), based on the store listings, their screenshots, frames from gameplay videos and six similar games. The game wasn't played.

- **Model:** a soft "vinyl toy" look. Chunky primitives with big rounded bevels in muted warm pastels, **no ink outlines**, and soft light shading with darkening in creases. This reads as Lambert/PBR with AO, not cel bands.
- **Saturation order:** the Pins and Box rims are the only fully saturated things. The Model is muted, and the background is a plain pale cool gradient with no floor.
- **Pins:** wide, low, slightly domed disc heads, almost flush and glossy, with the cross recess in a darker tone of their own colour. A short threaded shank shows on pop-out.
- **Boxes:** chunky rounded squares, with the colour only in a thick rim around a near-white panel of recessed holes. Empty holes are grey with an inner shadow. The **Buffer** is a smaller, quieter row of grey ring slots. No fill warning was seen, so that one is ours to design.
- **HUD:** fat, rounded, outlined all-caps type, and chunky "candy" buttons (lighter face, darker thick bottom edge). Colour roles: green = go, gold = reward, red = fail, navy = ink, cream = surfaces.
- **Feedback:** small pale sparkles, a soft arc trail to the Box, a glow on the emptied Socket. The win screen dims the scene, with a bold banner, a star and a burst.
- Section 10 of the findings lists **15 qualities to carry over** in original art, each mapped to a part of UI visual style. Section 11 lists what couldn't be verified: real-time motion, Buffer warning, blocked feedback, the exact font, on-device shading.
