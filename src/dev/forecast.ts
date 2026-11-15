// Dev-only next-Box forecast: which colour the next-colour rule would give a Box slot if that Box
// closed right now. Never shown to players.
import type { Level } from '../rules/level';
import { candidateColours } from '../rules/next-colour';
import { hash32 } from '../rules/random';
import type { State } from '../rules/state';

/** A colour index, or null for a grey Box. */
export function forecastNextBox(level: Level, state: State, box: number): number | null {
  // As in closeBox: the closed Box has left before the next colour is chosen.
  const vacated: State = {
    ...state,
    boxes: state.boxes.map((b, i) => (i === box ? { colour: null, fill: 0 } : b)),
  };
  const candidates = candidateColours(level, vacated);
  if (!candidates.length) return null;
  return candidates[hash32(level.seed, state.picks) % candidates.length] ?? null;
}
