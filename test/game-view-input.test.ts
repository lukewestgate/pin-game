import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import type { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import { CAMERA, FEEDBACK } from '../src/input/constants';
import { createGameView, type GameView } from '../src/render/game-view';
import { initialState, tap } from '../src/rules/rules';
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
  INSETS.left = 0;
  current?.view.dispose();
  current?.engine.dispose();
  current = null;
});

function setup(clock?: () => number) {
  const engine = new NullEngine({
    renderWidth: W,
    renderHeight: H,
    textureSize: 512,
    deterministicLockstep: false,
    lockstepMaxSteps: 1,
  });
  const view = createGameView(engine, level, () => INSETS, clock ? { clock } : {});
  current = { view, engine };
  view.draw(state);
  view.scene.render();
  const camera = view.scene.getCameraByName('model-camera') as ArcRotateCamera;
  return { view, camera, engine };
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
    view.resize(() => state);
    expect(camera.radius).toBeCloseTo(r1 / 1.5, 6);
  });

  it('rebuilds the HUD at the new layout on resize, deferring while animations fly', () => {
    let t = 0;
    const { view } = setup(() => t);
    const bufferX = () => view.scene.getMeshByName('buffer')?.position.x ?? 0;
    const before = bufferX();
    INSETS.left = 60; // the safe area changes, as on a rotation
    view.resize(() => state);
    expect(bufferX()).not.toBeCloseTo(before, 3);
    // With a tap in flight the rebuild waits until the animation has settled.
    const pin = index('roof-1');
    const result = tap(level, state, pin);
    view.play(result.events);
    t = 10;
    view.scene.render();
    INSETS.left = 0;
    view.resize(() => result.state);
    expect(bufferX()).not.toBeCloseTo(before, 3);
    t = 100000;
    view.scene.render();
    view.scene.render();
    expect(bufferX()).toBeCloseTo(before, 3);
  });

  it('stops wiggling a Pin once it has been tapped and detached', () => {
    const finalPosition = (wiggle: boolean) => {
      let t = 0;
      const { view } = setup(() => t);
      const pin = index('roof-1');
      if (wiggle) view.blockedTap(pin, state, 0);
      view.play(tap(level, state, pin).events);
      t = 100;
      view.scene.render();
      return view.scene.getMeshByName('pin-roof-1')?.position.clone() ?? Vector3.Zero();
    };
    const wiggled = finalPosition(true);
    const plain = finalPosition(false);
    expect(Vector3.Distance(wiggled, plain)).toBeLessThan(1e-6);
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
    view.updateFeedback(1040);
    expect(Vector3.Distance(mesh?.position ?? home, home)).toBeGreaterThan(0.001);
    const bonnet = view.scene.getTransformNodeByName('part-bonnet');
    const covers = bonnet?.getChildMeshes().filter((m) => m.renderOverlay) ?? [];
    expect(covers.length).toBeGreaterThan(0);
    expect(covers[0]?.overlayColor.r).toBe(1);
    expect(covers[0]?.overlayAlpha).toBeGreaterThan(0);
    view.updateFeedback(1000 + FEEDBACK.flashMs + 1);
    expect(mesh?.position.equals(home)).toBe(true);
    expect(bonnet?.getChildMeshes().some((m) => m.renderOverlay)).toBe(false);
  });

  it('Peeks the Part of the pressed Pin to 0.22 opacity over 120 ms, and fades back on release', () => {
    const { view } = setup();
    const roof = view.scene.getTransformNodeByName('part-roof');
    const meshes = roof?.getChildMeshes().filter((m) => m.metadata === null) ?? [];
    expect(meshes.length).toBeGreaterThan(0);
    const alpha = () => meshes.map((m) => m.material?.alpha ?? 1);
    view.updateFeedback(1000);
    view.peekAt(0, 0, index('roof-1'), 1000);
    view.updateFeedback(1060);
    expect(alpha()[0]).toBeCloseTo(1 - (1 - FEEDBACK.peekAlpha) / 2, 6);
    view.updateFeedback(1200);
    for (const a of alpha()) expect(a).toBeCloseTo(FEEDBACK.peekAlpha, 6);
    expect(meshes[0]?.material?.needDepthPrePass).toBe(true);
    // Other Parts stay solid.
    const bonnet = view.scene.getTransformNodeByName('part-bonnet');
    for (const m of bonnet?.getChildMeshes() ?? []) expect(m.material?.alpha).toBe(1);
    view.peekEnd();
    view.updateFeedback(1260);
    expect(alpha()[0]).toBeCloseTo(FEEDBACK.peekAlpha + (1 - FEEDBACK.peekAlpha) / 2, 6);
    view.updateFeedback(1400);
    for (const m of meshes) expect(m.material?.alpha).toBe(1);
  });

  it('Peeks the first Part the ray hits when no Pin is under the press, and nothing in empty space', () => {
    const { view } = setup();
    const m = view.layout.model;
    view.updateFeedback(0);
    view.peekAt(m.x + m.w / 2, m.y + m.h / 2, null, 0);
    view.updateFeedback(500);
    expect(view.peeking()).not.toBeNull();
    view.peekEnd();
    view.updateFeedback(1000);
    view.peekAt(1, 1, null, 1000);
    expect(view.peeking()).toBeNull();
  });

  it('leaves the rules state untouched by a Peek', () => {
    const { view } = setup();
    const before = JSON.stringify(state);
    view.peekAt(0, 0, index('roof-1'), 0);
    view.updateFeedback(500);
    view.peekEnd();
    view.updateFeedback(1000);
    expect(JSON.stringify(state)).toBe(before);
    expect(view.candidates(state).length).toBe(level.pins.length);
  });
});
