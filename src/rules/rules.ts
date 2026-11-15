// The pure rules reducer, ported from the Sorting rules prototype. No engine or DOM imports
// (lint-enforced): the solver, tests and the screen all share exactly these rules.
import type { Level } from './level';
import { candidateColours } from './next-colour';
import { hash32 } from './random';
import type { Box, State, Status } from './state';
import { blockersOf } from './state';

export type RulesEvent =
  | { kind: 'pinToBox'; pin: number; slot: number; fill: number }
  /** `slot` is the Buffer position the Pin lands in. */
  | { kind: 'pinToBuffer'; pin: number; slot: number }
  | { kind: 'boxClosed'; slot: number; colour: number }
  /** `colour: null` is a grey Box. */
  | { kind: 'boxOpened'; slot: number; colour: number | null }
  /** `from` lists the Buffer positions (before the drain) that moved into the Box. */
  | { kind: 'bufferDrained'; slot: number; colour: number; from: number[]; fill: number }
  | { kind: 'partFell'; part: number }
  | { kind: 'won' }
  | { kind: 'lost' };

export type Refusal =
  | { reason: 'blocked'; blockers: number[] }
  | { reason: 'removed' }
  | { reason: 'over' }
  | { reason: 'unknownPin' };

export interface TapResult {
  state: State;
  events: RulesEvent[];
  /** Set when the tap changed nothing. `state` is then the input state. */
  refused?: Refusal;
}

interface Draft {
  removed: boolean[];
  partLeft: number[];
  buffer: number[];
  boxes: Box[];
  picks: number;
  closes: number;
  status: Status;
}

function draft(st: State): Draft {
  return {
    removed: st.removed.slice(),
    partLeft: st.partLeft.slice(),
    buffer: st.buffer.slice(),
    boxes: st.boxes.map((b) => ({ colour: b.colour, fill: b.fill })),
    picks: st.picks,
    closes: st.closes,
    status: st.status,
  };
}

function pickColour(level: Level, st: Draft): number | null {
  const q = candidateColours(level, st);
  const k = st.picks++;
  if (!q.length) return null;
  return q[hash32(level.seed, k) % q.length] ?? null;
}

export function initialState(level: Level): { state: State; events: RulesEvent[] } {
  const st: Draft = {
    removed: level.pins.map(() => false),
    partLeft: level.pinsOfPart.map((pins) => pins.length),
    buffer: [],
    boxes: [],
    picks: 0,
    closes: 0,
    status: 'playing',
  };
  const events: RulesEvent[] = [];
  for (let slot = 0; slot < level.boxes; slot++) {
    const colour = pickColour(level, st);
    st.boxes.push({ colour, fill: 0 });
    events.push({ kind: 'boxOpened', slot, colour });
  }
  return { state: st, events };
}

function closeBox(level: Level, st: Draft, slot: number, ev: RulesEvent[]): void {
  const old = st.boxes[slot]?.colour;
  if (old === undefined || old === null) throw new Error(`Box ${slot} closed without a colour`);
  st.closes++;
  st.boxes[slot] = { colour: null, fill: 0 }; // the closed Box leaves before the next colour is chosen
  const colour = pickColour(level, st);
  st.boxes[slot] = { colour, fill: 0 };
  ev.push({ kind: 'boxClosed', slot, colour: old });
  ev.push({ kind: 'boxOpened', slot, colour });
  if (colour !== null) drain(level, st, slot, ev);
}

function drain(level: Level, st: Draft, slot: number, ev: RulesEvent[]): void {
  const box = st.boxes[slot];
  if (!box || box.colour === null) return;
  const colour = box.colour;
  const from: number[] = [];
  st.buffer.forEach((c, i) => {
    if (c === colour && box.fill + from.length < level.capacity) from.push(i);
  });
  if (from.length) {
    st.buffer = st.buffer.filter((_, i) => !from.includes(i));
    box.fill += from.length;
    ev.push({ kind: 'bufferDrained', slot, colour, from, fill: box.fill });
  }
  if (box.fill === level.capacity) closeBox(level, st, slot, ev);
}

/** The one player action. Never mutates its input. */
export function tap(level: Level, st0: State, pinIndex: number): TapResult {
  const pin = level.pins[pinIndex];
  if (!pin) return { state: st0, events: [], refused: { reason: 'unknownPin' } };
  if (st0.status !== 'playing') return { state: st0, events: [], refused: { reason: 'over' } };
  if (st0.removed[pinIndex]) return { state: st0, events: [], refused: { reason: 'removed' } };
  const blockers = blockersOf(level, st0, pinIndex);
  if (blockers.length) return { state: st0, events: [], refused: { reason: 'blocked', blockers } };

  const st = draft(st0);
  const ev: RulesEvent[] = [];
  st.removed[pinIndex] = true;
  const left = (st.partLeft[pin.part] ?? 0) - 1;
  st.partLeft[pin.part] = left;
  if (left === 0) ev.push({ kind: 'partFell', part: pin.part });

  const slot = st.boxes.findIndex((b) => b.colour === pin.colour);
  const box = st.boxes[slot];
  if (box) {
    box.fill++;
    ev.push({ kind: 'pinToBox', pin: pinIndex, slot, fill: box.fill });
    if (box.fill === level.capacity) closeBox(level, st, slot, ev);
  } else {
    st.buffer.push(pin.colour);
    ev.push({ kind: 'pinToBuffer', pin: pinIndex, slot: st.buffer.length - 1 });
    // The Level is lost the moment a Pin fills the Buffer's last slot.
    if (st.buffer.length >= level.bufferSize) {
      st.status = 'lost';
      ev.push({ kind: 'lost' });
      return { state: st, events: ev };
    }
  }
  if (st.removed.every(Boolean)) {
    // Colour totals are multiples of Capacity, so an empty Model always means an empty Buffer.
    if (st.buffer.length)
      throw new Error('Rule bug: the Model is empty but Pins are in the Buffer');
    st.status = 'won';
    ev.push({ kind: 'won' });
  }
  return { state: st, events: ev };
}
