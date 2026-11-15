import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState, tap } from '../src/rules/rules';

const W = 360;
const H = 640;

function setup() {
  const level = bundledLevels().find((l) => l.id === 'tiny-cart-1');
  if (!level) throw new Error('missing tiny-cart-1');
  const engine = new NullEngine({
    renderWidth: W,
    renderHeight: H,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1,
  });
  const view = createGameView(engine, level);
  return { level, engine, view };
}

/** Where a Pin's head appears on screen, in CSS px. */
function screenPoint(view: GameView, pinId: string): { x: number; y: number } {
  const mesh = view.scene.getMeshByName(`pin-${pinId}`);
  const camera = view.scene.getCameraByName('model-camera') as ArcRotateCamera | null;
  if (!mesh || !camera) throw new Error('scene is missing the Pin or camera');
  const ndc = Vector3.TransformCoordinates(
    mesh.getBoundingInfo().boundingSphere.centerWorld,
    camera.getViewMatrix().multiply(camera.getProjectionMatrix()),
  );
  const vp = camera.viewport;
  return {
    x: (vp.x + ((ndc.x + 1) / 2) * vp.width) * W,
    y: (1 - vp.y - vp.height + ((1 - ndc.y) / 2) * vp.height) * H,
  };
}

let current: { view: GameView; engine: NullEngine } | null = null;
afterEach(() => {
  current?.view.dispose();
  current?.engine.dispose();
  current = null;
});

describe('game view', () => {
  it('reports the Pin under a click, and draws removed Pins and fallen Parts as gone', () => {
    const { level, engine, view } = setup();
    current = { view, engine };
    let state = initialState(level).state;
    view.draw(state);
    view.scene.render();

    const lidA = level.pinSockets.findIndex((s) => s.id === 'lid-a');
    const lidB = level.pinSockets.findIndex((s) => s.id === 'lid-b');
    const at = screenPoint(view, 'lid-a');
    expect(view.pinAt(at.x, at.y)).toBe(lidA);

    state = tap(level, state, lidA).state;
    state = tap(level, state, lidB).state;
    view.draw(state);

    expect(view.scene.getMeshByName('pin-lid-a')?.isEnabled()).toBe(false);
    expect(view.scene.getTransformNodeByName('part-lid')?.isEnabled()).toBe(false);
    expect(view.scene.getTransformNodeByName('part-base')?.isEnabled()).toBe(true);
    expect(view.pinAt(at.x, at.y)).not.toBe(lidA);
  });
});
