// Web Worker entry: receives a Level, replies with the full difficulty report.
import type { Level } from '../rules/level';
import { report } from '../solver/report';

self.onmessage = (e: MessageEvent<Level>) => {
  self.postMessage(report(e.data));
};
