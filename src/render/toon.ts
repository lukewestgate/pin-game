// 3-band toon shading as a StandardMaterial plugin: it snaps the light that reached a pixel to
// one of three levels. The band numbers live here and are written into the shader snippet.
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.pure';
import { RegisterClass } from '@babylonjs/core/Misc/typeStore';
import type { Material } from '@babylonjs/core/Materials/material.pure';

/** Light at or above `from` (0..1) is drawn at `level`. Ascending. */
export const TOON_BANDS = [
  { from: 0, level: 0.58 },
  { from: 0.5, level: 0.8 },
  { from: 0.85, level: 1 },
] as const;

export function toonBand(light: number): number {
  let level: number = TOON_BANDS[0].level;
  for (const band of TOON_BANDS) if (light >= band.from) level = band.level;
  return level;
}

/** GLSL for the fragment hook before fog: `diffuseBase` is the summed light, `color` the result. */
export function toonShaderCode(): string {
  const f = (n: number) => n.toFixed(3);
  const [a, b, c] = TOON_BANDS;
  return `
float toonLight = dot(diffuseBase, vec3(0.3, 0.59, 0.11));
float toonLevel = toonLight >= ${f(c.from)} ? ${f(c.level)} : (toonLight >= ${f(b.from)} ? ${f(b.level)} : ${f(a.level)});
color.rgb *= toonLevel / max(toonLight, 0.001);
`;
}

export class ToonPlugin extends MaterialPluginBase {
  constructor(material: Material) {
    super(material, 'Toon', 200, { TOON: false });
    this._enable(true);
  }

  override getClassName(): string {
    return 'ToonPlugin';
  }

  override prepareDefines(defines: Record<string, unknown>): void {
    defines.TOON = true;
  }

  override getCustomCode(shaderType: string): Record<string, string> | null {
    return shaderType === 'fragment' ? { CUSTOM_FRAGMENT_BEFORE_FOG: toonShaderCode() } : null;
  }
}

// Material.clone re-instantiates plugins by registered class name; Peek clones Part materials.
RegisterClass('BABYLON.ToonPlugin', ToonPlugin);
