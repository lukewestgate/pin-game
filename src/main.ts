// Entry point: wires content, rules, undo history and the Babylon view to the DOM buttons.
import './render/babylon-side-effects';
import './style.css';
import { Engine } from '@babylonjs/core/Engines/engine.pure';
import { bundledFiles, bundledLevels } from './content/bundled';
import { loadDevContent } from './dev/dev-content';
import { isDevMode } from './dev/mode';
import type { DevViewer } from './dev/viewer';
import { canUndo, commit, startHistory, undo, type History } from './rules/history';
import { initialState, tap } from './rules/rules';
import type { State } from './rules/state';
import { createGameView } from './render/game-view';
import { hardwareScalingFor } from './render/render-quality';
import { readSafeInsets } from './render/safe-insets';

const TAP_SLOP_PX = 6;

function element<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

const canvas = element<HTMLCanvasElement>('scene');
const statusText = element('status');
const undoButton = element<HTMLButtonElement>('undo');
const restartButton = element<HTMLButtonElement>('restart');

// The game boots straight into the wooden-toy car. (tiny-cart-1 stays bundled as a test fixture.)
// In dev mode a bad data file shows in the dev panel instead of crashing the page. Vite reloads
// the page when a Model or Level file changes, so edits show up in the running game.
const devContent = isDevMode({ viteDev: import.meta.env.DEV, search: location.search })
  ? (({ models, levels }) => loadDevContent(models, levels))(bundledFiles())
  : null;
const carLevel = (devContent?.levels ?? bundledLevels()).find((l) => l.id === 'wooden-car-1');
if (!carLevel) {
  if (devContent) {
    void import('./dev/viewer').then((m) =>
      m.startDevViewer({ errors: devContent.errors, game: null }),
    );
  }
  throw new Error('The wooden-car-1 Level is not bundled or failed to load');
}
const level = carLevel;

// WebGL2 engine (Babylon falls back to WebGL1 only where WebGL2 is missing).
const engine = new Engine(
  canvas,
  true,
  { alpha: true, premultipliedAlpha: false, stencil: true },
  false,
);
// 4x MSAA from the context's `antialias`, and the pixel ratio capped at about 2.
engine.setHardwareScalingLevel(hardwareScalingFor(window.devicePixelRatio));
const view = createGameView(engine, level, readSafeInsets);
const bar = element('bar');

/** Puts the DOM bottom bar where the layout says. */
function placeBar(): void {
  const r = view.layout.bottomBar;
  Object.assign(bar.style, {
    left: `${r.x}px`,
    top: `${r.y}px`,
    width: `${r.w}px`,
    height: `${r.h}px`,
  });
}
placeBar();

const start = initialState(level).state;
let history: History<State> = startHistory(start);

const STATUS: Record<State['status'], string> = {
  playing: 'Tap a Pin to remove it.',
  won: 'Won! Every Pin is out.',
  lost: 'Lost: out of room in the Buffer.',
};

let devViewer: DevViewer | null = null;
if (devContent) {
  void import('./dev/viewer').then((m) => {
    devViewer = m.startDevViewer({
      errors: devContent.errors,
      game: { level, scene: view.scene, canvas },
    });
    devViewer.update(history.present);
  });
}

/** Snaps the screen to the present state, cancelling every animation (Undo, Restart). */
function show(): void {
  devViewer?.update(history.present);
  view.draw(history.present);
  statusText.textContent = STATUS[history.present.status];
  undoButton.disabled = !canUndo(history);
}

// Win and lose show only once everything has settled.
view.onOutcome = (outcome) => {
  statusText.textContent = STATUS[outcome];
};

function tapPin(pin: number): void {
  const result = tap(level, history.present, pin);
  if (result.refused) return;
  history = commit(history, result.state);
  devViewer?.update(history.present);
  view.play(result.events);
  statusText.textContent = STATUS.playing;
  undoButton.disabled = !canUndo(history);
}

let press: { id: number; x: number; y: number } | null = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 0) press = { id: e.pointerId, x: e.offsetX, y: e.offsetY };
});
canvas.addEventListener('pointerup', (e) => {
  if (!press || press.id !== e.pointerId) return;
  const moved = Math.hypot(e.offsetX - press.x, e.offsetY - press.y);
  const { x, y } = press;
  press = null;
  if (moved > TAP_SLOP_PX) return;
  const pin = view.pinAt(x, y);
  if (pin !== null) tapPin(pin);
});
canvas.addEventListener('pointercancel', () => (press = null));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

undoButton.addEventListener('click', () => {
  history = undo(history);
  show();
});
restartButton.addEventListener('click', () => {
  history = startHistory(start);
  show();
});

window.addEventListener('resize', () => {
  engine.setHardwareScalingLevel(hardwareScalingFor(window.devicePixelRatio));
  engine.resize();
  view.resize();
  placeBar();
});

show();
engine.runRenderLoop(() => view.scene.render());
