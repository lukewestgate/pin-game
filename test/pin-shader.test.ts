import { describe, expect, it } from 'vitest';
import { pinMarkCode } from '../src/render/pins';

describe('pin mark shader', () => {
  // Babylon's StandardMaterial vertex shader only declares `uv` under `#ifdef UV1`, and an untextured
  // Pin never sets UV1, so the plugin must declare it itself or the Pin material fails to compile
  // and every Pin vanishes. Found in the browser; NullEngine never compiles GLSL.
  it('declares the uv attribute the vertex hook reads when the host shader does not', () => {
    const { CUSTOM_VERTEX_DEFINITIONS: defs, CUSTOM_VERTEX_MAIN_END: main } = pinMarkCode().vertex;
    expect(main).toContain('= uv;');
    expect(defs).toMatch(/#ifndef UV1\s+attribute vec2 uv;\s+#endif/);
  });
});
