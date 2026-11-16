// Entry point: wires content, rules, undo history and the Babylon view to the DOM buttons.
import './render/babylon-side-effects';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-800.css';
import './style.css';
import { Engine } from '@babylonjs/core/Engines/engine.pure';
import { bundledFiles, bundledLevels } from './content/bundled';
import { loadDevContent } from './dev/dev-content';
import { isDevMode } from './dev/mode';
import type { DevViewer } from './dev/viewer';
import { canUndo, commit, startHistory, undo, type History } from './rules/history';
import { initialState, tap } from './rules/rules';
import type { State } from './rules/state';
import { attachInput } from './input/input';
import { createAudio } from './audio/audio';
import { createBabylonBackend } from './audio/babylon-backend';
import { createGameView } from './render/game-view';
import { hardwareScalingFor } from './render/render-quality';
import { readSafeInsets } from './render/safe-insets';
import { browserStorage, createSettingsStore } from './settings/store';
import { ICONS, type IconName } from './ui/icons';
import { startUpdater } from './pwa/updater';

function element<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el as T;
}

const canvas = element<HTMLCanvasElement>('scene');
const statusText = element('status');
const undoButton = element<HTMLButtonElement>('undo');
const restartButton = element<HTMLButtonElement>('restart');
const outcomePanel = element('outcome');
const outcomeTitle = element('outcome-title');
const againButton = element<HTMLButtonElement>('again');

for (const slot of document.querySelectorAll<HTMLElement>('[data-icon]')) {
  slot.innerHTML = ICONS[slot.dataset.icon as IconName];
}

// The copy is a placeholder (UI visual style).
const OUTCOME_COPY = {
  won: { title: 'CAR STRIPPED!', button: 'Play again' },
  lost: { title: 'OUT OF ROOM', button: 'Try again' },
} as const;

function showOutcome(outcome: 'won' | 'lost'): void {
  bannerShowing = true;
  outcomePanel.className = outcome;
  outcomeTitle.textContent = OUTCOME_COPY[outcome].title;
  againButton.textContent = OUTCOME_COPY[outcome].button;
}

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
const settings = createSettingsStore(browserStorage());
const view = createGameView(engine, level, readSafeInsets, {
  screwShapes: settings.get('screwShapes'),
});
const bar = element('bar');

// Sound: scheduled Timeline steps play at their start times. If audio fails, nothing else changes.
const audio = createAudio({
  backend: createBabylonBackend(),
  enabled: () => settings.get('sound'),
});
view.onSteps = (steps) => audio.schedule(steps, performance.now());

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

// The settings sheet opens above the Settings button, right-aligned to it.
const sheet = element('settings-sheet');
const settingsButton = element<HTMLButtonElement>('settings');
const soundSwitch = element<HTMLInputElement>('setting-sound');
const shapesSwitch = element<HTMLInputElement>('setting-screw-shapes');
function placeSheet(): void {
  const b = settingsButton.getBoundingClientRect();
  sheet.style.bottom = `${window.innerHeight - b.top + 10}px`;
  sheet.style.right = `${Math.max(8, window.innerWidth - b.right)}px`;
}
const muteButton = element<HTMLButtonElement>('mute');
function syncSwitches(): void {
  const on = settings.get('sound');
  soundSwitch.checked = on;
  muteButton.setAttribute('aria-pressed', String(!on));
  const icon = muteButton.querySelector<HTMLElement>('[data-icon]');
  if (icon) icon.innerHTML = ICONS[on ? 'soundOn' : 'soundOff'];
  shapesSwitch.checked = settings.get('screwShapes');
}
settingsButton.addEventListener('click', () => {
  sheet.classList.toggle('hidden');
  placeSheet();
});
muteButton.addEventListener('click', () => settings.set('sound', !settings.get('sound')));
soundSwitch.addEventListener('change', () => settings.set('sound', soundSwitch.checked));
shapesSwitch.addEventListener('change', () => settings.set('screwShapes', shapesSwitch.checked));
settings.subscribe((key, value) => {
  if (key === 'screwShapes') view.setScrewShapes(value);
  if (key === 'sound' && !value) audio.silence();
  syncSwitches();
});
canvas.addEventListener('pointerdown', () => sheet.classList.add('hidden'));
syncSwitches();
placeBar();
placeSheet();

const start = initialState(level).state;
let history: History<State> = startHistory(start);

const STATUS: Record<State['status'], string> = {
  playing: 'Tap a Pin to remove it.',
  won: 'Won! Every Pin is out.',
  lost: 'Lost: out of room in the Buffer.',
};

// A waiting update is applied only before the first tap of a Level or once a banner shows.
let bannerShowing = false;
const updater = startUpdater(() => ({
  tapsOnLevel: canUndo(history) ? 1 : 0,
  bannerShowing,
}));

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
  outcomePanel.className = 'hidden';
  bannerShowing = false;
  updater.recheck();
}

// Win and lose show only once everything has settled.
view.onOutcome = (outcome) => {
  statusText.textContent = STATUS[outcome];
  showOutcome(outcome);
  updater.recheck();
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

const input = attachInput(canvas, {
  modelRegion: () => view.layout.model,
  candidates: () => view.candidates(history.present),
  zoom: () => view.zoom,
  setZoom: (z) => view.setZoom(z),
  turn: (dx, dy) => view.turn(dx, dy),
  highlight: (pin) => view.highlight(pin),
  peekAt: (x, y, pin) => view.peekAt(x, y, pin, performance.now()),
  peekEnd: () => view.peekEnd(),
  tapPin,
  blockedTap: (pin) => {
    view.blockedTap(pin, history.present, performance.now());
    audio.blocked(performance.now());
  },
  pointerUp: () => void audio.unlock(),
});

undoButton.addEventListener('click', () => {
  audio.cancel();
  history = undo(history);
  show();
});
function restart(): void {
  audio.cancel();
  history = startHistory(start);
  show();
}
restartButton.addEventListener('click', restart);
againButton.addEventListener('click', restart);

window.addEventListener('resize', () => {
  engine.setHardwareScalingLevel(hardwareScalingFor(window.devicePixelRatio));
  engine.resize();
  view.resize(() => history.present);
  placeBar();
  placeSheet();
});

show();
engine.runRenderLoop(() => {
  input.tick(performance.now());
  audio.tick(performance.now());
  view.scene.render();
});
