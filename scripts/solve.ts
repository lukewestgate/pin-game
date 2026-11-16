// `pnpm solve [file…]`: prints each Level's solver report. With no files, every Level in the
// levels folder. The win-rate band is shown but never fails anything; an unproven Level exits 1.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadLevel } from '../src/content/loader';
import { formatReport, report } from '../src/solver/report';

const dataDir = path.resolve(import.meta.dirname, '../src/data');
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

const models = Object.fromEntries(
  readdirSync(path.join(dataDir, 'models'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f, readJson(path.join(dataDir, 'models', f))]),
);

const args = process.argv.slice(2);
const files = args.length
  ? args.map((f) => path.resolve(f))
  : readdirSync(path.join(dataDir, 'levels'))
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => path.join(dataDir, 'levels', f));

let failed = false;
for (const file of files) {
  const name = path.basename(file);
  const result = report(loadLevel(readJson(file), name, models));
  console.log(formatReport(name, result));
  if (result.verdict !== 'winnable') failed = true;
}
process.exitCode = failed ? 1 : 0;
