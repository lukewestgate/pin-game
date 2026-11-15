import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState } from '../src/rules/rules';

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
  const view = createGameView(engine, level);
  current = { view, engine };
  view.draw(initialState(level).state);
  return { level, view };
}

describe('Workbench look in the scene', () => {
  it('draws every car Pin as an instance of one head mesh, with an outline on each', () => {
    const { level, view } = build();
    const template = view.scene.getMeshByName('pin-template') as Mesh;
    expect(template.instances.length).toBeGreaterThanOrEqual(level.pinSockets.length);
    for (const socket of level.pinSockets) {
      const head = view.scene.getMeshByName(`pin-${socket.id}`);
      const ink = view.scene.getMeshByName(`pin-${socket.id}-ink`);
      expect(head).toBeTruthy();
      expect(ink?.parent).toBe(head);
      expect(ink?.isPickable).toBe(false);
    }
  });

  it('outlines Pins only: Part meshes and HUD planes get none', () => {
    const { view } = build();
    const inks = view.scene.meshes.filter((m) => m.name.endsWith('-ink'));
    expect(inks.length).toBeGreaterThan(0);
    expect(inks.every((m) => m.name.startsWith('pin-') || m.name.includes('-pin-'))).toBe(true);
    const part = view.scene.meshes.find((m) => m.material?.name.startsWith('mat-'));
    expect(part?.material?.pluginManager?.getPlugin('Toon')).toBeTruthy();
  });

  it('shows the shank only while a Pin pops out', () => {
    const { level, view } = build();
    const shank = view.scene.getMeshByName(`pin-${level.pinSockets[0]?.id}-shank`);
    expect(shank?.isEnabled()).toBe(false);
    view.popOut(0, 0.2);
    expect(shank?.isEnabled()).toBe(true);
    view.popOut(0, null);
    expect(shank?.isEnabled()).toBe(false);
  });
});
