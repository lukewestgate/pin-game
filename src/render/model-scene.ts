// Builds a Model's meshes from its JSON shapes. Kept apart from the HUD and input, so a future
// editor can reuse it. Boxes are rounded (`round`) with box-projected UVs, cylinders are lathed
// with soft rims, `finish: "wood"` multiplies the colour by a grain drawn in code, and all
// normals are smooth. Toon shading arrives with ticket 28.
import type { ModelData, Shape } from '../content/schema';
import { Constants } from '@babylonjs/core/Engines/constants';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder.pure';
import { CreateLathe } from '@babylonjs/core/Meshes/Builders/latheBuilder.pure';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.pure';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder.pure';
import { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.pure';
import type { Scene } from '@babylonjs/core/scene.pure';
import { roundedBoxData, type MeshData } from './rounded-box';
import { grainPixels } from './wood-grain';

export interface ModelScene {
  root: TransformNode;
  /** One node per Part, in Model order; Sockets are in this node's local space. */
  parts: TransformNode[];
  /** Model-space bounding sphere of the shapes and the Pins sitting in their Sockets. */
  bounds: { centre: Vector3; radius: number };
}

/** A Pin's head. The game view draws Pins, but they count towards the bounding sphere. */
export const PIN = { diameter: 0.24, height: 0.08, segments: 14 } as const;
/** Round things stay round: about 32 segments on wheels and other cylinders and rings. */
export const WHEEL_SEGMENTS = 32;
const WOOD_TEXTURE_SIZE = 256;

export type MaterialFor = (hex: string, finish?: Shape['finish']) => StandardMaterial;

/** One material per colour and finish, shared across meshes. */
export function materialCache(scene: Scene): MaterialFor {
  const cache = new Map<string, StandardMaterial>();
  let grain: RawTexture | null = null;
  const woodTexture = (): RawTexture => {
    if (!grain) {
      grain = new RawTexture(
        grainPixels(WOOD_TEXTURE_SIZE),
        WOOD_TEXTURE_SIZE,
        WOOD_TEXTURE_SIZE,
        Constants.TEXTUREFORMAT_RGBA,
        scene,
        true,
        false,
        Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
      );
      grain.wrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
      grain.wrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
    }
    return grain;
  };
  return (hex, finish) => {
    const key = finish ? `${hex}/${finish}` : hex;
    let mat = cache.get(key);
    if (!mat) {
      mat = new StandardMaterial(`mat-${key}`, scene);
      mat.diffuseColor = Color3.FromHexString(hex);
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      if (finish === 'wood') mat.diffuseTexture = woodTexture();
      cache.set(key, mat);
    }
    return mat;
  };
}

function applyData(mesh: Mesh, data: MeshData): Mesh {
  const vd = new VertexData();
  vd.positions = data.positions;
  vd.indices = data.indices;
  vd.normals = data.normals;
  vd.uvs = data.uvs;
  vd.applyToMesh(mesh);
  return mesh;
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number, steps: number): Vector3[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / steps;
    return new Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  });
}

/** A cylinder lathed from a profile with rounded rims, so tyres and dowels have soft edges. */
function roundedCylinder(
  name: string,
  shape: Extract<Shape, { kind: 'cylinder' }>,
  scene: Scene,
): Mesh {
  const R = shape.diameter / 2;
  const h = shape.height;
  const b = Math.min(shape.round ?? 0.06, shape.diameter * 0.45, h * 0.45);
  const profile = [
    new Vector3(0, -h / 2, 0),
    ...arc(R - b, -h / 2 + b, b, -Math.PI / 2, 0, 5),
    ...arc(R - b, h / 2 - b, b, 0, Math.PI / 2, 5),
    new Vector3(0, h / 2, 0),
  ];
  return CreateLathe(
    name,
    {
      shape: profile,
      tessellation: shape.segments ?? WHEEL_SEGMENTS,
      sideOrientation: Mesh.DOUBLESIDE,
    },
    scene,
  );
}

function shapeMesh(shape: Shape, name: string, scene: Scene): Mesh {
  switch (shape.kind) {
    case 'box':
      return applyData(new Mesh(name, scene), roundedBoxData(shape.size, shape.round));
    case 'cylinder':
      return roundedCylinder(name, shape, scene);
    case 'torus':
      return CreateTorus(
        name,
        {
          diameter: shape.diameter,
          thickness: shape.thickness,
          tessellation: shape.segments ?? WHEEL_SEGMENTS,
        },
        scene,
      );
    case 'capsule':
      return CreateCapsule(
        name,
        { radius: shape.radius, height: shape.height, tessellation: shape.segments ?? 16 },
        scene,
      );
    case 'sphere':
      return CreateSphere(
        name,
        {
          diameterX: shape.size[0],
          diameterY: shape.size[1],
          diameterZ: shape.size[2],
          segments: shape.segments ?? 16,
        },
        scene,
      );
  }
}

export function buildModel(
  scene: Scene,
  model: ModelData,
  material = materialCache(scene),
): ModelScene {
  const root = new TransformNode(`model-${model.id}`, scene);
  const parts = model.parts.map((part) => {
    const node = new TransformNode(`part-${part.id}`, scene);
    node.parent = root;
    if (part.position) node.position = Vector3.FromArray(part.position);
    if (part.rotation) node.rotation = Vector3.FromArray(part.rotation);
    part.shapes.forEach((shape, i) => {
      const mesh = shapeMesh(shape, `${part.id}-${i}`, scene);
      mesh.parent = node;
      mesh.position = Vector3.FromArray(shape.position);
      if (shape.rotation) mesh.rotation = Vector3.FromArray(shape.rotation);
      mesh.material = material(shape.colour, shape.finish);
    });
    return node;
  });

  root.computeWorldMatrix(true);
  const meshes = root.getChildMeshes();
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  for (const mesh of meshes) {
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, box.minimumWorld);
    max = Vector3.Maximize(max, box.maximumWorld);
  }
  // Pins stick out of their Sockets: grow the box by each head's extent (a cube bound, so safe).
  const pad = new Vector3(PIN.diameter / 2, PIN.diameter / 2, PIN.diameter / 2);
  model.parts.forEach((part, p) => {
    const node = parts[p];
    if (!node) return;
    for (const socket of part.sockets) {
      const dir = Vector3.FromArray(socket.direction).normalize();
      const tip = Vector3.FromArray(socket.position).add(dir.scale(PIN.height));
      const world = Vector3.TransformCoordinates(tip, node.getWorldMatrix());
      min = Vector3.Minimize(min, world.subtract(pad));
      max = Vector3.Maximize(max, world.add(pad));
    }
  });
  const centre = min.add(max).scale(0.5);
  return { root, parts, bounds: { centre, radius: max.subtract(min).length() / 2 } };
}
