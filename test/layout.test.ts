import { describe, expect, it } from 'vitest';
import { fitDistance, layout, type Insets } from '../src/render/hud-layout';

function at<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`No item at ${index}`);
  return item;
}

const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const CAR = { boxes: 3, capacity: 3, bufferSize: 6 };

const close = (actual: number, expected: number, digits = 0) =>
  expect(actual).toBeCloseTo(expected, digits);

describe('layout at the Screen layout ticket sizes (3 Boxes, Capacity 3, Buffer 6)', () => {
  const cases = [
    { name: '360 x 640', w: 360, h: 640, insets: NONE, model: [360, 391] },
    {
      name: 'iPhone SE 375 x 667',
      w: 375,
      h: 667,
      insets: { ...NONE, top: 20 },
      model: [375, 398],
    },
    {
      name: 'iPhone 14 390 x 844',
      w: 390,
      h: 844,
      insets: { ...NONE, top: 47, bottom: 34 },
      model: [390, 514],
    },
    { name: 'desktop 1280 x 800 column', w: 1280, h: 800, insets: NONE, model: [450, 551] },
  ];
  for (const c of cases) {
    it(c.name, () => {
      const l = layout({ width: c.w, height: c.h }, c.insets, CAR);
      expect(l.boxes).toHaveLength(3);
      close(at(l.boxes, 0).w, 104);
      close(at(l.boxes, 0).h, 104);
      close(at(at(l.boxHoles, 0), 0).w * l.pinHead, 36);
      close(at(l.bufferSlots, 0).w, 37);
      close(at(l.bufferSlots, 0).w * l.pinHead, 29);
      close(l.model.w, at(c.model, 0));
      close(l.model.h, at(c.model, 1));
    });
  }
});

describe('layout structure', () => {
  const l = layout({ width: 360, height: 640 }, NONE, CAR);

  it('stacks the bands with the constant margins', () => {
    expect(at(l.boxes, 0).y).toBe(10);
    close(l.buffer.y, 10 + 104 + 8, 5);
    close(l.model.y, l.buffer.y + l.buffer.h + 10, 5);
    expect(l.bottomBar.h).toBe(48);
    expect(l.bottomBar.y).toBe(640 - 10 - 48);
    close(l.model.y + l.model.h + 10, l.bottomBar.y, 5);
  });

  it('centres the Box row with 10 between Boxes', () => {
    expect(at(l.boxes, 1).x - (at(l.boxes, 0).x + at(l.boxes, 0).w)).toBe(10);
    close(at(l.boxes, 0).x, 360 - (at(l.boxes, 2).x + at(l.boxes, 2).w), 5);
  });

  it('puts ⌈Capacity/2⌉ slots on the top row and centres the rest below', () => {
    const holes = at(l.boxHoles, 0);
    expect(at(holes, 0).y).toBe(at(holes, 1).y);
    expect(at(holes, 2).y).toBeGreaterThan(at(holes, 0).y);
    close(at(holes, 2).x + at(holes, 2).w / 2, at(l.boxes, 0).x + at(l.boxes, 0).w / 2, 5);
  });
});

describe('reflow', () => {
  it('shrinks Boxes to fit more of them', () => {
    const l = layout({ width: 360, height: 640 }, NONE, { ...CAR, boxes: 4 });
    expect(l.boxes).toHaveLength(4);
    close(at(l.boxes, 0).w, (340 - 30) / 4, 5);
    expect(at(l.boxes, 3).x + at(l.boxes, 3).w).toBeLessThanOrEqual(350 + 1e-9);
  });

  it('widens Boxes with Capacity, up to the 46 px slot cap', () => {
    const l = layout({ width: 360, height: 640 }, NONE, { ...CAR, boxes: 2, capacity: 4 });
    close(at(l.boxes, 0).w, 2 * 46 + 12, 5);
    expect(l.boxHoles[0]).toHaveLength(4);
    close(at(l.boxes, 0).h, 2 * 46 + 12, 5);
  });

  it('limits the Buffer slot to what fits in one row', () => {
    const l = layout({ width: 360, height: 640 }, NONE, { ...CAR, bufferSize: 12 });
    close(at(l.bufferSlots, 0).w, (340 - 12) / 12, 5);
    expect(l.buffer.w).toBeLessThanOrEqual(340 + 1e-9);
  });

  it('caps the Buffer slot at 52', () => {
    const l = layout({ width: 360, height: 640 }, NONE, { boxes: 1, capacity: 10, bufferSize: 3 });
    expect(at(l.bufferSlots, 0).w).toBeLessThanOrEqual(52);
  });

  it('keeps the Model region positive on a tiny screen', () => {
    const l = layout({ width: 200, height: 250 }, NONE, CAR);
    expect(l.model.h).toBeGreaterThan(0);
  });
});

describe('safe insets and the column', () => {
  it('moves every band inside the insets', () => {
    const l = layout({ width: 390, height: 844 }, { top: 47, right: 0, bottom: 34, left: 0 }, CAR);
    expect(at(l.boxes, 0).y).toBe(47 + 10);
    expect(l.bottomBar.y + l.bottomBar.h + 10).toBe(844 - 34);
  });

  it('centres the column in the area left by side insets', () => {
    const l = layout({ width: 800, height: 360 }, { top: 0, right: 44, bottom: 21, left: 44 }, CAR);
    close(l.column.w, (339 * 9) / 16, 5);
    close(l.column.x, 44 + (712 - l.column.w) / 2, 5);
  });

  it('uses a 9:16 column of the safe height in landscape', () => {
    const l = layout({ width: 800, height: 360 }, NONE, CAR);
    close(l.column.w, (360 * 9) / 16, 5);
    close(l.column.x, (800 - l.column.w) / 2, 5);
    expect(l.column.h).toBe(360);
    close(at(l.boxes, 0).w, (202.5 - 20 - 20) / 3, 5);
    close(l.model.x, l.column.x, 5);
    close(l.model.w, l.column.w, 5);
  });

  it('keeps the full width on a portrait screen that is wider than 9:16', () => {
    const l = layout({ width: 375, height: 667 }, NONE, CAR);
    expect(l.column.w).toBe(375);
  });

  it('uses the full safe width on a portrait phone', () => {
    const l = layout({ width: 360, height: 640 }, NONE, CAR);
    expect(l.column).toEqual({ x: 0, y: 0, w: 360, h: 640 });
  });
});

describe('fitDistance', () => {
  const fov = 0.8;
  it('fits the sphere to the narrower field of view of the region', () => {
    const tall = fitDistance(10, { w: 360, h: 391 }, fov);
    const wide = fitDistance(10, { w: 391, h: 360 }, fov);
    // Width limits the tall-ish region, so its horizontal half-angle is used.
    expect(tall).toBeGreaterThan(10 / Math.sin(fov / 2));
    expect(wide).toBeCloseTo(10 / Math.sin(fov / 2), 5);
  });

  it('puts the sphere edge exactly on the limiting edge (fit margin 1.0)', () => {
    const w = 300;
    const h = 600;
    const d = fitDistance(10, { w, h }, fov);
    const halfH = Math.atan(Math.tan(fov / 2) * (w / h));
    expect(Math.sin(halfH) * d).toBeCloseTo(10, 5);
  });
});
