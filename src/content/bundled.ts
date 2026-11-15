// Models and Levels shipped with the game, bundled at build time so they're versioned with the code.
import { loadLevel, type LoadedLevel } from './loader';
import { ContentError } from './validate';

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
  const levels = Object.entries(levelFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, json]) => ({
      file: fileName(path),
      level: loadLevel(json, fileName(path), models),
    }));
  const seen = new Set<string>();
  for (const { file, level } of levels) {
    if (seen.has(level.id)) throw new ContentError(file, `duplicate Level id ${level.id}`);
    seen.add(level.id);
  }
  return levels.map((l) => l.level);
}
