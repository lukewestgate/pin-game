import { describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { report } from '../src/solver/report';

const level = bundledLevels().find((l) => l.id === 'wooden-car-1');
if (!level) throw new Error('missing wooden-car-1');
const model = level.model;
const withCoverCount = (pred: (n: number) => boolean) =>
  model.parts.flatMap((p) => p.sockets).filter((s) => pred(s.coveredBy.length));

describe('wooden-toy car Model', () => {
  it('has the ticket 07 Parts, Cores and covering', () => {
    expect(model.parts.map((p) => p.id)).toEqual([
      'wheel-fl',
      'wheel-fr',
      'wheel-rl',
      'wheel-rr',
      'bonnet',
      'roof',
      'door-l',
      'door-r',
      'tailgate',
      'spare-wheel',
      'axle-front',
      'axle-rear',
      'engine',
      'seat-l',
      'seat-r',
      'steering-wheel',
      'rear-seat',
      'chassis',
      'bumper-front',
      'bumper-rear',
      'headlight-l',
      'headlight-r',
    ]);
    const cores = model.parts.filter((p) => p.sockets.length === 0).map((p) => p.id);
    expect(cores).toEqual(['chassis', 'bumper-front', 'bumper-rear', 'headlight-l', 'headlight-r']);
    expect(withCoverCount((n) => n === 0)).toHaveLength(16);
    expect(withCoverCount((n) => n === 1)).toHaveLength(14);
    const covers = Object.fromEntries(
      model.parts
        .filter((p) => p.sockets.length)
        .map((p) => [p.id, [...new Set(p.sockets.flatMap((s) => s.coveredBy))]]),
    );
    expect(covers['axle-front']).toEqual(['wheel-fl', 'wheel-fr']);
    expect(covers['axle-rear']).toEqual(['wheel-rl', 'wheel-rr']);
    expect(covers['engine']).toEqual(['bonnet']);
    expect(covers['seat-l']).toEqual(['door-l']);
    expect(covers['seat-r']).toEqual(['door-r']);
    expect(covers['steering-wheel']).toEqual(['roof']);
    expect(covers['rear-seat']).toEqual(['tailgate']);
  });

  it('keeps the prototype variant C Socket positions', () => {
    const tailgate = model.parts.find((p) => p.id === 'tailgate');
    expect(tailgate?.sockets.map((s) => s.position)).toEqual([
      [-1.76, 2.1, 0.58],
      [-1.76, 1.45, -0.58],
    ]);
  });

  it('uses wood finish and rounding on the body', () => {
    const chassis = model.parts.find((p) => p.id === 'chassis');
    expect(chassis?.shapes.every((s) => s.finish === 'wood')).toBe(true);
    expect(model.parts.flatMap((p) => p.shapes).some((s) => s.round !== undefined)).toBe(true);
  });
});

describe('frozen wooden-car-1 Level', () => {
  it('is 5 colours x 6 with the Buffer 6 override', () => {
    expect([level.boxes, level.capacity, level.bufferSize, level.nextColour]).toEqual([
      3,
      3,
      6,
      'reachable-first',
    ]);
    expect(level.pins).toHaveLength(30);
    for (const c of [0, 1, 2, 3, 4])
      expect(level.pins.filter((p) => p.colour === c)).toHaveLength(6);
  });

  it('obeys the dealing constraints', () => {
    for (const part of level.pinsOfPart) {
      const colours = part.map((i) => level.pins[i]?.colour);
      if (colours.length > 1) expect(new Set(colours).size).toBeGreaterThan(1);
    }
    const outer = new Set(level.pins.filter((p) => p.coveredBy.length === 0).map((p) => p.colour));
    expect(outer.size).toBe(5);
  });

  it('is proven winnable at a random-tap win rate inside 60-80%', () => {
    const r = report(level);
    expect(r.verdict).toBe('winnable');
    expect(r.winRate).toBeGreaterThanOrEqual(0.6);
    expect(r.winRate).toBeLessThanOrEqual(0.8);
    // car-sweep.cjs (the prototype rules module, 1000 playouts, playout seed 1) measures 0.700.
    expect(r.winRate).toBe(0.7);
  }, 60_000);
});
