// The Babylon scene for one Level: the Model, its Pins, and the Box row and Buffer drawn by an
// orthographic HUD camera in CSS px. It draws rules state and reports which Pin was clicked;
// it never decides outcomes. Snaps with no animation until the Timeline (ticket 25).
import type { LoadedLevel } from '../content/loader';
import { CANDY } from '../content/palette';
import type { State } from '../rules/state';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.pure';
import { Camera } from '@babylonjs/core/Cameras/camera.pure';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera.pure';
import type { AbstractEngine } from '@babylonjs/core/Engines/abstractEngine.pure';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.pure';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.pure';
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder.pure';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder.pure';
import { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.pure';
import { Scene } from '@babylonjs/core/scene.pure';
import { buildModel, materialCache } from './model-scene';
import { hudLayout, type HudLayout, type Rect } from './hud-layout';

const HUD_LAYER = 0x10000000;
const START_YAW = 0.6;
const START_PITCH = -0.35;
const PIN = { diameter: 0.24, height: 0.08 };
const GREY_BOX = '#6b7780';
const BUFFER_MAT = '#1b272d';
const BUFFER_SLOT = '#0f1a1f';

export interface GameView {
  readonly scene: Scene;
  /** Draws `state` from scratch. */
  draw(state: State): void;
  /** The Pin under a point in CSS px relative to the canvas, if any. */
  pinAt(x: number, y: number): number | null;
  /** Call after the canvas changes size. */
  resize(): void;
  dispose(): void;
}

function scaled(hex: string, k: number): string {
  return Color3.FromHexString(hex).scale(k).toHexString();
}

export function createGameView(engine: AbstractEngine, level: LoadedLevel): GameView {
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
    const mesh = CreateCylinder(`pin-${socket.id}`, { ...PIN, tessellation: 16 }, scene);
    const dir = Vector3.FromArray(socket.direction).normalize();
    mesh.parent = model.parts[pin.part] ?? null;
    mesh.position = Vector3.FromArray(socket.position).add(dir.scale(PIN.height / 2));
    mesh.rotationQuaternion = Quaternion.FromUnitVectorsToRef(Vector3.Up(), dir, new Quaternion());
    mesh.material = material(CANDY[pin.colour] ?? '#ffffff');
    mesh.metadata = { pin: i };
    return mesh;
  });

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

  // ---- HUD ----
  const hud = new FreeCamera('hud-camera', new Vector3(0, 0, -100), scene);
  hud.mode = Camera.ORTHOGRAPHIC_CAMERA;
  hud.layerMask = HUD_LAYER;
  hud.minZ = 1;
  hud.maxZ = 200;
  scene.activeCameras = [camera, hud];
  const hudRoot = new TransformNode('hud', scene);

  let layout: HudLayout = hudLayout(1, 1, level);

  function fitCameras(): void {
    const w = engine.getRenderWidth(true) * engine.getHardwareScalingLevel();
    const h = engine.getRenderHeight(true) * engine.getHardwareScalingLevel();
    layout = hudLayout(w, h, level);
    hud.orthoLeft = 0;
    hud.orthoRight = w;
    hud.orthoTop = 0;
    hud.orthoBottom = -h;
    const m = layout.model;
    camera.viewport = new Viewport(m.x / w, 1 - (m.y + m.h) / h, m.w / w, m.h / h);
    // Fit the bounding sphere into the region's narrower field of view, so no rotation clips.
    const aspect = m.w / m.h;
    const halfFov = Math.min(camera.fov / 2, Math.atan(Math.tan(camera.fov / 2) * aspect));
    camera.radius = (model.bounds.radius * 1.1) / Math.sin(halfFov);
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
      layout.boxSlots[b]?.forEach((hole, i) => {
        hudPlane(`box-${b}-hole-${i}`, hole, -1, scaled(tint, 0.42), 0.9);
        if (i < box.fill) hudPin(`box-${b}-pin-${i}`, hole, tint, 0.78);
      });
    });
    hudPlane('buffer', layout.buffer, 0, BUFFER_MAT);
    layout.bufferSlots.forEach((slot, i) => {
      hudPlane(`buffer-slot-${i}`, slot, -1, BUFFER_SLOT, 0.9);
      const colour = state.buffer[i];
      if (colour !== undefined) hudPin(`buffer-pin-${i}`, slot, CANDY[colour] ?? '#ffffff', 0.72);
    });
  }

  function draw(state: State): void {
    pinMeshes.forEach((mesh, i) => mesh.setEnabled(!state.removed[i]));
    model.parts.forEach((node, p) => {
      const hasPins = (level.pinsOfPart[p]?.length ?? 0) > 0;
      node.setEnabled(!hasPins || (state.partLeft[p] ?? 0) > 0);
    });
    drawHud(state);
  }

  fitCameras();

  return {
    scene,
    draw,
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
