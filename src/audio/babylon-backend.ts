// The Babylon AudioEngineV2 backend: the only file that touches Babylon audio. Every sound is
// decoded once at load, with VOICE_CAP clones of it so voices can be cut one by one. The default
// unmute button is off (`disableDefaultUI`) but the engine keeps its own re-unlock; the input
// layer calls `unlock()` on the first pointerup. Any failure leaves the game silent, never broken.
import type { AudioEngineV2 } from '@babylonjs/core/AudioV2/abstractAudio/audioEngineV2';
import type { StaticSound } from '@babylonjs/core/AudioV2/abstractAudio/staticSound';
import { CreateAudioEngineAsync } from '@babylonjs/core/AudioV2/webAudio/pure';
import type { AudioBackend, Voice } from './audio';
import { SOUND_NAMES, VOICE_CAP, type SoundName } from './sound-map';
import chime from './sounds/chime.mp3?url';
import clatter from './sounds/clatter.mp3?url';
import click from './sounds/click.mp3?url';
import lose from './sounds/lose.mp3?url';
import pop from './sounds/pop.mp3?url';
import thunk from './sounds/thunk.mp3?url';
import tock from './sounds/tock.mp3?url';
import win from './sounds/win.mp3?url';

const URLS: Record<SoundName, string> = { pop, click, thunk, chime, clatter, tock, win, lose };

interface Slot {
  sound: StaticSound;
  busy: boolean;
  /** Bumped per play, so a stale Voice cannot cut a newer one. */
  generation: number;
  /** Ended events still owed by our own `stop()` calls; they must not clear `busy`. */
  expectedEnds: number;
}

export function createBabylonBackend(): AudioBackend {
  const pools = new Map<SoundName, Slot[]>();
  let engine: AudioEngineV2 | null = null;

  // Ambient audio mixes with the player's own music on iOS.
  try {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'ambient';
  } catch {
    // Unsupported: ignore.
  }

  const ready: Promise<void> = (async () => {
    engine = await CreateAudioEngineAsync({ disableDefaultUI: true });
    await Promise.all(
      SOUND_NAMES.map(async (name) => {
        if (!engine) return;
        const first = await engine.createSoundAsync(name, URLS[name]);
        const slots: Slot[] = [{ sound: first, busy: false, generation: 0, expectedEnds: 0 }];
        for (let i = 1; i < VOICE_CAP; i++) {
          slots.push({
            sound: await first.cloneAsync(),
            busy: false,
            generation: 0,
            expectedEnds: 0,
          });
        }
        for (const slot of slots) {
          slot.sound.onEndedObservable.add(() => {
            // An ended event caused by our own stop() must not free a voice restarted since.
            if (slot.expectedEnds > 0) slot.expectedEnds--;
            else slot.busy = false;
          });
        }
        pools.set(name, slots);
      }),
    );
  })();
  ready.catch(() => undefined); // Loading failed: play() finds no pool and stays silent.

  return {
    async unlock() {
      await ready;
      await engine?.unlockAsync();
    },
    play(name, { rate, volume }): Voice | null {
      const slots = pools.get(name);
      if (!slots) return null;
      const slot = slots.find((s) => !s.busy) ?? slots[0];
      if (!slot) return null;
      if (slot.busy) slot.expectedEnds++;
      slot.sound.stop();
      slot.sound.playbackRate = rate;
      slot.sound.play({ volume });
      slot.busy = true;
      const generation = ++slot.generation;
      return {
        stop() {
          if (slot.generation !== generation || !slot.busy) return;
          slot.expectedEnds++;
          slot.sound.stop();
          slot.busy = false;
        },
      };
    },
  };
}
