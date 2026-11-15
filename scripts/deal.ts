// `pnpm deal [deals] [ruleSeeds]`: searches deal seeds and rule seeds on the wooden car for
// solver-proven Levels in the 60-80% random-tap band and prints the one closest to 70% as Level
// JSON on stdout (progress on stderr). Redirect it into src/data/levels/ to freeze it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadLevel, parseModel } from '../src/content/loader';
import { report, WIN_RATE_BAND } from '../src/solver/report';
import { buildLevelJson, deal, dealSlots } from './deal-lib';

const TARGET = 0.7;
const deals = Number(process.argv[2] ?? 40);
const ruleSeeds = Number(process.argv[3] ?? 3);

const modelFile = path.resolve(import.meta.dirname, '../src/data/models/wooden-car.json');
const modelJson: unknown = JSON.parse(readFileSync(modelFile, 'utf8'));
const model = parseModel(modelJson, 'wooden-car.json');
const slots = dealSlots(model);

let best: { rate: number; deal: number; seed: number; json: object } | null = null;
let tried = 0;
for (let d = 1; d <= deals; d++) {
  const colours = deal(slots, d);
  for (let s = 1; s <= ruleSeeds; s++) {
    const json = buildLevelJson('wooden-car-1', model, colours, s);
    const r = report(loadLevel(json, 'candidate', { 'wooden-car.json': modelJson }));
    tried++;
    if (r.verdict !== 'winnable') continue;
    if (r.winRate < WIN_RATE_BAND.min || r.winRate > WIN_RATE_BAND.max) continue;
    if (!best || Math.abs(r.winRate - TARGET) < Math.abs(best.rate - TARGET)) {
      best = { rate: r.winRate, deal: d, seed: s, json };
    }
  }
}
if (!best) throw new Error(`no candidate in the band after ${tried} tries`);
console.error(
  `tried ${tried}; picked deal seed ${best.deal}, rule seed ${best.seed}, win rate ${(best.rate * 100).toFixed(1)}%`,
);
console.log(JSON.stringify(best.json, null, 2));
