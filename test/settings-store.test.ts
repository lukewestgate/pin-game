import { describe, expect, it } from 'vitest';
import { createSettingsStore, SETTINGS_KEY, type KeyValueStorage } from '../src/settings/store';

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const data = { ...initial };
  return {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const broken: KeyValueStorage = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
};

describe('settings store', () => {
  it('defaults to sound on and screw shapes off', () => {
    const store = createSettingsStore(fakeStorage());
    expect(store.get('sound')).toBe(true);
    expect(store.get('screwShapes')).toBe(false);
  });

  it('remembers a change across a reload (a new store on the same storage)', () => {
    const storage = fakeStorage();
    createSettingsStore(storage).set('screwShapes', true);
    createSettingsStore(storage).set('sound', false);
    const reloaded = createSettingsStore(storage);
    expect(reloaded.get('screwShapes')).toBe(true);
    expect(reloaded.get('sound')).toBe(false);
  });

  it('keeps defaults for keys a stored value lacks, and ignores corrupt or mistyped data', () => {
    expect(
      createSettingsStore(fakeStorage({ [SETTINGS_KEY]: '{"sound":false}' })).get('screwShapes'),
    ).toBe(false);
    const bad = createSettingsStore(fakeStorage({ [SETTINGS_KEY]: '{"sound":"no"}' }));
    expect(bad.get('sound')).toBe(true);
    expect(createSettingsStore(fakeStorage({ [SETTINGS_KEY]: 'not json' })).get('sound')).toBe(
      true,
    );
  });

  it('falls back to memory when storage throws, and still works for the session', () => {
    const store = createSettingsStore(broken);
    expect(store.get('sound')).toBe(true);
    store.set('sound', false);
    expect(store.get('sound')).toBe(false);
  });

  it('works with no storage at all', () => {
    const store = createSettingsStore(null);
    store.set('screwShapes', true);
    expect(store.get('screwShapes')).toBe(true);
  });

  it('tells subscribers about changes, until they unsubscribe', () => {
    const store = createSettingsStore(fakeStorage());
    const seen: [string, boolean][] = [];
    const off = store.subscribe((key, value) => seen.push([key, value]));
    store.set('screwShapes', true);
    off();
    store.set('screwShapes', false);
    expect(seen).toEqual([['screwShapes', true]]);
  });
});
