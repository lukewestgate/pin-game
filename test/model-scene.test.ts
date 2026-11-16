import '../src/render/babylon-side-effects';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.pure';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.pure';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { Scene } from '@babylonjs/core/scene.pure';
import { afterEach, describe, expect, it } from 'vitest';
import { bundledLevels } from '../src/content/bundled';
import type { ModelData } from '../src/content/schema';
import { PIN, buildModel } from '../src/render/model-scene';
import { roundedBoxData } from '../src/render/rounded-box';
import { grainPixels } from '../src/render/wood-grain';

describe('roundedBoxData', () => {
  const data = roundedBoxData([2, 1, 1.5], 0.2);
  const at = (i: number) => [
    data.positions[3 * i],
    data.positions[3 * i + 1],
    data.positions[3 * i + 2],
  ];

  it('stays inside the box and has unit normals', () => {
    for (let i = 0; i < data.positions.length / 3; i++) {
      const [x, y, z] = at(i) as [number, number, number];
      expect(Math.abs(x)).toBeLessThanOrEqual(1 + 1e-6);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.5 + 1e-6);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.75 + 1e-6);
      const n = Math.hypot(
        data.normals[3 * i] ?? 0,
        data.normals[3 * i + 1] ?? 0,
        data.normals[3 * i + 2] ?? 0,
      );
      expect(n).toBeCloseTo(1, 4);
    }
  });

  it('clamps an oversized radius to fit instead of breaking the shape', () => {
    const big = roundedBoxData([2, 0.3, 1], 5);
    expect(big.positions.every((v) => Number.isFinite(v))).toBe(true);
    expect(
      Math.max(...big.positions.filter((_, i) => i % 3 === 0).map(Math.abs)),
    ).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('projects UVs along the dominant normal axis, one repeat per 1.2 units', () => {
    let checked = 0;
    for (let i = 0; i < data.positions.length / 3; i++) {
      const [x, y, z] = at(i) as [number, number, number];
      const ny = data.normals[3 * i + 1] ?? 0;
      if (ny > 0.99) {
        expect(data.uvs[2 * i]).toBeCloseTo(x / 1.2, 5);
        expect(data.uvs[2 * i + 1]).toBeCloseTo(z / 1.2, 5);
        checked++;
      }
      void y;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('grainPixels', () => {
  it('is deterministic RGBA, white-based with darker grain', () => {
    const a = grainPixels(64);
    expect(a).toHaveLength(64 * 64 * 4);
    expect(grainPixels(64)).toEqual(a);
    const reds = a.filter((_, i) => i % 4 === 0);
    expect(Math.min(...reds)).toBeLessThan(250);
    expect(Math.max(...reds)).toBeGreaterThan(240);
    expect(Math.min(...reds)).toBeGreaterThan(120);
    expect(a.filter((_, i) => i % 4 === 3).every((v) => v === 255)).toBe(true);
  });
});

let engine: NullEngine | null = null;
afterEach(() => {
  engine?.dispose();
  engine = null;
});
function newScene(): Scene {
  engine = new NullEngine();
  return new Scene(engine);
}

const woodModel: ModelData = {
  id: 'm',
  formatVersion: 1,
  parts: [
    {
      id: 'p',
      sockets: [{ id: 's', position: [3, 0, 0], direction: [1, 0, 0], coveredBy: [] }],
      shapes: [
        {
          kind: 'box',
          size: [1, 1, 1],
          position: [0, 0, 0],
          colour: '#d9aa78',
          round: 0.1,
          finish: 'wood',
        },
        { kind: 'cylinder', diameter: 1, height: 1, position: [0, 2, 0], colour: '#3a3d45' },
      ],
    },
  ],
};

describe('buildModel', () => {
  it('textures wood-finish shapes only, and gives rounded boxes UVs', () => {
    const scene = newScene();
    const model = buildModel(scene, woodModel);
    const [box, cyl] = model.root.getChildMeshes();
    const boxMat = box?.material as StandardMaterial;
    const cylMat = cyl?.material as StandardMaterial;
    expect(boxMat.diffuseTexture).not.toBeNull();
    expect(cylMat.diffuseTexture).toBeNull();
    expect(box?.getVerticesData(VertexBuffer.UVKind)).not.toBeNull();
    expect(cyl?.getVerticesData(VertexBuffer.UVKind)).not.toBeNull();
  });

  it('puts the Pins inside the bounding sphere', () => {
    const scene = newScene();
    const model = buildModel(scene, woodModel);
    const tip = new Vector3(3 + PIN.height + 0, 0, 0);
    const reach = Vector3.Distance(model.bounds.centre, tip) + PIN.diameter / 2;
    expect(model.bounds.radius).toBeGreaterThanOrEqual(reach - 1e-6);
  });

  it('keeps every Pin of the wooden car inside the bounding sphere', () => {
    const scene = newScene();
    const level = bundledLevels().find((l) => l.id === 'wooden-car-1');
    if (!level) throw new Error('missing wooden-car-1');
    const model = buildModel(scene, level.model);
    for (const socket of level.pinSockets) {
      const dir = Vector3.FromArray(socket.direction).normalize();
      const tip = Vector3.FromArray(socket.position).add(dir.scale(PIN.height));
      expect(Vector3.Distance(model.bounds.centre, tip) + PIN.diameter / 2).toBeLessThanOrEqual(
        model.bounds.radius + 1e-6,
      );
    }
  });
});
