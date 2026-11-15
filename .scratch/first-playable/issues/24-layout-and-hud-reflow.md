# 24: Layout and HUD reflow

**What to build:** The screen is laid out as designed on every phone: the Box row and then the Buffer at the top, the car in the middle, and the bottom bar below. It reflows from the Level's numbers, respects safe areas, and becomes a centred portrait column in landscape and on desktop. See [spec](../spec.md): Layout and HUD; Screen layout ticket (11).

**Blocked by:** 20 (Walking skeleton).

**Status:** ready-for-agent

- [x] A pure `layout(screen, safeInsets, level) → rects` in CSS px, with no Babylon or DOM imports. The bands are margin 10, Box row (10 apart, centred), gap 8, Buffer, margin 10, Model region, margin 10, bottom bar 48, margin 10. Every number is a developer constant.
- [x] Boxes are roughly square with slots in two rows (top row ⌈Capacity/2⌉). Box width = min((available − gaps) / Box count, columns × 46 + 12). Slot = (Box width − 12) / columns. A Pin head is 0.78 of its slot. Buffer slot = min(52, 0.8 × Box slot, what fits in one row).
- [x] Table tests match the Screen layout ticket at 360 × 640, 375 × 667, 390 × 844 and the desktop column (with 3/3/6: Box 104, Pin in Box 36, Buffer slot 37). Further tests cover reflow when Box count, Capacity or Buffer size change, safe insets, and the 9:16 landscape column.
- [x] `viewport-fit=cover` and a hidden probe element feed `env(safe-area-inset-*)` to `layout` as numbers.
- [x] The HUD orthographic camera works in CSS px with the origin at the top left, and HUD meshes are placed straight from the rects.
- [x] The Model camera fits the bounding sphere to the Model region, offset so the turning centre sits at the region's centre.
- [x] The bottom bar holds the DOM buttons: dev Undo on the left, Restart on the right (styling comes later).

## Comments

Implemented on branch `worktree-agent-aed8366711f165846`. Deviations and notes:

- `layout` lives in `src/render/hud-layout.ts` (the skeleton stand-in, replaced). It also returns `column`, `bottomBar` and `pinHead` (0.78); the HUD now draws Box and Buffer Pins at 0.78 of their slot (the skeleton used 0.72 in the Buffer).
- The 9:16 column applies only when the safe area is landscape. A portrait screen wider than 9:16 (iPhone SE 375 x 667) keeps its full width, as the Screen layout table assumes.
- The table figures for the 375 x 667 and 390 x 844 Model regions imply insets of top 20 and top 47 / bottom 34; the tests use those.
- Model camera fit is a pure `fitDistance` (fit margin 1.0, was 1.1). The turning centre sits at the region centre because the camera viewport is the Model region and targets the bounds centre.
- The bottom bar DOM is positioned from `layout.bottomBar` in `main.ts`; styling waits for ticket 29. Safe insets are read by `src/render/safe-insets.ts` (DOM, not unit-tested) from the hidden `#safe-probe`.
