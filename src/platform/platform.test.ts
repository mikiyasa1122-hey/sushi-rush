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
  const createContextDouble = (overrides: Partial<AudioContext> = {}) => {
    const oscillator = { type: 'sine', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} };
    const gain = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    return {
      state: 'running',
      currentTime: 0,
      destination: {},
      resume: () => Promise.resolve(),
      createOscillator: () => oscillator,
      createGain: () => gain,
      ...overrides,
    } as unknown as AudioContext;
  };

  it('respects independent voice and effect settings', () => {
    const context = createContextDouble();
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

  it('does not finish unlocking or play effects until a suspended iOS context resumes', async () => {
    let state: AudioContextState = 'suspended';
    let finishResume = () => undefined;
    const context = createContextDouble({
      resume: vi.fn(() => new Promise<void>((resolve) => {
        finishResume = () => { state = 'running'; resolve(); };
      })),
    });
    Object.defineProperty(context, 'state', { get: () => state });
    const audio = new AudioController(undefined, undefined, () => context);
    let unlocked: boolean | undefined;

    const pending = Promise.resolve(audio.unlock()).then((value) => { unlocked = value; });

    expect(context.resume).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(unlocked).toBeUndefined();
    expect(audio.playEffect('correct')).toBe(false);

    finishResume();
    await pending;
    expect(unlocked).toBe(true);
    expect(audio.playEffect('correct')).toBe(true);
  });

  it('returns false instead of throwing when iOS rejects audio resume', async () => {
    const context = createContextDouble({
      state: 'suspended',
      resume: () => Promise.reject(new Error('not allowed')),
    });
    const audio = new AudioController(undefined, undefined, () => context);

    await expect(Promise.resolve(audio.unlock())).resolves.toBe(false);
  });

  it('requests Hey Omachi speech in the current user gesture', () => {
    const events: string[] = [];
    const audio = new AudioController(
      () => ({ play: () => { events.push('asset'); return Promise.reject(new Error('missing')); } } as HTMLAudioElement),
      (text) => events.push(text),
      () => createContextDouble(),
    );

    expect(audio.playVoice()).toBe(true);
    expect(events).toEqual(['Hey Omachi!']);
  });

  it('retries an effect after iOS suspends and resumes the audio context', async () => {
    let state: AudioContextState = 'suspended';
    let finishResume = () => undefined;
    const start = vi.fn();
    const context = createContextDouble({
      resume: vi.fn(() => new Promise<void>((resolve) => {
        finishResume = () => { state = 'running'; resolve(); };
      })),
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {}, start, stop() {},
      } as unknown as OscillatorNode),
    });
    Object.defineProperty(context, 'state', { get: () => state });
    const audio = new AudioController(undefined, undefined, () => context);

    const pending = audio.playEffectAfterUnlock('correct');
    expect(context.resume).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();

    finishResume();
    await expect(pending).resolves.toBe(true);
    expect(start).toHaveBeenCalledOnce();
  });
});
