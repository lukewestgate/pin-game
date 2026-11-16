// `pnpm sounds`: synthesises the game's sound effects from scratch (no samples, so nothing to
// license: the output is dedicated to the public domain, CC0) and encodes them as mono 96 kbps
// MP3 with ffmpeg into src/audio/sounds/. The committed MP3s are the source of truth; rerun only
// to retune. The Box click is C5 and the chime is C6 so the chord climb (see sound-map.ts) works.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const RATE = 44100;
const outDir = path.resolve(import.meta.dirname, '../src/audio/sounds');

/** Seeded noise so reruns give the same files. */
let seed = 12345;
const noise = (): number => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff) * 2 - 1;
};

type Fn = (t: number) => number;
const TAU = Math.PI * 2;

function render(seconds: number, fn: Fn): Float32Array {
  const out = new Float32Array(Math.ceil(seconds * RATE));
  for (let i = 0; i < out.length; i++) out[i] = fn(i / RATE);
  return out;
}

/** A sine with an optional exponential pitch glide and an exponential decay. */
function tone(f0: number, f1: number, decay: number, gain: number): Fn {
  let phase = 0;
  let last = 0;
  return (t) => {
    const dt = t - last;
    last = t;
    const f = f0 * Math.pow(f1 / f0, Math.min(1, t / (decay * 2)));
    phase += TAU * f * dt;
    return Math.sin(phase) * Math.exp(-t / decay) * gain;
  };
}

/** A bell-ish ping: a fundamental plus a quiet octave and twelfth. */
const ping = (f: number, decay: number, gain: number): Fn => {
  return (t) =>
    (Math.sin(TAU * f * t) +
      0.35 * Math.sin(TAU * f * 2 * t) * Math.exp(-t / (decay * 0.5)) +
      0.15 * Math.sin(TAU * f * 3 * t) * Math.exp(-t / (decay * 0.3))) *
    Math.exp(-t / decay) *
    gain;
};

/** Mixes `part` into `into` starting at `at` seconds. */
function mix(into: Float32Array, part: Float32Array, at: number): void {
  const start = Math.round(at * RATE);
  for (let i = 0; i < part.length && start + i < into.length; i++) {
    into[start + i] = (into[start + i] ?? 0) + (part[i] ?? 0);
  }
}

/** Short fade in and out so nothing clicks at the file edges. */
function fade(buf: Float32Array): Float32Array {
  const n = Math.round(0.004 * RATE);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    buf[i] = (buf[i] ?? 0) * k;
    const j = buf.length - 1 - i;
    buf[j] = (buf[j] ?? 0) * k;
  }
  return buf;
}

function clatter(): Float32Array {
  const out = new Float32Array(Math.round(0.4 * RATE));
  const hits = [0, 0.045, 0.09, 0.17, 0.22, 0.31];
  hits.forEach((at, k) => {
    let lp = 0;
    const part = render(0.07, (t) => {
      lp += 0.45 * (noise() - lp); // a rough low-pass: plastic, not hiss
      return (lp * 0.9 + Math.sin(TAU * (1500 + k * 230) * t) * 0.25) * Math.exp(-t / 0.012);
    });
    mix(out, part, at);
  });
  return out;
}

function win(): Float32Array {
  const out = new Float32Array(Math.round(1.5 * RATE));
  [523.25, 659.25, 783.99, 1046.5].forEach((f, k) =>
    mix(out, render(0.9, ping(f, 0.22, 0.4)), k * 0.14),
  );
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => mix(out, render(0.9, ping(f, 0.4, 0.2)), 0.6));
  return out;
}

function lose(): Float32Array {
  const out = new Float32Array(Math.round(1.1 * RATE));
  [392, 329.63, 261.63].forEach((f, k) => mix(out, render(0.6, ping(f, 0.18, 0.45)), k * 0.2));
  return out;
}

const sounds: Record<string, Float32Array> = {
  pop: render(0.09, tone(380, 900, 0.02, 0.8)),
  click: render(0.18, ping(523.25, 0.045, 0.7)),
  thunk: render(0.2, tone(150, 60, 0.05, 0.9)),
  chime: render(0.7, ping(1046.5, 0.18, 0.5)),
  clatter: clatter(),
  tock: render(0.12, tone(330, 250, 0.018, 0.9)),
  win: win(),
  lose: lose(),
};

function wav(samples: Float32Array): Buffer {
  const peak = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0.0001);
  const scale = 0.85 / peak; // normalise: playback volume is set in the game
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(v * scale * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(path.join(tmpdir(), 'pin-sounds-'));
try {
  for (const [name, samples] of Object.entries(sounds)) {
    const wavFile = path.join(tmp, `${name}.wav`);
    writeFileSync(wavFile, wav(fade(samples)));
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'error',
        '-i',
        wavFile,
        '-ac',
        '1',
        '-b:a',
        '96k',
        path.join(outDir, `${name}.mp3`),
      ],
      { stdio: 'inherit' },
    );
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
