// Cross-field content checks, run as plain functions after Zod parsing. Each error names the
// file and the Part or Socket id at fault.
import { DEFAULT_RULES } from '../rules/level';
import { CANDY } from './palette';
import type { LevelData, ModelData } from './schema';

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

/** Finds a covering loop (Part A covered by B, B by A, ...) and returns its Part ids in order. */
function findCoveringLoop(model: ModelData): string[] | null {
  const covers = new Map<string, Set<string>>();
  for (const part of model.parts) {
    const set = new Set<string>();
    for (const socket of part.sockets)
      for (const coverId of socket.coveredBy) if (coverId !== part.id) set.add(coverId);
    covers.set(part.id, set);
  }
  const done = new Set<string>();
  const path: string[] = [];
  const visit = (id: string): string[] | null => {
    const at = path.indexOf(id);
    if (at >= 0) return [...path.slice(at), id];
    if (done.has(id)) return null;
    path.push(id);
    for (const next of covers.get(id) ?? []) {
      const loop = visit(next);
      if (loop) return loop;
    }
    path.pop();
    done.add(id);
    return null;
  };
  for (const id of covers.keys()) {
    const loop = visit(id);
    if (loop) return loop;
  }
  return null;
}

export function validateModel(model: ModelData, file: string): void {
  const partIds = new Set<string>();
  for (const part of model.parts) {
    if (partIds.has(part.id)) throw new ContentError(file, `duplicate Part id ${part.id}`);
    partIds.add(part.id);
  }
  const hasSockets = new Map(model.parts.map((p) => [p.id, p.sockets.length > 0]));
  const socketIds = new Set<string>();
  for (const part of model.parts) {
    for (const socket of part.sockets) {
      if (socketIds.has(socket.id))
        throw new ContentError(file, `duplicate Socket id ${socket.id}`);
      socketIds.add(socket.id);
      for (const coverId of socket.coveredBy) {
        const where = `Socket ${socket.id} (Part ${part.id})`;
        if (coverId === part.id)
          throw new ContentError(file, `${where} is covered by its own Part ${coverId}`);
        if (!partIds.has(coverId))
          throw new ContentError(file, `${where} is covered by unknown Part ${coverId}`);
        if (!hasSockets.get(coverId))
          throw new ContentError(
            file,
            `${where} is covered by Core ${coverId}, which never falls away`,
          );
      }
    }
  }
  const loop = findCoveringLoop(model);
  if (loop) throw new ContentError(file, `covering loop ${loop.join(' -> ')}`);
}

/** Checks a Level against its (already validated) Model. */
export function validateLevel(level: LevelData, model: ModelData, file: string): void {
  const sockets = new Set(model.parts.flatMap((p) => p.sockets.map((s) => s.id)));
  for (const id of Object.keys(level.colours))
    if (!sockets.has(id)) throw new ContentError(file, `colour given for unknown Socket ${id}`);

  if (sockets.size === 0) throw new ContentError(file, `Model ${model.id} has no Sockets`);

  const totals = new Map<number, number>();
  for (const socketId of sockets) {
    const colour = level.colours[socketId];
    if (colour === undefined) throw new ContentError(file, `Socket ${socketId} has no colour`);
    if (colour >= CANDY.length)
      throw new ContentError(
        file,
        `Socket ${socketId} has colour ${colour}, outside the palette of ${CANDY.length}`,
      );
    totals.set(colour, (totals.get(colour) ?? 0) + 1);
  }

  const capacity = level.rules?.capacity ?? DEFAULT_RULES.capacity;
  for (const [colour, total] of totals)
    if (total % capacity !== 0)
      throw new ContentError(
        file,
        `colour ${colour} has ${total} Pins, not a multiple of Capacity ${capacity}`,
      );
}
