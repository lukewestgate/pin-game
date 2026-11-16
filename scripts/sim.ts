// `pnpm sim [query]`: boots the game on a dev server, loads it in headless Firefox with `?sim`,
// and saves a screenshot of the report (frame costs plus a snapshot of the canvas).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const port = 5187;
const query = process.argv[2] ?? '';
const out = process.env.SIM_OUT ?? 'sim.png';
const profile = '.sim-profile';
const size = process.env.SIM_SIZE ?? '390,844';

const server = spawn('pnpm', ['exec', 'vite', '--port', String(port), '--strictPort'], {
  stdio: 'ignore',
});
try {
  await sleep(3000);
  mkdirSync(profile, { recursive: true });
  // SIM_DPR=2 renders at a phone's pixel ratio, so fill-rate costs show up as they would there.
  writeFileSync(
    `${profile}/user.js`,
    `user_pref("layout.css.devPixelsPerPx", "${process.env.SIM_DPR ?? '1'}");\n`,
  );
  rmSync(out, { force: true });
  // Firefox fails now and then on a reused profile, so try a few times.
  for (let attempt = 0; attempt < 4 && !existsSync(out); attempt++) {
    await new Promise<void>((resolve) => {
      const ff = spawn(
        'firefox',
        [
          '--headless',
          '--no-remote',
          '--profile',
          profile,
          '--window-size',
          size,
          '--screenshot',
          out,
          `http://localhost:${port}/?sim${query ? `&${query}` : ''}`,
        ],
        { stdio: 'ignore' },
      );
      const timer = setTimeout(() => ff.kill(), 120_000);
      ff.on('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    if (!existsSync(out)) await sleep(3000);
  }
  console.log(existsSync(out) ? `Saved ${out}` : 'No screenshot was produced');
} finally {
  server.kill();
  rmSync(profile, { recursive: true, force: true });
}
