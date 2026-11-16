// The dev viewer: id labels over the Model, Socket selection with covering-Part highlight,
// ray-check warnings, the solver panel, load errors and the optional next-Box forecast.
// Loaded only in dev mode (see `mode.ts`). DOM and Babylon glue: the logic it shows lives in the
// pure modules beside it, which carry the tests.
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.pure';
import { Color3 } from '@babylonjs/core/Maths/math.color.pure';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector.pure';
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh.pure';
import type { Scene } from '@babylonjs/core/scene.pure';
import './dev.css';
import type { LoadedLevel } from '../content/loader';
import { CANDY } from '../content/palette';
import type { State } from '../rules/state';
import { formatReport } from '../solver/report';
import { coveringParts } from './covering';
import type { DevContentError } from './dev-content';
import { forecastNextBox } from './forecast';
import { rayCheck } from './ray-check';
import { startSolve } from './solve-client';

export interface DevViewerOptions {
  errors: readonly DevContentError[];
  /** Null when no Level loaded: the panel then shows only the errors. */
  game: { level: LoadedLevel; scene: Scene; canvas: HTMLCanvasElement } | null;
}

export interface DevViewer {
  /** Call whenever the game state changes, to refresh the forecast. */
  update(state: State): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export function startDevViewer(options: DevViewerOptions): DevViewer {
  const panel = el('details', { id: 'dev-panel', open: true });
  panel.append(el('summary', {}, `Dev viewer · build ${__APP_VERSION__}`));
  document.body.append(panel);

  const errorList = el('ul', { className: 'dev-errors' });
  for (const e of options.errors) errorList.append(el('li', {}, e.message));
  if (options.errors.length) panel.append(el('strong', {}, 'Load errors'), errorList);

  const game = options.game;
  if (!game) return { update: () => undefined };
  const { level, scene } = game;

  // ---- Ray-check warnings ----
  const warnings = rayCheck(level.model);
  const warnList = el('ul', { className: 'dev-warnings' });
  for (const w of warnings) warnList.append(el('li', {}, w.message));
  panel.append(
    el('strong', {}, `Ray check: ${warnings.length ? `${warnings.length} warning(s)` : 'clean'}`),
    warnList,
  );

  // ---- Labels ----
  const labelLayer = el('div', { id: 'dev-labels' });
  document.body.append(labelLayer);
  const labels: { el: HTMLElement; world: () => Vector3 }[] = [];
  const node = (name: string) => scene.getTransformNodeByName(`part-${name}`);
  for (const part of level.model.parts) {
    const partNode = node(part.id);
    if (!partNode) continue;
    labels.push({
      el: labelLayer.appendChild(el('span', { className: 'dev-part-label' }, part.id)),
      world: () => partNode.getAbsolutePosition().clone(),
    });
    for (const socket of part.sockets) {
      labels.push({
        el: labelLayer.appendChild(el('span', { className: 'dev-socket-label' }, socket.id)),
        world: () =>
          Vector3.TransformCoordinates(
            Vector3.FromArray(socket.position),
            partNode.getWorldMatrix(),
          ),
      });
    }
  }
  const labelsBox = el('input', { type: 'checkbox', checked: true });
  labelLayer.hidden = false;
  labelsBox.onchange = () => (labelLayer.hidden = !labelsBox.checked);
  panel.append(el('label', {}, labelsBox, ' Part and Socket ids'));

  const project = () => {
    const camera = scene.activeCameras?.[0] ?? scene.activeCamera;
    if (camera && !labelLayer.hidden) {
      const engine = scene.getEngine();
      const w = engine.getRenderWidth(true);
      const h = engine.getRenderHeight(true);
      const k = game.canvas.clientWidth / w;
      const viewport = camera.viewport.toGlobal(w, h);
      const transform = camera.getViewMatrix().multiply(camera.getProjectionMatrix());
      for (const label of labels) {
        const p = Vector3.Project(label.world(), Matrix.Identity(), transform, viewport);
        const visible = p.z >= 0 && p.z <= 1;
        label.el.style.display = visible ? '' : 'none';
        label.el.style.transform = `translate(${p.x * k}px, ${p.y * k}px)`;
      }
    }
    requestAnimationFrame(project);
  };
  requestAnimationFrame(project);

  // ---- Socket selection and covering-Part highlight ----
  const highlight = new StandardMaterial('dev-highlight', scene);
  highlight.disableLighting = true;
  highlight.emissiveColor = Color3.FromHexString('#ffd60a');
  let restore: (() => void) | null = null;
  const select = el('select', {});
  select.append(el('option', { value: '' }, '(none)'));
  for (const part of level.model.parts)
    for (const socket of part.sockets)
      select.append(el('option', { value: socket.id }, `${socket.id} (${part.id})`));
  select.onchange = () => {
    restore?.();
    restore = null;
    const covering = coveringParts(level.model, select.value);
    const saved: [AbstractMesh, AbstractMesh['material']][] = [];
    for (const id of covering) {
      for (const mesh of node(id)?.getChildMeshes() ?? []) {
        if (mesh.name.startsWith('pin-')) continue;
        saved.push([mesh, mesh.material]);
        mesh.material = highlight;
      }
    }
    restore = () => saved.forEach(([mesh, material]) => (mesh.material = material));
    covered.textContent = select.value
      ? `Covered by: ${covering.length ? covering.join(', ') : '(nothing)'}`
      : '';
  };
  const covered = el('div', {});
  panel.append(el('label', {}, 'Socket ', select), covered);

  // ---- Solver panel ----
  const output = el('pre', { className: 'dev-report' });
  const solveButton = el('button', { type: 'button' }, 'Solve');
  const cancelButton = el('button', { type: 'button', disabled: true }, 'Cancel');
  let cancel: (() => void) | null = null;
  const finish = (text: string) => {
    cancel = null;
    output.textContent = text;
    solveButton.disabled = false;
    cancelButton.disabled = true;
  };
  solveButton.onclick = () => {
    solveButton.disabled = true;
    cancelButton.disabled = false;
    output.textContent = 'Solving...';
    cancel = startSolve(
      level,
      () => new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' }),
      {
        onReport: (r) => finish(formatReport(level.id, r)),
        onError: (m) => finish(`Solver failed: ${m}`),
      },
    );
  };
  cancelButton.onclick = () => {
    cancel?.();
    finish('Cancelled.');
  };
  panel.append(el('div', {}, solveButton, cancelButton), output);

  // ---- Next-Box forecast (off by default) ----
  const forecastBox = el('input', { type: 'checkbox', checked: false });
  const forecastOut = el('div', { className: 'dev-forecast' });
  let lastState: State | null = null;
  const draw = () => {
    forecastOut.replaceChildren();
    if (!forecastBox.checked || !lastState) return;
    lastState.boxes.forEach((_, i) => {
      const colour = lastState ? forecastNextBox(level, lastState, i) : null;
      const hex = colour === null ? '#6b7780' : (CANDY[colour] ?? '#fff');
      const swatch = el('span', { className: 'dev-swatch' });
      swatch.style.background = hex;
      forecastOut.append(
        el(
          'div',
          {},
          `If Box ${i + 1} closed now: `,
          swatch,
          colour === null ? ' grey' : ` ${hex}`,
        ),
      );
    });
  };
  forecastBox.onchange = draw;
  panel.append(el('label', {}, forecastBox, ' Next-Box forecast'), forecastOut);

  return {
    update(state) {
      lastState = state;
      draw();
    },
  };
}
