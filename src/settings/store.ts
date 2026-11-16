// The settings store: load/get/set over a key-value storage (`localStorage` in the browser).
// If storage is missing or throws (private windows), it keeps the values in memory for the
// session. Shaped like the future progress store.

export interface Settings {
  /** Sound effects on. The bar's Mute button and the sheet's Sound switch share this. */
  sound: boolean;
  /** Colour-blind help: each Pin colour gets its own Head mark. */
  screwShapes: boolean;
}

export type SettingKey = keyof Settings;

export const SETTINGS_KEY = 'pin-game:settings';
export const DEFAULT_SETTINGS: Readonly<Settings> = { sound: true, screwShapes: false };

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SettingsStore {
  get<K extends SettingKey>(key: K): Settings[K];
  set<K extends SettingKey>(key: K, value: Settings[K]): void;
  /** Called after every `set`. Returns an unsubscribe function. */
  subscribe(listener: (key: SettingKey, value: boolean) => void): () => void;
}

function load(storage: KeyValueStorage | null): Settings {
  const values: Settings = { ...DEFAULT_SETTINGS };
  try {
    const raw = storage?.getItem(SETTINGS_KEY);
    if (!raw) return values;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return values;
    for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'boolean') values[key] = value;
    }
  } catch {
    // Unreadable storage: keep the defaults.
  }
  return values;
}

export function createSettingsStore(storage: KeyValueStorage | null): SettingsStore {
  const values = load(storage);
  const listeners = new Set<(key: SettingKey, value: boolean) => void>();
  return {
    get: (key) => values[key],
    set(key, value) {
      values[key] = value;
      try {
        storage?.setItem(SETTINGS_KEY, JSON.stringify(values));
      } catch {
        // Storage failed: the value still holds for this session.
      }
      for (const listener of listeners) listener(key, value);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** `localStorage`, or null where even touching it throws. */
export function browserStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
