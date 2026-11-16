// The Babylon scene for one Level: the Model, its Pins, and the Box row and Buffer drawn by an
// orthographic HUD camera in CSS px. It draws rules state and reports which Pin was clicked;
// it never decides outcomes. `draw` snaps to a state from scratch; `play` animates one tap's rules
// events through the pure Timeline, with overlapping steps (ticket 25).
import type { LoadedLevel } from '../content/loader';
import { CANDY } from '../content/palette';
import { CAMERA, FEEDBACK } from '../input/constants';
import { turn as turnView } from '../input/camera-control';
import type { PinCandidate } from '../input/picking';
import { blockersOf, hasFallen, isBlocked, type State } from '../rules/state';
import type { RulesEvent } from '../rules/rules';
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
import type { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh.pure';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder.pure';
import { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.pure';
import { Scene } from '@babylonjs/core/scene.pure';
import { PIN, buildModel, materialCache } from './model-scene';
import { flashStrength, perpendicular, wiggleOffset } from './pin-feedback';
import { PIN_HEAD } from './pin-geometry';
import { createPinFactory } from './pins';
import { emptyTracks, schedule, type Step, type Timing, type Tracks } from './timeline';
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

export interface ViewOptions {
  /** Milliseconds; defaults to `performance.now`. Tests drive it by hand. */
  clock?: () => number;
  /** The one animation speed multiplier. */
  speed?: number;
  timing?: Partial<Timing>;
}

const PULL_DISTANCE = 0.5;
const FALL_DISTANCE = 7;
const HUD_EXIT_MARGIN = 10;

/** A timed piece of rendering. `start` runs once at `t0`, `tick` each frame, `end` at `t1`. */
interface Task {
  t0: number;
  t1: number;
  started?: boolean;
  start?: () => void;
  tick?: (p: number) => void;
  end?: () => void;
}

const ease = (p: number): number => p * p * (3 - 2 * p);

export interface GameView {
  readonly scene: Scene;
  /** The current layout in CSS px. */
  readonly layout: HudLayout;
  /** Cancels every animation, resets the tracks and draws `state` from scratch (Undo, Restart). */
  draw(state: State): void;
  /** Animates one tap's rules events now. The rules state has already moved on. */
  play(events: readonly RulesEvent[]): void;
  /** Called when a won or lost step is reached, after everything has settled. */
  onOutcome: ((outcome: 'won' | 'lost') => void) | null;
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
  updateFeedback(now: number): void;
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
  options: ViewOptions = {},
): GameView {
  const clock = options.clock ?? (() => performance.now());
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

  const light = new HemisphericLight('light', new Vector3(0.3, 1, -0.4), scene);
  light.groundColor = new Color3(0.45, 0.45, 0.45);

  // ---- Model and Pins ----
  const model = buildModel(scene, level.model, material);
  const pins = createPinFactory(scene, model.root);
  const pinSet = level.pinSockets.map((socket, i) => {
    const pin = level.pins[i];
    if (!pin) throw new Error(`Pin ${i} has no rules entry`);
    const made = pins.create(
      `pin-${socket.id}`,
      CANDY[pin.colour] ?? '#ffffff',
      model.parts[pin.part] ?? null,
    );
    const dir = Vector3.FromArray(socket.direction).normalize();
    made.head.position = Vector3.FromArray(socket.position);
    made.head.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
      Vector3.Up(),
      dir,
      new Quaternion(),
    );
    made.head.metadata = { pin: i };
    return made;
  });
  const pinMeshes = pinSet.map((made) => made.head);
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

  /** A Pin head, with its outline, as a flat disc at a point in CSS px. */
  function hudDisc(
    name: string,
    x: number,
    y: number,
    diameter: number,
    hex: string,
  ): InstancedMesh {
    const { head } = pins.create(name, hex, hudRoot);
    head.layerMask = HUD_LAYER;
    for (const child of head.getChildMeshes()) child.layerMask = HUD_LAYER;
    head.isPickable = false;
    head.scaling.setAll(diameter / PIN_HEAD.diameter);
    head.rotation.x = -Math.PI / 2;
    head.position = new Vector3(x, -y, -3);
    return head;
  }

  const centre = (r: Rect): { x: number; y: number } => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

  function hudPin(name: string, r: Rect, hex: string): InstancedMesh {
    const c = centre(r);
    return hudDisc(name, c.x, c.y, r.w * layout.pinHead, hex);
  }

  const tintOf = (colour: number | null): string =>
    colour === null ? GREY_BOX : (CANDY[colour] ?? GREY_BOX);

  // What the HUD currently shows, kept so steps can move individual pieces.
  let boxNodes: (TransformNode | undefined)[] = [];
  let bufferPins: (InstancedMesh | undefined)[] = [];
  let flyCount = 0;

  function holeRect(b: number, i: number): Rect {
    const rect = layout.boxHoles[b]?.[i];
    if (!rect) throw new Error(`Box ${b} has no hole ${i}`);
    return rect;
  }

  function slotRect(i: number): Rect {
    const rect = layout.bufferSlots[i];
    if (!rect) throw new Error(`The Buffer has no slot ${i}`);
    return rect;
  }

  function addBoxPin(b: number, i: number, colour: number | null): InstancedMesh {
    const mesh = hudPin(`box-${b}-pin-${i}`, holeRect(b, i), tintOf(colour));
    mesh.parent = boxNodes[b] ?? hudRoot;
    return mesh;
  }

  /** One Box, its holes and its Pins, as a node whose offset slides it. */
  function buildBox(b: number, colour: number | null, fill: number): TransformNode | undefined {
    const rect = layout.boxes[b];
    if (!rect) return undefined;
    const node = new TransformNode(`box-${b}-node`, scene);
    node.parent = hudRoot;
    boxNodes[b] = node;
    const tint = tintOf(colour);
    hudPlane(`box-${b}`, rect, 0, scaled(tint, 0.92)).parent = node;
    layout.boxHoles[b]?.forEach((hole, i) => {
      hudPlane(`box-${b}-hole-${i}`, hole, -1, scaled(tint, 0.42), 0.9).parent = node;
      if (i < fill) addBoxPin(b, i, colour);
    });
    return node;
  }

  function drawHud(state: State): void {
    for (const child of hudRoot.getChildren()) child.dispose();
    boxNodes = [];
    bufferPins = [];
    state.boxes.forEach((box, b) => buildBox(b, box.colour, box.fill));
    hudPlane('buffer', layout.buffer, 0, BUFFER_MAT);
    layout.bufferSlots.forEach((slot, i) => {
      hudPlane(`buffer-slot-${i}`, slot, -1, BUFFER_SLOT, 0.9);
      const colour = state.buffer[i];
      if (colour !== undefined)
        bufferPins[i] = hudPin(`buffer-pin-${i}`, slot, CANDY[colour] ?? '#ffffff');
    });
  }

  // ---- Animation: plays the Timeline's steps and never decides outcomes ----
  const pinHomes = pinMeshes.map((mesh) => ({
    parent: mesh.parent,
    position: mesh.position.clone(),
    rotation: (mesh.rotationQuaternion ?? new Quaternion()).clone(),
  }));
  const partHomes = model.parts.map((node) => node.position.clone());
  let tasks: Task[] = [];
  let tracks: Tracks = emptyTracks();
  let outcomeHandler: GameView['onOutcome'] = null;

  /** A world point as CSS px, through the Model camera and its viewport. */
  function toScreen(world: Vector3): { x: number; y: number } {
    const ndc = Vector3.TransformCoordinates(
      world,
      camera.getViewMatrix().multiply(camera.getProjectionMatrix()),
    );
    const m = layout.model;
    return { x: m.x + ((ndc.x + 1) / 2) * m.w, y: m.y + ((1 - ndc.y) / 2) * m.h };
  }

  const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

  /** Where a Part flies when it falls: its override, else outward from the Model's centre. */
  function fallDirection(part: number): Vector3 {
    const override = level.model.parts[part]?.fall;
    if (override) return Vector3.FromArray(override).normalize();
    const node = model.parts[part];
    if (!node) return Vector3.Up();
    const { min, max } = node.getHierarchyBoundingVectors(true);
    const out = min.add(max).scale(0.5).subtract(model.bounds.centre);
    return out.lengthSquared() < 1e-6 ? Vector3.Up() : out.normalize();
  }

  function tasksFor(step: Step): Task[] {
    switch (step.kind) {
      case 'pinToBox':
      case 'pinToBuffer': {
        const mesh = pinMeshes[step.pin];
        if (!mesh) return [];
        const colour = level.pins[step.pin]?.colour ?? 0;
        const hex = CANDY[colour] ?? '#ffffff';
        let from = Vector3.Zero();
        let dir = Vector3.Up();
        let disc: InstancedMesh | undefined;
        let origin = { x: 0, y: 0 };
        const target = (): Rect =>
          step.kind === 'pinToBox' ? holeRect(step.box, step.fill - 1) : slotRect(step.slot);
        return [
          {
            t0: step.t0,
            t1: step.pullEnd,
            start: () => {
              // Leave the Part (which may fall) but keep the world pose.
              mesh.setParent(null);
              mesh.isPickable = false;
              from = mesh.position.clone();
              dir = mesh.getDirection(Vector3.Up()).normalize();
            },
            tick: (p) => {
              mesh.position.copyFrom(from.add(dir.scale(PULL_DISTANCE * ease(p))));
              pinSet[step.pin]?.setShank(PULL_DISTANCE * ease(p));
            },
          },
          {
            t0: step.flyAt,
            t1: step.t1,
            start: () => {
              pinSet[step.pin]?.setShank(null);
              mesh.setEnabled(false);
              origin = toScreen(mesh.position);
              disc = hudDisc(`fly-${flyCount++}`, origin.x, origin.y, 1, hex);
            },
            tick: (p) => {
              if (!disc) return;
              const to = target();
              const c = centre(to);
              const e = ease(p);
              disc.position.x = lerp(origin.x, c.x, e);
              disc.position.y = -lerp(origin.y, c.y, e);
              disc.scaling.setAll((to.w * layout.pinHead * lerp(1.4, 1, e)) / PIN_HEAD.diameter);
            },
            end: () => {
              disc?.dispose();
              if (step.kind === 'pinToBox') addBoxPin(step.box, step.fill - 1, colour);
              else
                bufferPins[step.slot] = hudPin(`buffer-pin-${step.slot}`, slotRect(step.slot), hex);
            },
          },
        ];
      }
      case 'partFell': {
        const node = model.parts[step.part];
        const home = partHomes[step.part];
        if (!node || !home) return [];
        let dir = Vector3.Up();
        return [
          {
            t0: step.t0,
            t1: step.t1,
            start: () => {
              dir = fallDirection(step.part);
              for (const m of node.getChildMeshes()) m.isPickable = false;
            },
            tick: (p) => node.position.copyFrom(home.add(dir.scale(FALL_DISTANCE * p * p))),
            end: () => node.setEnabled(false),
          },
        ];
      }
      case 'boxClosed': {
        const rect = layout.boxes[step.box];
        const away = rect ? rect.y + rect.h + HUD_EXIT_MARGIN : 100;
        return [
          {
            t0: step.t0,
            t1: step.t1,
            tick: (p) => {
              const node = boxNodes[step.box];
              if (node) node.position.y = away * ease(p);
            },
            end: () => {
              boxNodes[step.box]?.dispose();
              boxNodes[step.box] = undefined;
            },
          },
        ];
      }
      case 'boxOpened': {
        const rect = layout.boxes[step.box];
        const away = rect ? rect.y + rect.h + HUD_EXIT_MARGIN : 100;
        let node: TransformNode | undefined;
        return [
          {
            t0: step.t0,
            t1: step.t1,
            start: () => (node = buildBox(step.box, step.colour, 0)),
            tick: (p) => {
              if (node) node.position.y = away * (1 - ease(p));
            },
          },
        ];
      }
      case 'bufferDrained': {
        const firstHole = step.fill - step.from.length;
        const flights = step.from.map((slotIndex, k): Task => {
          let mesh: InstancedMesh | undefined;
          return {
            t0: step.launches[k] ?? step.t0,
            t1: step.lands[k] ?? step.t1,
            start: () => {
              mesh = bufferPins[slotIndex];
              bufferPins[slotIndex] = undefined;
            },
            tick: (p) => {
              if (!mesh) return;
              const a = centre(slotRect(slotIndex));
              const b = centre(holeRect(step.box, firstHole + k));
              mesh.position.x = lerp(a.x, b.x, ease(p));
              mesh.position.y = -lerp(a.y, b.y, ease(p));
            },
            end: () => {
              mesh?.dispose();
              addBoxPin(step.box, firstHole + k, step.colour);
            },
          };
        });
        const moves: { mesh: InstancedMesh; fromX: number; to: number }[] = [];
        const closeGaps: Task = {
          t0: step.lands.at(-1) ?? step.t0,
          t1: step.t1,
          start: () => {
            moves.length = 0;
            let next = 0;
            for (const mesh of bufferPins)
              if (mesh) moves.push({ mesh, fromX: mesh.position.x, to: next++ });
          },
          tick: (p) =>
            moves.forEach(({ mesh, fromX, to }) => {
              mesh.position.x = lerp(fromX, centre(slotRect(to)).x, ease(p));
            }),
          end: () => {
            bufferPins = [];
            for (const { mesh, to } of moves) {
              mesh.name = `buffer-pin-${to}`;
              mesh.position.x = centre(slotRect(to)).x;
              bufferPins[to] = mesh;
            }
          },
        };
        return [...flights, closeGaps];
      }
      case 'won':
      case 'lost':
        return [{ t0: step.t0, t1: step.t0, end: () => outcomeHandler?.(step.kind) }];
    }
  }

  function update(now: number): void {
    for (const task of tasks) {
      if (now < task.t0) continue;
      if (!task.started) {
        task.started = true;
        task.start?.();
      }
      const span = task.t1 - task.t0;
      task.tick?.(span > 0 ? Math.min(1, (now - task.t0) / span) : 1);
      if (now >= task.t1) task.end?.();
    }
    tasks = tasks.filter((task) => now < task.t1);
  }
  scene.onBeforeRenderObservable.add(() => update(clock()));

  function play(events: readonly RulesEvent[]): void {
    const result = schedule(events, clock(), tracks, {
      speed: options.speed,
      timing: options.timing,
    });
    tracks = result.tracks;
    for (const step of result.steps) tasks.push(...tasksFor(step));
  }

  function draw(state: State): void {
    tasks = [];
    tracks = emptyTracks();
    pinMeshes.forEach((mesh, i) => {
      const home = pinHomes[i];
      if (home) {
        mesh.parent = home.parent;
        mesh.position.copyFrom(home.position);
        mesh.rotationQuaternion = home.rotation.clone();
      }
      mesh.isPickable = true;
      pinSet[i]?.setShank(null);
      mesh.setEnabled(!state.removed[i]);
    });
    model.parts.forEach((node, p) => {
      node.position.copyFrom(partHomes[p] ?? Vector3.Zero());
      node.setEnabled(!hasFallen(level, state, p));
      for (const m of node.getChildMeshes()) m.isPickable = true;
    });
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
      if (state.removed[i] || !mesh.isEnabled()) return;
      mesh.computeWorldMatrix(true);
      const dir = mesh.getDirection(Vector3.Up());
      const head = mesh.getAbsolutePosition().add(dir.scale(PIN.height / 2));
      const screen = Vector3.Project(head, Matrix.IdentityReadOnly, transform, viewport);
      const depth = Vector3.TransformCoordinates(head, viewMatrix).z;
      const toHead = head.subtract(eye);
      const distance = toHead.length();
      const hit = scene.pickWithRay(
        new Ray(eye, toHead.scale(1 / distance), distance + 1),
        (other) =>
          other.isEnabled() &&
          other.layerMask !== HUD_LAYER &&
          !(other.metadata as { decor?: boolean } | null)?.decor,
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

  function updateFeedback(now: number): void {
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
  scene.onBeforeRenderObservable.add(() => updateFeedback(clock()));

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
    updateFeedback,
    play,
    get onOutcome() {
      return outcomeHandler;
    },
    set onOutcome(fn) {
      outcomeHandler = fn;
    },
    pinAt(x, y) {
      const hit = scene.pick(
        x,
        y,
        (mesh) =>
          mesh.isEnabled() &&
          mesh.isPickable &&
          mesh.layerMask !== HUD_LAYER &&
          !(mesh.metadata as { decor?: boolean } | null)?.decor,
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
