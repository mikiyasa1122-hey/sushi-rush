import { LeaderboardRepository } from './leaderboard';
import { safeShare, safeVibrate } from './capabilities';
import { AudioController } from './audio';

describe('LeaderboardRepository', () => {
  it('trims names, sorts scores, and keeps the top 10', async () => {
    const repo = new LeaderboardRepository(undefined);
    for (let i = 0; i < 12; i++) await repo.save({ name: ` Player ${i} `, score: i * 100, playedAt: i });
    const entries = await repo.list();
    expect(entries).toHaveLength(10);
    expect(entries[0]).toMatchObject({ name: 'Player 11', score: 1100 });
    expect(entries[9].score).toBe(200);
  });

  it('rejects blank names', async () => {
    const repo = new LeaderboardRepository(undefined);
    await expect(repo.save({ name: '   ', score: 100, playedAt: 1 })).rejects.toThrow('名前');
  });
});

describe('safe capabilities', () => {
  it('never throws when share and vibration are missing', async () => {
    await expect(safeShare({ title: 'SUSHI RUSH' }, {} as Navigator)).resolves.toBe(false);
    expect(safeVibrate(30, {} as Navigator)).toBe(false);
  });
});

describe('AudioController', () => {
  it('respects independent voice and effect settings', () => {
    const oscillator = { type: 'sine', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} };
    const gain = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    const context = { currentTime: 0, destination: {}, resume: () => Promise.resolve(), createOscillator: () => oscillator, createGain: () => gain } as unknown as AudioContext;
    const audio = new AudioController(() => ({ play: () => Promise.resolve() } as HTMLAudioElement), () => undefined, () => context);
    audio.setVoiceEnabled(false);
    expect(audio.playVoice()).toBe(false);
    audio.setEffectsEnabled(true);
    expect(audio.playEffect('correct')).toBe(true);
  });

  it('falls back to speech synthesis when the fixed voice file fails', async () => {
    const spoken: string[] = [];
    const audio = new AudioController(
      () => ({ play: () => Promise.reject(new Error('missing file')) } as HTMLAudioElement),
      (text) => spoken.push(text),
    );

    expect(audio.playVoice()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(spoken).toEqual(['Hey Omachi!']);
  });
});
