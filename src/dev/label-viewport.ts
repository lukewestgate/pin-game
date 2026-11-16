import { Viewport } from '@babylonjs/core/Maths/math.viewport';

/**
 * A camera viewport (fractions, y measured from the bottom) as the pixel viewport that
 * `Vector3.Project` wants (y measured from the top).
 */
export function projectionViewport(vp: Viewport, width: number, height: number): Viewport {
  return new Viewport(
    vp.x * width,
    (1 - vp.y - vp.height) * height,
    vp.width * width,
    vp.height * height,
  );
}
