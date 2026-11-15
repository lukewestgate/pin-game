// Builds a Model's meshes from its JSON shapes. Kept apart from the HUD and input, so a future
// editor can reuse it. Bevels (`round`), wood grain and toon shading arrive with ticket 28.
import type { ModelData, Shape } from '../content/schema';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { Color3 } from '@babylonjs/core/Maths/math.color.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder.pure';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder.pure';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder.pure';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder.pure';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder.pure';
import type { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.pure';
import type { Scene } from '@babylonjs/core/scene.pure';

export interface ModelScene {
  root: TransformNode;
  /** One node per Part, in Model order; Sockets are in this node's local space. */
  parts: TransformNode[];
  /** Model-space bounding sphere of the shapes. */
  bounds: { centre: Vector3; radius: number };
}

/** One flat material per colour, shared across meshes. */
export function materialCache(scene: Scene): (hex: string) => StandardMaterial {
  const cache = new Map<string, StandardMaterial>();
  return (hex) => {
    let mat = cache.get(hex);
    if (!mat) {
      mat = new StandardMaterial(`mat-${hex}`, scene);
      mat.diffuseColor = Color3.FromHexString(hex);
      mat.specularColor = new Color3(0.1, 0.1, 0.1);
      cache.set(hex, mat);
    }
    return mat;
  };
}

function shapeMesh(shape: Shape, name: string, scene: Scene): Mesh {
  switch (shape.kind) {
    case 'box':
      return CreateBox(
        name,
        { width: shape.size[0], height: shape.size[1], depth: shape.size[2] },
        scene,
      );
    case 'cylinder':
      return CreateCylinder(
        name,
        { diameter: shape.diameter, height: shape.height, tessellation: shape.segments ?? 32 },
        scene,
      );
    case 'torus':
      return CreateTorus(
        name,
        {
          diameter: shape.diameter,
          thickness: shape.thickness,
          tessellation: shape.segments ?? 32,
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
      mesh.material = material(shape.colour);
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
  const centre = min.add(max).scale(0.5);
  return { root, parts, bounds: { centre, radius: max.subtract(min).length() / 2 } };
}
