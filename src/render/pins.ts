// Every Pin on screen (car, Box and Buffer) is an instance of one head mesh, so they share one
// draw call. Per instance: the colour and the Head-mark atlas index, as instanced buffers read by
// a material plugin. An ink outline (inverted hull) hangs off each head, and a threaded shank
// is drawn only while a Pin pops out.
import { Constants } from '@babylonjs/core/Engines/constants';
import type { Material } from '@babylonjs/core/Materials/material.pure';
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.pure';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color.pure';
import type { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh.pure';
import { Mesh } from '@babylonjs/core/Meshes/mesh.pure';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode.pure';
import type { Scene } from '@babylonjs/core/scene.pure';
import { MARK_CELLS, MARK_CELL_SIZE, markAtlasPixels } from './head-mark-atlas';
import { pinHeadData, pinOutlineData, shankData } from './pin-geometry';
import type { MeshData } from './rounded-box';
import { applyData } from './model-scene';
import { ToonPlugin } from './toon';

export const INK = '#13202a';
/** Outline thickness in Model units (about 5% of the head's diameter). */
const OUTLINE_WIDTH = 0.012;
const SHANK_COLOUR = '#aeb4bb';
/** Longest shank a pop-out can show; shorter lifts scale the shank down. */
const SHANK_LENGTH = 0.3;
/** Wall and floor tones of the Head-mark recess, as multiples of the Pin colour. */
export const MARK_WALL = 0.3;
export const MARK_FLOOR = 0.5;

/** The fragment and vertex code that reads the per-instance colour and mark. */
export function pinMarkCode(): {
  vertex: Record<string, string>;
  fragment: Record<string, string>;
} {
  return {
    vertex: {
      CUSTOM_VERTEX_DEFINITIONS: `
attribute vec3 pinColor;
attribute float markIndex;
varying vec3 vPinColor;
varying float vMarkIndex;
varying vec2 vMarkUV;
`,
      CUSTOM_VERTEX_MAIN_END: `
vPinColor = pinColor;
vMarkIndex = markIndex;
vMarkUV = uv;
`,
    },
    fragment: {
      CUSTOM_FRAGMENT_DEFINITIONS: `
uniform sampler2D markAtlas;
varying vec3 vPinColor;
varying float vMarkIndex;
varying vec2 vMarkUV;
`,
      CUSTOM_FRAGMENT_UPDATE_DIFFUSE: `
baseColor.rgb = vPinColor;
if (vMarkUV.x >= 0.0) {
  vec2 markPixel = texture2D(markAtlas, vec2((vMarkIndex + vMarkUV.x) / ${MARK_CELLS.toFixed(1)}, vMarkUV.y)).rg;
  baseColor.rgb *= mix(1.0, ${MARK_WALL.toFixed(2)}, markPixel.r);
  baseColor.rgb = mix(baseColor.rgb, vPinColor * ${MARK_FLOOR.toFixed(2)}, markPixel.g);
}
`,
    },
  };
}

class PinMarkPlugin extends MaterialPluginBase {
  constructor(
    material: Material,
    private readonly atlas: RawTexture,
  ) {
    super(material, 'PinMark', 190, { PIN_MARK: false });
    this._enable(true);
  }

  override getClassName(): string {
    return 'PinMarkPlugin';
  }

  override prepareDefines(defines: Record<string, unknown>): void {
    defines.PIN_MARK = true;
  }

  override getAttributes(attributes: string[]): void {
    attributes.push('pinColor', 'markIndex');
  }

  override getSamplers(samplers: string[]): void {
    samplers.push('markAtlas');
  }

  override hasTexture(texture: unknown): boolean {
    return texture === this.atlas;
  }

  override getActiveTextures(textures: unknown[]): void {
    textures.push(this.atlas);
  }

  override bindForSubMesh(
    _ubo: unknown,
    _scene: unknown,
    _engine: unknown,
    subMesh: { effect?: { setTexture(name: string, t: RawTexture): void } | null },
  ): void {
    subMesh.effect?.setTexture('markAtlas', this.atlas);
  }

  override getCustomCode(shaderType: string): Record<string, string> | null {
    const code = pinMarkCode();
    return shaderType === 'vertex' ? code.vertex : code.fragment;
  }
}

export interface PinMesh {
  head: InstancedMesh;
  /** Draws the shank `length` Model units long under the head, or hides it with null. */
  setShank(length: number | null): void;
}

export interface PinFactory {
  /** A Pin head at the parent's origin, pointing up (+y) with its base on y = 0. */
  create(name: string, hex: string, parent: TransformNode | null, mark?: number): PinMesh;
}

/** `home` parents the hidden template meshes, so they stay inside the Model's bounds. */
export function createPinFactory(scene: Scene, home: TransformNode): PinFactory {
  const atlas = new RawTexture(
    markAtlasPixels(),
    MARK_CELLS * MARK_CELL_SIZE,
    MARK_CELL_SIZE,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    false,
    false,
    Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
  );
  atlas.wrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
  atlas.wrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

  const headMaterial = new StandardMaterial('pin-head', scene);
  headMaterial.diffuseColor = new Color3(1, 1, 1);
  headMaterial.specularColor = new Color3(0.15, 0.15, 0.15);
  new ToonPlugin(headMaterial);
  new PinMarkPlugin(headMaterial, atlas);

  const inkMaterial = new StandardMaterial('pin-ink', scene);
  inkMaterial.disableLighting = true;
  inkMaterial.emissiveColor = Color3.FromHexString(INK);

  const shankMaterial = new StandardMaterial('pin-shank', scene);
  shankMaterial.diffuseColor = Color3.FromHexString(SHANK_COLOUR);
  shankMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
  new ToonPlugin(shankMaterial);

  const template = (name: string, data: MeshData, material: StandardMaterial): Mesh => {
    const mesh = applyData(new Mesh(name, scene), data);
    mesh.material = material;
    mesh.isVisible = false;
    mesh.isPickable = false;
    mesh.parent = home;
    return mesh;
  };
  const head = template('pin-template', pinHeadData(), headMaterial);
  head.registerInstancedBuffer('pinColor', 3);
  head.registerInstancedBuffer('markIndex', 1);
  const outline = template('pin-outline-template', pinOutlineData(OUTLINE_WIDTH), inkMaterial);
  const shank = template('pin-shank-template', shankData(SHANK_LENGTH), shankMaterial);

  return {
    create(name, hex, parent, mark = 0) {
      const instance = head.createInstance(name);
      instance.parent = parent;
      instance.instancedBuffers.pinColor = Color3.FromHexString(hex);
      instance.instancedBuffers.markIndex = mark;
      const ink = outline.createInstance(`ink-${name}`);
      ink.parent = instance;
      ink.isPickable = false;
      ink.metadata = { decor: true };
      const thread = shank.createInstance(`shank-${name}`);
      thread.parent = instance;
      thread.isPickable = false;
      thread.metadata = { decor: true };
      thread.setEnabled(false);
      return {
        head: instance,
        setShank(length) {
          thread.setEnabled(length !== null);
          if (length !== null) thread.scaling.y = Math.max(0.01, length / SHANK_LENGTH);
        },
      };
    },
  };
}
