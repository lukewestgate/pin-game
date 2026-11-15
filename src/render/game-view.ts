// The Babylon scene for one Level: the Model, its Pins, and the Box row and Buffer drawn by an
// orthographic HUD camera in CSS px. It draws rules state and reports which Pin was clicked;
// it never decides outcomes. Snaps with no animation until the Timeline (ticket 25).
import type { LoadedLevel } from '../content/loader';
import { CANDY } from '../content/palette';
import { CAMERA, FEEDBACK } from '../input/constants';
import { turn as turnView } from '../input/camera-control';
import type { PinCandidate } from '../input/picking';
import { blockersOf, hasFallen, isBlocked, type State } from '../rules/state';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.pure';
import { Camera } from '@babylonjs/core/Cameras/camera.pure';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.pure';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine.pure';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.pure';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.pure';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Ray } from '@babylonjs/core/Culling/ray.pure';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder.pure';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder.pure';
import { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.pure';
import { Scene } from '@babylonjs/core/scene.pure';
import { PIN, buildModel, materialCache } from './model-scene';
import { flashStrength, perpendicular, wiggleOffset } from './pin-feedback';
import {
  fitDistance,
  layout as computeLayout,
  type HudLayout,
  type Insets,
  type Rect,
} from './hud-layout';

const HUD_LAYER = 0x10000000;
const START_YAW = 0.6;
const START_PITCH = -0.35;
const GREY_BOX = '#6b7780';
const BUFFER_MAT = '#1b272d';
const BUFFER_SLOT = '#0f1a1f';

export interface GameView {
  readonly scene: Scene;
  /** The current layout in CSS px. */
  readonly layout: HudLayout;
  /** Draws `state` from scratch. */
  draw(state: State): void;
  /** The Pin under a point in CSS px relative to the canvas, if any. */
  pinAt(x: number, y: number): number | null;
  /** Zoom, 1 to 2.2. Never changes the turning centre (no panning). */
  readonly zoom: number;
  setZoom(zoom: number): void;
  /** Turntable drag of (dx, dy) CSS px. */
  turn(dx: number, dy: number): void;
  /** Pin candidates for picking: projected head, drawn radius, visibility, Blocked, depth. */
  candidates(state: State): PinCandidate[];
  /** Press feedback: the Pin grows and gets a white outline. `null` clears it. */
  highlight(pin: number | null): void;
  /** Blocked tap feedback at time `now` (ms): shake the Pin, flash its covering Parts red. */
  blockedTap(pin: number, state: State, now: number): void;
  /** Advances the feedback animations to `now` (ms). Runs before every render. */
  update(now: number): void;
  /** Call after the canvas changes size. */
  resize(): void;
  dispose(): void;
}

function scaled(hex: string, k: number): string {
  return Color3.FromHexString(hex).scale(k).toHexString();
}

export function createGameView(
  engine: AbstractEngine,
  level: LoadedLevel,
  getInsets: () => Insets = () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
): GameView {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 0);
  const material = materialCache(scene);
  const flat = (() => {
    const cache = new Map<string, StandardMaterial>();
    return (hex: string) => {
      let mat = cache.get(hex);
      if (!mat) {
        mat = new StandardMaterial(`hud-${hex}`, scene);
        mat.disableLighting = true;
        mat.emissiveColor = Color3.FromHexString(hex);
        cache.set(hex, mat);
      }
      return mat;
    };
  })();

  new HemisphericLight('light', new Vector3(0.3, 1, -0.4), scene);

  // ---- Model and Pins ----
  const model = buildModel(scene, level.model, material);
  const pinMeshes = level.pinSockets.map((socket, i) => {
    const pin = level.pins[i];
    if (!pin) throw new Error(`Pin ${i} has no rules entry`);
    const mesh = CreateCylinder(
      `pin-${socket.id}`,
      { diameter: PIN.diameter, height: PIN.height, tessellation: PIN.segments },
      scene,
    );
    const dir = Vector3.FromArray(socket.direction).normalize();
    mesh.parent = model.parts[pin.part] ?? null;
    mesh.position = Vector3.FromArray(socket.position).add(dir.scale(PIN.height / 2));
    mesh.rotationQuaternion = Quaternion.FromUnitVectorsToRef(Vector3.Up(), dir, new Quaternion());
    mesh.material = material(CANDY[pin.colour] ?? '#ffffff');
    mesh.metadata = { pin: i };
    return mesh;
  });
  const pinHome = pinMeshes.map((mesh) => mesh.position.clone());
  const pinDir = level.pinSockets.map((socket) => Vector3.FromArray(socket.direction).normalize());

  const camera = new ArcRotateCamera(
    'model-camera',
    START_YAW,
    Math.PI / 2 + START_PITCH,
    1,
    model.bounds.centre,
    scene,
  );
  camera.fov = 0.8;
  camera.minZ = 0.05;
  let zoom = 1;

  // ---- HUD ----
  const hud = new FreeCamera('hud-camera', new Vector3(0, 0, -100), scene);
  hud.mode = Camera.ORTHOGRAPHIC_CAMERA;
  hud.layerMask = HUD_LAYER;
  hud.minZ = 1;
  hud.maxZ = 200;
  scene.activeCameras = [camera, hud];
  const hudRoot = new TransformNode('hud', scene);

  let layout: HudLayout = computeLayout({ width: 1, height: 1 }, getInsets(), level);

  function fitCameras(): void {
    const w = engine.getRenderWidth(true) * engine.getHardwareScalingLevel();
    const h = engine.getRenderHeight(true) * engine.getHardwareScalingLevel();
    layout = computeLayout({ width: w, height: h }, getInsets(), level);
    hud.orthoLeft = 0;
    hud.orthoRight = w;
    hud.orthoTop = 0;
    hud.orthoBottom = -h;
    const m = layout.model;
    camera.viewport = new Viewport(m.x / w, 1 - (m.y + m.h) / h, m.w / w, m.h / h);
    // The camera targets the turning centre, so it sits at the viewport's (the region's) centre.
    camera.radius = fitDistance(model.bounds.radius, m, camera.fov) / zoom;
  }

  function hudPlane(name: string, r: Rect, z: number, hex: string, inset = 1): Mesh {
    const mesh = CreatePlane(name, { width: r.w * inset, height: r.h * inset }, scene);
    mesh.parent = hudRoot;
    mesh.layerMask = HUD_LAYER;
    mesh.isPickable = false;
    mesh.position = new Vector3(r.x + r.w / 2, -(r.y + r.h / 2), z);
    mesh.material = flat(hex);
    return mesh;
  }

  function hudPin(name: string, r: Rect, hex: string, size: number): void {
    const mesh = CreateCylinder(name, { diameter: r.w * size, height: 1, tessellation: 24 }, scene);
    mesh.parent = hudRoot;
    mesh.layerMask = HUD_LAYER;
    mesh.isPickable = false;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position = new Vector3(r.x + r.w / 2, -(r.y + r.h / 2), -3);
    mesh.material = flat(hex);
  }

  function drawHud(state: State): void {
    for (const child of hudRoot.getChildMeshes()) child.dispose();
    state.boxes.forEach((box, b) => {
      const rect = layout.boxes[b];
      if (!rect) return;
      const tint = box.colour === null ? GREY_BOX : (CANDY[box.colour] ?? GREY_BOX);
      hudPlane(`box-${b}`, rect, 0, scaled(tint, 0.92));
      layout.boxHoles[b]?.forEach((hole, i) => {
        hudPlane(`box-${b}-hole-${i}`, hole, -1, scaled(tint, 0.42), 0.9);
        if (i < box.fill) hudPin(`box-${b}-pin-${i}`, hole, tint, layout.pinHead);
      });
    });
    hudPlane('buffer', layout.buffer, 0, BUFFER_MAT);
    layout.bufferSlots.forEach((slot, i) => {
      hudPlane(`buffer-slot-${i}`, slot, -1, BUFFER_SLOT, 0.9);
      const colour = state.buffer[i];
      if (colour !== undefined)
        hudPin(`buffer-pin-${i}`, slot, CANDY[colour] ?? '#ffffff', layout.pinHead);
    });
  }

  function draw(state: State): void {
    pinMeshes.forEach((mesh, i) => mesh.setEnabled(!state.removed[i]));
    model.parts.forEach((node, p) => node.setEnabled(!hasFallen(level, state, p)));
    drawHud(state);
  }

  // ---- Input support: picking candidates, turning, zoom and tap feedback ----
  function candidates(state: State): PinCandidate[] {
    const m = layout.model;
    const viewMatrix = camera.getViewMatrix(true);
    const transform = viewMatrix.multiply(camera.getProjectionMatrix(true));
    const viewport = new Viewport(m.x, m.y, m.w, m.h);
    const focal = m.h / 2 / Math.tan(camera.fov / 2);
    const eye = camera.position.clone();
    const result: PinCandidate[] = [];
    pinMeshes.forEach((mesh, i) => {
      if (!mesh.isEnabled()) return;
      mesh.computeWorldMatrix(true);
      const dir = mesh.getDirection(Vector3.Up());
      const head = mesh.getAbsolutePosition().add(dir.scale(PIN.height / 2));
      const screen = Vector3.Project(head, Matrix.IdentityReadOnly, transform, viewport);
      const depth = Vector3.TransformCoordinates(head, viewMatrix).z;
      const toHead = head.subtract(eye);
      const distance = toHead.length();
      const hit = scene.pickWithRay(
        new Ray(eye, toHead.scale(1 / distance), distance + 1),
        (other) => other.isEnabled() && other.layerMask !== HUD_LAYER,
      );
      const visible =
        !hit?.hit || hit.pickedMesh === mesh || (hit.distance ?? 0) >= distance - 0.02;
      result.push({
        id: i,
        x: screen.x,
        y: screen.y,
        r: ((PIN.diameter / 2) * focal) / Math.max(depth, 1e-6),
        visible,
        blocked: isBlocked(level, state, i),
        depth,
      });
    });
    return result;
  }

  let highlighted: number | null = null;
  function highlight(pin: number | null): void {
    if (highlighted !== null) {
      const old = pinMeshes[highlighted];
      if (old) {
        old.scaling.setAll(1);
        old.renderOutline = false;
      }
    }
    highlighted = pin;
    const mesh = pin === null ? undefined : pinMeshes[pin];
    if (!mesh) return;
    mesh.scaling.setAll(FEEDBACK.pressScale);
    mesh.outlineColor = Color3.White();
    mesh.outlineWidth = 0.025;
    mesh.renderOutline = true;
  }

  const wiggles = new Map<number, number>();
  const flashes = new Map<number, number>(); // Part index -> start time
  function blockedTap(pin: number, state: State, now: number): void {
    wiggles.set(pin, now);
    for (const part of blockersOf(level, state, pin)) flashes.set(part, now);
  }

  function update(now: number): void {
    for (const [pin, t0] of wiggles) {
      const mesh = pinMeshes[pin];
      const home = pinHome[pin];
      const dir = pinDir[pin];
      if (!mesh || !home || !dir) continue;
      const side = Vector3.FromArray(perpendicular([dir.x, dir.y, dir.z]));
      mesh.position.copyFrom(home).addInPlace(side.scale(wiggleOffset(now - t0, FEEDBACK)));
      if (now - t0 >= FEEDBACK.wiggleMs) wiggles.delete(pin);
    }
    for (const [part, t0] of flashes) {
      const strength = flashStrength(now - t0, FEEDBACK);
      for (const mesh of model.parts[part]?.getChildMeshes() ?? []) {
        if ((mesh.metadata as { pin?: unknown } | null)?.pin !== undefined) continue;
        mesh.renderOverlay = strength > 0;
        mesh.overlayColor = Color3.Red();
        mesh.overlayAlpha = 0.6 * strength;
      }
      if (strength === 0) flashes.delete(part);
    }
  }
  scene.onBeforeRenderObservable.add(() => update(performance.now()));

  fitCameras();

  return {
    scene,
    get layout() {
      return layout;
    },
    draw,
    get zoom() {
      return zoom;
    },
    setZoom(z) {
      zoom = Math.min(CAMERA.zoomMax, Math.max(CAMERA.zoomMin, z));
      camera.radius = fitDistance(model.bounds.radius, layout.model, camera.fov) / zoom;
    },
    turn(dx, dy) {
      const next = turnView(
        { yaw: camera.alpha, pitch: camera.beta - Math.PI / 2 },
        dx,
        dy,
        layout.model.w,
        CAMERA,
      );
      camera.alpha = next.yaw;
      camera.beta = Math.PI / 2 + next.pitch;
    },
    candidates,
    highlight,
    blockedTap,
    update,
    pinAt(x, y) {
      const hit = scene.pick(
        x,
        y,
        (mesh) => mesh.isEnabled() && mesh.layerMask !== HUD_LAYER,
        false,
        camera,
      );
      const pin: unknown = (hit.pickedMesh?.metadata as { pin?: unknown } | null)?.pin;
      return typeof pin === 'number' ? pin : null;
    },
    resize: fitCameras,
    dispose: () => scene.dispose(),
  };
}
