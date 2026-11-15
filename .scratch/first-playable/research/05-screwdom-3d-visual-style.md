# Research: Screwdom 3D visual style

Ticket: [../issues/18-screwdom-3d-visual-style.md](../issues/18-screwdom-3d-visual-style.md)
Feeds: [../issues/17-ui-visual-style.md](../issues/17-ui-visual-style.md)
Researched: 2026-11-15. Vocabulary: [GLOSSARY.md](../../../GLOSSARY.md). In the game's own words a "screw" is our **Pin**, a "box" is our **Box**, the row of holes under the boxes is our **Buffer**, and the object is our **Model**, made of **Parts**.

The question is what Screwdom 3D looks like, described as qualities that [UI visual style](../issues/17-ui-visual-style.md) can turn into original decisions. Nothing here is meant to be copied: no assets, icons, branding or sampled hex values.

**How to read this file.**
- **Observed** means I saw it myself in a store screenshot or a gameplay video frame (sources in §1). Store screenshots are marketing art: the scenes are staged, the background is a painted meadow that the real game doesn't use, and the hand cursor and captions are added. Where marketing and gameplay differ, I say so.
- **Inferred** means my reading of what I saw, for example which shading model produced it. It is labelled *inferred*.
- The gameplay frames are YouTube thumbnails and storyboard sprites. The storyboards are only 101–108 px wide, so small details (fonts, warning colours) are only readable in the 1280×720 thumbnails.
- I did not install or play the game.

---

## 1. The game and its sources

| Fact | Value | Source |
|---|---|---|
| Name | "Screwdom 3D" on Google Play, "Screwdom" on the App Store | Store pages below |
| Google Play | `com.ig.screwdom`, developer shown as **iKame Games - Zego Studio**, support email at `ikameglobal.com`, 4.5 stars, 10M+ downloads, updated 11 Nov 2026 | https://play.google.com/store/apps/details?id=com.ig.screwdom (fetched 2026-11-15) |
| App Store | id 6740043080, seller **Zego Global Pte Ltd**, copyright "© Zego Studio", developer site zegostudio.com. Version 13.8.0 adds an in-game mailbox. The version notes list seasonal themes and team events (Halloween theme, Harvest Pass, Unicorn Rising) | https://apps.apple.com/us/app/screwdom/id6740043080 |
| Developer | Zego Global Pte Ltd lists offices in Singapore and Hanoi. Its site doesn't list Screwdom. The Play description says "developed by iKame Games". iKame is a Vietnamese publisher (https://ikameglobal.com). One YouTube description credits "Dino Global Studio" (see §5) | https://zegostudio.com |
| Store description | Its visual claims are "Stunning models … houses, ducks, cubes" and "ASMR and Colorful Gameplay: Click sounds and colorful models". It also says "No Time Limits" | Play listing |
| Store screenshots | Twelve were viewed: six App Store (iPhone 1242×2688) and eleven Play, overlapping. Play captions: "Tap to unscrew", "Clear the box", "Remove screw strategically", "Test your IQ", "ASMR click", "Unscrew elements by colors", "Solve puzzles", "Explore new levels", "360° rotation", "Ultimate boosters", "Train your brain" | Both listings |
| Gameplay video (Level 5, cube Model; Level 2 and more; win screen) | "Screwdom 3D Game Gameplay", Homescapes Walkthrough | https://www.youtube.com/watch?v=euliz-diW7o |
| Gameplay video (Levels 54–55, alarm clock and wooden toy Models; "Continue?" offer) | PocketGamix | https://www.youtube.com/watch?v=n6a_F5cYwmY |
| Gameplay video (Levels 11–20 thumbnail: poodle, wooden figure, pony) | Usman's Gaming | https://www.youtube.com/watch?v=yX8Su2MZBiU |
| Gameplay video frames (Levels 49–50 gamepad, 63 box figure, 100) | PocketGamix, NEW GAMER, Gina Got Game | https://www.youtube.com/watch?v=k-PDP_SdXfQ, https://www.youtube.com/watch?v=r_E16yD6gsM, https://www.youtube.com/watch?v=gB0lvWl8Y4w |

I found no press coverage or developer write-up of the art. Reviews are aggregator pages (for example https://grand-screen.com/games/screwdom-3d/) that praise the "3D screw models" and complain about ads. They say nothing specific about the visuals.

## 2. The Model (3D object)

**Observed**
- **Subjects** are friendly everyday objects and animals: a two-storey house, an owl, a windmill, a grand piano, a camera, a flower pot, a duck, a cat, a poodle, a pony, an astronaut, a slice of cake, an alarm clock, a wooden toy figure, a gamepad and a cube.
- **Two shape families:**
  1. **Soft "vinyl toy"** Models (owl, camera, windmill, house, alarm clock). These are built from chunky primitives (boxes, cylinders, capsules, domes) with **large rounded bevels on every edge**. Nothing is sharp. The owl reads like a moulded clay or vinyl toy.
  2. **Blocky "voxel/brick"** Models (cat, poodle, duck, pony, astronaut, flower). These are stacks of bevelled cubes and slabs, like toy bricks. Each block is a Part in a single flat colour.
- **Detail level is low.**
  - Details are separate chunky Parts (a dormer, a chimney, the owl's eye rings, piano keys).
  - Small painted touches add character: the owl's zigzag mouth, a triangle beak, the house's window frames.
  - Some surfaces carry a **subtle texture**: wood grain on the windmill sails and the cube level's planks, and tiles on the house roof. Most surfaces are plain.
- **Colour on the Model:**
  - Bodies are mid-saturation and slightly creamy or pastel: tan, cream, warm wood, soft pink, mint, lavender grey, white.
  - Body colours are noticeably **less saturated than the screws**, so the screws pop.
  - Exception: the alarm clock is a saturated red, and its screws then rely on contrast in value.
- **Shading:**
  - Smooth, soft gradients with a broad, soft highlight on top-facing curves.
  - Gentle darkening into creases and where Parts meet, which looks like ambient occlusion.
  - **No hard cel bands.**
  - **No ink outlines** on the Model in any frame I looked at.
- **Lighting:** a soft key light from the upper left or front, plus strong ambient fill. Shadow sides stay light and colourful, never near black.
- **Shadows:**
  - Parts shade each other softly. In the gameplay frames the Model floats with **no visible ground or drop shadow**.
  - The marketing house sits on a base slab.
  - The windmill sits on a green disc, which is a Part.
- **Framing:** the Model fills the middle of the portrait screen, roughly 70–85% of its width, between the Box row above and the boosters below.
- **Parts:** later levels (the cube, the toy figure) have flat **coloured plates or bars** laid over the wooden blocks and held by screws. These are slightly darker tints (sage, slate, rose, lilac) that read as separate pieces. This is the layered-plate idea from 2D screw games, moved onto a 3D object.

**Inferred**
- The look is a **soft PBR or Lambert-with-AO "clay toy" render**, not toon shading.
  - It has a roughness-type wide highlight and soft occlusion in the creases.
  - Low specular on the bodies, glossier on the screws.
  - The marketing shots could be offline renders. The gameplay frames look the same in kind but flatter, so I'd guess baked or screen-space AO at most on device.
- Bevels do much of the work. They give every edge a highlight line that stands in for an outline.

## 3. The screws (our Pins)

**Observed**
- **Head form:**
  - A **wide, low, slightly domed disc** with a small chamfer at the rim. It is clearly wider than it is tall.
  - At rest only the head shows: it sits nearly flush with the surface, like a button.
  - In the marketing close-ups (piano, cat) the head is a pan or countersunk shape on a short shank with **rounded, chunky threads**, about 1.5 head-diameters long.
  - In the Level 5 frame a red screw lifts out on a **long smooth shank**.
- **Recess:**
  - A **cross recess with rounded arm ends** (a plus sign, Phillips-like) on every screw, in every colour.
  - The recess is cut into the head and drawn as a darker shade of the screw's own colour, with a visible inner wall.
  - I saw no other drive types.
- **Material:** glossy plastic. Each head has a crisp white **specular dot or highlight** on its upper edge and a soft gradient across the dome.
- **Colours (named only, values not sampled):**
  - About ten fully saturated toy colours: red, yellow, green, blue, sky or cyan, pink or magenta, orange, purple, brown and white.
  - **Brown** and **white** are used as screw colours, which is unusual. In some levels a grey or dark one appears as well.
- **Size against the Model:** a head is about 4–7% of the Model's width on screen, roughly the size of the owl's beak. Screws are dense: 69–117 per level in the counters I saw (`0/69`, `3/117`).
- **Pins in a Box:** seen from straight above, sitting in the Box's holes, head and cross still visible.

## 4. Boxes and Buffer

**Observed (gameplay and marketing agree)**
- **Box row:**
  - Four Boxes across the top, evenly spaced, each about 20% of the screen width.
  - Each Box is a **chunky rounded square**, shaped like a padded tile or a squat bin seen from above.
  - It has a **thick coloured rim** in the Box's colour, with small **side "ears" or tabs** on the left and right, and a visible darker side face showing depth. The rim has a faint **wood-grain texture**.
  - Inside the rim is a **near-white inset panel** with **three round holes in a triangle** (one at the top, two at the bottom). This is Capacity 3 made visible.
- **Empty hole:** a mid-grey circle with an inner shadow on its upper edge, so it reads as a real hole and not a dot.
- **How a Box shows its colour:** only through its rim. The panel and holes are neutral, and the Pins that land in the holes are the same colour as the rim.
- **Locked extra Box positions (gameplay only):** grey, wood-grained rounded squares the same size as a Box, with a big white **"+"** and a blue clapperboard **"AD"** badge. They are unlocked by watching an ad. The marketing shots hide these.
- **Buffer:**
  - A row of **five small circular slots**, centred under the Box row, much smaller than a Box.
  - Each slot is a **grey hole inside a white ring**, like a grommet.
  - Filled slots show the screw head in its colour (visible as coloured dots in storyboard frames).
- **Fill warning:** **not observed.** No frame I could read showed the Buffer near full with a warning colour, pulse or icon. See §8.
- **Box completion:** one marketing shot shows a fourth screw arriving at a full Box ("Clear the box" caption). The storyboard frames show the Box colours in the row changing between frames. That suggests full Boxes leave and new ones come in, but I couldn't see the transition itself.

## 5. Background

**Observed**
- **In gameplay:** a **plain, pale sky-blue vertical gradient**, slightly deeper at the top. There is no floor, horizon or scenery. Every gameplay frame I saw used it.
- **In marketing:** a painted, blurred **blue sky with clouds over a green meadow** with a distant cottage. This is store art only.
- The "Explore new levels" shot shows levels on **warm wood-grain cards**. That is probably a level-select or collection screen I didn't see in gameplay.

**Inferred**
- The pale, low-contrast background lets the saturated screws and Boxes carry all the colour. It is cool, while the Models are mostly warm (wood, tan, cream), so the Model stands out.

## 6. HUD

All observed from the gameplay thumbnails (1280×720), unless noted.

- **Top bar:**
  - A **pause** button (two bars) at the top left.
  - **"LEVEL n"** centred in a **heavy, rounded, all-caps sans** in white with a dark outline.
  - A **coin counter** at the top right: a gold coin in a **dark navy rounded pill**.
- **Level path strip:**
  - Under the title, five small **rounded-square tiles** on a connecting bar. Each tile shows a thumbnail of a Model (an ice lolly, cake, house, duck).
  - Past tiles are cream, the current one is cyan, and future or special ones are dark navy.
- **Screw counter:** a small gold screw icon with **"removed/total"** in bold white with an outline, on the left under the Box row.
- **Zoom slider:** a magnifier icon on a short dark track, at the lower left above the boosters (*inferred* to be zoom from the icon).
- **Boosters:**
  - A bottom row of four **chunky rounded-square buttons** in cream or light orange, with a darker orange rim and bottom edge (a raised, bevelled "candy button").
  - Each has a full-colour illustrated tool: a red power drill, a red and blue horseshoe magnet, a broom or duster, and a hammer.
  - A green **"+"** badge sits at the lower right of each.
  - Marketing shows a hammer booster as a big purple mallet with a star, a radial burst of light and screws flying off.
- **Icons:** all are **glossy, shaded, illustrated objects**, not flat line icons.
- **Win screen (low-res storyboard):**
  - A **dark overlay**.
  - **"LEVEL COMPLETED!"** in bold yellow with an outline.
  - A glowing gold star with a sparkle burst under a **ribbon banner**.
  - A coin reward box with a **segmented multiplier meter** (red, yellow, green segments and a moving pointer).
  - Gold coins scattered below it.
  - A new-booster unlock appears as a **cream card with a dark-red rim** and a green button ("Drill").
- **Lose/continue (low-res storyboard):**
  - A **"Continue?"** modal: a **royal-blue panel** with a red round close button and a white inner card.
  - The card offers "Unlock box and continue", with a green "Play on" price button and a blue "Free" (video) button.
  - A magenta "Keep up offer" bundle sits under it.
- **Pause screen (low-res):** a cream card with "PAUSE" and three round toggle buttons (*inferred* to be sound, music and vibration).
- **Marketing captions:**
  - A **chunky rounded display font**, warm cream fill with a brown outline and a drop shadow.
  - It sits on **wooden signboards with yellow screw heads at the corners**.
  - Play uses a dark wood plank, the App Store a light wood plank.

**Inferred:** the HUD language is "toy workshop": wood, glossy candy buttons, outlined fat type, coins. It is in the same family as Royal Match and Homescapes-style casual UI.

## 7. Colour roles

**Observed**

| Role | What it is |
|---|---|
| Sorting colours | About 10 fully saturated toy hues on screws and Box rims. These are the most saturated things on screen |
| Model body | Muted warm neutrals and pastels (wood, tan, cream, white, soft pink, mint, lavender grey) |
| Background | Pale cool sky-blue gradient |
| Holes and empty slots | Mid-grey with an inner shadow. Box panels near-white; Buffer slots ringed in white |
| Ink / type | White fill with a dark navy or brown outline. Dark navy for pills and counters |
| Primary action | Green (the "+" badges, the "Play on" and "Claim" buttons) |
| Secondary / free action | Bright blue ("Free", the "AD" badge, the modal panel) |
| Reward | Gold and yellow (coins, star, "LEVEL COMPLETED!") |
| Close / danger | Red round close button |
| Warm surfaces | Cream, light orange and wood for booster buttons and cards |

**Inferred:** saturation follows importance. Pins and Box rims are loudest, then the HUD action colours, then the Model, then the background.

## 8. Motion and feedback

**Observed (mostly marketing stills, so the timing can't be seen)**
- **Pop-out:**
  - The tapped screw rises along its axis, showing its threaded shank, with white **sparkle stars** around it.
  - In gameplay (Level 5) a lifted screw shows a long shank, and a **pale glowing ring** marks the socket it left.
- **Fly to Box:**
  - A **soft light-blue curved trail** arcs from the Model up to a Box.
  - The marketing shows the screw upright over the Box hole.
- **Parts falling away:** across successive storyboard frames (about 5 s apart), freed Parts disappear and the Model gets sparser until single blocks float. It is consistent with Parts dropping out of view, but I couldn't see how they move.
- **Booster:** the hammer comes with a white radial light burst, glow and sparkles, and screws fly outward.
- **Win:** a sparkle burst behind the star, plus coins.
- **Sound:** the store copy stresses "ASMR click" and "Click sounds". I didn't hear any audio.

**Not observed:** the press highlight, the feedback for tapping a Blocked Pin, the Buffer's near-full warning, Box close and replace animations, and any camera shake. See §11.

## 9. Genre conventions (what is generic and what is Screwdom's own)

Compared against store screenshots of:
- Screw Sort 3D: Pin Puzzle Game, https://apps.apple.com/us/app/-/id6633425539
- Screw Sort Jam™ – Pin Puzzle 3D, https://apps.apple.com/app/id6446284100
- Screw Craze – Screw Sort Puzzle, https://apps.apple.com/app/id6737797679
- 3D Bolt Master®: Screw Master®, https://apps.apple.com/us/app/-/id6738771575
- Screw Game: Jam Puzzle 3D, https://apps.apple.com/us/app/-/id6744392799
- Rollic's 2D-layered Screw Jam (Rollic Games per its Play listing), https://play.google.com/store/apps/details?id=com.quok.screwJam

I did not confirm the developers of the App Store titles: the page data mixes in "You might also like" developers.

**Generic: seen in nearly every game**
- **Box row at the top:** four Boxes, each a coloured rim around a light panel with **3 holes** (a triangle in the 3D games, a straight line in Screw Jam).
- **Buffer:** about **5 small round grey slots** in a row under the Boxes.
- **Pins:** saturated toy-colour **cross-recess** heads, the Phillips "+" being the genre's shorthand for a screw. They are densely spread over a cute, bevelled, pastel 3D Model in a soft clay-toy render with no outlines.
- **Background:** a plain, light, single-hue gradient (blue, lavender, pink, mint).
- **HUD:** "LEVEL n" at the top centre with a pause button at the top left.
- **Boosters:** a bottom row of 3–4 tool buttons (**drill, hammer, broom, magnet**) with "+" or count badges.
- **Other conventions:** a tap-hand tutorial cursor, an arc trail to the Box, and "ASMR / satisfying" positioning.

**Varies between games, so it's a style choice**
- **Box silhouette:**
  - Screwdom: side tabs and a wood-grain rim.
  - Screw Craze and Screw Game: cat or bear ears on top.
  - Screw Sort 3D: a small handle on top.
  - Screw Jam: a long tray with a handle.
- **Model style:**
  - Screwdom: mostly **simple chunky toys and brick-built animals** with few Parts and big screws.
  - Screw Sort 3D and Bolt Master: **very busy dioramas** (dollhouses, cake stands, cosmetics) with hundreds of tiny screws.
  - Screwdom's Models are noticeably simpler, with larger screws relative to the object.
- **Buffer slot look:** white-ringed grey (Screwdom), plain grey dots (Screw Sort 3D), dark dots (Screw Craze).
- **Booster button style:** cream and orange candy tiles (Screwdom), blue pills (Bolt Master).
- **Background colour:** sky blue in Screwdom; others use lavender, pink, or a different colour per level.

**Specific to Screwdom (as far as I saw)**
- The **wood-grain rims** on Boxes and on the locked-Box tiles, and the wooden caption signboards with corner screws. Wood is a recurring material in its UI.
- **Brown and white** are full sorting colours.
- Low-poly-feeling **"soft vinyl toy" Models** with big friendly screws, rather than detailed dioramas.
- A **level path strip** of Model thumbnails under the level title.
- Locked extra Box positions shown in the row as grey "+ AD" tiles.

## 10. Qualities to carry over

Each quality is written for original art. None of them copies an asset, icon, logo, layout detail, caption style or sampled value.

| # | Quality to make in our own art | Feeds (in [UI visual style](../issues/17-ui-visual-style.md)) |
|---|---|---|
| 1 | **Soft toy-like Model**: chunky primitives with generous rounded bevels and no hard edges, so the car reads as a moulded toy. Bevel highlights take the place of outlines on the body | Boxes and Buffer as objects (material and shading). The car's look via [02](../issues/02-clean-cartoon-look-on-mobile.md) |
| 2 | **Soft, light shading over cel bands**: a wide soft highlight and gentle darkening in creases. Shadow sides stay light and coloured. *Inferred* to be Lambert/PBR-like with AO. If we go toon, a soft 2–3 step ramp with smoothed steps comes closest | Material and shading decision (toon vs Lambert) |
| 3 | **Saturation hierarchy**: the Pins and Box tints are the only fully saturated things. The car body is muted cream, greys and pastels, and the background is paler still | Colour roles; car body colours; background |
| 4 | **Pin head as a wide, low, slightly domed disc** with a small rim chamfer, sitting almost flush like a button, with a glossy highlight. The head mark is a recess in a darker tone of the Pin's own colour, with a visible inner wall. This matches the Candy palette and the Head mark decision in [12](../issues/12-pin-colours-and-colour-blind-readability.md) | Pin head form; Head mark readability; tap target size |
| 5 | **A short, chunky threaded shank revealed on pop-out**, so pulling a Pin reads as unscrewing. At rest only the head shows | Pin form (motion timing stays with [09](../issues/09-animation-sequencing-and-input.md)) |
| 6 | **Box as a chunky, padded object**: a thick tinted rim with visible side depth, around a near-white inset panel with Capacity-many recessed holes. The colour lives in the rim, and the holes stay neutral. Give our Box its own silhouette (not side tabs, ears or handles copied from others) | Boxes as objects; how a Box shows its colour |
| 7 | **An empty slot that reads as a real hole**: a mid-grey disc with an inner shadow on the upper edge. With the colour-blind setting on, that colour's drive recess shows faintly in it ([12](../issues/12-pin-colours-and-colour-blind-readability.md)) | How an empty slot reads |
| 8 | **Buffer smaller and quieter than the Boxes**: a centred row of round grommet-like slots under the Box row. **Add a clear fill warning of our own** (for example the rings warming towards our fail colour as slots fill, and a pulse on the last free slot). The reference shows none I could see, so this is our design | Buffer warning |
| 9 | **A pale, plain, cool backdrop** (a soft vertical gradient, no floor or scenery) that fills the letterbox seamlessly and contrasts with a warm car | Background |
| 10 | **Fat, rounded, heavy type** for the level title and banners: all-caps, light fill with a dark outline or shadow. It must be a free, self-hostable font precached with the build (licence to check in 17) | Type |
| 11 | **Chunky "candy" buttons**: rounded squares with a lighter face, a darker rim and a thicker darker bottom edge, so they look pressable. Small badge in a corner for state. Use in-house icons with simple filled shapes, at most a single highlight | Buttons and icons (Restart, dev Undo, mute, colour-blind toggle) |
| 12 | **Functional colour roles**: green = go/confirm, gold = reward/win, red = close/fail, deep navy = ink and counters, warm cream = button and card surfaces. Pick our own values, built from Candy | Colour roles (accent, ink, surfaces, success, fail) |
| 13 | **Win banner as a celebration**: dim the scene, bold outlined headline, a burst of sparkles or a star, then a short bounce-in. **Lose banner** calmer and clearly different (no reward colours) | Win and lose banners |
| 14 | **Light, airy feedback**: sparkles at the pop-out, a soft pale arc trail on the flight to the Box, and a faint glowing ring on the emptied Socket. Particles are small and white or pale, never noisy | Flourishes (timing with [09](../issues/09-animation-sequencing-and-input.md)) |
| 15 | **A wood or workshop accent** is an option for the UI theme, as one material used sparingly. It's Screwdom's most recognisable choice, so if we use it, make it our own (or choose another material) | Overall UI theme |

## 11. Not verified

- **Real-time motion:** easing, durations, how Parts fall (drop, fade or fly), Box close and replace animations, and whether the camera moves. I saw only stills and storyboard frames about 5 s apart.
- **Buffer fill warning:** whether the game warns at all as the Buffer fills, and how. Not visible in any frame I could read.
- **Blocked Pin feedback and press highlight.**
- **The exact HUD font** (I can only describe its character) and whether it is a stock font.
- **On-device shading model** (PBR, Lambert with baked AO, or matcap). Inferred from stills only. Marketing shots may be offline renders.
- **Whether every level uses the pale blue background.** Events and seasonal themes (Halloween, Harvest, per the App Store notes) may change it.
- **Developer identity:** Play says "iKame Games - Zego Studio", the App Store seller is Zego Global Pte Ltd, and one YouTube description says "Dino Global Studio". A search summary claimed a US App Store page showed Dino Global Studio, but the page I fetched shows Zego Global Pte Ltd. I couldn't confirm the corporate relationship from a primary source.
- **The win, lose and pause screens** were read from ~100 px-wide storyboard frames. Layout and colours are approximate, and the text was partly illegible.
- **Developers of the comparison games** other than Screw Jam (Rollic Games).
- **Audio:** the claims come from store copy only.

Downloaded images were kept outside the repo, under the job's temp folder, and are not part of this research.
