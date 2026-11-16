// The wood grain, drawn in code: a white RGBA square with soft, wavy, darker lines that wrap
// vertically. It multiplies a shape's body colour, so there is no image asset.

/** Deterministic: the same size always gives the same pixels. */
export function grainPixels(size: number): Uint8Array {
  const pixels = new Uint8Array(size * size * 4).fill(255);
  let s = 11;
  const rnd = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
  const ink = [90, 50, 20];
  for (let line = 0; line < 46; line++) {
    const y0 = rnd() * size;
    const amplitude = 2 + rnd() * 5;
    const waves = 1 + Math.floor(rnd() * 3);
    const strength = 0.05 + rnd() * 0.1;
    const width = 0.8 + rnd() * 2.2;
    for (let x = 0; x < size; x++) {
      const yc = y0 + Math.sin((x / size) * Math.PI * 2 * waves + line) * amplitude;
      for (let dy = -Math.ceil(width); dy <= Math.ceil(width); dy++) {
        const row = Math.round(yc) + dy;
        const falloff = 1 - Math.abs(row - yc) / (width + 1);
        if (falloff <= 0) continue;
        const a = strength * falloff;
        const o = ((((row % size) + size) % size) * size + x) * 4;
        for (let c = 0; c < 3; c++)
          pixels[o + c] = Math.round((pixels[o + c] as number) * (1 - a) + (ink[c] as number) * a);
      }
    }
  }
  return pixels;
}
