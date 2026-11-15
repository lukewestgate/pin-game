import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { CAMERA, FEEDBACK } from '../src/input/constants';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState } from '../src/rules/rules';
import { isBlocked } from '../src/rules/state';

const W = 360;
const H = 640;
const INSETS = { top: 20, right: 0, bottom: 30, left: 0 };

const level = (() => {
  const l = bundledLevels().find((x) => x.id === 'wooden-car-1');
  if (!l) throw new Error('missing wooden-car-1');
  return l;
})();
const state = initialState(level).state;
const index = (id: string) => level.pinSockets.findIndex((s) => s.id === id);

let current: { view: GameView; engine: NullEngine } | null = null;
afterEach(() => {
  current?.view.dispose();
  current?.engine.dispose();
  current = null;
});

function setup() {
  const engine = new NullEngine({
    renderWidth: W,
    renderHeight: H,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1,
  });
  const view = createGameView(engine, level, () => INSETS);
  current = { view, engine };
  view.draw(state);
  view.scene.render();
  const camera = view.scene.getCameraByName('model-camera') as ArcRotateCamera;
  return { view, camera };
}

describe('game view input support', () => {
  it('builds candidates at the projected head, with Blocked from the rules and a drawn radius', () => {
    const { view, camera } = setup();
    const cands = view.candidates(state);
    const roof = cands.find((c) => c.id === index('roof-1'));
    expect(roof).toBeDefined();
    const mesh = view.scene.getMeshByName('pin-roof-1');
    const head = mesh?.getBoundingInfo().boundingSphere.centerWorld ?? Vector3.Zero();
    const ndc = Vector3.TransformCoordinates(
      head,
      camera.getViewMatrix().multiply(camera.getProjectionMatrix()),
    );
    const vp = camera.viewport;
    // The head sits within one Pin-height of the mesh centre, so allow a few px.
    expect(roof?.x).toBeCloseTo((vp.x + ((ndc.x + 1) / 2) * vp.width) * W, -1);
    expect(roof?.y).toBeCloseTo((1 - vp.y - vp.height + ((1 - ndc.y) / 2) * vp.height) * H, -1);
    expect(roof?.r).toBeGreaterThan(3);
    expect(roof?.r).toBeLessThan(20);
    for (const c of cands) expect(c.blocked).toBe(isBlocked(level, state, c.id));
    expect(cands.find((c) => c.id === index('engine-1'))?.blocked).toBe(true);
  });

  it('marks a Pin whose head the camera cannot see as not visible', () => {
    const { view, camera } = setup();
    // Look at the car from straight behind its left side so the engine Pins are inside the car.
    const cands = view.candidates(state);
    const hidden = cands.filter((c) => !c.visible).map((c) => c.id);
    expect(cands.some((c) => c.visible)).toBe(true);
    expect(hidden.length).toBeGreaterThan(0);
    expect(hidden).toContain(index('engine-1'));
    expect(camera.radius).toBeGreaterThan(0);
  });

  it('turns like a turntable and limits pitch', () => {
    const { view, camera } = setup();
    const alpha = camera.alpha;
    view.turn(150, 0);
    view.scene.render();
    expect(camera.alpha).toBeCloseTo(
      alpha - (((CAMERA.turnDeg * Math.PI) / 180) * 150) / view.layout.model.w,
      6,
    );
    view.turn(0, -100000);
    expect(camera.beta).toBeCloseTo(Math.PI / 2 + CAMERA.pitchLimit, 6);
    view.turn(0, 100000);
    expect(camera.beta).toBeCloseTo(Math.PI / 2 - CAMERA.pitchLimit, 6);
  });

  it('zooms from 1x to 2.2x by moving the camera in, and keeps the zoom across a resize', () => {
    const { view, camera } = setup();
    const r1 = camera.radius;
    view.setZoom(5);
    expect(view.zoom).toBe(CAMERA.zoomMax);
    expect(camera.radius).toBeCloseTo(r1 / 2.2, 6);
    view.setZoom(0.1);
    expect(view.zoom).toBe(1);
    view.setZoom(1.5);
    view.resize();
    expect(camera.radius).toBeCloseTo(r1 / 1.5, 6);
  });

  it('grows the pressed Pin and outlines it, until cleared', () => {
    const { view } = setup();
    const mesh = view.scene.getMeshByName('pin-roof-1');
    const before = mesh?.scaling.x ?? 0;
    view.highlight(index('roof-1'));
    expect(mesh?.scaling.x).toBeCloseTo(before * FEEDBACK.pressScale, 6);
    expect(mesh?.renderOutline).toBe(true);
    view.highlight(null);
    expect(mesh?.scaling.x).toBeCloseTo(before, 6);
    expect(mesh?.renderOutline).toBe(false);
  });

  it('shakes a Blocked Pin sideways and flashes its covering Part red, then settles', () => {
    const { view } = setup();
    const pin = index('engine-1');
    const mesh = view.scene.getMeshByName('pin-engine-1');
    const home = mesh?.position.clone() ?? Vector3.Zero();
    view.blockedTap(pin, state, 1000);
    view.update(1040);
    expect(Vector3.Distance(mesh?.position ?? home, home)).toBeGreaterThan(0.001);
    const bonnet = view.scene.getTransformNodeByName('part-bonnet');
    const covers = bonnet?.getChildMeshes().filter((m) => m.renderOverlay) ?? [];
    expect(covers.length).toBeGreaterThan(0);
    expect(covers[0]?.overlayColor.r).toBe(1);
    expect(covers[0]?.overlayAlpha).toBeGreaterThan(0);
    view.update(1000 + FEEDBACK.flashMs + 1);
    expect(mesh?.position.equals(home)).toBe(true);
    expect(bonnet?.getChildMeshes().some((m) => m.renderOverlay)).toBe(false);
  });
});
