import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState, tap } from '../src/rules/rules';
import { solve } from '../src/solver/solve';

let current: { view: GameView; engine: NullEngine } | null = null;
afterEach(() => {
  current?.view.dispose();
  current?.engine.dispose();
  current = null;
});

function build() {
  const level = bundledLevels().find((l) => l.id === 'wooden-car-1');
  if (!level) throw new Error('missing wooden-car-1');
  const engine = new NullEngine({
    renderWidth: 360,
    renderHeight: 640,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1,
  });
  const clock = { now: 0 };
  const view = createGameView(engine, level, undefined, { clock: () => clock.now });
  current = { view, engine };
  view.draw(initialState(level).state);
  return { level, view, clock };
}

describe('Workbench look in the scene', () => {
  it('draws every car Pin as an instance of one head mesh, with an outline on each', () => {
    const { level, view } = build();
    const template = view.scene.getMeshByName('pin-template') as Mesh;
    expect(template.instances.length).toBeGreaterThanOrEqual(level.pinSockets.length);
    for (const socket of level.pinSockets) {
      const head = view.scene.getMeshByName(`pin-${socket.id}`);
      const ink = view.scene.getMeshByName(`ink-pin-${socket.id}`);
      expect(head).toBeTruthy();
      expect(ink?.parent).toBe(head);
      expect(ink?.metadata).toEqual({ decor: true });
    }
  });

  it('outlines Pins only: Part meshes and HUD planes get none', () => {
    const { view } = build();
    const inks = view.scene.meshes.filter((m) => m.name.startsWith('ink-'));
    expect(inks.length).toBeGreaterThan(0);
    expect(inks.every((m) => /^ink-(pin|box-\d+-pin|buffer-pin)-/.test(m.name))).toBe(true);
    const part = view.scene.meshes.find((m) => m.material?.name.startsWith('mat-'));
    expect(part?.material?.pluginManager?.getPlugin('Toon')).toBeTruthy();
  });

  it('shows the shank only while a Pin pops out', () => {
    const { level, view, clock } = build();
    const first = solve(level).path[0] ?? 0;
    const id = level.pinSockets[first]?.id;
    const shank = view.scene.getMeshByName(`shank-pin-${id}`);
    expect(shank?.isEnabled()).toBe(false);
    view.play(tap(level, initialState(level).state, first).events);
    clock.now += 60; // part-way through the pull
    view.scene.render();
    expect(shank?.isEnabled()).toBe(true);
    clock.now += 5000;
    view.scene.render();
    expect(shank?.isEnabled()).toBe(false);
  });
});
