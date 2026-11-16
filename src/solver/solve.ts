// Depth-first search over tap orders, ported from the Sorting rules prototype. Pure and headless,
// and bounded or cancellable so it can later run in a Worker.
import type { Level } from '../rules/level';
import { initialState, tap } from '../rules/rules';
import { legalTaps, type State } from '../rules/state';

export type Verdict = 'winnable' | 'unwinnable' | 'unknown';

export interface SolveOptions {
  /** Most positions to visit before giving up with `unknown`. */
  budget?: number;
  /** Polled once per position; return true to give up with `unknown`. */
  shouldStop?: () => boolean;
  /** Search from here instead of the Level's start. */
  from?: State;
}

export interface SolveResult {
  verdict: Verdict;
  /** One winning tap order (Pin indices). Empty unless `winnable`. */
  path: number[];
  nodes: number;
}

export const DEFAULT_BUDGET = 200_000;

function stateKey(st: State): string {
  const removed = st.removed.map((x) => (x ? '1' : '0')).join('');
  const buffer = st.buffer.toSorted((a, b) => a - b).join(',');
  const boxes = st.boxes
    .map((b) => `${b.colour}:${b.fill}`)
    .toSorted()
    .join(',');
  return `${removed}|${buffer}|${boxes}|${st.closes}`;
}

class GiveUp extends Error {}

export function solve(level: Level, options: SolveOptions = {}): SolveResult {
  const budget = options.budget ?? DEFAULT_BUDGET;
  const start = options.from ?? initialState(level).state;
  const dead = new Set<string>();
  const path: number[] = [];
  let nodes = 0;

  // Pins of one colour in one Part under the same cover are interchangeable.
  const pinClass = level.pins.map((p) => `${p.colour}/${p.part}/${p.coveredBy.join(',')}`);

  function dfs(st: State): boolean {
    if (st.status === 'won') return true;
    if (st.status !== 'playing') return false;
    const key = stateKey(st);
    if (dead.has(key)) return false;
    if (++nodes > budget || options.shouldStop?.()) throw new GiveUp();
    const tried = new Set<string>();
    for (const pin of legalTaps(level, st)) {
      const cls = pinClass[pin] ?? String(pin);
      if (tried.has(cls)) continue;
      tried.add(cls);
      if (dfs(tap(level, st, pin).state)) {
        path.push(pin);
        return true;
      }
    }
    dead.add(key);
    return false;
  }

  try {
    const won = dfs(start);
    return { verdict: won ? 'winnable' : 'unwinnable', path: path.reverse(), nodes };
  } catch (e) {
    if (e instanceof GiveUp) return { verdict: 'unknown', path: [], nodes };
    throw e;
  }
}
