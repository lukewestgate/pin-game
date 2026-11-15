// Entry point: wires content, rules, undo history and the Babylon view to the DOM buttons.
import './render/babylon-side-effects';
import './style.css';
import { Engine } from '@babylonjs/core/Engines/engine.pure';
import { bundledLevels } from './content/bundled';
import { canUndo, commit, startHistory, undo, type History } from './rules/history';
import { initialState, tap } from './rules/rules';
import type { State } from './rules/state';
import { attachInput } from './input/input';
import { createGameView } from './render/game-view';
import { readSafeInsets } from './render/safe-insets';

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
const carLevel = bundledLevels().find((l) => l.id === 'wooden-car-1');
if (!carLevel) throw new Error('The wooden-car-1 Level is not bundled');
const level = carLevel;

// WebGL2 engine (Babylon falls back to WebGL1 only where WebGL2 is missing).
const engine = new Engine(
  canvas,
  true,
  { alpha: true, premultipliedAlpha: false, stencil: true },
  true,
);
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

function show(): void {
  view.draw(history.present);
  statusText.textContent = STATUS[history.present.status];
  undoButton.disabled = !canUndo(history);
}

function tapPin(pin: number): void {
  const result = tap(level, history.present, pin);
  if (result.refused) return;
  history = commit(history, result.state);
  show();
}

const input = attachInput(canvas, {
  modelRegion: () => view.layout.model,
  candidates: () => view.candidates(history.present),
  zoom: () => view.zoom,
  setZoom: (z) => view.setZoom(z),
  turn: (dx, dy) => view.turn(dx, dy),
  highlight: (pin) => view.highlight(pin),
  tapPin,
  blockedTap: (pin) => view.blockedTap(pin, history.present, performance.now()),
});

undoButton.addEventListener('click', () => {
  history = undo(history);
  show();
});
restartButton.addEventListener('click', () => {
  history = startHistory(start);
  show();
});

window.addEventListener('resize', () => {
  engine.resize();
  view.resize();
  placeBar();
});

show();
engine.runRenderLoop(() => {
  input.tick(performance.now());
  view.scene.render();
});
