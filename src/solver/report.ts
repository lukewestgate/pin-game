import type { Level } from '../rules/level';
import { initialState, tap } from '../rules/rules';
import { legalTaps } from '../rules/state';
import { playouts } from './playouts';
import { DEFAULT_BUDGET, solve, type Verdict } from './solve';

/** The designer's target band for the random-tap win rate. Informational: it never fails anything. */
export const WIN_RATE_BAND = { min: 0.6, max: 0.8 } as const;

export interface ReportOptions {
  budget?: number;
  playouts?: number;
  seed?: number;
  shouldStop?: () => boolean;
}

export interface Report {
  verdict: Verdict;
  /** One winning tap order (Pin indices); empty unless `winnable`. */
  path: number[];
  nodes: number;
  playouts: number;
  /** Share of random-tap playouts that win (0 to 1). */
  winRate: number;
  /** Share of legal first taps from which the Level can still be won. 0 unless `winnable`. */
  firstTapWinShare: number;
  /** Most Pins in the Buffer at once along the winning order; null unless `winnable`. */
  peakBuffer: number | null;
}

export function report(level: Level, options: ReportOptions = {}): Report {
  const budget = options.budget ?? DEFAULT_BUDGET;
  const { shouldStop } = options;
  const main = solve(level, { budget, shouldStop });
  const rate = playouts(level, {
    count: options.playouts ?? 1000,
    seed: options.seed ?? 1,
    shouldStop,
  });
  let firstTapWinShare = 0;
  let peakBuffer: number | null = null;
  if (main.verdict === 'winnable') {
    const start = initialState(level).state;
    const firsts = legalTaps(level, start);
    let winning = 0;
    for (const pin of firsts) {
      const from = tap(level, start, pin).state;
      if (solve(level, { budget, shouldStop, from }).verdict === 'winnable') winning++;
    }
    firstTapWinShare = winning / firsts.length;
    let state = start;
    peakBuffer = 0;
    for (const pin of main.path) {
      state = tap(level, state, pin).state;
      peakBuffer = Math.max(peakBuffer, state.buffer.length);
    }
  }
  return {
    verdict: main.verdict,
    path: main.path,
    nodes: main.nodes,
    playouts: rate.played,
    winRate: rate.winRate,
    firstTapWinShare,
    peakBuffer,
  };
}

/** A few readable lines for `pnpm solve`. */
export function formatReport(name: string, r: Report): string {
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const band =
    r.winRate < WIN_RATE_BAND.min ? 'below' : r.winRate > WIN_RATE_BAND.max ? 'above' : 'within';
  return [
    `${name}: ${r.verdict.toUpperCase()} (${r.nodes} nodes)`,
    `  random-tap win rate: ${pct(r.winRate)} over ${r.playouts} playouts (${band} the ${pct(WIN_RATE_BAND.min)} to ${pct(WIN_RATE_BAND.max)} band)`,
    `  first taps that can still win: ${pct(r.firstTapWinShare)}`,
    `  peak Buffer use on the winning order: ${r.peakBuffer ?? 'n/a'}`,
    `  winning order: ${r.path.length ? r.path.join(' ') : 'none'}`,
  ].join('\n');
}
