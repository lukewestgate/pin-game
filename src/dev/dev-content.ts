// Loads Models and Levels for the dev viewer without throwing: a bad file becomes an error entry
// (naming the file and the Part or Socket id, from the ContentError message) and the rest still load.
import { loadLevel, type LoadedLevel } from '../content/loader';
import { ContentError } from '../content/validate';

export interface DevContentError {
  file: string;
  message: string;
}

export interface DevContent {
  levels: LoadedLevel[];
  errors: DevContentError[];
}

/** Both maps are keyed by file name, as in `bundled.ts`. Levels load in file-name order. */
export function loadDevContent(
  modelFiles: Readonly<Record<string, unknown>>,
  levelFiles: Readonly<Record<string, unknown>>,
): DevContent {
  const levels: LoadedLevel[] = [];
  const errors: DevContentError[] = [];
  const seen = new Set<string>();
  for (const file of Object.keys(levelFiles).sort()) {
    try {
      const level = loadLevel(levelFiles[file], file, modelFiles);
      if (seen.has(level.id)) throw new ContentError(file, `duplicate Level id ${level.id}`);
      seen.add(level.id);
      levels.push(level);
    } catch (e) {
      if (e instanceof ContentError) errors.push({ file: e.file, message: e.message });
      else errors.push({ file, message: `${file}: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return { levels, errors };
}
