import { describe, expect, it } from 'vitest';
import { parseModel } from '../src/content/loader';
import carJson from '../src/data/models/wooden-car.json';
import { buildLevelJson, deal, dealSlots } from '../scripts/deal-lib';

const model = parseModel(carJson, 'wooden-car.json');
const slots = dealSlots(model);

describe('dealing script', () => {
  it('lists the 30 Sockets in Part order with their depth', () => {
    expect(slots).toHaveLength(30);
    expect(slots.filter((s) => s.outer)).toHaveLength(16);
  });

  it('is deterministic per seed and differs between seeds', () => {
    expect(deal(slots, 5)).toEqual(deal(slots, 5));
    expect(deal(slots, 5)).not.toEqual(deal(slots, 6));
  });

  it('deals 6 Pins of each of 5 colours, honouring both constraints', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const colours = deal(slots, seed);
      for (let c = 0; c < 5; c++) expect(colours.filter((x) => x === c)).toHaveLength(6);
      const byPart = new Map<number, number[]>();
      slots.forEach((s, i) =>
        byPart.set(s.part, [...(byPart.get(s.part) ?? []), colours[i] ?? -1]),
      );
      for (const cs of byPart.values())
        if (cs.length > 1) expect(new Set(cs).size).toBeGreaterThan(1);
      const outer = new Set(colours.filter((_, i) => slots[i]?.outer));
      expect(outer.size).toBe(5);
    }
  });

  it('writes an explicit colour per Socket with the Buffer 6 override and no deal seed', () => {
    const json = buildLevelJson('x', model, deal(slots, 1), 3);
    expect(Object.keys(json.colours)).toHaveLength(30);
    expect(json.rules).toEqual({
      boxes: 3,
      capacity: 3,
      bufferSize: 6,
      nextColour: 'reachable-first',
    });
    expect(json.seed).toBe(3);
    expect(Object.keys(json)).not.toContain('dealSeed');
  });
});
