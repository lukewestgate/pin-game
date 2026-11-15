// Undo is a stack of past states held outside the reducer. Unlimited, and it can undo a loss.

export interface History<S> {
  readonly past: readonly S[];
  readonly present: S;
}

export function startHistory<S>(present: S): History<S> {
  return { past: [], present };
}

export function commit<S>(history: History<S>, next: S): History<S> {
  return { past: [...history.past, history.present], present: next };
}

export function canUndo<S>(history: History<S>): boolean {
  return history.past.length > 0;
}

export function undo<S>(history: History<S>): History<S> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return { past: history.past.slice(0, -1), present: previous };
}
