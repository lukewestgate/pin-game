// Models and Levels shipped with the game, bundled at build time so they're versioned with the code.
import { loadLevel, type LoadedLevel } from './loader';

const modelFiles = import.meta.glob<unknown>('../data/models/*.json', {
  eager: true,
  import: 'default',
});
const levelFiles = import.meta.glob<unknown>('../data/levels/*.json', {
  eager: true,
  import: 'default',
});

const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

const models = Object.fromEntries(
  Object.entries(modelFiles).map(([p, json]) => [fileName(p), json]),
);

/** Every shipped Level, loaded and compiled, in file-name order. */
export function bundledLevels(): LoadedLevel[] {
  return Object.entries(levelFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, json]) => loadLevel(json, fileName(path), models));
}
