import { describe, expect, it } from 'vitest';
import type { Step } from '../render/timeline';
import { createAudio, type AudioBackend, type Voice } from './audio';
import { CHORD, VOICE_CAP } from './sound-map';

interface Played {
  sound: string;
  rate: number;
  volume: number;
  stopped: boolean;
}

function fakeBackend(opts: { failUnlock?: boolean; throwOnPlay?: boolean } = {}) {
  const played: Played[] = [];
  let unlocks = 0;
  const backend: AudioBackend = {
    unlock() {
      unlocks++;
      return opts.failUnlock ? Promise.reject(new Error('nope')) : Promise.resolve();
    },
    play(sound, o): Voice {
      if (opts.throwOnPlay) throw new Error('boom');
      const rec: Played = { sound, rate: o.rate, volume: o.volume, stopped: false };
      played.push(rec);
      return {
        stop: () => {
          rec.stopped = true;
        },
      };
    },
  };
  return { backend, played, unlocks: () => unlocks };
}

const box = (fill: number, t0: number): Step => ({
  kind: 'pinToBox',
  pin: 0,
  box: 0,
  fill,
  t0,
  pullEnd: t0 + 10,
  flyAt: t0 + 10,
  t1: t0 + 100,
});

async function unlocked(opts: Parameters<typeof fakeBackend>[0] = {}, enabled = () => true) {
  const fake = fakeBackend(opts);
  const audio = createAudio({ backend: fake.backend, enabled, random: () => 0.5 });
  await audio.unlock();
  return { ...fake, audio };
}

describe('createAudio', () => {
  it('drops sounds before the unlock', () => {
    const fake = fakeBackend();
    const audio = createAudio({ backend: fake.backend, enabled: () => true, random: () => 0.5 });
    audio.schedule([box(1, 0)], 0);
    expect(fake.played).toEqual([]);
  });

  it('plays the pop at tap time and the click at the step end', async () => {
    const { audio, played } = await unlocked();
    audio.schedule([box(1, 0)], 0);
    expect(played.map((p) => p.sound)).toEqual(['pop']);
    audio.tick(99);
    expect(played).toHaveLength(1);
    audio.tick(100);
    expect(played.map((p) => p.sound)).toEqual(['pop', 'click']);
  });

  it('climbs the chord across a Box, per fill', async () => {
    const { audio, played } = await unlocked();
    audio.schedule([box(1, 0), box(2, 0), box(3, 0)], 0);
    audio.tick(1000);
    const clicks = played.filter((p) => p.sound === 'click').map((p) => p.rate);
    expect(clicks).toEqual(CHORD.slice(0, 3));
  });

  it('jitters pitch and volume within bounds', async () => {
    const fake = fakeBackend();
    let n = 0;
    const audio = createAudio({
      backend: fake.backend,
      enabled: () => true,
      random: () => (n++ % 2 === 0 ? 1 : 0),
    });
    await audio.unlock();
    audio.blocked(0);
    const p = fake.played[0];
    expect(p?.rate).toBeGreaterThan(1.03);
    expect(p?.rate).toBeLessThan(1.05);
    expect(p?.volume).toBeLessThanOrEqual(1);
  });

  it('cuts the oldest voice past the cap', async () => {
    const { audio, played } = await unlocked();
    for (let i = 0; i <= VOICE_CAP; i++) audio.blocked(i);
    expect(played).toHaveLength(VOICE_CAP + 1);
    expect(played.map((p) => p.stopped)).toEqual([true, ...Array(VOICE_CAP).fill(false)]);
  });

  it('cancel drops pending sounds', async () => {
    const { audio, played } = await unlocked();
    audio.schedule([box(1, 0)], 0);
    audio.cancel();
    audio.tick(1000);
    expect(played.map((p) => p.sound)).toEqual(['pop']);
  });

  it('plays nothing while muted, and muting drops pending sounds', async () => {
    let on = true;
    const { audio, played } = await unlocked({}, () => on);
    audio.schedule([box(1, 0)], 0);
    on = false;
    audio.tick(1000);
    audio.blocked(1000);
    expect(played.map((p) => p.sound)).toEqual(['pop']);
  });

  it('stays silent and never throws when unlock fails, retrying on the next unlock', async () => {
    const fake = fakeBackend({ failUnlock: true });
    const audio = createAudio({ backend: fake.backend, enabled: () => true, random: () => 0.5 });
    await expect(audio.unlock()).resolves.toBeUndefined();
    audio.blocked(0);
    expect(fake.played).toEqual([]);
    await audio.unlock();
    expect(fake.unlocks()).toBe(2);
  });

  it('swallows a throwing backend', async () => {
    const { audio } = await unlocked({ throwOnPlay: true });
    expect(() => {
      audio.blocked(0);
      audio.schedule([box(1, 0)], 0);
      audio.tick(500);
    }).not.toThrow();
  });
});
