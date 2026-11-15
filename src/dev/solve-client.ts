// Runs the solver report in a Web Worker so the panel stays responsive. Cancelling terminates the
// worker, which stops it at once however deep the search is.
import type { Level } from '../rules/level';
import type { Report } from '../solver/report';

/** The slice of `Worker` this client uses, so tests can pass a fake. */
export interface SolveWorker {
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
  postMessage(message: unknown): void;
  terminate(): void;
}

export interface SolveHandlers {
  onReport(report: Report): void;
  onError(message: string): void;
}

/** Starts a solve and returns its cancel function. */
export function startSolve(
  level: Level,
  createWorker: () => SolveWorker,
  handlers: SolveHandlers,
): () => void {
  const worker = createWorker();
  let live = true;
  const stop = () => {
    live = false;
    worker.terminate();
  };
  worker.onmessage = (e) => {
    if (!live) return;
    stop();
    handlers.onReport(e.data as Report);
  };
  worker.onerror = (e) => {
    if (!live) return;
    stop();
    handlers.onError(e.message);
  };
  worker.postMessage(level);
  return stop;
}
