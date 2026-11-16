import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { expect, it } from 'vitest';
import { projectionViewport } from '../src/dev/label-viewport';

it('projects the view centre to the centre of a bottom-anchored viewport, y from the top', () => {
  // The bottom 60% of a 100 x 200 screen: its centre is at y = 200 * (1 - 0.3) = 140 from the top.
  const vp = new Viewport(0, 0, 1, 0.6);
  const p = Vector3.Project(
    Vector3.Zero(),
    Matrix.Identity(),
    Matrix.Identity(),
    projectionViewport(vp, 100, 200),
  );
  expect(p.x).toBeCloseTo(50);
  expect(p.y).toBeCloseTo(140);
});
