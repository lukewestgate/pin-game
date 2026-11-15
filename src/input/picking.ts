// Pure: which Pin a tap means (ticket 13). The render layer builds the candidates: it projects
// each Pin head, takes its drawn radius, tests visibility with one ray to the head, and reads
// Blocked from the rules state (never from what the camera sees).
import type { PickConstants } from './constants';

export interface PinCandidate {
  id: number;
  /** Head centre in CSS px. */
  x: number;
  y: number;
  /** Drawn head radius in CSS px. */
  r: number;
  visible: boolean;
  blocked: boolean;
  /** Distance from the camera, for breaking ties. */
  depth: number;
}

export interface Pick {
  id: number | null;
  how: 'direct' | 'assist' | 'miss';
}

export function targetRadius(c: PinCandidate, K: PickConstants): number {
  return Math.max(c.r * K.targetScale, K.minTargetPx / 2);
}

export function pickPin(x: number, y: number, candidates: PinCandidate[], K: PickConstants): Pick {
  const scored = candidates
    .filter((c) => c.visible)
    .map((c) => {
      const radius = targetRadius(c, K);
      const d = Math.hypot(c.x - x, c.y - y);
      return { c, d, norm: d / radius, edge: d - radius, radius };
    });
  const closest = (a: (typeof scored)[number], b: (typeof scored)[number]) =>
    a.norm - b.norm || a.c.depth - b.c.depth;

  const direct = scored.filter((p) => p.d <= p.radius).sort(closest);
  const tappable = direct.filter((p) => !p.c.blocked);
  const pool = K.preferUnblocked && tappable.length > 0 ? tappable : direct;
  const best = pool[0];
  if (best) return { id: best.c.id, how: 'direct' };

  const near = scored
    .filter((p) => !p.c.blocked && p.edge <= K.assistPx)
    .sort((a, b) => a.edge - b.edge || a.c.depth - b.c.depth)[0];
  if (near) return { id: near.c.id, how: 'assist' };
  return { id: null, how: 'miss' };
}
