import type { ModelData } from '../content/schema';

/** The Part ids in a Socket's `coveredBy` list: what the viewer highlights when it is selected. */
export function coveringParts(model: ModelData, socketId: string): string[] {
  for (const part of model.parts)
    for (const socket of part.sockets) if (socket.id === socketId) return [...socket.coveredBy];
  return [];
}
