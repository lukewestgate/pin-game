import { describe, expect, it } from 'vitest';
import { startSolve, type SolveWorker } from '../src/dev/solve-client';
import { report } from '../src/solver/report';
import { A, build } from './helpers';

class FakeWorker implements SolveWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: { message: string }) => void) | null = null;
  posted: unknown[] = [];
  terminated = false;
  postMessage(message: unknown): void {
    this.posted.push(message);
  }
  terminate(): void {
    this.terminated = true;
  }
}

const level = build([{ id: 'p0', pins: [A, A, A] }], { boxes: 1, capacity: 3, bufferSize: 5 });

describe('solver panel client', () => {
  it('sends the Level to the worker and hands back its report', () => {
    const worker = new FakeWorker();
    const results: unknown[] = [];
    startSolve(level, () => worker, { onReport: (r) => results.push(r), onError: () => undefined });
    expect(worker.posted).toEqual([level]);
    const r = report(level, { playouts: 10 });
    worker.onmessage?.({ data: r } as MessageEvent);
    expect(results).toEqual([r]);
    expect(worker.terminated).toBe(true);
  });

  it('cancel stops the worker and drops any later result', () => {
    const worker = new FakeWorker();
    const results: unknown[] = [];
    const cancel = startSolve(level, () => worker, {
      onReport: (r) => results.push(r),
      onError: () => undefined,
    });
    cancel();
    expect(worker.terminated).toBe(true);
    worker.onmessage?.({ data: report(level, { playouts: 10 }) } as MessageEvent);
    expect(results).toEqual([]);
  });

  it('passes a worker failure to onError', () => {
    const worker = new FakeWorker();
    const errors: string[] = [];
    startSolve(level, () => worker, { onReport: () => undefined, onError: (m) => errors.push(m) });
    worker.onerror?.({ message: 'boom' } as ErrorEvent);
    expect(errors).toEqual(['boom']);
    expect(worker.terminated).toBe(true);
  });
});
