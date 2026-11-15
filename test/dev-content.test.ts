import { describe, expect, it } from 'vitest';
import { loadDevContent } from '../src/dev/dev-content';
import cartLevel from '../src/data/levels/tiny-cart-1.json';
import cartModel from '../src/data/models/tiny-cart.json';

const models = { 'tiny-cart.json': cartModel };

describe('dev content loading', () => {
  it('loads every good Level and reports no errors', () => {
    const r = loadDevContent(models, { 'tiny-cart-1.json': cartLevel });
    expect(r.levels.map((l) => l.id)).toEqual(['tiny-cart-1']);
    expect(r.errors).toEqual([]);
  });

  it('collects a bad Level as an error naming the file and the Socket id, and keeps the rest', () => {
    const colours: Record<string, number> = { ...cartLevel.colours };
    delete colours['wheel-fl'];
    const bad = { ...cartLevel, id: 'broken', colours };
    const r = loadDevContent(models, { 'a-broken.json': bad, 'tiny-cart-1.json': cartLevel });
    expect(r.levels.map((l) => l.id)).toEqual(['tiny-cart-1']);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.file).toBe('a-broken.json');
    expect(r.errors[0]?.message).toContain('wheel-fl');
  });

  it('reports a broken Model by its own file name', () => {
    const badModel = { ...cartModel, formatVersion: 99 };
    const r = loadDevContent({ 'tiny-cart.json': badModel }, { 'tiny-cart-1.json': cartLevel });
    expect(r.levels).toEqual([]);
    expect(r.errors[0]?.file).toBe('tiny-cart.json');
  });

  it('reports a duplicate Level id on the later file', () => {
    const r = loadDevContent(models, {
      'a.json': cartLevel,
      'b.json': cartLevel,
    });
    expect(r.levels).toHaveLength(1);
    expect(r.errors[0]?.file).toBe('b.json');
    expect(r.errors[0]?.message).toContain('tiny-cart-1');
  });
});
