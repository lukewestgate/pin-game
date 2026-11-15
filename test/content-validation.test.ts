import { describe, expect, it } from 'vitest';
import { loadLevel } from '../src/content/loader';
import { ContentError } from '../src/content/validate';

const up = [0, 1, 0];
const shape = { kind: 'box', size: [1, 1, 1], position: [0, 0, 0], colour: '#8fa7c4' };
const socket = (id: string, coveredBy: string[] = []) => ({
  id,
  position: [0, 0, 0],
  direction: up,
  coveredBy,
});
const part = (id: string, sockets: ReturnType<typeof socket>[] = []) => ({
  id,
  shapes: [shape],
  sockets,
});
const model = (parts: ReturnType<typeof part>[], id = 'm') => ({ id, formatVersion: 1, parts });
const level = (colours: Record<string, number>, extra: object = {}) => ({
  id: 'l',
  formatVersion: 1,
  model: 'm',
  seed: 1,
  colours,
  rules: { capacity: 2 },
  ...extra,
});

/** A valid pair to mutate: two Parts, two Pins each, Capacity 2. */
const good = () => ({
  model: model([part('a', [socket('a1'), socket('a2')]), part('b', [socket('b1'), socket('b2')])]),
  level: level({ a1: 0, a2: 1, b1: 0, b2: 1 }),
});

function load(levelJson: unknown, ...models: unknown[]): ContentError {
  const files = Object.fromEntries(models.map((m, i) => [`model-${i}.json`, m]));
  try {
    loadLevel(levelJson, 'level.json', files);
  } catch (e) {
    expect(e).toBeInstanceOf(ContentError);
    return e as ContentError;
  }
  throw new Error('expected a ContentError');
}

describe('content validation', () => {
  it('accepts a valid Level', () => {
    const { model, level } = good();
    expect(() => loadLevel(level, 'level.json', { 'model-0.json': model })).not.toThrow();
  });

  it('names the file and path for a bad Zod shape', () => {
    const { model, level } = good();
    const bad = { ...level, seed: 'x' };
    const error = load(bad, model);
    expect(error.file).toBe('level.json');
    expect(error.message).toContain('level.json');
    expect(error.message).toContain('seed');
  });

  it('names the Model file for a bad Model shape', () => {
    const { level } = good();
    const error = load(level, { id: 'm', formatVersion: 1, parts: [] });
    expect(error.message).toContain('model-0.json');
  });

  it('rejects a Socket with no colour, naming it', () => {
    const { model, level } = good();
    const error = load({ ...level, colours: { a1: 0, a2: 1, b1: 0 } }, model);
    expect(error.message).toContain('level.json');
    expect(error.message).toContain('Socket b2');
  });

  it('rejects a colour for an unknown Socket, naming it', () => {
    const { model, level } = good();
    const error = load({ ...level, colours: { ...level.colours, zz: 0 } }, model);
    expect(error.message).toContain('Socket zz');
  });

  it('rejects a colour outside the palette, naming the Socket', () => {
    const { model, level } = good();
    const error = load({ ...level, colours: { ...level.colours, a1: 10, a2: 10 } }, model);
    expect(error.message).toContain('Socket a1');
  });

  it('rejects a colour total that is not a multiple of Capacity', () => {
    const { model, level } = good();
    const error = load({ ...level, rules: { capacity: 3 } }, model);
    expect(error.message).toContain('level.json');
    expect(error.message).toContain('multiple of Capacity 3');
  });

  it('uses the default Capacity when the Level does not override it', () => {
    const { model, level } = good();
    const noRules = { ...level, rules: undefined };
    expect(load(noRules, model).message).toContain('multiple of Capacity 3');
  });

  it('rejects a covering loop, naming the Parts', () => {
    const m = model([
      part('a', [socket('a1', ['b']), socket('a2')]),
      part('b', [socket('b1', ['a']), socket('b2')]),
    ]);
    const error = load(level({ a1: 0, a2: 1, b1: 0, b2: 1 }), m);
    expect(error.message).toContain('model-0.json');
    expect(error.message).toContain('covering loop');
    expect(error.message).toMatch(/a -> b -> a|b -> a -> b/);
  });

  it('rejects a longer covering loop', () => {
    const m = model([
      part('a', [socket('a1', ['b'])]),
      part('b', [socket('b1', ['c'])]),
      part('c', [socket('c1', ['a'])]),
    ]);
    expect(load(level({ a1: 0, b1: 0, c1: 0 }), m).message).toContain('covering loop');
  });

  it('rejects a Core covering a Socket, naming both', () => {
    const m = model([part('a', [socket('a1', ['core']), socket('a2')]), part('core')]);
    const error = load(level({ a1: 0, a2: 0 }), m);
    expect(error.message).toContain('Socket a1');
    expect(error.message).toContain('Core core');
  });

  it('rejects a Socket covered by its own Part, naming it', () => {
    const m = model([part('a', [socket('a1', ['a']), socket('a2')])]);
    const error = load(level({ a1: 0, a2: 0 }), m);
    expect(error.message).toContain('Socket a1');
    expect(error.message).toContain('own Part a');
  });

  it('rejects an unknown covering Part, naming it', () => {
    const m = model([part('a', [socket('a1', ['ghost']), socket('a2')])]);
    const error = load(level({ a1: 0, a2: 0 }), m);
    expect(error.message).toContain('Socket a1');
    expect(error.message).toContain('ghost');
  });

  it('rejects duplicate Part ids', () => {
    const m = model([part('a', [socket('a1')]), part('a', [socket('a2')])]);
    expect(load(level({ a1: 0, a2: 0 }), m).message).toContain('duplicate Part id a');
  });

  it('rejects duplicate Socket ids, even across Parts', () => {
    const m = model([part('a', [socket('s')]), part('b', [socket('s')])]);
    expect(load(level({ s: 0 }), m).message).toContain('duplicate Socket id s');
  });

  it('rejects duplicate Model ids across files', () => {
    const { model, level } = good();
    expect(load(level, model, model).message).toContain('duplicate Model id m');
  });

  it('rejects an unknown Model id', () => {
    const { model, level } = good();
    const error = load({ ...level, model: 'nope' }, model);
    expect(error.message).toContain('level.json');
    expect(error.message).toContain('unknown Model id nope');
  });
});
