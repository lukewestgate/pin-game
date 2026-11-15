// The pure animation scheduler: turns one tap's rules events into timed steps. No Babylon or DOM.
// Tracks remember when each shared thing is free again, so a step waits only for the Box slot
// or the Buffer it touches, never for the whole previous chain. See the Animation sequencing
// ticket (09). Rendering only plays these steps and never decides outcomes.
import type { RulesEvent } from '../rules/rules';

/** Default timings in ms. Every value is scaled by the one speed multiplier. */
export const DEFAULT_TIMING = {
  pull: 110,
  fly: 380,
  fall: 550,
  close: 340,
  open: 300,
  drainFly: 320,
  drainStagger: 90,
  compact: 160,
  endBeat: 250,
};
export type Timing = typeof DEFAULT_TIMING;

export interface Tracks {
  /** Every animation scheduled so far has finished by this time. */
  all: number;
  /** The Buffer (one serial track) is settled. */
  buffer: number;
  /** Per Box slot: settled (no Pin landing, not closing or sliding in). */
  slots: readonly number[];
}

export interface Options {
  /** Multiplies speed: 2 halves every duration. Default 1. */
  speed?: number;
  timing?: Partial<Timing>;
}

export const emptyTracks = (): Tracks => ({ all: 0, buffer: 0, slots: [] });

interface Span {
  t0: number;
  t1: number;
}

export type Step =
  | (Span & {
      kind: 'pinToBox';
      pin: number;
      box: number;
      fill: number;
      pullEnd: number;
      flyAt: number;
    })
  | (Span & { kind: 'pinToBuffer'; pin: number; slot: number; pullEnd: number; flyAt: number })
  | (Span & { kind: 'partFell'; part: number })
  | (Span & { kind: 'boxClosed'; box: number; colour: number })
  | (Span & { kind: 'boxOpened'; box: number; colour: number | null })
  | (Span & {
      kind: 'bufferDrained';
      box: number;
      colour: number;
      from: number[];
      fill: number;
      /** When each drained Pin leaves the Buffer, and when it lands in its Box. */
      launches: number[];
      lands: number[];
      /** `t1` is when the Buffer has closed its gaps. */
    })
  | (Span & { kind: 'won' })
  | (Span & { kind: 'lost' });

export function schedule(
  events: readonly RulesEvent[],
  now: number,
  before: Tracks,
  opts: Options,
): { steps: Step[]; tracks: Tracks } {
  const speed = opts.speed ?? 1;
  const T = { ...DEFAULT_TIMING, ...opts.timing };
  for (const k of Object.keys(T) as (keyof Timing)[]) T[k] /= speed;

  const slots = before.slots.slice();
  const slot = (s: number): number => Math.max(now, slots[s] ?? 0);
  let buffer = Math.max(now, before.buffer);
  let all = Math.max(now, before.all);
  // The tapped Pin leaves its Socket at tap time; a Part it was holding falls then.
  let pulledAt = now + T.pull;
  const steps: Step[] = [];

  for (const ev of events) {
    let step: Step;
    switch (ev.kind) {
      case 'pinToBox':
      case 'pinToBuffer': {
        const ready = ev.kind === 'pinToBox' ? slot(ev.box) : buffer;
        const flyAt = Math.max(now + T.pull, ready - T.fly);
        const t1 = flyAt + T.fly;
        pulledAt = now + T.pull;
        if (ev.kind === 'pinToBox') {
          slots[ev.box] = t1;
          step = {
            kind: 'pinToBox',
            pin: ev.pin,
            box: ev.box,
            fill: ev.fill,
            t0: now,
            pullEnd: pulledAt,
            flyAt,
            t1,
          };
        } else {
          buffer = t1;
          step = {
            kind: 'pinToBuffer',
            pin: ev.pin,
            slot: ev.slot,
            t0: now,
            pullEnd: pulledAt,
            flyAt,
            t1,
          };
        }
        break;
      }
      case 'partFell':
        step = { kind: 'partFell', part: ev.part, t0: pulledAt, t1: pulledAt + T.fall };
        break;
      case 'boxClosed': {
        const t0 = slot(ev.box);
        slots[ev.box] = t0 + T.close;
        step = { kind: 'boxClosed', box: ev.box, colour: ev.colour, t0, t1: t0 + T.close };
        break;
      }
      case 'boxOpened': {
        const t0 = slot(ev.box);
        slots[ev.box] = t0 + T.open;
        step = { kind: 'boxOpened', box: ev.box, colour: ev.colour, t0, t1: t0 + T.open };
        break;
      }
      case 'bufferDrained': {
        const t0 = Math.max(slot(ev.box), buffer);
        const launches = ev.from.map((_, k) => t0 + k * T.drainStagger);
        const lands = launches.map((t) => t + T.drainFly);
        const landed = lands.at(-1) ?? t0;
        slots[ev.box] = landed;
        buffer = landed + T.compact;
        step = {
          kind: 'bufferDrained',
          box: ev.box,
          colour: ev.colour,
          from: ev.from,
          fill: ev.fill,
          launches,
          lands,
          t0,
          t1: buffer,
        };
        break;
      }
      case 'won':
      case 'lost': {
        const t0 = Math.max(all, buffer, ...slots) + T.endBeat;
        step = { kind: ev.kind, t0, t1: t0 };
        break;
      }
    }
    all = Math.max(all, step.t1);
    steps.push(step);
  }
  return { steps, tracks: { all, buffer, slots } };
}
