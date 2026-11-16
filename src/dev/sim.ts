// Headless simulator (`?sim`): renders the real game in software GL without a person, so a
// desktop can check what the phone shows. It renders still frames, then plays taps as fast as the
// player might, and reports frame costs and a snapshot of the canvas as page text and an image,
// which `pnpm sim` captures with a headless browser. Software GL is far slower than a phone GPU,
// so the numbers that carry over are draw calls, active meshes and CPU time, not the fps.
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import type { Engine } from '@babylonjs/core/Engines/engine.pure';
import type { Scene } from '@babylonjs/core/scene.pure';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.pure';

export interface SimHost {
  engine: Engine;
  scene: Scene;
  canvas: HTMLCanvasElement;
  /** Taps the next tappable Pin, or returns false when none is left. */
  tapNext(): boolean;
}

interface Phase {
  name: string;
  frames: number;
  tapEvery: number;
}

const PHASES: Phase[] = [
  { name: 'still', frames: 20, tapEvery: 0 },
  { name: 'fast taps', frames: 60, tapEvery: 4 },
];

const HUD_LAYER = 0x10000000;

interface Variant {
  name: string;
  hide: (mesh: AbstractMesh) => boolean;
  /** Changes a scene setting for the run; returns how to restore it. */
  apply?: (scene: Scene) => () => void;
}

/** Each variant hides one feature, so its cost shows as the drop in GPU time against `all`. */
const VARIANTS: Variant[] = [
  { name: 'all', hide: () => false },
  { name: 'no ink outlines', hide: (m) => isDecor(m) },
  { name: 'no HUD', hide: (m) => m.layerMask === HUD_LAYER },
  {
    name: 'frozen active meshes (upper bound for culling cost)',
    hide: () => false,
    apply: (scene) => {
      scene.freezeActiveMeshes();
      return () => scene.unfreezeActiveMeshes();
    },
  },
  {
    name: 'no frustum clipping',
    hide: () => false,
    apply: (scene) => {
      scene.skipFrustumClipping = true;
      return () => (scene.skipFrustumClipping = false);
    },
  },
  { name: 'no car/model', hide: (m) => m.layerMask !== HUD_LAYER && !isDecor(m) },
];

const isDecor = (m: AbstractMesh): boolean => !!(m.metadata as { decor?: boolean } | null)?.decor;

/** Draws one frame and waits for the GPU to finish it, so the time includes the GPU's share. */
function timedFrame(host: SimHost): number {
  const gl = (host.engine as unknown as { _gl: WebGL2RenderingContext })._gl;
  const t0 = performance.now();
  host.scene.render();
  gl.finish();
  return performance.now() - t0;
}

export async function runSim(host: SimHost): Promise<void> {
  const { scene, canvas } = host;
  // Shaders compile in the background, so give them time before measuring.
  const waitStart = performance.now();
  while (!scene.isReady() && performance.now() - waitStart < 20_000) {
    scene.render();
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const readyAfter = performance.now() - waitStart;
  const instrumentation = new SceneInstrumentation(scene);
  instrumentation.captureRenderTime = true;
  instrumentation.captureActiveMeshesEvaluationTime = true;
  const lines: string[] = [
    `GL: ${host.engine.getGlInfo().renderer}`,
    `scene ready: ${scene.isReady()} after ${readyAfter.toFixed(0)} ms`,
  ];
  let snapshot = '';
  for (const phase of PHASES) {
    const times: number[] = [];
    let draws = 0;
    for (let i = 0; i < phase.frames; i++) {
      if (phase.tapEvery && i % phase.tapEvery === 0) host.tapNext();
      times.push(timedFrame(host));
      draws = Math.max(draws, instrumentation.drawCallsCounter.current);
      // The drawing buffer is only readable in the task that drew it.
      if (phase === PHASES[PHASES.length - 1] && i === phase.frames - 1) {
        snapshot = canvas.toDataURL('image/png');
      }
    }
    times.sort((a, b) => a - b);
    const mid = times[Math.floor(times.length / 2)] ?? 0;
    const worst = times[times.length - 1] ?? 0;
    lines.push(
      `${phase.name}: median ${mid.toFixed(1)} ms, worst ${worst.toFixed(1)} ms, ` +
        `${draws} draws, ${scene.getActiveMeshes().length} active meshes`,
    );
  }
  // The browser rounds timers to about a millisecond, so time a batch of frames and divide.
  const gl = (host.engine as unknown as { _gl: WebGL2RenderingContext })._gl;
  lines.push('GPU-inclusive mean frame time over 40 frames (still scene):');
  for (const variant of VARIANTS) {
    const hidden = scene.meshes.filter((m) => m.isEnabled() && variant.hide(m));
    for (const m of hidden) m.setEnabled(false);
    const restore = variant.apply?.(scene);
    timedFrame(host);
    const t0 = performance.now();
    for (let i = 0; i < 40; i++) timedFrame(host);
    const withGpu = (performance.now() - t0) / 40;
    // Without the GPU wait, the time is the CPU's share: draw calls, uniforms, state changes. A phone
    // CPU is several times slower than a desktop one, so this is the figure that predicts its lag.
    const c0 = performance.now();
    for (let i = 0; i < 40; i++) scene.render();
    const cpu = (performance.now() - c0) / 40;
    gl.finish();
    restore?.();
    for (const m of hidden) m.setEnabled(true);
    lines.push(
      `  ${variant.name}: ${withGpu.toFixed(2)} ms with GPU, ${cpu.toFixed(2)} ms CPU only`,
    );
  }
  const out = document.createElement('div');
  out.id = 'sim-report';
  out.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#123;color:#fff;font:12px monospace;padding:8px';
  const text = document.createElement('pre');
  text.textContent = ['SIM', ...lines].join('\n');
  const img = document.createElement('img');
  img.src = snapshot;
  img.style.cssText = 'width:100%;max-height:75vh;object-fit:contain;display:block';
  out.append(text, img);
  document.body.append(out);
}
