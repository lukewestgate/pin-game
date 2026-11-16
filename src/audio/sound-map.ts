// The step -> sound map (spec: Sound). Pure: reads Timeline steps, never changes them.
// Slide-in, gap closing, Undo and Restart are silent; there is no near-full warning.
import type { Step } from '../render/timeline';

export type SoundName = 'pop' | 'click' | 'thunk' | 'chime' | 'clatter' | 'tock' | 'win' | 'lose';
export const SOUND_NAMES: readonly SoundName[] = [
  'pop',
  'click',
  'thunk',
  'chime',
  'clatter',
  'tock',
  'win',
  'lose',
];

/** At most this many voices of one sound at once; the oldest is cut. */
export const VOICE_CAP = 4;
/** Random pitch jitter, plus or minus (a fraction). */
export const PITCH_JITTER = 0.04;
/** Random volume loss, up to this fraction. */
export const VOLUME_JITTER = 0.15;
/** Base volume per sound (0 to 1). */
export const VOLUME: Record<SoundName, number> = {
  pop: 0.6,
  click: 0.6,
  thunk: 0.7,
  chime: 0.6,
  clatter: 0.5,
  tock: 0.6,
  win: 0.7,
  lose: 0.7,
};
/**
 * Playback-rate multipliers of the Box click for the 1st, 2nd and 3rd Pin seated in a Box
 * (root, major third, fifth). The click sample is C5; the close chime is C6 and completes it.
 */
export const CHORD: readonly number[] = [1, 1.2599, 1.4983];

export interface Cue {
  sound: SoundName;
  /** Timeline time in ms. */
  at: number;
  /** Index into CHORD (0 for sounds that do not climb). */
  chord: number;
}

const chordIndex = (fill: number): number => Math.min(Math.max(fill - 1, 0), CHORD.length - 1);

export function cuesFor(step: Step): Cue[] {
  switch (step.kind) {
    case 'pinToBox':
      return [
        { sound: 'pop', at: step.t0, chord: 0 },
        { sound: 'click', at: step.t1, chord: chordIndex(step.fill) },
      ];
    case 'pinToBuffer':
      return [
        { sound: 'pop', at: step.t0, chord: 0 },
        { sound: 'thunk', at: step.t1, chord: 0 },
      ];
    case 'bufferDrained':
      return step.lands.map((at, k) => ({
        sound: 'click' as const,
        at,
        chord: chordIndex(step.fill - step.lands.length + k + 1),
      }));
    case 'partFell':
      return [{ sound: 'clatter', at: step.t0, chord: 0 }];
    case 'boxClosed':
      return [{ sound: 'chime', at: step.t0, chord: 0 }];
    case 'won':
      return [{ sound: 'win', at: step.t0, chord: 0 }];
    case 'lost':
      return [{ sound: 'lose', at: step.t0, chord: 0 }];
    case 'boxOpened':
      return [];
  }
}
