// The pure screen layout in CSS px, origin at the top left. No Babylon or DOM imports.
// Every number is a developer constant. See the Screen layout ticket (11).

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Screen {
  width: number;
  height: number;
}

/** The rule numbers the layout reflows from. A loaded Level has all three. */
export interface LayoutLevel {
  boxes: number;
  capacity: number;
  bufferSize: number;
}

export interface HudLayout {
  /** The centred portrait column inside the safe area; everything else sits in it. */
  column: Rect;
  boxes: Rect[];
  /** Hole rects inside each Box, row-major: ⌈Capacity/2⌉ on top. */
  boxHoles: Rect[][];
  buffer: Rect;
  bufferSlots: Rect[];
  /** Where the Model is drawn. */
  model: Rect;
  /** Where the DOM buttons sit. */
  bottomBar: Rect;
  /** A Pin head's size as a share of its slot. */
  pinHead: number;
}

export const HUD = {
  margin: 10,
  boxGap: 10,
  rowGap: 8,
  boxPad: 6,
  maxHole: 46,
  maxBufferSlot: 52,
  bufferSlotOfBoxSlot: 0.8,
  pinHead: 0.78,
  bottomBar: 48,
  /** The column's width over its height. */
  columnAspect: 9 / 16,
  /** 1 = the bounding sphere just touches the Model region's limiting edge. */
  fitMargin: 1,
} as const;

export function layout(screen: Screen, insets: Insets, level: LayoutLevel): HudLayout {
  const { margin, boxGap, rowGap, boxPad } = HUD;
  const safe: Rect = {
    x: insets.left,
    y: insets.top,
    w: Math.max(1, screen.width - insets.left - insets.right),
    h: Math.max(1, screen.height - insets.top - insets.bottom),
  };
  // Portrait screens use their whole width; landscape and desktop get the 9:16 column.
  const colW = safe.w > safe.h ? Math.min(safe.w, safe.h * HUD.columnAspect) : safe.w;
  const column: Rect = { x: safe.x + (safe.w - colW) / 2, y: safe.y, w: colW, h: safe.h };

  const cols = Math.ceil(level.capacity / 2);
  const rows = Math.ceil(level.capacity / cols);
  const avail = column.w - 2 * margin;
  const boxW = Math.min(
    (avail - (level.boxes - 1) * boxGap) / level.boxes,
    cols * HUD.maxHole + 2 * boxPad,
  );
  const slot = (boxW - 2 * boxPad) / cols;
  const boxH = rows * slot + 2 * boxPad;
  const rowW = level.boxes * boxW + (level.boxes - 1) * boxGap;
  const centreX = column.x + column.w / 2;
  const top = column.y + margin;

  const boxes: Rect[] = [];
  const boxHoles: Rect[][] = [];
  for (let b = 0; b < level.boxes; b++) {
    const box = { x: centreX - rowW / 2 + b * (boxW + boxGap), y: top, w: boxW, h: boxH };
    boxes.push(box);
    const holes: Rect[] = [];
    for (let i = 0; i < level.capacity; i++) {
      const r = Math.floor(i / cols);
      const inRow = r === 0 ? cols : level.capacity - cols;
      const c = i - r * cols;
      const rowStart = box.x + (box.w - inRow * slot) / 2;
      holes.push({ x: rowStart + c * slot, y: box.y + boxPad + r * slot, w: slot, h: slot });
    }
    boxHoles.push(holes);
  }

  const bSlot = Math.min(
    HUD.maxBufferSlot,
    HUD.bufferSlotOfBoxSlot * slot,
    (avail - 2 * boxPad) / level.bufferSize,
  );
  const bufW = level.bufferSize * bSlot + 2 * boxPad;
  const buffer = { x: centreX - bufW / 2, y: top + boxH + rowGap, w: bufW, h: bSlot + 2 * boxPad };
  const bufferSlots = Array.from({ length: level.bufferSize }, (_, i) => ({
    x: buffer.x + boxPad + i * bSlot,
    y: buffer.y + boxPad,
    w: bSlot,
    h: bSlot,
  }));

  const bottomBar = {
    x: column.x + margin,
    y: column.y + column.h - margin - HUD.bottomBar,
    w: avail,
    h: HUD.bottomBar,
  };
  const modelTop = buffer.y + buffer.h + margin;
  const model = {
    x: column.x,
    y: modelTop,
    w: column.w,
    h: Math.max(1, bottomBar.y - margin - modelTop),
  };
  return { column, boxes, boxHoles, buffer, bufferSlots, model, bottomBar, pinHead: HUD.pinHead };
}

/**
 * How far the Model camera sits from the turning centre, so a sphere of `radius` around it
 * fits the region at 1x. The narrower of the horizontal and vertical fields of view decides.
 */
export function fitDistance(radius: number, region: { w: number; h: number }, fov: number): number {
  const aspect = region.w / region.h;
  const half = Math.min(fov / 2, Math.atan(Math.tan(fov / 2) * aspect));
  return (radius * HUD.fitMargin) / Math.sin(half);
}
