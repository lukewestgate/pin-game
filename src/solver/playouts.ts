// Random tapping: how forgiving is the Level? The loop is copied exactly from the Sorting rules
// prototype (and `car-sweep.cjs`), so win rates match the measured ones.
import type { Level } from '../rules/level';
import { hash32, rng } from '../rules/random';
import { initialState, tap } from '../rules/rules';
import { legalTaps } from '../rules/state';

export interface PlayoutOptions {
  count?: number;
  seed?: number;
  /** Polled before each playout; return true to stop early. */
  shouldStop?: () => boolean;
}

export interface PlayoutResult {
  /** Playouts actually run (fewer than `count` if stopped). */
  played: number;
  winRate: number;
}

export function playouts(level: Level, options: PlayoutOptions = {}): PlayoutResult {
  const n = options.count ?? 1000;
  const seed = options.seed ?? 1;
  const start = initialState(level).state;
  let wins = 0;
  let played = 0;
  for (let k = 0; k < n; k++) {
    if (options.shouldStop?.()) break;
    const r = rng(hash32(seed, k));
    let st = start;
    while (st.status === 'playing') {
      const legal = legalTaps(level, st);
      if (legal.length === 0) break; // deadlock (e.g. cyclic coveredBy): counts as a loss
      st = tap(level, st, legal[Math.floor(r() * legal.length)] as number).state;
    }
    if (st.status === 'won') wins++;
    played++;
  }
  return { played, winRate: played ? wins / played : 0 };
}
