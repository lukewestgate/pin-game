import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.pure';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { createGameView, type GameView } from '../src/render/game-view';
import { layout } from '../src/render/hud-layout';
import { initialState, tap } from '../src/rules/rules';

function at<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error(`No item at ${index}`);
  return item;
}

const W = 360;
const H = 640;
const INSETS = { top: 20, right: 0, bottom: 30, left: 0 };

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
  const view = createGameView(engine, level, () => INSETS);
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

  it('places HUD meshes from the layout rects, with the origin at the top left', () => {
    const { level, engine, view } = setup();
    current = { view, engine };
    view.draw(initialState(level).state);
    const l = layout({ width: W, height: H }, INSETS, level);
    const box = view.scene.getMeshByName('box-1');
    const rect = at(l.boxes, 1);
    expect(box?.position.x).toBeCloseTo(rect.x + rect.w / 2, 5);
    expect(box?.position.y).toBeCloseTo(-(rect.y + rect.h / 2), 5);
    const hud = view.scene.getCameraByName('hud-camera') as FreeCamera;
    expect([hud.orthoLeft, hud.orthoRight, hud.orthoTop, hud.orthoBottom]).toEqual([0, W, 0, -H]);
    expect(view.layout.bottomBar).toEqual(l.bottomBar);
  });

  it('centres the turning centre in the Model region and fits the sphere there', () => {
    const { level, engine, view } = setup();
    current = { view, engine };
    view.scene.render();
    const l = layout({ width: W, height: H }, INSETS, level);
    const camera = view.scene.getCameraByName('model-camera') as ArcRotateCamera;
    const vp = camera.viewport;
    expect(vp.x * W).toBeCloseTo(l.model.x, 3);
    expect(vp.y * H).toBeCloseTo(H - l.model.y - l.model.h, 3);
    expect(vp.width * W).toBeCloseTo(l.model.w, 3);
    expect(vp.height * H).toBeCloseTo(l.model.h, 3);
    // The target projects to the middle of the viewport.
    const ndc = Vector3.TransformCoordinates(
      camera.target,
      camera.getViewMatrix().multiply(camera.getProjectionMatrix()),
    );
    expect(ndc.x).toBeCloseTo(0, 5);
    expect(ndc.y).toBeCloseTo(0, 5);
  });
});
