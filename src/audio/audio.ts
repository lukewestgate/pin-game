// The audio module: turns scheduled Timeline steps into sounds at their start times.
// It knows nothing of Babylon (a backend is injected), the rules or the Timeline's internals,
// and it never throws: if audio fails, the game plays exactly the same.
import type { Step } from '../render/timeline';
import {
  CHORD,
  cuesFor,
  PITCH_JITTER,
  VOICE_CAP,
  VOLUME,
  VOLUME_JITTER,
  type Cue,
  type SoundName,
} from './sound-map';

export interface Voice {
  stop(): void;
}

export interface AudioBackend {
  /** Resumes the audio context. May reject (never unlocked). */
  unlock(): Promise<void>;
  /** Starts one voice, or returns null if the sound is not ready. */
  play(sound: SoundName, options: { rate: number; volume: number }): Voice | null;
}

export interface AudioOptions {
  backend: AudioBackend;
  /** The Sound setting (the Mute button and the sheet's switch). */
  enabled: () => boolean;
  /** 0 to 1; injectable for tests. */
  random?: () => number;
}

export interface GameAudio {
  /** Call on `pointerup`. Retries until it succeeds; never throws. */
  unlock(): Promise<void>;
  /** Queues the sounds of freshly scheduled steps; those already due play now. */
  schedule(steps: readonly Step[], now: number): void;
  /** A Blocked tap: plays "tock" now. */
  blocked(now: number): void;
  /** Plays queued sounds that are due. Call every frame. */
  tick(now: number): void;
  /** Drops every queued sound (Undo, Restart, Mute). */
  cancel(): void;
  /** Drops every queued sound and stops the playing ones (Mute). */
  silence(): void;
}

export function createAudio(options: AudioOptions): GameAudio {
  const random = options.random ?? Math.random;
  let unlocked = false;
  let pending: Cue[] = [];
  const voices = new Map<SoundName, Voice[]>();

  function play(cue: Cue): void {
    if (!unlocked || !options.enabled()) return;
    try {
      const list = voices.get(cue.sound) ?? [];
      voices.set(cue.sound, list);
      while (list.length >= VOICE_CAP) list.shift()?.stop();
      const rate = (CHORD[cue.chord] ?? 1) * (1 + (random() * 2 - 1) * PITCH_JITTER);
      const volume = VOLUME[cue.sound] * (1 - random() * VOLUME_JITTER);
      const voice = options.backend.play(cue.sound, { rate, volume });
      if (voice) list.push(voice);
    } catch {
      // Audio failed: stay silent.
    }
  }

  function tick(now: number): void {
    if (pending.length === 0) return;
    if (!options.enabled()) {
      pending = [];
      return;
    }
    if (!unlocked) return; // keep due cues until the first pointerup unlocks audio
    const due = pending.filter((c) => c.at <= now).sort((a, b) => a.at - b.at);
    if (due.length === 0) return;
    pending = pending.filter((c) => c.at > now);
    for (const cue of due) play(cue);
  }

  return {
    async unlock() {
      if (unlocked) return;
      try {
        await options.backend.unlock();
        unlocked = true;
      } catch {
        // Stay locked; the next pointerup tries again.
      }
    },
    schedule(steps, now) {
      for (const step of steps) pending.push(...cuesFor(step));
      tick(now);
    },
    blocked(now) {
      play({ sound: 'tock', at: now, chord: 0 });
    },
    tick,
    cancel() {
      pending = [];
    },
    silence() {
      pending = [];
      for (const list of voices.values()) {
        for (const voice of list.splice(0)) {
          try {
            voice.stop();
          } catch {
            // Audio failed: stay silent.
          }
        }
      }
    },
  };
}
