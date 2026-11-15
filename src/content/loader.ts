import type { z } from 'zod';
import { makeLevel, type Level } from '../rules/level';
import { CANDY } from './palette';
import { levelSchema, modelSchema, type LevelData, type ModelData, type Socket } from './schema';

/** A content error that names the file, and the Part or Socket id where there is one. */
export class ContentError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = 'ContentError';
  }
}

/** A rules Level plus what the screen needs to draw it. Pin `i` sits in `pinSockets[i]`. */
export interface LoadedLevel extends Level {
  id: string;
  model: ModelData;
  pinSockets: readonly Socket[];
}

function parse<T>(schema: z.ZodType<T>, json: unknown, file: string): T {
  const result = schema.safeParse(json);
  if (result.success) return result.data;
  const issues = result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
  throw new ContentError(file, issues.join('; '));
}

export function parseModel(json: unknown, file: string): ModelData {
  return parse(modelSchema, json, file);
}

export function parseLevel(json: unknown, file: string): LevelData {
  return parse(levelSchema, json, file);
}

/** Joins a parsed Level to its Model, turning string ids into indices. */
export function compileLevel(level: LevelData, model: ModelData, file: string): LoadedLevel {
  const partIndex = new Map(model.parts.map((p, i) => [p.id, i]));
  const pinSockets: Socket[] = [];
  const parts = model.parts.map((part) => ({
    id: part.id,
    pins: part.sockets.map((socket) => {
      const colour = level.colours[socket.id];
      if (colour === undefined) throw new ContentError(file, `Socket ${socket.id} has no colour`);
      if (colour >= CANDY.length) {
        throw new ContentError(
          file,
          `Socket ${socket.id} has colour ${colour}, outside the palette`,
        );
      }
      pinSockets.push(socket);
      return {
        colour,
        coveredBy: socket.coveredBy.map((coverId) => {
          const index = partIndex.get(coverId);
          if (index === undefined) {
            throw new ContentError(
              file,
              `Socket ${socket.id} is covered by unknown Part ${coverId}`,
            );
          }
          return index;
        }),
      };
    }),
  }));
  const rules = makeLevel({ seed: level.seed, rules: level.rules ?? {}, parts });
  return { ...rules, id: level.id, model, pinSockets };
}

/** Parses a Level and the Models it may use (keyed by file name), and compiles the Level. */
export function loadLevel(
  levelJson: unknown,
  file: string,
  modelFiles: Readonly<Record<string, unknown>>,
): LoadedLevel {
  const level = parseLevel(levelJson, file);
  const model = Object.entries(modelFiles)
    .map(([modelFile, json]) => parseModel(json, modelFile))
    .find((m) => m.id === level.model);
  if (!model) throw new ContentError(file, `unknown Model id ${level.model}`);
  return compileLevel(level, model, file);
}
