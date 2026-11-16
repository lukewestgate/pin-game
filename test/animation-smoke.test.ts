import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import type { LoadedLevel } from '../src/content/loader';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState, tap } from '../src/rules/rules';
import type { State } from '../src/rules/state';
import { solve } from '../src/solver/solve';

const W = 360;
const H = 640;
const INSETS = { top: 20, right: 0, bottom: 30, left: 0 };

const disposables: { dispose(): void }[] = [];
afterEach(() => {
  while (disposables.length) disposables.pop()?.dispose();
});

function carLevel(): LoadedLevel {
  const level = bundledLevels().find((l) => l.id === 'wooden-car-1');
  if (!level) throw new Error('missing wooden-car-1');
  return level;
}

function makeView(level: LoadedLevel, clock: () => number, speed = 1): GameView {
  const engine = new NullEngine({
    renderWidth: W,
    renderHeight: H,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1,
  });
  const view = createGameView(engine, level, () => INSETS, { clock, speed });
  disposables.push(view, engine);
  return view;
}

/** Everything visible in the scene, so two scenes can be compared. */
function snapshot(view: GameView): string[] {
  view.scene.render();
  return view.scene.meshes
    .filter((m) => m.isEnabled())
    .map((m) => {
      const p = m.getAbsolutePosition();
      return `${m.name}@${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)}`;
    })
    .sort();
}

function expectMatchesRules(view: GameView, level: LoadedLevel, state: State): void {
  const fresh = makeView(level, () => 0);
  fresh.draw(state);
  expect(snapshot(view)).toEqual(snapshot(fresh));
  const names = view.scene.meshes.filter((m) => m.isEnabled()).map((m) => m.name);
  expect(names.filter((n) => n.startsWith('fly-'))).toEqual([]);
  expect(names.filter((n) => n.startsWith('buffer-pin-'))).toHaveLength(state.buffer.length);
  const inBoxes = state.boxes.reduce((n, b) => n + b.fill, 0);
  expect(names.filter((n) => /^box-\d+-pin-/.test(n))).toHaveLength(inBoxes);
}

describe('animation smoke test (headless)', () => {
  it('plays the car winning order at high speed and matches the rules after settling and undo', () => {
    const level = carLevel();
    const solved = solve(level);
    expect(solved.verdict).toBe('winnable');

    let now = 0;
    const view = makeView(level, () => now, 20);
    const outcomes: string[] = [];
    view.onOutcome = (o) => outcomes.push(o);
    let { state } = initialState(level);
    view.draw(state);

    const states: State[] = [state];
    solved.path.forEach((pin, i) => {
      const result = tap(level, state, pin);
      expect(result.refused).toBeUndefined();
      state = result.state;
      states.push(state);
      view.play(result.events);
      now += 10; // taps far faster than the animations
      view.scene.render();
      // Mid-play: a Pin may still be flying, so only check the final scene below.
      if (i === 5) expect(outcomes).toEqual([]);
    });

    now += 5000;
    expectMatchesRules(view, level, state);
    expect(outcomes).toEqual(['won']);

    // Undo snaps to the previous state, cancelling everything.
    const previous = states.at(-2);
    if (!previous) throw new Error('no previous state');
    view.draw(previous);
    expectMatchesRules(view, level, previous);
  });

  it('cancels animations that are still running when the state is redrawn', () => {
    const level = carLevel();
    let now = 0;
    const view = makeView(level, () => now);
    let { state } = initialState(level);
    view.draw(state);
    const first = solve(level).path.slice(0, 4);
    const history: State[] = [state];
    for (const pin of first) {
      const r = tap(level, state, pin);
      state = r.state;
      history.push(state);
      view.play(r.events);
      now += 50;
      view.scene.render();
    }
    view.draw(history[1] as State);
    now += 10_000;
    expectMatchesRules(view, level, history[1] as State);
  });
});
