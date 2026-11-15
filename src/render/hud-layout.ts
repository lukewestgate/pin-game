// A stand-in HUD layout in CSS px, origin at the top left. No Babylon or DOM imports.
// The full pure `layout(screen, safeInsets, level)` (safe areas, portrait column) is ticket 24.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HudLayout {
  boxes: Rect[];
  /** Hole rects inside each Box, row-major: ⌈Capacity/2⌉ on top. */
  boxSlots: Rect[][];
  buffer: Rect;
  bufferSlots: Rect[];
  /** Where the Model is drawn. */
  model: Rect;
}

export const HUD = {
  margin: 10,
  boxGap: 10,
  rowGap: 8,
  boxPad: 6,
  maxSlot: 46,
  maxBufferSlot: 52,
  bottomBar: 48,
} as const;

export function hudLayout(
  width: number,
  height: number,
  rules: { boxes: number; capacity: number; bufferSize: number },
): HudLayout {
  const { margin, boxGap, rowGap, boxPad } = HUD;
  const cols = Math.ceil(rules.capacity / 2);
  const rows = Math.ceil(rules.capacity / cols);
  const avail = width - 2 * margin;
  const boxW = Math.min(
    (avail - (rules.boxes - 1) * boxGap) / rules.boxes,
    cols * HUD.maxSlot + 2 * boxPad,
  );
  const slot = (boxW - 2 * boxPad) / cols;
  const boxH = rows * slot + 2 * boxPad;
  const rowW = rules.boxes * boxW + (rules.boxes - 1) * boxGap;
  const top = margin;

  const boxes: Rect[] = [];
  const boxSlots: Rect[][] = [];
  for (let b = 0; b < rules.boxes; b++) {
    const box = { x: (width - rowW) / 2 + b * (boxW + boxGap), y: top, w: boxW, h: boxH };
    boxes.push(box);
    const holes: Rect[] = [];
    for (let i = 0; i < rules.capacity; i++) {
      const r = Math.floor(i / cols);
      const inRow = r === 0 ? cols : rules.capacity - cols;
      const c = i - r * cols;
      const rowStart = box.x + (box.w - inRow * slot) / 2;
      holes.push({ x: rowStart + c * slot, y: box.y + boxPad + r * slot, w: slot, h: slot });
    }
    boxSlots.push(holes);
  }

  const bSlot = Math.min(HUD.maxBufferSlot, 0.8 * slot, (avail - 2 * boxPad) / rules.bufferSize);
  const bufW = rules.bufferSize * bSlot + 2 * boxPad;
  const buffer = { x: (width - bufW) / 2, y: top + boxH + rowGap, w: bufW, h: bSlot + 2 * boxPad };
  const bufferSlots = Array.from({ length: rules.bufferSize }, (_, i) => ({
    x: buffer.x + boxPad + i * bSlot,
    y: buffer.y + boxPad,
    w: bSlot,
    h: bSlot,
  }));

  const modelTop = buffer.y + buffer.h + margin;
  const modelBottom = height - margin - HUD.bottomBar - margin;
  const model = { x: 0, y: modelTop, w: width, h: Math.max(1, modelBottom - modelTop) };
  return { boxes, boxSlots, buffer, bufferSlots, model };
}
