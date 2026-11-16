import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.pure';
import type { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import type { LoadedLevel } from '../src/content/loader';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState, tap } from '../src/rules/rules';
import type { State } from '../src/rules/state';

const INSETS = { top: 20, right: 0, bottom: 30, left: 0 };

let current: { view: GameView; engine: NullEngine } | null = null;
afterEach(() => {
  current?.view.dispose();
  current?.engine.dispose();
  current = null;
});

function setup(screwShapes?: boolean) {
  const level = bundledLevels().find((l) => l.id === 'tiny-cart-1');
  if (!level) throw new Error('missing tiny-cart-1');
  const engine = new NullEngine({
    renderWidth: 360,
    renderHeight: 640,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1,
  });
  const view = createGameView(engine, level, () => INSETS, { screwShapes });
  current = { view, engine };
  return { level, view };
}

const markOf = (mesh: AbstractMesh | null | undefined): number | undefined =>
  (mesh as InstancedMesh | null | undefined)?.instancedBuffers?.markIndex as number | undefined;

const isPinHead = (m: AbstractMesh) =>
  m.getClassName() === 'InstancedMesh' && /^(pin|box-\d+-pin|buffer-pin)-/.test(m.name);

/** Taps removable Pins until a Box holds a Pin and the Buffer holds a Pin, or runs out. */
function playSome(level: LoadedLevel): State {
  let state = initialState(level).state;
  for (let round = 0; round <= level.pins.length; round++) {
    for (let i = 0; i < level.pins.length; i++) {
      const result = tap(level, state, i);
      if (result.refused) continue;
      state = result.state;
      if (state.status !== 'playing') return state;
      if (state.buffer.length > 0 && state.boxes.some((b) => b.fill > 0)) return state;
      break;
    }
  }
  return state;
}

describe('screw shapes', () => {
  it('shows the cross on every Pin by default', () => {
    const { level, view } = setup();
    view.draw(playSome(level));
    const heads = view.scene.meshes.filter(isPinHead);
    expect(heads.length).toBeGreaterThan(2);
    for (const head of heads) expect(markOf(head)).toBe(0);
  });

  it('gives each colour its own drive on the car, in the Boxes and in the Buffer, mid-Level', () => {
    const { level, view } = setup();
    const state = playSome(level);
    view.draw(state);
    const before = view.scene.meshes.length;
    view.setScrewShapes(true);
    expect(view.scene.meshes.length).toBe(before); // atlas indices only, no rebuild
    level.pinSockets.forEach((socket, i) => {
      const colour = level.pins[i]?.colour;
      expect(markOf(view.scene.getMeshByName(`pin-${socket.id}`))).toBe(colour);
    });
    state.boxes.forEach((box, b) => {
      for (let i = 0; i < box.fill; i++) {
        expect(markOf(view.scene.getMeshByName(`box-${b}-pin-${i}`))).toBe(box.colour);
      }
    });
    state.buffer.forEach((colour, i) => {
      expect(markOf(view.scene.getMeshByName(`buffer-pin-${i}`))).toBe(colour);
    });
    view.setScrewShapes(false);
    for (const head of view.scene.meshes.filter(isPinHead)) expect(markOf(head)).toBe(0);
  });

  it('applies to Pins drawn after the switch', () => {
    const { level, view } = setup();
    view.setScrewShapes(true);
    const state = playSome(level);
    view.draw(state);
    state.buffer.forEach((colour, i) =>
      expect(markOf(view.scene.getMeshByName(`buffer-pin-${i}`))).toBe(colour),
    );
  });

  it('can start on, from the remembered setting', () => {
    const { level, view } = setup(true);
    const first = level.pinSockets[0];
    expect(markOf(view.scene.getMeshByName(`pin-${first?.id}`))).toBe(level.pins[0]?.colour);
  });

  it('shows the colour drive faintly in every Box hole only while the setting is on', () => {
    const { level, view } = setup();
    view.draw(initialState(level).state);
    const marks = () => view.scene.meshes.filter((m) => /^box-\d+-mark-\d+$/.test(m.name));
    expect(marks().length).toBeGreaterThan(0);
    expect(marks().every((m) => !m.isEnabled())).toBe(true);
    view.setScrewShapes(true);
    expect(marks().every((m) => m.isEnabled())).toBe(true);
    view.setScrewShapes(false);
    expect(marks().every((m) => !m.isEnabled())).toBe(true);
  });
});
